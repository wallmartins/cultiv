import type { MarketingLocale } from "~/i18n/marketing/types";

const markdownModules = import.meta.glob<string>("../../../content/blog/*/*.md", {
  query: "?raw",
  import: "default",
  eager: true
});

const contentRootSegment = "/content/blog/";

export interface BlogMarkdownFile {
  readonly file: string;
  readonly raw: string;
}

export function listBundledBlogMarkdown(locale: MarketingLocale): BlogMarkdownFile[] {
  const localeSegment = `${contentRootSegment}${locale}/`;

  return Object.entries(markdownModules)
    .filter(([path]) => path.includes(localeSegment))
    .map(([path, raw]) => ({
      file: path.slice(path.lastIndexOf("/") + 1),
      raw
    }));
}
