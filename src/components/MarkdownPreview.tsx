"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";

interface MarkdownPreviewProps {
  content: string;
  isDark: boolean;
}

export default function MarkdownPreview({ content, isDark }: MarkdownPreviewProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-400">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Preview Tab Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <svg
          className="w-4 h-4 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          实时预览
        </span>
      </div>

      {/* Preview Content */}
      <div
        id="pdf-preview"
        className="flex-1 overflow-auto p-6 bg-white dark:bg-slate-900"
      >
        <article className="markdown-preview max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              rehypeHighlight,
              rehypeRaw,
            ]}
            components={{
              // Custom code block rendering
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";
                
                if (!inline && language) {
                  return (
                    <pre className="not-prose">
                      <code className={className} data-language={language} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                }
                
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
