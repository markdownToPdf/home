"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
}

export default function MarkdownEditor({ value, onChange, isDark }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Tab handling
      if (e.key === "Tab") {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const newValue =
          value.substring(0, start) + "  " + value.substring(end);

        onChange(newValue);

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }

      // Auto-indent on Enter
      if (e.key === "Enter") {
        const start = textarea.selectionStart;
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const line = value.substring(lineStart, start);
        const indent = line.match(/^\s*/)?.[0] || "";

        if (indent) {
          e.preventDefault();
          const newValue =
            value.substring(0, start) + "\n" + indent + value.substring(start);
          onChange(newValue);

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
          }, 0);
        }
      }
    },
    [value, onChange]
  );

  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor Tab */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            编辑器
          </span>
        </div>
        <span className="text-xs text-slate-400">
          {value.length} 字符
        </span>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="editor-textarea"
          placeholder="在这里输入 Markdown 内容..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
