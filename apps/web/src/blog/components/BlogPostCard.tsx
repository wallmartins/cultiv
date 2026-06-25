import { CoordinateLabel, ExpeditionCard, Text, cn } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { getBlogTagLabel } from "../../../content/blog/tags";
import type { BlogTagSlug } from "../../../content/blog/tags";
import type { BlogPost } from "../lib/post-schema";
import { getBlogPostPath, getBlogTagPath } from "../seo/blog-paths";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface BlogPostCardProps {
  readonly locale: MarketingLocale;
  readonly post: BlogPost;
}

function formatPublishedDate(iso: string, locale: MarketingLocale): string {
  return new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(iso));
}

export function BlogPostCard({ locale, post }: BlogPostCardProps) {
  const messages = getLocaleMessages(locale);
  const readTime = messages.blog.readTimeMinutes.replace(
    "{minutes}",
    String(post.readingTimeMinutes)
  );

  return (
    <ExpeditionCard as="div" className="group flex h-full flex-col overflow-hidden p-0">
      <Link
        to={getBlogPostPath(locale, post.slug)}
        className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
      >
        <div className="aspect-video overflow-hidden border-b border-dotted-cartography">
          <img
            src={post.coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-[250ms] group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5 pb-3">
          <Text as="h2" variant="display-sm" className="line-clamp-2 text-deep-blue">
            {post.title}
          </Text>
          <Text as="p" variant="body" className="line-clamp-3 flex-1 text-ink-muted">
            {post.excerpt}
          </Text>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <CoordinateLabel index={1} label={formatPublishedDate(post.publishedAt, locale)} />
            <span className="ui-type-mono text-sm text-ink-muted">{readTime}</span>
          </div>
        </div>
      </Link>
      <div className="flex flex-wrap gap-2 px-5 pb-5">
        {post.tags.map((tagSlug) => (
          <Link
            key={tagSlug}
            to={getBlogTagPath(locale, tagSlug)}
            className={cn(
              "rounded-[5px] border-dotted-cartography bg-off-white px-2.5 py-1",
              "ui-type-mono text-[0.625rem] uppercase tracking-widest text-ink-muted",
              "transition-colors duration-200 hover:border-terracotta hover:text-deep-blue motion-reduce:transition-none"
            )}
          >
            {getBlogTagLabel(tagSlug as BlogTagSlug, locale)}
          </Link>
        ))}
      </div>
    </ExpeditionCard>
  );
}
