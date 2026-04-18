import { useState, useCallback, useMemo, useRef } from "react";
import {
  Upload,
  FileText,
  Download,
  Copy,
  RotateCcw,
  Trash2,
  LocateFixed,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  Settings2,
  Eye,
  Code2,
  ShieldCheck,
  ImageOff,
  Rows3,
  Repeat,
} from "lucide-react";
import type {
  EbookMeta,
  MergeConfig,
  UploadedMarkdownFile,
} from "./types/markdown";
import { mergeMarkdownFiles } from "./utils/mergeStrategies";
import { PREVIEW_THEMES, renderMarkdownToHtml } from "./utils/markdownPreview";
import {
  exportMarkdownFile,
  exportPdfFromHtml,
  exportWordFile,
} from "./utils/exporters";

const DEFAULT_CONFIG: MergeConfig = {
  mergeMode: "default",
  ebook: {
    bookTitle: "",
    author: "",
    showToc: true,
    tocMaxDepth: 2,
  },
  showTitleOrder: false,
  titleOrderType: "numeric",
  stripHtml: false,
  stripImages: false,
  collapseEmptyLines: false,
  replaceFrom: "",
  replaceTo: "",
};

/** 统一表单控件：对比度、hover、focus-visible（键盘可达） */
const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50";

const CARD_CLASS =
  "rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-900/[0.04]";

const BTN_ICON_CLASS =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 disabled:pointer-events-none disabled:opacity-40";

const BTN_PRIMARY_CLASS =
  "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40";

const SECTION_LABEL_CLASS =
  "block text-[11px] font-semibold uppercase tracking-wide text-slate-500";

