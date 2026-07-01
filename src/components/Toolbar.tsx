"use client";

import { useState, useEffect, useCallback } from "react";
import hljs from "highlight.js";

interface ToolbarProps {
  markdown: string;
  previewRef: React.RefObject<HTMLDivElement> | null;
  onHtmlReady?: (html: string) => void;
}

export default function Toolbar({ markdown, onHtmlReady }: ToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // ============ Markdown 转 HTML (与 Web Worker 相同逻辑) ============
  const convertMarkdownToHtml = useCallback((md: string): string => {
    const codeBlocks: string[] = [];
    
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
        const cells = parseCells(line).map((cell) => `<td>${cell}</td>`).join('');
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
  }, []);

  // 生成完整 HTML 文档
  const generateFullHtml = useCallback((bodyContent: string, title: string = 'Document'): string => {
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
        h1, h2, h3, pre, table, blockquote { page-break-inside: avoid; }
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
  }, []);

  // 通知父组件 HTML 已准备好
  useEffect(() => {
    if (onHtmlReady && markdown) {
      const bodyHtml = convertMarkdownToHtml(markdown);
      const fullHtml = generateFullHtml(bodyHtml, 'Document');
      onHtmlReady(fullHtml);
    }
  }, [markdown, onHtmlReady, convertMarkdownToHtml, generateFullHtml]);

  // 调用后端 API 生成 PDF
  const handleExportPDF = async () => {
    setIsExporting(true);

    try {
      const bodyHtml = convertMarkdownToHtml(markdown);
      const fullHtml = generateFullHtml(bodyHtml, 'Document');

      // 调用后端 API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: markdown,
          title: 'markdown-document',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF');
      }

      // 获取 PDF blob
      const blob = await response.blob();
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'markdown-document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('PDF export failed:', error);
      alert(error.message || '导出 PDF 失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClear = () => {
    if (confirm('确定要清空编辑器内容吗？')) {
      const event = new CustomEvent('clearMarkdown');
      window.dispatchEvent(event);
    }
  };

  const handleLoadExample = () => {
    const event = new CustomEvent('loadExample');
    window.dispatchEvent(event);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      {/* Left actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleLoadExample}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
        >
          加载示例
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
        >
          清空
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopyMarkdown}
          className="relative px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
        >
          {showCopied ? (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              已复制
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              复制
            </span>
          )}
        </button>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-hover"
        >
          {isExporting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              导出中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出 PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
