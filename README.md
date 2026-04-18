# Markdown Merger

一个用于批量合并 Markdown 文件的前端工具，支持拖拽上传、内容清洗、手动编辑、实时预览、多主题切换，以及导出 Markdown / PDF / Word。

## 功能特点

- 批量导入 `.md` / `.markdown` 文件，支持拖拽和点击上传
- 文件顺序调整、删除、清空
- 内容处理能力
  - 全局替换（支持正则，手动点击“替换”才生效）
  - 过滤 HTML 标签
  - 过滤 Markdown 图片标签
  - 合并连续空行
- 合并模式
  - **默认**：每篇使用 `# 文件名` 作为标题后接正文
  - **电子书**：可配置书名、作者；可选生成章节目录（锚点链接）；每篇为 `##` 二级标题章节
- 标题序号（数字 / 中文 / Emoji），两种合并模式下均作用于篇名/章节标题
- 预览与编辑
  - 源码模式可直接编辑合并结果
  - 预览模式支持多主题切换
- 导出能力
  - Markdown（纯文本）
  - PDF（按当前主题）
  - Word（`.docx`）

## 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS
- markdown-it、markdown-it-anchor（标题锚点，目录可点击跳转）

## 本地运行

```bash
pnpm install
pnpm dev
```

默认开发地址：`http://localhost:5173`

## 打包构建

```bash
pnpm build
pnpm preview
```

## 使用说明（快速上手）

1. 上传多个 Markdown 文件
2. 在左侧调整处理配置（替换、过滤、序号等）
3. 在右侧源码区按需微调合并结果
4. 切换到预览模式查看最终样式
5. 导出目标格式（Markdown / PDF / Word）
