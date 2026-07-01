/**
 * Web Worker: Markdown 转 HTML
 * 在 Worker 线程中执行，不阻塞主线程
 */

const hljs = importScripts 
  ? null 
  : require('highlight.js');

/**
 * Markdown 转 HTML 转换器（Worker 版本）
 */
class MarkdownConverter {
    constructor(options = {}) {
        this.hljsTheme = options.hljsTheme || 'monokai';
    }

    /**
     * Markdown 转 HTML
     * @param {string} md - Markdown 字符串
     * @returns {string} HTML 内容
     */
    convert(md) {
        const codeBlocks = [];
        
        // 提取代码块并进行服务器端代码高亮
        let html = md.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const index = codeBlocks.length;
            let language = lang || 'javascript';
            
            let highlightedCode = '';
            
            try {
                const codeToHighlight = code.trim();
                
                // 如果有 hljs，进行语法高亮
                if (hljs && hljs.getLanguage(language)) {
                    let codeToProcess = codeToHighlight;
                    
                    // JSX/JavaScript: 处理尖括号
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
                    // 无语法高亮，只转义
                    highlightedCode = codeToHighlight
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                }
            } catch (error) {
                const escaped = code.trim()
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\$/g, '&#36;');
                highlightedCode = escaped;
            }
            
            codeBlocks.push(`<pre><code class="language-${language} hljs">${highlightedCode}</code></pre>`);
            return `__CODE_BLOCK_${index}__`;
        });

        // 行内代码
        html = html.replace(/`([^`]+)`/g, (match, code) => {
            const escaped = code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\$/g, '&#36;');
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
        html = html.replace(/((?:^|\n)(\|.+\|(?:\n\|.+\|)*))/g, (match, tableBlock) => {
            const lines = tableBlock.trim().split('\n').filter(line => line.trim().startsWith('|'));
            if (lines.length < 2) return match;

            const hasAlignmentRow = lines.some(line => {
              const trimmed = line.trim();
              return trimmed.startsWith('|') && trimmed.endsWith('|') && /[\-:]/.test(trimmed);
            });
            if (!hasAlignmentRow) return match;

            const parseCells = (row) => {
                return row.split('|')
                    .slice(1, -1)
                    .map((cell) => cell.trim());
            };

            const headers = parseCells(lines[0])
                .map((cell) => `<th>${cell}</th>`)
                .join('');
            const bodyRows = lines.slice(2)
                .map((line) => {
                    const cells = parseCells(line)
                        .map((cell) => `<td>${cell}</td>`)
                        .join('');
                    return `<tr>${cells}</tr>`;
                })
                .join('');

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

    /**
     * 生成完整 HTML 文档
     */
    generateFullHtml(bodyContent, options = {}) {
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

// Worker 消息处理
self.onmessage = function(e) {
    const { type, payload, id } = e.data;
    
    try {
        const converter = new MarkdownConverter();
        
        switch (type) {
            case 'CONVERT':
                const { markdown, title } = payload;
                const bodyHtml = converter.convert(markdown);
                const fullHtml = converter.generateFullHtml(bodyHtml, { title });
                
                self.postMessage({
                    type: 'RESULT',
                    id,
                    payload: {
                        bodyHtml,
                        fullHtml,
                        success: true
                    }
                });
                break;
                
            case 'PING':
                self.postMessage({ type: 'PONG', id });
                break;
                
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            id,
            payload: {
                success: false,
                error: error.message
            }
        });
    }
};
