import { Container, CoordinateLabel, Text } from "@my-ai-orchestrator/ui";
import { BlogPostCard } from "../components/BlogPostCard";
import { BlogTagChips } from "../components/BlogTagChips";
import type { BlogPost } from "../lib/post-schema";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface BlogIndexScreenProps {
  readonly locale: MarketingLocale;
  readonly posts: ReadonlyArray<BlogPost>;
  readonly activeTagSlug?: string;
}

export function BlogIndexScreen({ locale, posts, activeTagSlug }: BlogIndexScreenProps) {
  const messages = getLocaleMessages(locale);

  return (
    <Container className="py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]">
      <header className="mx-auto mb-10 max-w-3xl md:mb-14">
        <CoordinateLabel
          index={0}
          label={messages.blog.indexEyebrow}
          className="mb-4 block"
        />
        <Text as="h1" variant="display" className="mb-3 text-deep-blue">
          {messages.header.nav.blog}
        </Text>
        <Text as="p" variant="body-lg" className="text-ink-muted">
          {messages.blog.indexSubtitle}
        </Text>
      </header>

      <div className="mb-10 md:mb-12">
        <BlogTagChips locale={locale} activeTagSlug={activeTagSlug} />
      </div>

      {posts.length === 0 ? (
        <Text as="p" variant="body-lg" className="text-center text-ink-muted">
          {messages.blog.emptyIndex}
        </Text>
      ) : (
        <ul className="mx-auto grid max-w-6xl list-none gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <BlogPostCard locale={locale} post={post} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
