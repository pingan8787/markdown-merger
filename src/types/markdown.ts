export type UploadedMarkdownFile = {
  id: string;
  name: string;
  content: string;
};

export type MergeConfig = {
  showTitleOrder: boolean;
  titleOrderType: "numeric" | "chinese" | "emoji";
  stripHtml: boolean;
  stripImages: boolean;
  collapseEmptyLines: boolean;
  replaceFrom: string;
  replaceTo: string;
};
