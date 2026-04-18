export type UploadedMarkdownFile = {
  id: string;
  name: string;
  content: string;
};

export type MergeMode = "default" | "ebook";

export type EbookMeta = {
  bookTitle: string;
  author: string;
  showToc: boolean;
  /** 预留：后续可按文档内标题深度生成目录 */
  tocMaxDepth: 1 | 2 | 3;
};

export type MergeConfig = {
  mergeMode: MergeMode;
  ebook: EbookMeta;
  showTitleOrder: boolean;
  titleOrderType: "numeric" | "chinese" | "emoji";
  stripHtml: boolean;
  stripImages: boolean;
  collapseEmptyLines: boolean;
  replaceFrom: string;
  replaceTo: string;
};
