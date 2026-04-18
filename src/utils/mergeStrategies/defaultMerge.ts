import type { MergeConfig, UploadedMarkdownFile } from "../../types/markdown";
import { processMarkdownContent } from "../markdownTools";

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

const formatTitleOrder = (
  index: number,
  config: Pick<MergeConfig, "showTitleOrder" | "titleOrderType">,
): string => {
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

export const mergeDefault = (
  files: UploadedMarkdownFile[],
  config: MergeConfig,
): string => {
  return files
    .map((file, index) => {
      const content = processMarkdownContent(file.content, config);
      const title = `${formatTitleOrder(index, config)}${file.name}`;
      return `# ${title}\n\n${content}`;
    })
    .join("\n\n");
};
