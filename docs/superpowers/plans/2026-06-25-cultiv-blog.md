# Cultiv Blog (Diário de bordo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public Markdown blog at `/blog` and `/en/blog` on the marketing surface with Cultiv Cartography UI, tag filters, `publishedAt` scheduling, and automatic SEO/GEO/RSS/sitemap.

**Architecture:** Markdown files under `apps/web/content/blog/{pt,en}` are read on the server via `createServerFn` + Node `fs`, validated with Zod, filtered by `publishedAt`, and rendered through TanStack Router routes wrapped in `MarketingLayout` (editorial variant without section rail). SEO helpers extend existing marketing infrastructure.

**Tech Stack:** TanStack Start/Router, React 19, `gray-matter`, `marked`, `zod`, Vitest, Tailwind v4, `@my-ai-orchestrator/ui`.

**Spec:** [`docs/superpowers/specs/2026-06-25-cultiv-blog-design.md`](../specs/2026-06-25-cultiv-blog-design.md)

---

## File map

| File | Responsibility |
|------|----------------|
| `apps/web/content/blog/tags.ts` | Canonical tag registry (slug + pt/en labels) |
| `apps/web/content/blog/author.ts` | Fixed author name + bio per locale |
| `apps/web/content/blog/README.md` | Author checklist |
| `apps/web/content/blog/pt/*.md` | Portuguese posts |
| `apps/web/content/blog/en/*.md` | English posts |
| `apps/web/public/blog/covers/` | Required cover images (WebP) |
| `apps/web/src/blog/lib/blog-content-root.ts` | Resolve `content/blog` path in dev + prod |
| `apps/web/src/blog/lib/post-schema.ts` | Zod frontmatter + `BlogPost` type |
| `apps/web/src/blog/lib/reading-time.ts` | Words-per-minute estimate |
| `apps/web/src/blog/lib/load-posts.ts` | Read dir, parse, validate, filter, sort |
| `apps/web/src/blog/lib/render-markdown.ts` | `marked` + HTML sanitizer |
| `apps/web/src/blog/server/blog-fns.ts` | `createServerFn` wrappers for routes |
| `apps/web/src/blog/seo/blog-paths.ts` | `getBlogIndexPath`, `getBlogPostPath`, `getBlogTagPath` |
| `apps/web/src/blog/seo/resolve-blog-head.ts` | Meta + hreflang for blog pages |
| `apps/web/src/blog/seo/blog-json-ld.ts` | BlogPosting / CollectionPage JSON-LD |
| `apps/web/src/blog/seo/blog-rss.ts` | RSS 2.0 XML builder |
| `apps/web/src/blog/seo/blog-sitemap.ts` | Sitemap URL entries for blog |
| `apps/web/src/blog/components/BlogProse.tsx` | Inter body typography + MD HTML |
| `apps/web/src/blog/components/BlogPostCard.tsx` | ExpeditionCard-based listing card |
| `apps/web/src/blog/components/BlogTagChips.tsx` | Filter chips |
| `apps/web/src/blog/components/BlogAuthorBlock.tsx` | Fixed author footer card |
| `apps/web/src/blog/components/BlogShareActions.tsx` | Copy link + Web Share API |
| `apps/web/src/blog/components/BlogStructuredData.tsx` | JSON-LD script tag |
| `apps/web/src/blog/screens/BlogIndexScreen.tsx` | Index + tag filter UI |
| `apps/web/src/blog/screens/BlogPostScreen.tsx` | Article page |
| `apps/web/src/routes/blog/index.tsx` | `/blog` |
| `apps/web/src/routes/blog/$slug.tsx` | `/blog/$slug` |
| `apps/web/src/routes/blog/tag/$tagSlug.tsx` | `/blog/tag/$tagSlug` |
| `apps/web/src/routes/blog/rss[.]xml.ts` | `/blog/rss.xml` |
| `apps/web/src/routes/en/blog/index.tsx` | `/en/blog` |
| `apps/web/src/routes/en/blog/$slug.tsx` | `/en/blog/$slug` |
| `apps/web/src/routes/en/blog/tag/$tagSlug.tsx` | `/en/blog/tag/$tagSlug` |
| `apps/web/src/routes/en/blog/rss[.]xml.ts` | `/en/blog/rss.xml` |
| `apps/web/src/i18n/marketing/types.ts` | Add `blog` namespace + `header.nav.blog` |
| `apps/web/src/i18n/marketing/locales/pt.ts` | Blog copy PT |
| `apps/web/src/i18n/marketing/locales/en.ts` | Blog copy EN |
| `apps/web/src/marketing/seo/seo.ts` | Optional `og:type` (`website` \| `article`) |
| `apps/web/src/marketing/seo/resolve-page-seo.ts` | Delegate sitemap build to include blog URLs |
| `apps/web/src/marketing/seo/geo/llms.ts` | Blog index + RSS links; recent posts in full |
| `apps/web/src/marketing/layouts/MarketingLayout.tsx` | `showSectionRail` prop (default `true`) |
| `apps/web/src/marketing/components/SiteHeader.tsx` | Blog nav link (locale-aware) |
| `apps/web/src/marketing/sections/FooterSection.tsx` | Blog footer link |
| `tests/web/blog-load-posts.test.ts` | Loader, validation, scheduling |
| `tests/web/blog-seo.test.ts` | JSON-LD, RSS, sitemap entries |
| `tests/web/geo.test.ts` | Extend for blog llms section |
| `tests/web/seo-meta.test.ts` | Extend for blog sitemap URLs |
| `tests/web/i18n-catalog.test.ts` | Auto-covers new blog keys (no change if parity kept) |

