import type { MergeConfig, UploadedMarkdownFile } from "../../types/markdown";
import { processMarkdownContent } from "../markdownTools";
import { uniqueSlug } from "../headingSlug";

const formatChineseIndex = (num: number): string => {
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (num <= 10) {
    return num === 10 ? "十" : digits[num];
  }
  if (num < 20) {
    return `十${digits[num % 10]}`;
  }
  if (num < 100) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return `${digits[tens]}十${ones === 0 ? "" : digits[ones]}`;
  }
  return String(num);
};

const formatChapterTitle = (
  index: number,
  fileName: string,
  config: Pick<MergeConfig, "showTitleOrder" | "titleOrderType">,
): string => {
  if (!config.showTitleOrder) {
    return fileName;
  }
  const order = index + 1;
  switch (config.titleOrderType) {
    case "chinese":
      return `${formatChineseIndex(order)}、${fileName}`;
    case "emoji":
      return `${order}\uFE0F\u20E3 ${fileName}`;
    case "numeric":
    default:
      return `${order}. ${fileName}`;
  }
};

export const mergeEbook = (
  files: UploadedMarkdownFile[],
  config: MergeConfig,
): string => {
  const bookTitle =
    config.ebook.bookTitle.trim() || "未命名电子书";
  const authorLine = config.ebook.author.trim()
    ? `**作者：** ${config.ebook.author.trim()}`
    : "";

  const slugRegistry: Record<string, boolean> = {};
  uniqueSlug(bookTitle, slugRegistry);

  const chapterEntries = files.map((file, index) => {
    const headingText = formatChapterTitle(index, file.name, config);
    return { file, headingText };
  });

  if (config.ebook.showToc && chapterEntries.length > 0) {
    uniqueSlug("目录", slugRegistry);
  }

  const entriesWithSlug = chapterEntries.map((entry) => ({
    ...entry,
    slug: uniqueSlug(entry.headingText, slugRegistry),
  }));

  const parts: string[] = [];
  parts.push(`# ${bookTitle}`, "");
  if (authorLine) {
    parts.push(authorLine, "");
  }

  if (config.ebook.showToc && entriesWithSlug.length > 0) {
    parts.push(
      "## 目录",
      "",
      ...entriesWithSlug.map(
        (entry) => `- [${entry.headingText}](#${entry.slug})`,
      ),
      "",
      "---",
      "",
    );
  } else {
    parts.push("---", "");
  }

  const chapters = entriesWithSlug
    .map((entry) => {
      const body = processMarkdownContent(entry.file.content, config);
      return `## ${entry.headingText}\n\n${body}`;
    })
    .join("\n\n");

  parts.push(chapters);

  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
};
