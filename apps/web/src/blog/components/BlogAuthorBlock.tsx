import { Text } from "@my-ai-orchestrator/ui";
import { blogAuthor } from "../../../content/blog/author";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface BlogAuthorBlockProps {
  readonly locale: MarketingLocale;
}

export function BlogAuthorBlock({ locale }: BlogAuthorBlockProps) {
  return (
    <aside className="rounded-[5px] border-dotted-cartography bg-off-white p-6 shadow-cartography md:p-7">
      <Text as="p" variant="label" className="mb-2">
        {blogAuthor.name[locale]}
      </Text>
      <Text as="p" variant="body" className="text-ink-muted">
        {blogAuthor.bio[locale]}
      </Text>
    </aside>
  );
}
