import type { MergeConfig, UploadedMarkdownFile } from "../../types/markdown";
import { mergeDefault } from "./defaultMerge";
import { mergeEbook } from "./ebookMerge";

export const mergeMarkdownFiles = (
  files: UploadedMarkdownFile[],
  config: MergeConfig,
): string => {
  if (config.mergeMode === "ebook") {
    return mergeEbook(files, config);
  }
  return mergeDefault(files, config);
};
