"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import MarkdownEditor from "@/components/MarkdownEditor";
import MarkdownPreview from "@/components/MarkdownPreview";
import Toolbar from "@/components/Toolbar";
import FeatureCard from "@/components/FeatureCard";
import Footer from "@/components/Footer";

const DEFAULT_MARKDOWN = `# 欢迎使用 Markdown to PDF

这是一个功能强大的在线 Markdown 编辑器，支持实时预览和 PDF 导出。

## 主要特性

- 📝 **实时编辑** - 所见即所得的编辑体验
- 👁️ **即时预览** - 毫秒级渲染响应
- 📄 **PDF 导出** - 一键生成精美 PDF
- 🌙 **深色模式** - 舒适的夜间编辑
- 🎨 **语法高亮** - 代码块完美呈现

## 代码示例

\`\`\`javascript
// 一个简单的问候函数
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome to Markdown to PDF\`;
}

const message = greet("World");
console.log(message);

// 异步操作示例
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
\`\`\`

## 表格示例

| 功能 | 描述 | 状态 |
|------|------|------|
| 实时预览 | 即时渲染 Markdown | ✅ |
| PDF 导出 | 高质量 PDF 下载 | ✅ |
| 深色模式 | 护眼夜间模式 | ✅ |
| 代码高亮 | 多语言语法支持 | ✅ |

## 引用块

> "好的文档是成功的另一半。一个优秀的工具值得配套优质的说明文档。"

## 有序列表

1. 在左侧编辑器中输入你的 Markdown 内容
2. 右侧会实时显示渲染效果
3. 点击工具栏的「导出 PDF」按钮下载文档

## 链接与图片

你可以添加 [链接](https://example.com) 和图片：

![示例图片](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80)

## 强调文本

这是一段包含多种强调效果的文本：

- **粗体文本** 用于强调重要内容
- *斜体文本* 用于轻柔强调
- ~~删除线~~ 用于显示已废弃内容
- \`行内代码\` 用于代码片段

祝你使用愉快！ 🚀
`;

export default function Home() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    
    // Listen for custom events from Toolbar
    const handleClear = () => setMarkdown("");
    const handleLoadExample = () => setMarkdown(DEFAULT_MARKDOWN);
    
    window.addEventListener("clearMarkdown", handleClear);
    window.addEventListener("loadExample", handleLoadExample);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("clearMarkdown", handleClear);
      window.removeEventListener("loadExample", handleLoadExample);
    };
  }, []);

  const features = [
    {
      icon: "⚡",
      title: "实时预览",
      description: "毫秒级渲染，编辑体验流畅无阻",
    },
    {
      icon: "📄",
      title: "PDF 导出",
      description: "一键生成专业级 PDF 文档",
    },
    {
      icon: "🎨",
      title: "精美排版",
      description: "自动格式化，文档更加美观",
    },
    {
      icon: "🌙",
      title: "深色模式",
      description: "保护眼睛的夜间编辑体验",
    },
    {
      icon: "💻",
      title: "代码高亮",
      description: "支持多语言的语法高亮显示",
    },
    {
      icon: "📱",
      title: "响应式设计",
      description: "完美适配桌面和移动设备",
    },
  ];

  return (
    <div className={`min-h-screen ${isDark ? "dark" : ""}`}>
      <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
        <Header isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-primary-900/20" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 dark:bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-700 dark:text-primary-300 text-sm font-medium mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              全新版本现已上线
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              <span className="gradient-text">Markdown to PDF</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "100ms" }}>
              现代化 Markdown 编辑器，支持实时预览与精美 PDF 导出
            </p>

            <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <a
                href="#editor"
                className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 btn-hover"
              >
                立即体验
              </a>
              <a
                href="#features"
                className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors btn-hover"
              >
                了解更多
              </a>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section id="features" className="py-16 px-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                为何选择我们
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                我们提供了一套完整的 Markdown 文档解决方案，让你的写作和分享更加便捷
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={index * 100}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Editor Section */}
        <section id="editor" className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                开始编辑
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                在下方输入你的 Markdown 内容，右侧实时预览效果
              </p>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-2 shadow-xl glow">
              {isMobile && (
                <div className="flex mb-2 bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("edit")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "edit"
                        ? "bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "preview"
                        ? "bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    预览
                  </button>
                </div>
              )}

              <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
                <Toolbar markdown={markdown} previewRef={previewRef} />
                <div className={`flex flex-col ${!isMobile ? "md:flex-row" : ""} h-[600px]`}>
                  {(!isMobile || activeTab === "edit") && (
                    <div className={`${isMobile ? "flex-1" : "w-full md:w-1/2"} border-r border-slate-200 dark:border-slate-700`}>
                      <MarkdownEditor
                        value={markdown}
                        onChange={setMarkdown}
                        isDark={isDark}
                      />
                    </div>
                  )}
                  {(!isMobile || activeTab === "preview") && (
                    <div className={`${isMobile ? "flex-1" : "w-full md:w-1/2"} overflow-hidden`}>
                      <MarkdownPreview content={markdown} isDark={isDark} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
