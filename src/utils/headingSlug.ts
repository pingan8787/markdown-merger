/**
 * 与 markdown-it-anchor 默认 slugify 一致，便于目录链接与标题 id 对齐。
 * @see https://github.com/valeriangalliat/markdown-it-anchor
 */
export const slugifyHeadingText = (text: string): string =>
  encodeURIComponent(String(text).trim().toLowerCase().replace(/\s+/g, "-"));

/**
 * 与 markdown-it-anchor 内部去重逻辑一致：冲突时使用 `base-1`、`base-2`…
 */
export const uniqueSlug = (title: string, used: Record<string, boolean>): string => {
  const base = slugifyHeadingText(title);
  let candidate = base;
  let index = 1;
  while (Object.prototype.hasOwnProperty.call(used, candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  used[candidate] = true;
  return candidate;
};