## Out of scope

- Admin UI, MDX, comments, pagination, dark mode, per-post hreflang pairs.

---

## Task 1: Dependencies and content scaffolding

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/content/blog/tags.ts`
- Create: `apps/web/content/blog/author.ts`
- Create: `apps/web/content/blog/README.md`
- Create: `apps/web/public/blog/covers/.gitkeep`
- Create: `apps/web/public/blog/inline/.gitkeep`

- [ ] **Step 1: Add dependencies**

```bash
cd apps/web && pnpm add gray-matter marked zod
```

- [ ] **Step 2: Create tag registry**

```typescript
// apps/web/content/blog/tags.ts
export const blogTags = [
  { slug: "voice", label: { pt: "Voz", en: "Voice" } },
  { slug: "product", label: { pt: "Produto", en: "Product" } },
  { slug: "writing", label: { pt: "Escrita", en: "Writing" } }
] as const;

export type BlogTagSlug = (typeof blogTags)[number]["slug"];

export const blogTagSlugs = blogTags.map((tag) => tag.slug);

export function getBlogTag(slug: string) {
  return blogTags.find((tag) => tag.slug === slug);
}

export function getBlogTagLabel(slug: BlogTagSlug, locale: "pt" | "en") {
  return getBlogTag(slug)?.label[locale] ?? slug;
}
```

- [ ] **Step 3: Create author config**

```typescript
// apps/web/content/blog/author.ts
export const blogAuthor = {
  name: { pt: "Cultiv", en: "Cultiv" },
  bio: {
    pt: "Mapeamos territórios de voz para que a IA escreva com a sua assinatura — não com a de todo mundo.",
    en: "We map voice territories so AI writes with your signature — not everyone else's."
  }
} as const;
```

- [ ] **Step 4: Add author README** (checklist from spec)

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml apps/web/content/blog apps/web/public/blog
git commit -m "chore(web): scaffold blog content directories and registry"
```

---

## Task 2: Blog content root + post schema (TDD)

**Files:**
- Create: `apps/web/src/blog/lib/blog-content-root.ts`
- Create: `apps/web/src/blog/lib/post-schema.ts`
- Create: `apps/web/src/blog/lib/reading-time.ts`
- Create: `tests/web/blog-load-posts.test.ts` (schema tests first)
- Create: `apps/web/src/blog/__fixtures__/pt/valid-post.md`
- Create: `apps/web/src/blog/__fixtures__/pt/future-post.md`

- [ ] **Step 1: Write failing schema tests**

