import MarkdownIt from "markdown-it";

export type PreviewTheme = {
  id: string;
  label: string;
  frameClassName: string;
  contentClassName: string;
  exportCss: string;
};

const markdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
});

export const renderMarkdownToHtml = (content: string): string =>
  markdownIt.render(content || "");

export const PREVIEW_THEMES: PreviewTheme[] = [
  {
    id: "paper",
    label: "纸张灰",
    frameClassName: "bg-slate-100",
    contentClassName: "markdown-preview markdown-theme-paper",
    exportCss:
      "body{background:#f1f5f9;color:#0f172a;font-family:'Inter','PingFang SC','Microsoft YaHei',sans-serif;} .content{max-width:820px;margin:0 auto;background:#ffffff;padding:44px;border-radius:16px;box-shadow:0 8px 28px rgba(15,23,42,.08);} .content h1{font-size:2.1rem;border-bottom:1px solid #cbd5e1;padding-bottom:10px;} .content h2{font-size:1.6rem;} .content h3{font-size:1.28rem;} .content p,.content li{font-size:1.02rem;} .content pre{background:#f8fafc;border:1px solid #e2e8f0;}",
  },
  {
    id: "ocean",
    label: "海洋蓝",
    frameClassName: "bg-sky-100",
    contentClassName: "markdown-preview markdown-theme-ocean",
    exportCss:
      "body{background:linear-gradient(180deg,#e0f2fe,#f0f9ff);color:#082f49;font-family:'Inter','PingFang SC','Microsoft YaHei',sans-serif;} .content{max-width:840px;margin:0 auto;background:#f8fdff;padding:44px;border-radius:16px;border:1px solid #bae6fd;} .content h1{font-size:2.15rem;color:#0c4a6e;} .content h2{font-size:1.62rem;color:#075985;} .content h3{font-size:1.28rem;color:#0369a1;} .content p,.content li{font-size:1.03rem;} .content a{color:#0369a1;} .content pre{background:#e0f2fe;border:1px solid #7dd3fc;}",
  },
  {
    id: "forest",
    label: "森林绿",
    frameClassName: "bg-emerald-100",
    contentClassName: "markdown-preview markdown-theme-forest",
    exportCss:
      "body{background:#ecfdf5;color:#022c22;font-family:'Inter','PingFang SC','Microsoft YaHei',sans-serif;} .content{max-width:840px;margin:0 auto;background:#f7fff9;padding:44px;border-radius:16px;border:1px solid #86efac;} .content h1{font-size:2.08rem;color:#14532d;} .content h2{font-size:1.58rem;color:#166534;} .content h3{font-size:1.24rem;color:#15803d;} .content p,.content li{font-size:1.02rem;} .content a{color:#047857;} .content blockquote{border-left-color:#10b981;background:#ecfdf5;} .content pre{background:#dcfce7;border:1px solid #86efac;}",
  },
  {
    id: "sunset",
    label: "日落橙",
    frameClassName: "bg-orange-100",
    contentClassName: "markdown-preview markdown-theme-sunset",
    exportCss:
      "body{background:#fff7ed;color:#431407;font-family:'Inter','PingFang SC','Microsoft YaHei',sans-serif;} .content{max-width:840px;margin:0 auto;background:#fffaf4;padding:44px;border-radius:16px;border:1px solid #fdba74;} .content h1{font-size:2.1rem;color:#9a3412;} .content h2{font-size:1.6rem;color:#c2410c;} .content h3{font-size:1.26rem;color:#ea580c;} .content p,.content li{font-size:1.03rem;} .content a{color:#c2410c;} .content blockquote{border-left-color:#fb923c;background:#ffedd5;} .content pre{background:#ffedd5;border:1px solid #fdba74;}",
  },
  {
    id: "lavender",
    label: "薰衣草",
    frameClassName: "bg-violet-100",
    contentClassName: "markdown-preview markdown-theme-lavender",
    exportCss:
      "body{background:#f5f3ff;color:#2e1065;font-family:'Inter','PingFang SC','Microsoft YaHei',sans-serif;} .content{max-width:840px;margin:0 auto;background:#faf8ff;padding:44px;border-radius:16px;border:1px solid #c4b5fd;} .content h1{font-size:2.08rem;color:#4c1d95;} .content h2{font-size:1.58rem;color:#5b21b6;} .content h3{font-size:1.25rem;color:#6d28d9;} .content p,.content li{font-size:1.02rem;} .content a{color:#6d28d9;} .content blockquote{border-left-color:#8b5cf6;background:#f3e8ff;} .content pre{background:#ede9fe;border:1px solid #c4b5fd;}",
  },
  {
    id: "night",
    label: "深夜黑",
    frameClassName: "bg-slate-950",
    contentClassName: "markdown-preview markdown-theme-night",
    exportCss:
      "body{background:#020617;color:#e2e8f0;font-family:'JetBrains Mono','SF Mono','PingFang SC',monospace;} .content{max-width:840px;margin:0 auto;background:#0f172a;padding:44px;border-radius:16px;border:1px solid #334155;} .content h1{font-size:2rem;color:#f8fafc;} .content h2{font-size:1.54rem;color:#e2e8f0;} .content h3{font-size:1.22rem;color:#cbd5e1;} .content p,.content li{font-size:1rem;color:#cbd5e1;} .content a{color:#67e8f9;} .content blockquote{border-left-color:#38bdf8;background:#0b2239;} .content pre{background:#1e293b;border:1px solid #334155;color:#dbeafe;}",
  },
];
