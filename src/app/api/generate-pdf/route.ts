import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import hljs from 'highlight.js';
import path from 'path';

// ============ MarkdownConverter (与前端 Web Worker 相同的转换逻辑) ============
class MarkdownConverter {
    convert(md: string): string {
        const codeBlocks: string[] = [];
        
        // 提取代码块并进行语法高亮
        let html = md.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const index = codeBlocks.length;
            let language = lang || 'javascript';
            
            try {
                const codeToHighlight = code.trim();
                let highlightedCode = codeToHighlight
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');

                if (hljs.getLanguage(language)) {
                    let codeToProcess = codeToHighlight;
                    if (language === 'jsx' || language === 'javascript' || language === 'js') {
                        codeToProcess = codeToProcess
                            .replace(/</g, '\u0002')
                            .replace(/>/g, '\u0003');
                    }
                    
                    const result = hljs.highlight(codeToProcess, { language });
                    highlightedCode = result.value
                        .replace(/\u0002/g, '&lt;')
                        .replace(/\u0003/g, '&gt;')
                        .replace(/&amp;(\w+;)/g, '&$1');
                } else {
                    highlightedCode = codeToHighlight
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/\$/g, '&#36;');
                }
                
                codeBlocks.push(`<pre><code class="language-${language} hljs">${highlightedCode}</code></pre>`);
            } catch {
                const escaped = code.trim()
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                codeBlocks.push(`<pre><code class="language-${language}">${escaped}</code></pre>`);
            }
            
            return `__CODE_BLOCK_${index}__`;
        });

        // 行内代码
        html = html.replace(/`([^`]+)`/g, (match, code) => {
            const escaped = code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            return `<code class="inline">${escaped}</code>`;
        });

        // 标题
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
                   .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                   .replace(/^### (.+)$/gm, '<h3>$1</h3>');

        // 引用
        html = html.replace(/^> (.+)$/gm, '<p class="quote">$1</p>');

        // 粗体斜体
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                   .replace(/\*(.+?)\*/g, '<em>$1</em>');

        // 分隔线
        html = html.replace(/^---$/gm, '<hr>');

        // 表格
        html = html.replace(/((?:^|\n)(\|.+\|(?:\n\|.+\|)*))/g, (match: string, tableBlock: string) => {
            const lines = tableBlock.trim().split('\n').filter((line: string) => line.trim().startsWith('|'));
            if (lines.length < 2) return match;

            const hasAlignmentRow = lines.some((line: string) => {
              const trimmed = line.trim();
              return trimmed.startsWith('|') && trimmed.endsWith('|') && /[\-:]/.test(trimmed);
            });
            if (!hasAlignmentRow) return match;

            const parseCells = (row: string) => row.split('|').slice(1, -1).map((c: string) => c.trim());

            const headers = parseCells(lines[0]).map((cell: string) => `<th>${cell}</th>`).join('');
            const bodyRows = lines.slice(2).map((line: string) => {
                const cells = parseCells(line).map((cell: string) => `<td>${cell}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');

            return `\n<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>\n`;
        });

        // 段落
        html = html.split('\n\n').map(para => {
            if (para.trim() && 
                !para.startsWith('<h') && 
                !para.startsWith('<p class') &&
                !para.startsWith('<hr') &&
                !para.startsWith('<table') &&
                !para.includes('<table>') &&
                !para.includes('__CODE_BLOCK_')) {
                return `<p>${para.replace(/\n/g, '<br>')}</p>`;
            }
            return para.replace(/\n/g, '<br>');
        }).join('\n');

        // 恢复代码块
        codeBlocks.forEach((block, index) => {
            html = html.replace(`__CODE_BLOCK_${index}__`, block);
        });

        return html.replace(/<p><\/p>/g, '');
    }

    generateFullHtml(bodyContent: string, options: { title?: string } = {}): string {
        const title = options.title || 'Document';
        
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/monokai.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", sans-serif;
            padding: 20mm 15mm;
            line-height: 1.6;
            font-size: 14px;
            color: #333;
        }
        h1 { font-size: 22px; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
        h2 { color: #2c3e50; margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 8px; font-size: 16px; }
        h3 { color: #34495e; margin-top: 15px; margin-bottom: 10px; font-size: 14px; }
        pre {
            background: #3e3e3e !important;
            border: 1px solid #555;
            border-radius: 6px;
            padding: 16px;
            margin: 12px 0;
            overflow-wrap: break-word;
            word-break: break-all;
            font-size: 11px;
        }
        pre code {
            font-family: "SF Mono", "Monaco", "Menlo", "Courier New", monospace;
            display: block;
            white-space: pre-wrap;
            word-break: normal;
            line-height: 1.5;
            color: #ccc;
        }
        code.inline {
            font-family: "SF Mono", "Monaco", "Menlo", "Courier New", monospace;
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.9em;
            color: #c7254e;
        }
        hr { border: none; border-top: 1px solid #eee; margin: 20px 0; }
        strong { color: #2c3e50; }
        em { color: #666; }
        p { margin: 8px 0; }
        .quote { color: #888; font-style: italic; text-align: center; margin: 20px 0; }
        table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th { background: #f6f8fa; font-weight: bold; }
        tr:nth-child(even) { background: #fafafa; }
        img { max-width: 100%; height: auto; margin: 12px 0; }
        a { color: #0ea5e9; }
        
        /* 分页控制 */
        h1, h2, h3, pre, table, blockquote { page-break-inside: avoid; }
        
        /* 打印样式 */
        @media print {
            body { padding: 0; }
            pre { white-space: pre-wrap; }
        }
    </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
    }
}

// ============ API 路由 ============
export async function POST(request: NextRequest) {
  try {
    const { markdown, title = 'document' } = await request.json();

    if (!markdown) {
      return NextResponse.json(
        { error: 'Markdown content is required' },
        { status: 400 }
      );
    }

    // 验证付费状态 (这里可以集成你的付费系统)
    // const isPaid = await checkPaymentStatus(request);
    // if (!isPaid) {
    //   return NextResponse.json({ error: 'Payment required' }, { status: 402 });
    // }

    // 转换 Markdown 到 HTML (与 Web Worker 相同的逻辑)
    const converter = new MarkdownConverter();
    const bodyHtml = converter.convert(markdown);
    const fullHtml = converter.generateFullHtml(bodyHtml, { title });

    // 获取 Chrome 路径
    const chromePath = process.env.CHROME_PATH || 
      (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/chromium-browser');

    // 启动 Puppeteer 生成 PDF
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();

      // 设置视口
      await page.setViewport({
        width: 1200,
        height: 1400,
        deviceScaleFactor: 1
      });

      // 设置内容
      await page.setContent(fullHtml, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // 短暂等待渲染
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 300)));

      // 生成 PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      // 返回 PDF (将 Uint8Array 转为 Buffer)
      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${title}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error: any) {
    console.error('PDF generation error:', error);
    
    // 如果是 Puppeteer 错误，返回更友好的消息
    if (error.message?.includes('Could not find Chrome')) {
      return NextResponse.json(
        { error: 'PDF service is not available. Please try again later.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate PDF. Please try again.' },
      { status: 500 }
    );
  }
}

// GET 请求返回预览 HTML (用于调试)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const markdown = searchParams.get('markdown') || '';
  const title = searchParams.get('title') || 'Preview';

  const converter = new MarkdownConverter();
  const bodyHtml = converter.convert(markdown);
  const fullHtml = converter.generateFullHtml(bodyHtml, { title });

  return new NextResponse(fullHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