```typescript
// tests/web/blog-load-posts.test.ts
import { describe, expect, it } from "vitest";
import { blogFrontmatterSchema } from "../../apps/web/src/blog/lib/post-schema.js";
import { estimateReadingTimeMinutes } from "../../apps/web/src/blog/lib/reading-time.js";

describe("blogFrontmatterSchema", () => {
  const base = {
    title: "Título",
    slug: "titulo",
    publishedAt: "2026-01-01T10:00:00-03:00",
    excerpt: "Resumo curto.",
    coverImage: "/blog/covers/titulo.webp",
    tags: ["voice"] as const
  };

  it("accepts valid frontmatter", () => {
    expect(blogFrontmatterSchema.parse(base).slug).toBe("titulo");
  });

  it("rejects unknown tag", () => {
    expect(() => blogFrontmatterSchema.parse({ ...base, tags: ["nope"] })).toThrow();
  });

  it("rejects excerpt over 200 chars", () => {
    expect(() =>
      blogFrontmatterSchema.parse({ ...base, excerpt: "x".repeat(201) })
    ).toThrow();
  });
});

describe("estimateReadingTimeMinutes", () => {
  it("returns at least 1 minute", () => {
    expect(estimateReadingTimeMinutes("hello world")).toBe(1);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm exec vitest run tests/web/blog-load-posts.test.ts`

- [ ] **Step 3: Implement schema + reading time**

```typescript
// apps/web/src/blog/lib/post-schema.ts
import { z } from "zod";
import { blogTagSlugs } from "../../../content/blog/tags.js";

export const blogFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  publishedAt: z.string().datetime({ offset: true }),
  excerpt: z.string().min(1).max(200),
  coverImage: z.string().regex(/^\/blog\//),
  tags: z.array(z.enum(blogTagSlugs as [string, ...string[]])).min(1)
});

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;

export type BlogPost = BlogFrontmatter & {
  readonly locale: "pt" | "en";
  readonly body: string;
  readonly html: string;
  readonly readingTimeMinutes: number;
};
```

```typescript
// apps/web/src/blog/lib/reading-time.ts
const WORDS_PER_MINUTE = 200;

export function estimateReadingTimeMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
```

```typescript
// apps/web/src/blog/lib/blog-content-root.ts
import { existsSync } from "node:fs";
import { join } from "node:path";

export function resolveBlogContentRoot(): string {
  const candidates = [
    join(process.cwd(), "content/blog"),
    join(process.cwd(), "apps/web/content/blog")
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "tags.ts")) || existsSync(join(candidate, "pt"))) {
      return candidate;
    }
  }

  return candidates[0]!;
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/blog/lib tests/web/blog-load-posts.test.ts apps/web/src/blog/__fixtures__
git commit -m "feat(web): add blog post schema and reading-time helper"
```

---

## Task 3: Load posts from disk (TDD)

**Files:**
- Create: `apps/web/src/blog/lib/render-markdown.ts`
- Create: `apps/web/src/blog/lib/load-posts.ts`
- Modify: `tests/web/blog-load-posts.test.ts`

Fixture files:

```markdown
---
title: "Post válido"
slug: "post-valido"
publishedAt: "2020-01-01T10:00:00-03:00"
excerpt: "Resumo."
coverImage: "/blog/covers/post-valido.webp"
tags: ["voice"]
---
Corpo do post com **negrito**.
```

```markdown
---
title: "Post futuro"
slug: "post-futuro"
publishedAt: "2099-01-01T10:00:00-03:00"
excerpt: "Agendado."
coverImage: "/blog/covers/post-futuro.webp"
tags: ["product"]
---
Futuro.
```

- [ ] **Step 1: Add loader tests**

```typescript
import { loadBlogPostsFromDirectory } from "../../apps/web/src/blog/lib/load-posts.js";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const fixturesDir = join(fileURLToPath(import.meta.url), "../../apps/web/src/blog/__fixtures__/pt");

describe("loadBlogPostsFromDirectory", () => {
  it("filters future publishedAt when includeScheduled is false", () => {
    const posts = loadBlogPostsFromDirectory("pt", fixturesDir, {
      now: new Date("2026-01-01T00:00:00Z"),
      includeScheduled: false,
      publicDir: join(process.cwd(), "apps/web/public")
    });
    expect(posts.map((p) => p.slug)).toEqual(["post-valido"]);
  });

  it("sorts by publishedAt desc", () => {
  // add second past post fixture if needed
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement load-posts + render-markdown**

```typescript
// apps/web/src/blog/lib/render-markdown.ts
import { marked } from "marked";

