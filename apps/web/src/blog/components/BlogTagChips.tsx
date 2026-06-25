import { cn } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { blogTags } from "../../../content/blog/tags";
import { getBlogIndexPath, getBlogTagPath } from "../seo/blog-paths";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface BlogTagChipsProps {
  readonly locale: MarketingLocale;
  readonly tags?: typeof blogTags;
  readonly activeTagSlug?: string;
}

export function BlogTagChips({
  locale,
  tags = blogTags,
  activeTagSlug
}: BlogTagChipsProps) {
  const messages = getLocaleMessages(locale);

  return (
    <nav
      aria-label={messages.blog.indexEyebrow}
      className="flex flex-wrap gap-2"
    >
      <Link
        to={getBlogIndexPath(locale)}
        className={cn(
          "rounded-[5px] border-dotted-cartography bg-off-white px-3 py-1.5",
          "ui-type-mono text-[0.6875rem] uppercase tracking-widest text-ink-muted",
          "transition-colors duration-200 hover:text-deep-blue motion-reduce:transition-none",
          activeTagSlug === undefined && "border-terracotta border-solid text-deep-blue"
        )}
      >
        {messages.blog.allTags}
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag.slug}
          to={getBlogTagPath(locale, tag.slug)}
          className={cn(
            "rounded-[5px] border-dotted-cartography bg-off-white px-3 py-1.5",
            "ui-type-mono text-[0.6875rem] uppercase tracking-widest text-ink-muted",
            "transition-colors duration-200 hover:text-deep-blue motion-reduce:transition-none",
            activeTagSlug === tag.slug && "border-terracotta border-solid text-deep-blue"
          )}
        >
          {tag.label[locale]}
        </Link>
      ))}
    </nav>
  );
}
