"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface WorkerResult {
  bodyHtml: string;
  fullHtml: string;
  success: boolean;
  error?: string;
}

interface UseMarkdownWorkerReturn {
  bodyHtml: string;
  fullHtml: string;
  isConverting: boolean;
  error: string | null;
  convert: (markdown: string, title?: string) => void;
}

let messageId = 0;

export function useMarkdownWorker(): UseMarkdownWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const [bodyHtml, setBodyHtml] = useState("");
  const [fullHtml, setFullHtml] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingCallbacks = useRef<Map<number, (result: WorkerResult) => void>>(new Map());

  useEffect(() => {
    // 创建 Worker
    workerRef.current = new Worker(
      new URL("../public/workers/markdown.worker.js", import.meta.url),
      { type: "module" }
    );

    // 处理 Worker 返回的消息
    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, id, payload } = e.data;

      if (type === "RESULT" || type === "ERROR") {
        const callback = pendingCallbacks.current.get(id);
        if (callback) {
          callback(payload);
          pendingCallbacks.current.delete(id);
        }
      }
    };

    workerRef.current.onerror = (err) => {
      console.error("Worker error:", err);
      setError(err.message);
      setIsConverting(false);
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const convert = useCallback((markdown: string, title?: string) => {
    if (!workerRef.current) {
      setError("Worker not initialized");
      return;
    }

    setIsConverting(true);
    setError(null);

    const id = ++messageId;

    pendingCallbacks.current.set(id, (result: WorkerResult) => {
      setIsConverting(false);
      if (result.success) {
        setBodyHtml(result.bodyHtml);
        setFullHtml(result.fullHtml);
      } else {
        setError(result.error || "Conversion failed");
      }
    });

    workerRef.current.postMessage({
      type: "CONVERT",
      id,
      payload: { markdown, title: title || "Document" },
    });
  }, []);

  return {
    bodyHtml,
    fullHtml,
    isConverting,
    error,
    convert,
  };
}
