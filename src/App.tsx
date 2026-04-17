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
import type { MergeConfig, UploadedMarkdownFile } from "./types/markdown";
import { mergeMarkdownFiles } from "./utils/markdownTools";
import { PREVIEW_THEMES, renderMarkdownToHtml } from "./utils/markdownPreview";
import {
  exportMarkdownFile,
  exportPdfFromHtml,
  exportWordFile,
} from "./utils/exporters";

const DEFAULT_CONFIG: MergeConfig = {
  showTitleOrder: false,
  titleOrderType: "numeric",
  stripHtml: false,
  stripImages: false,
  collapseEmptyLines: false,
  replaceFrom: "",
  replaceTo: "",
};

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
    const headingRegex = new RegExp(`^#\\s+.*${escapeRegExp(fileName)}.*$`, "m");
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1">
        <header className="mb-6 text-center shrink-0">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <FileText className="text-blue-600" /> Markdown 文件合并工具
          </h1>
          <p className="text-slate-500 mt-2">
            拖拽多个 MD 文件，自定义格式并一键合并导出
          </p>
        </header>

        {/* 主布局容器 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 左侧栏：配置项与文件列表 */}
          <div className="lg:col-span-4 space-y-6 flex flex-col h-auto">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 shrink-0">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
                <Settings2 size={18} className="text-slate-400" /> 合并配置
              </h2>
              <div className="space-y-4">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <p className="text-xs text-slate-500">
                    标题固定使用一级标题格式：<span className="font-mono"># 文件名</span>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      序号类型
                    </label>
                    <select
                      disabled={!config.showTitleOrder}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all disabled:opacity-50"
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
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase mb-2">
                    <Repeat size={14} /> 全局替换 (支持正则)
                  </label>
                  <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                    <input
                      type="text"
                      placeholder="查找..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                      value={replaceFromInput}
                      onChange={(e) => setReplaceFromInput(e.target.value)}
                    />
                    <button
                      onClick={handleSwapReplaceInputs}
                      className="h-8 w-8 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center"
                      title="对换查找和替换输入"
                    >
                      <ArrowLeftRight size={14} />
                    </button>
                    <input
                      type="text"
                      placeholder="替换为..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                      value={replaceToInput}
                      onChange={(e) => setReplaceToInput(e.target.value)}
                    />
                    <button
                      onClick={handleApplyReplace}
                      className="h-8 px-3 border border-blue-200 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors whitespace-nowrap"
                      title="点击后才应用全局替换"
                    >
                      替换
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
                className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center
                  ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"}`}
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
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center sticky top-0 z-10 shrink-0">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      文件列表 ({files.length})
                    </span>
                    <button
                      onClick={() => setFiles([])}
                      className="text-[10px] text-red-500 font-bold uppercase hover:bg-red-50 px-2 py-1 rounded transition-colors"
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
                            onClick={() => moveFile(index, -1)}
                            disabled={index === 0}
                            className="hover:text-blue-500 disabled:opacity-0 transition-opacity"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => moveFile(index, 1)}
                            disabled={index === files.length - 1}
                            className="hover:text-blue-500 disabled:opacity-0 transition-opacity"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                        <p className="flex-1 text-xs text-slate-700 truncate font-medium">
                          {file.name}
                        </p>
                        <button
                          onClick={() => handleLocateArticle(file.name)}
                          className="text-slate-300 hover:text-blue-500 p-1 transition-colors"
                          title="定位到右侧对应文章"
                        >
                          <LocateFixed size={14} />
                        </button>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                        >
                          <Trash2 size={14} />
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap gap-3 justify-between items-center shrink-0">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
                  <Eye size={18} className="text-slate-400" /> 合并预览 (源码)
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCopyMergedContent}
                    disabled={files.length === 0}
                    className="h-9 w-9 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                    title={isCopied ? "已复制" : "复制合成结果"}
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={handleResetToGenerated}
                    disabled={files.length === 0}
                    className="h-9 w-9 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                    title="用最新合并结果覆盖编辑内容"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setViewMode((current) =>
                        current === "source" ? "preview" : "source",
                      )
                    }
                    disabled={files.length === 0}
                    className="border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    {viewMode === "source" ? (
                      <Eye size={16} />
                    ) : (
                      <Code2 size={16} />
                    )}
                    {viewMode === "source" ? "切换预览模式" : "切换源码模式"}
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    disabled={files.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Download size={16} /> 导出 Markdown
                  </button>
                  <button
                    onClick={handleExportPdf}
                    disabled={files.length === 0}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Download size={16} /> 导出 PDF
                  </button>
                  <button
                    onClick={handleExportWord}
                    disabled={files.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Download size={16} /> 导出 Word
                  </button>
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
                    className={`h-full flex flex-col items-center justify-center text-slate-500 space-y-4 italic border-2 border-dashed rounded-2xl transition-all ${
                      isDragging
                        ? "border-blue-500 bg-blue-50/70 text-blue-600"
                        : "border-slate-300/60 bg-slate-800/20 opacity-60"
                    }`}
                  >
                    <FileText size={64} />
                    <p className="text-lg font-medium">
                      左侧可上传，也可直接拖拽文件到此处
                    </p>
                    <p className="text-sm">支持 .md / .markdown 文件</p>
                  </div>
                ) : viewMode === "source" ? (
                  <textarea
                    ref={sourceTextareaRef}
                    value={effectiveContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    className="w-full h-full resize-none rounded-xl border border-slate-700 bg-slate-950/80 p-4 text-slate-200 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="合并结果会显示在这里，你可以继续手动修改..."
                  />
                ) : (
                  <div className="h-full flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      {PREVIEW_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => setSelectedThemeId(theme.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                            selectedThemeId === theme.id
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
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