const App = () => {
  // 状态管理
  const [files, setFiles] = useState<UploadedMarkdownFile[]>([]);
  const [config, setConfig] = useState<MergeConfig>(DEFAULT_CONFIG);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"source" | "preview">("source");
  const [selectedThemeId, setSelectedThemeId] = useState(PREVIEW_THEMES[0].id);
  const [isCopied, setIsCopied] = useState(false);
  const [manualContent, setManualContent] = useState<string | null>(null);
  const [replaceFromInput, setReplaceFromInput] = useState("");
  const [replaceToInput, setReplaceToInput] = useState("");
  const sourceTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewContentRef = useRef<HTMLDivElement | null>(null);

  // 处理文件读取
  const handleFiles = useCallback((incomingFiles: FileList | null) => {
    if (!incomingFiles) {
      return;
    }

    const mdFiles = Array.from(incomingFiles).filter(
      (file) =>
        file.name.endsWith(".md") ||
        file.name.endsWith(".markdown") ||
        file.type === "text/markdown",
    );

    mdFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const content = event.target?.result;
        if (typeof content !== "string") {
          return;
        }

        setFiles((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2, 11),
            name: file.name,
            content,
          },
        ]);
      };
      reader.readAsText(file);
    });
  }, []);

  // 排序与删除
  const moveFile = (index: number, direction: number) => {
    const newFiles = [...files];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newFiles.length) {
      [newFiles[index], newFiles[newIndex]] = [
        newFiles[newIndex],
        newFiles[index],
      ];
      setFiles(newFiles);
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  // 生成合并内容
  const mergedContent = useMemo(
    () => mergeMarkdownFiles(files, config),
    [files, config],
  );

  const effectiveContent = manualContent ?? mergedContent;

  const renderedPreviewHtml = useMemo(
    () => renderMarkdownToHtml(effectiveContent),
    [effectiveContent],
  );

  const selectedTheme = useMemo(
    () =>
      PREVIEW_THEMES.find((theme) => theme.id === selectedThemeId) ??
      PREVIEW_THEMES[0],
    [selectedThemeId],
  );

  const buildFilename = (ext: "md" | "pdf" | "docx"): string =>
    `merged_markdown_${Date.now()}.${ext}`;

  const handleExportMarkdown = () => {
    if (files.length === 0) return;
    exportMarkdownFile(effectiveContent, buildFilename("md"));
  };

  const handleExportWord = () => {
    if (files.length === 0) return;
    void exportWordFile(
      renderedPreviewHtml,
      buildFilename("docx"),
    );
  };

  const handleExportPdf = async () => {
    if (files.length === 0) return;
    await exportPdfFromHtml(
      renderedPreviewHtml,
      buildFilename("pdf"),
      selectedTheme.exportCss,
    );
  };

  const handleCopyMergedContent = async () => {
    if (!effectiveContent) return;

    try {
      await navigator.clipboard.writeText(effectiveContent);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = effectiveContent;
      textarea.style.position = "fixed";
      textarea.style.left = "-99999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1200);
  };

  const handleResetToGenerated = () => {
    setManualContent(null);
  };

  const handleApplyReplace = () => {
    setConfig({
      ...config,
      replaceFrom: replaceFromInput,
      replaceTo: replaceToInput,
    });
  };

  const handleSwapReplaceInputs = () => {
    setReplaceFromInput(replaceToInput);
    setReplaceToInput(replaceFromInput);
  };

  const escapeRegExp = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const findHeadingStartIndex = (content: string, fileName: string): number => {
    const headingRegex = new RegExp(
      `^#{1,6}\\s+.*${escapeRegExp(fileName)}.*$`,
      "m",
    );
    const match = headingRegex.exec(content);
    return match?.index ?? -1;
  };

  const handleLocateArticle = (fileName: string) => {
    if (viewMode === "source") {
      const textarea = sourceTextareaRef.current;
      if (!textarea) return;

      const index = findHeadingStartIndex(effectiveContent, fileName);
      if (index < 0) return;

      const lineBefore = effectiveContent.slice(0, index).split("\n").length - 1;
      const computedLineHeight = Number.parseFloat(
        window.getComputedStyle(textarea).lineHeight,
      );
      const lineHeight = Number.isNaN(computedLineHeight) ? 22 : computedLineHeight;
      const targetTop = Math.max(lineBefore * lineHeight, 0);
      textarea.focus();
      textarea.setSelectionRange(index, index);
      // focus/selection may reset scroll position, so scroll on next frame.
      requestAnimationFrame(() => {
        textarea.scrollTo({
          top: targetTop,
          behavior: "smooth",
        });
      });
      return;
    }

    const previewRoot = previewContentRef.current;
    if (!previewRoot) return;
    const headingNodes = Array.from(
      previewRoot.querySelectorAll("h1, h2, h3"),
    ) as HTMLElement[];
    const targetHeading = headingNodes.find((node) =>
      node.textContent?.includes(fileName),
    );
    if (!targetHeading) return;
    const targetTop = targetHeading.offsetTop - previewRoot.offsetTop;
    previewRoot.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });
  };

  return (
    <div className="app-page-bg p-4 md:p-8 font-sans text-slate-900 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1">
        <header className="mb-8 text-center shrink-0">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight flex flex-wrap items-center justify-center gap-3">
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25"
              aria-hidden
            >
              <FileText className="h-6 w-6" />
            </span>
            Markdown 文件合并工具
          </h1>
          <p className="text-slate-600 mt-3 text-base max-w-xl mx-auto leading-relaxed">
            拖拽多个 Markdown 文件，配置合并方式与过滤规则，一键预览并导出
          </p>
        </header>

        {/* 主布局容器 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 左侧栏：配置项与文件列表 */}
          <div className="lg:col-span-4 space-y-6 flex flex-col h-auto">
            <div className={`${CARD_CLASS} p-5 shrink-0`}>
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2 text-slate-800">
                <Settings2 size={18} className="text-slate-400 shrink-0" aria-hidden />
                合并配置
              </h2>
              <div className="space-y-4">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                  <label className={`${SECTION_LABEL_CLASS} mb-1.5`}>
                    合并模式
                  </label>
                  <select
                    className={FIELD_CLASS}
                    value={config.mergeMode}
                    onChange={(e) => {
                      const nextMode = e.target.value as MergeConfig["mergeMode"];
                      setManualContent(null);
                      setConfig({ ...config, mergeMode: nextMode });
                    }}
                  >
                    <option value="default">默认（逐篇合并）</option>
                    <option value="ebook">电子书</option>
                  </select>
                </div>

                {config.mergeMode === "ebook" && (
                  <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3">
                    <p className="text-xs font-semibold text-indigo-800">
                      电子书元信息
                    </p>
                    <div>
                      <label className={`${SECTION_LABEL_CLASS} mb-1.5`}>
                        书名
                      </label>
                      <input
                        type="text"
                        placeholder="留空则使用「未命名电子书」"
                        className={FIELD_CLASS}
                        value={config.ebook.bookTitle}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            ebook: { ...config.ebook, bookTitle: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={`${SECTION_LABEL_CLASS} mb-1.5`}>
                        作者
                      </label>
                      <input
                        type="text"
                        placeholder="选填"
                        className={FIELD_CLASS}
                        value={config.ebook.author}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            ebook: { ...config.ebook, author: e.target.value },
                          })
                        }
                      />
                    </div>
                    <label className="flex items-center justify-between cursor-pointer group py-1">
                      <span className="text-xs font-medium text-slate-700">
                        生成章节目录
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.ebook.showToc}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            ebook: { ...config.ebook, showToc: e.target.checked },
                          })
                        }
                      />
                      <div className="relative w-8 h-4 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                    </label>
                    <div>
                      <label className={`${SECTION_LABEL_CLASS} mb-1.5`}>
                        目录深度（预留）
                      </label>
                      <select
                        className={FIELD_CLASS}
                        value={String(config.ebook.tocMaxDepth)}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            ebook: {
                              ...config.ebook,
                              tocMaxDepth: Number(
                                e.target.value,
                              ) as EbookMeta["tocMaxDepth"],
                            },
                          })
                        }
                      >
                        <option value="1">H1</option>
                        <option value="2">H2</option>
                        <option value="3">H3</option>
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        当前目录仅列出各篇二级标题；深度选项供后续扩展文档内标题目录。
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {config.mergeMode === "default" ? (
                      <>
                        每篇使用一级标题：
                        <span className="font-mono"># 文件名</span>
                      </>
                    ) : (
                      <>
                        顶部书名使用
                        <span className="font-mono"> # 书名</span>
                        ，每篇使用
                        <span className="font-mono"> ## 章节标题</span>
                      </>
                    )}
                  </p>
                  <label className="flex items-center justify-between cursor-pointer group py-1">
                    <span className="text-xs font-medium text-slate-700">
                      显示标题序号
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={config.showTitleOrder}
                      onChange={(e) =>
                        setConfig({ ...config, showTitleOrder: e.target.checked })
                      }
                    />
                    <div className="relative w-8 h-4 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                  </label>
                  <div>
                    <label className={`${SECTION_LABEL_CLASS} mb-1.5`}>
                      序号类型
                    </label>
                    <select
                      disabled={!config.showTitleOrder}
                      className={FIELD_CLASS}
                      value={config.titleOrderType}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          titleOrderType: e.target.value as MergeConfig["titleOrderType"],
                        })
                      }
                    >
                      <option value="numeric">数字（1. 2. 3.）</option>
                      <option value="chinese">中文（一、二、三、）</option>
                      <option value="emoji">Emoji（1️⃣ 2️⃣ 3️⃣）</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className={`${SECTION_LABEL_CLASS} mb-2 flex items-center gap-2`}>
                    <Repeat size={14} className="text-slate-400" aria-hidden />
                    全局替换（支持正则）
                  </span>
                  <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                    <input
                      type="text"
                      placeholder="查找..."
                      className={FIELD_CLASS}
                      value={replaceFromInput}
                      onChange={(e) => setReplaceFromInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleSwapReplaceInputs}
                      className={BTN_ICON_CLASS}
                      title="对换查找和替换输入"
                    >
                      <ArrowLeftRight size={14} aria-hidden />
                    </button>
                    <input
                      type="text"
                      placeholder="替换为..."
                      className={FIELD_CLASS}
                      value={replaceToInput}
                      onChange={(e) => setReplaceToInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleApplyReplace}
                      className={`${BTN_PRIMARY_CLASS} h-8 shrink-0 px-3 text-xs bg-blue-600 focus-visible:ring-blue-600 whitespace-nowrap`}
                      title="点击后才应用全局替换"
                    >
                      应用
                    </button>
                  </div>
                </div>

                <div className="pt-3 space-y-2 border-t border-slate-100">
                  <label className="flex items-center justify-between cursor-pointer group py-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        size={14}
                        className={
                          config.stripHtml ? "text-blue-600" : "text-slate-400"
                        }
                      />
                      <span className="text-xs font-medium text-slate-700">
                        过滤 HTML 标签
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={config.stripHtml}
                      onChange={(e) =>
                        setConfig({ ...config, stripHtml: e.target.checked })
                      }
                    />
                    <div className="relative w-8 h-4 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group py-1">
                    <div className="flex items-center gap-2">
                      <ImageOff
                        size={14}
                        className={
                          config.stripImages
                            ? "text-amber-600"
                            : "text-slate-400"
                        }
                      />
                      <span className="text-xs font-medium text-slate-700">
                        过滤图片标签
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={config.stripImages}
                      onChange={(e) =>
                        setConfig({ ...config, stripImages: e.target.checked })
                      }
                    />
                    <div className="relative w-8 h-4 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group py-1">
                    <div className="flex items-center gap-2">
                      <Rows3
                        size={14}
                        className={
                          config.collapseEmptyLines
                            ? "text-indigo-600"
                            : "text-slate-400"
                        }
                      />
                      <span className="text-xs font-medium text-slate-700">
                        合并连续空行
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={config.collapseEmptyLines}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          collapseEmptyLines: e.target.checked,
                        })
                      }
                    />
                    <div className="relative w-8 h-4 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 transition-[border-color,background-color,box-shadow] flex flex-col items-center justify-center text-center focus-within:ring-2 focus-within:ring-blue-500/25 focus-within:border-blue-400
                  ${isDragging ? "border-blue-500 bg-blue-50/90 shadow-inner" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/90"}`}
              >
                <input
                  type="file"
                  multiple
                  accept=".md,.markdown"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                  id="fileInput"
                />
                <label
                  htmlFor="fileInput"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload
                    size={24}
                    className={isDragging ? "text-blue-600" : "text-slate-400"}
                  />
                  <p className="text-sm font-medium text-slate-700 mt-2">
                    点击或拖拽文件
                  </p>
                </label>
              </div>

              {files.length > 0 && (
                <div className={`${CARD_CLASS} flex flex-col overflow-hidden`}>
                  <div className="p-3 border-b border-slate-100 bg-slate-50/60 flex justify-between items-center sticky top-0 z-10 shrink-0">
                    <span className={`${SECTION_LABEL_CLASS} normal-case tracking-normal text-slate-600`}>
                      文件列表（{files.length}）
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      className="text-xs font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                    >
                      清空
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200">
                    {files.map((file, index) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 p-2.5 border-b border-slate-100 last:border-0 group hover:bg-slate-50"
                      >
                        <div className="flex flex-col text-slate-300">
                          <button
                            type="button"
                            onClick={() => moveFile(index, -1)}
                            disabled={index === 0}
                            className="rounded-md p-0.5 text-slate-400 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 disabled:pointer-events-none disabled:opacity-0 transition-colors"
                            aria-label="上移"
                          >
                            <ArrowUp size={12} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFile(index, 1)}
                            disabled={index === files.length - 1}
                            className="rounded-md p-0.5 text-slate-400 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 disabled:pointer-events-none disabled:opacity-0 transition-colors"
                            aria-label="下移"
                          >
                            <ArrowDown size={12} aria-hidden />
                          </button>
                        </div>
                        <p className="flex-1 text-xs text-slate-700 truncate font-medium">
                          {file.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleLocateArticle(file.name)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35"
                          title="定位到右侧对应文章"
                          aria-label={`定位 ${file.name}`}
                        >
                          <LocateFixed size={14} aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                          aria-label={`移除 ${file.name}`}
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧合并预览：高度固定为 calc(100vh - 300px) */}
          <div className="lg:col-span-8 flex flex-col h-full">
            <div className={`${CARD_CLASS} flex flex-col h-full overflow-hidden`}>
              <div className="p-4 border-b border-slate-100 bg-slate-50/40 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between shrink-0">
                <h2 className="text-lg font-semibold flex items-center gap-2.5 text-slate-800">
                  {viewMode === "source" ? (
                    <Code2 size={18} className="text-blue-600 shrink-0" aria-hidden />
                  ) : (
                    <Eye size={18} className="text-blue-600 shrink-0" aria-hidden />
                  )}
                  {viewMode === "source" ? "合并结果 · 源码" : "合并结果 · 预览"}
                </h2>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap sm:gap-3">
                  <div
                    className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-1 shadow-sm shadow-slate-900/3"
                    role="group"
                    aria-label="编辑与视图"
                  >
                    <button
                      type="button"
                      onClick={handleCopyMergedContent}
                      disabled={files.length === 0}
                      className={BTN_ICON_CLASS}
                      title={isCopied ? "已复制" : "复制合并结果"}
                    >
                      <Copy size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={handleResetToGenerated}
                      disabled={files.length === 0}
                      className={BTN_ICON_CLASS}
                      title="用最新合并结果覆盖编辑内容"
                    >
                      <RotateCcw size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setViewMode((current) =>
                          current === "source" ? "preview" : "source",
                        )
                      }
                      disabled={files.length === 0}
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-transparent px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 disabled:pointer-events-none disabled:opacity-40"
                    >
                      {viewMode === "source" ? (
                        <Eye size={16} aria-hidden />
                      ) : (
                        <Code2 size={16} aria-hidden />
                      )}
                      {viewMode === "source" ? "预览" : "源码"}
                    </button>
                  </div>
                  <div
                    className="hidden sm:block h-9 w-px shrink-0 bg-slate-200"
                    role="separator"
                    aria-hidden
                  />
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="导出"
                  >
                    <button
                      type="button"
                      onClick={handleExportMarkdown}
                      disabled={files.length === 0}
                      className={`${BTN_PRIMARY_CLASS} bg-blue-600 focus-visible:ring-blue-600`}
                    >
                      <Download size={16} aria-hidden /> Markdown
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      disabled={files.length === 0}
                      className={`${BTN_PRIMARY_CLASS} bg-violet-600 focus-visible:ring-violet-600`}
                    >
                      <Download size={16} aria-hidden /> PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleExportWord}
                      disabled={files.length === 0}
                      className={`${BTN_PRIMARY_CLASS} bg-emerald-600 focus-visible:ring-emerald-600`}
                    >
                      <Download size={16} aria-hidden /> Word
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="flex-1 overflow-auto p-6 bg-slate-900 font-mono text-sm leading-relaxed text-slate-300 scrollbar-thin scrollbar-thumb-slate-700"
                style={{ maxHeight: "calc(100vh - 210px)" }}
              >
                {files.length === 0 ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFiles(e.dataTransfer.files);
                    }}
                    className={`min-h-[280px] flex flex-col items-center justify-center text-center px-6 py-10 space-y-3 border-2 border-dashed rounded-2xl transition-[border-color,background-color,box-shadow,color] ${
                      isDragging
                        ? "border-blue-400 bg-slate-800/60 text-blue-200 shadow-[0_0_0_3px_rgba(59,130,246,0.25)]"
                        : "border-slate-600/80 bg-slate-800/30 text-slate-400"
                    }`}
                  >
                    <FileText
                      size={56}
                      className={isDragging ? "text-blue-300" : "text-slate-500"}
                      aria-hidden
                    />
                    <p className="text-lg font-semibold text-slate-200 max-w-md leading-snug">
                      将 Markdown 文件拖到此处，或使用左栏上传
                    </p>
                    <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                      支持 .md / .markdown；合并结果会出现在下方编辑区
                    </p>
                  </div>
                ) : viewMode === "source" ? (
                  <textarea
                    ref={sourceTextareaRef}
                    value={effectiveContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    className="w-full h-full min-h-[240px] resize-y rounded-xl border border-slate-700 bg-slate-950/85 p-4 text-slate-200 font-mono text-sm leading-relaxed outline-none transition-shadow focus-visible:border-blue-500/60 focus-visible:ring-2 focus-visible:ring-blue-500/35"
                    placeholder="合并结果会显示在这里，你可以继续手动修改..."
                  />
                ) : (
                  <div className="h-full flex flex-col gap-4">
                    <div
                      className="flex flex-wrap gap-2"
                      role="tablist"
                      aria-label="预览主题"
                    >
                      {PREVIEW_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedThemeId(theme.id)}
                          aria-pressed={selectedThemeId === theme.id}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-blue-400/80 ${
                            selectedThemeId === theme.id
                              ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                              : "bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700/80 hover:border-slate-500"
                          }`}
                        >
                          {theme.label}
                        </button>
                      ))}
                    </div>
                    <div
                      ref={previewContentRef}
                      className={`flex-1 overflow-y-auto p-8 md:p-10 scroll-smooth rounded-xl ${selectedTheme.frameClassName}`}
                    >
                      <div
                        className={selectedTheme.contentClassName}
                        dangerouslySetInnerHTML={{
                          __html: renderedPreviewHtml,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