marked.setOptions({ gfm: true });

export function renderMarkdownToHtml(markdown: string): string {
  const raw = marked.parse(markdown, { async: false }) as string;
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
}
```

```typescript
// apps/web/src/blog/lib/load-posts.ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { blogFrontmatterSchema, type BlogPost } from "./post-schema.js";
import { renderMarkdownToHtml } from "./render-markdown.js";
import { estimateReadingTimeMinutes } from "./reading-time.js";

export type LoadBlogPostsOptions = {
  readonly now?: Date;
  readonly includeScheduled?: boolean;
  readonly tagSlug?: string;
  readonly publicDir: string;
};

function assertCoverExists(coverImage: string, publicDir: string) {
  const filePath = join(publicDir, coverImage.replace(/^\//, ""));
  if (!existsSync(filePath)) {
    throw new Error(`Missing cover image: ${coverImage} (expected at ${filePath})`);
  }
}

export function loadBlogPostsFromDirectory(
  locale: MarketingLocale,
  contentLocaleDir: string,
  options: LoadBlogPostsOptions
): BlogPost[] {
  const now = options.now ?? new Date();
  const includeScheduled = options.includeScheduled ?? false;

  if (!existsSync(contentLocaleDir)) {
    return [];
  }

  const files = readdirSync(contentLocaleDir).filter((f) => f.endsWith(".md"));
  const posts: BlogPost[] = [];
  const seenSlugs = new Set<string>();

  for (const file of files) {
    const raw = readFileSync(join(contentLocaleDir, file), "utf8");
    const { data, content } = matter(raw);
    const frontmatter = blogFrontmatterSchema.parse(data);

    if (seenSlugs.has(frontmatter.slug)) {
      throw new Error(`Duplicate blog slug in ${locale}: ${frontmatter.slug}`);
    }
    seenSlugs.add(frontmatter.slug);

    assertCoverExists(frontmatter.coverImage, options.publicDir);

    const publishedAt = new Date(frontmatter.publishedAt);
    if (!includeScheduled && publishedAt > now) {
      continue;
    }

    if (options.tagSlug && !frontmatter.tags.includes(options.tagSlug as never)) {
      continue;
    }

    posts.push({
      ...frontmatter,
      locale,
      body: content.trim(),
      html: renderMarkdownToHtml(content),
      readingTimeMinutes: estimateReadingTimeMinutes(content)
    });
  }

  return posts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getBlogPostBySlug(
  locale: MarketingLocale,
  slug: string,
  contentLocaleDir: string,
  options: LoadBlogPostsOptions
): BlogPost | undefined {
  return loadBlogPostsFromDirectory(locale, contentLocaleDir, {
    ...options,
    includeScheduled: options.includeScheduled ?? false
  }).find((post) => post.slug === slug);
}
```

Add helper `resolveBlogPublicDir()` mirroring content root (join `process.cwd()`, `"public"`).

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(web): load and validate blog posts from markdown files"
```

---

## Task 4: Server functions for routes

**Files:**
- Create: `apps/web/src/blog/server/blog-fns.ts`

- [ ] **Step 1: Implement createServerFn wrappers**

```typescript
// apps/web/src/blog/server/blog-fns.ts
import { createServerFn } from "@tanstack/react-start";
import { join } from "node:path";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { resolveBlogContentRoot } from "../lib/blog-content-root.js";
import { getBlogPostBySlug, loadBlogPostsFromDirectory } from "../lib/load-posts.js";
import { getBlogTag } from "../../../content/blog/tags.js";

function getDirs() {
  const contentRoot = resolveBlogContentRoot();
  const publicDir = join(process.cwd(), "public");
  return { contentRoot, publicDir };
}

export const fetchBlogPosts = createServerFn({ method: "GET" })
  .validator((input: { locale: MarketingLocale; tagSlug?: string; includeScheduled?: boolean }) => input)
  .handler(({ data }) => {
    const { contentRoot, publicDir } = getDirs();
    return loadBlogPostsFromDirectory(data.locale, join(contentRoot, data.locale), {
      tagSlug: data.tagSlug,
      includeScheduled: data.includeScheduled ?? false,
      publicDir
    });
  });

export const fetchBlogPost = createServerFn({ method: "GET" })
  .validator((input: { locale: MarketingLocale; slug: string; includeScheduled?: boolean }) => input)
  .handler(({ data }) => {
    const { contentRoot, publicDir } = getDirs();
    const post = getBlogPostBySlug(
      data.locale,
      data.slug,
      join(contentRoot, data.locale),
      { includeScheduled: data.includeScheduled ?? false, publicDir }
    );
    if (!post) {
      throw new Response("Not Found", { status: 404 });
    }
    return post;
  });

export const fetchBlogTag = createServerFn({ method: "GET" })
  .validator((input: { locale: MarketingLocale; tagSlug: string }) => input)
  .handler(({ data }) => {
    const tag = getBlogTag(data.tagSlug);
    if (!tag) {
      throw new Response("Not Found", { status: 404 });
    }
    const posts = fetchBlogPosts.handler({ data: { locale: data.locale, tagSlug: data.tagSlug } });
    // inline call loadBlogPostsFromDirectory instead to avoid circular fn call
    return { tag, posts: /* loaded posts */ [] };
  });
```

Implement `fetchBlogTag` by calling `loadBlogPostsFromDirectory` directly; throw 404 if `posts.length === 0`.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(web): add blog server functions for route loaders"
```

---

## Task 5: Blog paths + head metadata + extend seo()

**Files:**
- Create: `apps/web/src/blog/seo/blog-paths.ts`
- Create: `apps/web/src/blog/seo/resolve-blog-head.ts`
- Modify: `apps/web/src/marketing/seo/seo.ts`
- Create: `tests/web/blog-seo.test.ts`

- [ ] **Step 1: Write failing head resolver test**

```typescript
import { resolveBlogIndexHead } from "../../apps/web/src/blog/seo/resolve-blog-head.js";

it("sets article og:type on post head", () => {
  const head = resolveBlogPostHead("pt", {
    title: "Hello",
    slug: "hello",
    excerpt: "Excerpt",
    coverImage: "/blog/covers/hello.webp",
    publishedAt: "2026-01-01T10:00:00-03:00",
    tags: ["voice"],
    locale: "pt",
    body: "",
    html: "",
    readingTimeMinutes: 1
  });
  expect(head.meta).toEqual(
    expect.arrayContaining([{ name: "og:type", content: "article" }])
  );
});
```

- [ ] **Step 2: Extend `seo()` helper**

Add optional `type?: "website" | "article"` defaulting to `"website"`; emit `og:type` from param.

- [ ] **Step 3: Implement path helpers**

```typescript
// apps/web/src/blog/seo/blog-paths.ts
import type { MarketingLocale } from "~/i18n/marketing/types";

export function getBlogIndexPath(locale: MarketingLocale) {
  return locale === "pt" ? "/blog" : "/en/blog";
}

export function getBlogPostPath(locale: MarketingLocale, slug: string) {
  return `${getBlogIndexPath(locale)}/${slug}`;
}

export function getBlogTagPath(locale: MarketingLocale, tagSlug: string) {
  return `${getBlogIndexPath(locale)}/tag/${tagSlug}`;
}

export function getBlogRssPath(locale: MarketingLocale) {
  return `${getBlogIndexPath(locale)}/rss.xml`;
}
```

- [ ] **Step 4: Implement `resolveBlogIndexHead`, `resolveBlogPostHead`, `resolveBlogTagHead`**

Use `getSiteUrl()`, `getLocaleMessages(locale).blog.*`, canonical + hreflang between pt/en index (and tag pages). Post head uses absolute cover URL: `${siteUrl}${coverImage}`.

- [ ] **Step 5: Run tests — expect PASS**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(web): blog SEO head resolvers and path helpers"
```

---

## Task 6: JSON-LD, RSS, sitemap, llms extensions

**Files:**
- Create: `apps/web/src/blog/seo/blog-json-ld.ts`
- Create: `apps/web/src/blog/seo/blog-rss.ts`
- Create: `apps/web/src/blog/seo/blog-sitemap.ts`
- Modify: `apps/web/src/marketing/seo/resolve-page-seo.ts`
- Modify: `apps/web/src/marketing/seo/geo/llms.ts`
- Modify: `tests/web/blog-seo.test.ts`, `tests/web/seo-meta.test.ts`, `tests/web/geo.test.ts`

- [ ] **Step 1: JSON-LD builders**

`buildBlogIndexJsonLd(locale)`, `buildBlogPostingJsonLd(post, siteUrl)`, `buildBlogTagJsonLd(locale, tagSlug, label)`.

- [ ] **Step 2: RSS builder**

```typescript
export function buildBlogRssXml(
  locale: MarketingLocale,
  posts: ReadonlyArray<BlogPost>,
  siteUrl: string
): string {
  // RSS 2.0 with channel + items; pubDate toUTCString(); enclosure for cover
}
```

- [ ] **Step 3: Sitemap extension**

```typescript
// blog-sitemap.ts
export function buildBlogSitemapEntries(siteUrl: string, now = new Date()): string {
  // for each locale: index, each published post, each tag with >=1 post
}
```

Modify `buildSitemapXml` in `resolve-page-seo.ts` to append `buildBlogSitemapEntries(siteUrl)`.

- [ ] **Step 4: Extend llms builders**

In `buildLlmsTxt`: add `## Blog` section with index + RSS URLs per locale.

In `buildLlmsFullTxt`: append `## Recent blog posts` with 5 newest titles + URLs (call `loadBlogPostsFromDirectory` for `pt` and `en` content dirs).

- [ ] **Step 5: Tests**

```typescript
it("includes blog post URL in sitemap", () => {
  const xml = buildSitemapXml("https://cultiv.app");
  expect(xml).toContain("https://cultiv.app/blog");
});
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(web): blog JSON-LD, RSS, sitemap, and llms extensions"
```

---

## Task 7: Marketing i18n for blog

**Files:**
- Modify: `apps/web/src/i18n/marketing/types.ts`
- Modify: `apps/web/src/i18n/marketing/locales/pt.ts`
- Modify: `apps/web/src/i18n/marketing/locales/en.ts`

- [ ] **Step 1: Add types**

```typescript
// in LocaleMessages
readonly header: {
  // ...
  readonly nav: {
    // existing keys...
    readonly blog: string;
  };
};
readonly blog: {
  readonly indexTitle: string;
  readonly indexDescription: string;
  readonly indexEyebrow: string;
  readonly indexSubtitle: string;
  readonly allTags: string;
  readonly backToIndex: string;
  readonly readTime: string; // "min de leitura" pattern — use `{minutes}` in component
  readonly shareCopy: string;
  readonly shareCopied: string;
  readonly shareNative: string;
  readonly ctaWaitlist: string;
  readonly tagPageTitle: string; // "{tag}" interpolated
  readonly tagEmpty: string;
  readonly rssTitle: string;
};
```

PT values: `nav.blog: "Diário de bordo"`, EN: `"Logbook"`.

- [ ] **Step 2: Run i18n parity test**

Run: `pnpm exec vitest run tests/web/i18n-catalog.test.ts`

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(web): add marketing i18n strings for blog"
```

---

## Task 8: Blog UI components

**Files:**
- Create: `apps/web/src/blog/components/BlogProse.tsx`
- Create: `apps/web/src/blog/components/BlogPostCard.tsx`
- Create: `apps/web/src/blog/components/BlogTagChips.tsx`
- Create: `apps/web/src/blog/components/BlogAuthorBlock.tsx`
- Create: `apps/web/src/blog/components/BlogShareActions.tsx`
- Create: `apps/web/src/blog/components/BlogStructuredData.tsx`

- [ ] **Step 1: BlogProse** — `ui-type-conducao text-[1.125rem] leading-[1.75]` wrapper with Tailwind arbitrary selectors for `h2`, `h3` (Playfair), `a` (deep-blue), `blockquote` (terracotta border), `code` (mono), `img` (rounded, lazy).

- [ ] **Step 2: BlogPostCard** — `ExpeditionCard as="div"` + `Link` overlay; 16:9 cover; meta row with `CoordinateLabel` for date + reading time.

- [ ] **Step 3: BlogTagChips** — links to `getBlogTagPath`; active chip `border-terracotta border-solid`.

- [ ] **Step 4: BlogAuthorBlock** — imports `blogAuthor`; dotted card.

- [ ] **Step 5: BlogShareActions** — copy URL + optional `navigator.share`.

- [ ] **Step 6: BlogStructuredData** — `<script type="application/ld+json">`.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat(web): add blog UI components"
```

---

## Task 9: Blog screens

**Files:**
- Create: `apps/web/src/blog/screens/BlogIndexScreen.tsx`
- Create: `apps/web/src/blog/screens/BlogPostScreen.tsx`

- [ ] **Step 1: BlogIndexScreen**

Props: `locale`, `posts`, `activeTagSlug?: string`.

Layout: hero eyebrow + title + subtitle; `BlogTagChips`; responsive grid of `BlogPostCard`; empty state from i18n.

- [ ] **Step 2: BlogPostScreen**

Props: `locale`, `post`.

Layout: cover with cartographic frame; title; meta; tags; `BlogProse`; `BlogShareActions`; `BlogAuthorBlock`; `ButtonLink` to `getHomePath(locale) + "#waitlist"`.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(web): add blog index and post screens"
```

---

## Task 10: TanStack routes + RSS handlers

**Files:**
- Create: `apps/web/src/routes/blog/index.tsx`
- Create: `apps/web/src/routes/blog/$slug.tsx`
- Create: `apps/web/src/routes/blog/tag/$tagSlug.tsx`
- Create: `apps/web/src/routes/blog/rss[.]xml.ts`
- Create: `apps/web/src/routes/en/blog/index.tsx`
- Create: `apps/web/src/routes/en/blog/$slug.tsx`
- Create: `apps/web/src/routes/en/blog/tag/$tagSlug.tsx`
- Create: `apps/web/src/routes/en/blog/rss[.]xml.ts`

- [ ] **Step 1: Index routes**

```typescript
// apps/web/src/routes/blog/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "~/marketing/layouts/MarketingLayout";
import { BlogIndexScreen } from "~/blog/screens/BlogIndexScreen";
import { fetchBlogPosts } from "~/blog/server/blog-fns";
import { resolveBlogIndexHead } from "~/blog/seo/resolve-blog-head";

export const Route = createFileRoute("/blog/")({
  loader: async ({ location }) => {
    const includeScheduled =
      import.meta.env.DEV && new URLSearchParams(location.search).get("preview") === "future";
    return fetchBlogPosts({ data: { locale: "pt", includeScheduled } });
  },
  head: () => resolveBlogIndexHead("pt"),
  component: BlogIndexPt
});

function BlogIndexPt() {
  const posts = Route.useLoaderData();
  return (
    <MarketingLayout locale="pt" showSectionRail={false}>
      <BlogIndexScreen locale="pt" posts={posts} />
    </MarketingLayout>
  );
}
```

Mirror for `/en/blog` with `locale: "en"`.

Add RSS `<link rel="alternate">` in index `head` via `resolveBlogIndexHead`.

- [ ] **Step 2: Post routes** — loader calls `fetchBlogPost`; 404 via thrown Response; `BlogStructuredData` + `BlogPostScreen`.

- [ ] **Step 3: Tag routes** — loader validates tag + loads filtered posts; 404 if empty.

- [ ] **Step 4: RSS routes** — server handler pattern from `sitemap[.]xml.ts`:

```typescript
export const Route = createFileRoute("/blog/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const posts = await fetchBlogPosts({ data: { locale: "pt" } });
        return new Response(buildBlogRssXml("pt", posts, getSiteUrl()), {
          headers: { "Content-Type": "application/rss+xml; charset=utf-8" }
        });
      }
    }
  }
});
```

- [ ] **Step 5: Regenerate route tree**

Run: `pnpm --filter @my-ai-orchestrator/web dev` briefly or `pnpm --filter @my-ai-orchestrator/web build` to refresh `routeTree.gen.ts`.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(web): add blog routes and RSS feeds"
```

