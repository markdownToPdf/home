# Markdown to PDF Converter - Next.js 官网

一个现代化的在线 Markdown 编辑器，可以实时预览并导出为精美的 PDF 文件。

## 功能特性

- 实时 Markdown 编辑与预览
- 支持语法高亮
- 一键导出为 PDF
- 响应式设计，支持深色/浅色主题
- 预设示例文档快速上手

## 技术栈

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- react-markdown + remark-gfm
- jsPDF + html2canvas

## 开始使用

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
├── src/
│   ├── app/
│   │   ├── layout.tsx      # 根布局
│   │   ├── page.tsx        # 首页
│   │   └── globals.css     # 全局样式
│   ├── components/
│   │   ├── Header.tsx      # 导航栏
│   │   ├── MarkdownEditor.tsx    # Markdown 编辑器
│   │   ├── MarkdownPreview.tsx  # 实时预览
│   │   ├── Toolbar.tsx     # 工具栏
│   │   ├── FeatureCard.tsx # 功能卡片
│   │   └── Footer.tsx      # 页脚
│   └── lib/
│       └── utils.ts        # 工具函数
├── public/
│   └── examples/           # 示例文件
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
