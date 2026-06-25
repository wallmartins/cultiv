import { ButtonLink, Container, CoordinateLabel, Text, cn } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { getBlogTagLabel } from "../../../content/blog/tags";
import type { BlogTagSlug } from "../../../content/blog/tags";
import { BlogAuthorBlock } from "../components/BlogAuthorBlock";
import { BlogProse } from "../components/BlogProse";
import { BlogShareActions } from "../components/BlogShareActions";
import type { BlogPost } from "../lib/post-schema";
import { getBlogIndexPath, getBlogPostPath, getBlogTagPath } from "../seo/blog-paths";
import { getHomePath, getLocaleMessages } from "~/i18n/marketing/get-locale";
import { getSiteUrl } from "~/marketing/seo/site-url";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface BlogPostScreenProps {
  readonly locale: MarketingLocale;
  readonly post: BlogPost;
}

function formatPublishedDate(iso: string, locale: MarketingLocale): string {
  return new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(iso));
}

export function BlogPostScreen({ locale, post }: BlogPostScreenProps) {
  const messages = getLocaleMessages(locale);
  const readTime = messages.blog.readTimeMinutes.replace(
    "{minutes}",
    String(post.readingTimeMinutes)
  );
  const shareUrl = `${getSiteUrl()}${getBlogPostPath(locale, post.slug)}`;

  return (
    <Container className="py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]">
      <article className="mx-auto w-full max-w-none md:max-w-[60vw]">
        <nav className="mb-6 md:mb-8" aria-label={messages.blog.backToIndex}>
          <Link
            to={getBlogIndexPath(locale)}
            className={cn(
              "ui-type-mono text-sm text-ink-muted",
              "transition-colors duration-200 hover:text-deep-blue motion-reduce:transition-none"
            )}
          >
            {messages.blog.backToIndex}
          </Link>
        </nav>

        <div
          className={cn(
            "mb-8 overflow-hidden rounded-[5px] border-dotted-cartography shadow-cartography",
            "md:mb-10"
          )}
        >
          <img
            src={post.coverImage}
            alt=""
            width={1200}
            height={675}
            loading="eager"
            className="aspect-video w-full object-cover"
          />
        </div>

        <header className="mb-8 space-y-4 md:mb-10">
          <Text as="h1" variant="display" className="text-deep-blue">
            {post.title}
          </Text>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <CoordinateLabel index={1} label={formatPublishedDate(post.publishedAt, locale)} />
            <span className="ui-type-mono text-sm text-ink-muted">{readTime}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tagSlug) => (
              <Link
                key={tagSlug}
                to={getBlogTagPath(locale, tagSlug)}
                className={cn(
                  "rounded-[5px] border-dotted-cartography bg-off-white px-3 py-1.5",
                  "ui-type-mono text-[0.6875rem] uppercase tracking-widest text-ink-muted",
                  "transition-colors duration-200 hover:border-terracotta hover:text-deep-blue motion-reduce:transition-none"
                )}
              >
                {getBlogTagLabel(tagSlug as BlogTagSlug, locale)}
              </Link>
            ))}
          </div>
        </header>

        <BlogProse html={post.html} className="mb-10 md:mb-12" />

        <div className="mb-10 space-y-8 md:mb-12">
          <BlogShareActions locale={locale} title={post.title} url={shareUrl} />
          <BlogAuthorBlock locale={locale} />
        </div>

        <nav className="mb-8 md:mb-10" aria-label={messages.blog.backToIndex}>
          <Link
            to={getBlogIndexPath(locale)}
            className={cn(
              "ui-type-mono text-sm text-ink-muted",
              "transition-colors duration-200 hover:text-deep-blue motion-reduce:transition-none"
            )}
          >
            {messages.blog.backToIndex}
          </Link>
        </nav>

        <ButtonLink href={`${getHomePath(locale)}#waitlist`}>
          {messages.blog.ctaWaitlist}
        </ButtonLink>
      </article>
    </Container>
  );
}
