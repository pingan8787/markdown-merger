import type { MergeConfig, UploadedMarkdownFile } from "../types/markdown";

export const normalizeLineEndings = (input: string): string =>
  input.replace(/\r\n/g, "\n");

export const replaceByPattern = (
  input: string,
  searchPattern: string,
  replacement: string,
): string => {
  if (!searchPattern) {
    return input;
  }

  try {
    return input.replace(new RegExp(searchPattern, "g"), replacement);
  } catch {
    return input.split(searchPattern).join(replacement);
  }
};

export const stripHtmlTags = (input: string): string =>
  input.replace(/<[^>]*>?/gm, "");

export const stripMarkdownImages = (input: string): string =>
  input.replace(/!\[.*?\]\(.*?\)/g, "");

export const collapseConsecutiveEmptyLines = (input: string): string =>
  input.replace(/\n{3,}/g, "\n\n");

export const processMarkdownContent = (
  content: string,
  config: Pick<
    MergeConfig,
    | "stripHtml"
    | "stripImages"
    | "collapseEmptyLines"
    | "replaceFrom"
    | "replaceTo"
  >,
): string => {
  let result = normalizeLineEndings(content);

  if (config.stripHtml) {
    result = stripHtmlTags(result);
  }

  if (config.stripImages) {
    result = stripMarkdownImages(result);
  }

  if (config.collapseEmptyLines) {
    result = collapseConsecutiveEmptyLines(result);
  }

  return replaceByPattern(result, config.replaceFrom, config.replaceTo);
};

export const mergeMarkdownFiles = (
  files: UploadedMarkdownFile[],
  config: MergeConfig,
): string => {
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

  const formatTitleOrder = (index: number): string => {
    if (!config.showTitleOrder) {
      return "";
    }

    const order = index + 1;
    switch (config.titleOrderType) {
      case "chinese":
        return `${formatChineseIndex(order)}、`;
      case "emoji":
        return `${order}\uFE0F\u20E3 `;
      case "numeric":
      default:
        return `${order}. `;
    }
  };

  return files
    .map((file, index) => {
      const content = processMarkdownContent(file.content, config);
      const title = `${formatTitleOrder(index)}${file.name}`;
      return `# ${title}\n\n${content}`;
    })
    .join("\n\n");
};
