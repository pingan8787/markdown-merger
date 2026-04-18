import type { MergeConfig } from "../types/markdown";

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