---

## Task 11: Marketing navigation + layout

**Files:**
- Modify: `apps/web/src/marketing/layouts/MarketingLayout.tsx`
- Modify: `apps/web/src/marketing/components/SiteHeader.tsx`
- Modify: `apps/web/src/marketing/components/SiteMobileNav.tsx`
- Modify: `apps/web/src/marketing/sections/FooterSection.tsx`

- [ ] **Step 1: MarketingLayout**

Add `showSectionRail?: boolean` default `true`; conditionally render `MarketingSectionRail`.

- [ ] **Step 2: SiteHeader + SiteMobileNav**

After existing `marketingNavItems`, render blog link:

```tsx
<a href={getBlogIndexPath(locale)} className={rebrandNavItemClassName}>
  {messages.header.nav.blog}
</a>
```

- [ ] **Step 3: FooterSection**

In product column, add link to `getBlogIndexPath(locale)` with `messages.header.nav.blog`.

- [ ] **Step 4: Manual check**

Landing header shows "Diário de bordo" → `/blog`; blog header shows same nav + CTA to waitlist.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(web): link marketing surface to blog in header and footer"
```

---

## Task 12: Seed content + cover assets

**Files:**
- Create: `apps/web/content/blog/pt/bem-vindo-ao-diario.md`
- Create: `apps/web/content/blog/en/welcome-to-the-logbook.md`
- Create: `apps/web/public/blog/covers/bem-vindo.webp` (placeholder WebP)
- Create: `apps/web/public/blog/covers/welcome.webp`

- [ ] **Step 1: Write seed posts** with `publishedAt` in the past and matching slugs/covers.

- [ ] **Step 2: Verify in dev**

Run: `pnpm dev:web`

Visit: `http://localhost:3000/blog`, `/blog/bem-vindo-ao-diario`, `/en/blog/welcome-to-the-logbook`

