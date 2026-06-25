import { marked } from "marked";

marked.setOptions({ gfm: true });

export function renderMarkdownToHtml(markdown: string): string {
  const raw = marked.parse(markdown, { async: false }) as string;
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
}
