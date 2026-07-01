import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markdown to PDF | 现代化 Markdown 编辑器",
  description: "一个功能强大的在线 Markdown 编辑器，支持实时预览和 PDF 导出。让你的文档排版更加精美专业。",
  keywords: ["Markdown", "PDF", "编辑器", "文档", "在线工具"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