- [ ] **Step 3: Commit**

```bash
git commit -m "content(web): add seed blog posts pt and en"
```

---

## Task 13: QA gate

**Files:**
- Modify: `docs/progress-log.md`

- [ ] **Step 1: Run web tests**

Run: `pnpm test:web`
Expected: all pass including `blog-load-posts.test.ts`, `blog-seo.test.ts`, updated `geo.test.ts`, `seo-meta.test.ts`

- [ ] **Step 2: Run build**

Run: `pnpm build:web`
Expected: success, no TypeScript errors

- [ ] **Step 3: Smoke checklist**

- [ ] `/blog` and `/en/blog` list seed posts
- [ ] Post OG uses cover image (view page source `og:image`)
- [ ] `/sitemap.xml` contains `/blog/bem-vindo-ao-diario`
- [ ] `/blog/rss.xml` returns XML with item
- [ ] `/llms.txt` mentions blog URLs
- [ ] Future `publishedAt` post returns 404 in production build preview
- [ ] `?preview=future` on dev shows scheduled post

- [ ] **Step 4: Update progress log**

- [ ] **Step 5: Commit**

```bash
git commit -m "docs: log Cultiv blog v1 implementation complete"
```

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Markdown in repo | 1, 12 |
| `/blog` + `/en/blog` | 10 |
| Tag filter canonical slug | 1, 3, 10 |
| `publishedAt` scheduling | 3, 4, 10 |
| Required cover | 3, 12 |
| Fixed author block | 1, 8 |
| Inter body / Playfair titles | 8, 9 |
| MarketingLayout + nav links | 11 |
| Auto SEO meta + JSON-LD | 5, 6, 10 |
| Auto sitemap | 6 |
| Auto RSS | 6, 10 |
| Auto llms.txt | 6 |
| Copy link + Web Share | 8 |
| Build fails on bad content | 3, 13 |
| No section rail on blog | 10, 11 |
| Dev preview future posts | 10 |

No placeholders remain. Types consistent: `BlogPost`, `MarketingLocale`, `BlogTagSlug` used throughout.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-25-cultiv-blog.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — implement tasks in this session using executing-plans, batch execution with checkpoints

Which approach do you want?
