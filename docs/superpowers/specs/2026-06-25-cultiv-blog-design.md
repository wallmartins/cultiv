---
title: Cultiv Blog — Diário de bordo (Marketing Surface)
doc_type: design
status: approved
domain: marketing-surface
last_updated: 2026-06-25
brainstorming_approach: Markdown-first public blog
---

# Cultiv Blog — Diário de bordo

## Summary

Add a **public blog** to the Cultiv marketing surface — accessible with or without login — that reuses **MarketingLayout**, **Cultiv Cartography** identity, and the existing SEO/GEO infrastructure. Content is **Markdown in the repository** (v1); posts are loaded via **server-side loaders**, filtered by `publishedAt`, and rendered with **Inter** for long-form reading and **Playfair Display** for titles.

**Locales:** separate PT (`/blog`) and EN (`/en/blog`) — posts are independent per locale (not paired translations).

**Authoring:** create `.md` + cover image + commit/deploy. No manual edits to `sitemap.xml`, `robots.txt`, RSS, meta tags, or `llms.txt` per post.

---

## Problem

Cultiv has no editorial channel for thought leadership, product narrative, or SEO content beyond the single-scroll landing page. The team needs:

- A discoverable, shareable blog with strong SEO and GEO
- Full Cultiv visual identity with readable typography
- Bidirectional navigation between landing and blog
- Low operational cost (no CMS subscription, no admin UI in v1)
- Scheduled publishing without redeploy

---

## Goals

1. Public blog at `/blog` and `/en/blog` — no authentication required.
2. Markdown files in repo; publish workflow = file + image + git deploy.
3. Extend SEO (meta, JSON-LD, sitemap), GEO (`llms.txt`), and RSS **automatically** from post frontmatter.
4. Tag filtering with canonical slugs and translated labels.
5. `publishedAt` scheduling — posts appear in listings, RSS, and sitemap only when `publishedAt <= now`; route returns 404 before that.
6. Links in marketing header/footer ↔ blog; blog header CTA back to landing waitlist.
7. Fixed author block (single author) reused on every post.
8. Required cover image per post for cards and OG sharing.

---

## Non-Goals (v1)

- In-browser admin / rich-text editor (future phase)
- MDX or React components in post body
- Comments, full-text search, pagination (until 20+ posts)
- Paired PT↔EN posts with per-article hreflang
- Dark mode on blog
- `MarketingSectionRail` on blog pages (reading focus)

---

## Decisions (brainstorming)

| Topic | Decision |
|-------|----------|
| Locales | B — `/blog` and `/en/blog`, independent posts |
| Content source | Markdown in repo |
| Post metadata | Title, slug, excerpt, cover (required), reading time, tags |
| Author | Fixed block in `author.ts` (pt/en), not per-post frontmatter |
| Tags | Canonical slug + translated label; filter routes `/blog/tag/{slug}` |
| Publishing | `publishedAt` ISO 8600; runtime filter (no redeploy for schedule) |
| RSS | Separate `/blog/rss.xml` and `/en/blog/rss.xml` |
| Rendering | Approach 1 — `gray-matter` + `marked` in server loader |
| Body typography | Inter (`ui-type-conducao`); titles Playfair (`ui-type-autoridade`) |
| Nav label | "Diário de bordo" (pt) / "Logbook" (en) |

---

## Architecture

### Directory layout

```
apps/web/
├── content/blog/
│   ├── README.md           # author checklist (operational)
│   ├── tags.ts             # canonical tag registry
│   ├── author.ts           # fixed name + bio per locale
│   ├── pt/
│   │   └── {slug}.md
│   └── en/
│       └── {slug}.md
├── public/blog/
│   ├── covers/             # required cover images (WebP)
│   └── inline/             # optional inline images
└── src/blog/
    ├── lib/
    │   ├── load-posts.ts   # read, parse, validate, filter, sort
    │   ├── post-schema.ts  # Zod frontmatter
    │   └── reading-time.ts
    ├── components/
    │   ├── BlogProse.tsx
    │   ├── BlogPostCard.tsx
    │   ├── BlogAuthorBlock.tsx
    │   ├── BlogTagChips.tsx
    │   └── BlogShareActions.tsx
    └── seo/
        ├── blog-json-ld.ts
        ├── blog-rss.ts
        └── blog-sitemap.ts   # extends sitemap builder
```

### Frontmatter schema

```yaml
---
title: "Título do artigo"
slug: "meu-primeiro-post"
publishedAt: "2026-06-25T10:00:00-03:00"
excerpt: "Resumo para card, SEO e RSS (≤160 chars recommended)"
coverImage: "/blog/covers/meu-post.webp"
tags: ["voice", "product"]
---
```

**Validation (Zod, fail build):**

- All fields required
- `slug` unique per locale
- Each `tags[]` entry must exist in `tags.ts`
- `coverImage` path must resolve to a file under `public/`
- `excerpt` max 200 chars (warn if >160)

### Tag registry (`tags.ts`)

```ts
export const blogTags = [
  { slug: "voice", label: { pt: "Voz", en: "Voice" } },
  { slug: "product", label: { pt: "Produto", en: "Product" } }
] as const;
```

Filter URLs use canonical slug in both locales: `/blog/tag/voice`, `/en/blog/tag/voice`. Each listing shows only posts in that locale.

### Author config (`author.ts`)

```ts
export const blogAuthor = {
  name: { pt: "…", en: "…" },
  bio: { pt: "…", en: "…" },
  // optional: image path
} as const;
```

### Routes

| Route | Purpose |
|-------|---------|
| `/blog` | PT index |
| `/blog/$slug` | PT article |
| `/blog/tag/$tagSlug` | PT tag filter |
| `/blog/rss.xml` | PT RSS 2.0 |
| `/en/blog` | EN index |
| `/en/blog/$slug` | EN article |
| `/en/blog/tag/$tagSlug` | EN tag filter |
| `/en/blog/rss.xml` | EN RSS 2.0 |

All routes use `MarketingLayout` with `data-surface="marketing"`.

### Data flow

```
.md on disk
  → server loader (Node fs + gray-matter + marked)
  → Zod validate
  → filter publishedAt <= now (prod)
  → sort by publishedAt desc
  → render route
```

**Scheduling:** loaders compare `publishedAt` to server time. Future posts: omitted from index, tag pages, RSS, sitemap; `$slug` route returns 404.

**Dev preview:** `?preview=future` on dev only lists/includes scheduled posts (never in production).

### Dependencies (new)

- `gray-matter` — frontmatter parse
- `marked` — Markdown → HTML (sanitized: no raw script/iframe)
- `zod` — if not already a direct dependency of `apps/web`

---

## UI

### Typography

| Element | Font | Token |
|---------|------|-------|
| Page / post titles | Playfair Display | `ui-type-autoridade` |
| In-article h2/h3 | Playfair | `Text` h2/h3 variants |
| Body | **Inter** | `ui-type-conducao`, ~1.125rem, leading 1.75 |
| Meta (date, reading time) | JetBrains Mono or label style | `ui-type-mono` |
| Tags | Inter uppercase chips | `border-dotted-cartography` |
| Decorative signature | Caveat | optional in author block |

Do **not** use `LogbookProse` for article body (Playfair italic is poor for long reads). Use new `BlogProse` with Inter.

### Index page

- Compact hero: "Diário de bordo" / "Logbook" + subtitle (i18n)
- Horizontal tag chips (all + each tag); active = terracotta solid border
- Grid of `ExpeditionCard` (`as="div"`) post cards: 16:9 cover, title, excerpt, meta, tags
- Responsive: 1 → 2 → 2–3 columns
- Minimal motion (card hover only); `prefers-reduced-motion` respected

### Article page

- Cover with cartographic frame (dotted border, `shadow-cartography`)
- Title, meta row, tag links
- `BlogProse` column ~42rem max-width
- Share: copy link + Web Share API when available
- Fixed `BlogAuthorBlock` card
- CTA `ButtonLink` → `/#waitlist` on home locale

### Tag page

- Same grid as index; heading = translated tag label + post count
- "← Voltar ao diário" link
- 404 if tag unknown or zero published posts

### Navigation

- **SiteHeader** + **FooterSection**: add "Diário de bordo" / "Logbook" → blog index
- Logo → home (`/` or `/en`)
- Blog header CTA unchanged: "Explorar sua voz" → `/#waitlist`
- Omit `MarketingSectionRail` on blog routes

### Images

- Covers: WebP in `public/blog/covers/`, recommended 1200×630 or 16:9
- Post cover: `loading="eager"` with explicit width/height
- Inline images: `loading="lazy"`, `rounded-[5px]`

---

## SEO, GEO, RSS (all automatic per post)

**No manual file edits when publishing a post.** Only create `.md` + cover (+ new tag in `tags.ts` if needed).

### Meta / OG / Twitter

Extend `seo()` helper to accept `og:type: "article"` for post routes.

| Page | title | description | og:image |
|------|-------|-------------|----------|
| Blog index | i18n catalog | i18n catalog | default Cultiv OG |
| Post | `{title} — Cultiv` | `excerpt` | absolute `coverImage` |
| Tag page | `{tag label} — Diário de bordo — Cultiv` | i18n template | default OG |

### JSON-LD

- **Index:** `Blog` + `CollectionPage` with `publisher` → Organization
- **Post:** `BlogPosting` with headline, description, image, datePublished, author Person, publisher, inLanguage, mainEntityOfPage
- **Tag:** `CollectionPage` with `about`

New component: `BlogStructuredData.tsx`.

### Sitemap

Extend `buildSitemapXml` to call blog loader and append:

| URL | priority | changefreq | lastmod |
|-----|----------|------------|---------|
| `/blog`, `/en/blog` | 0.8 | weekly | build date |
| `/blog/{slug}`, `/en/blog/{slug}` | 0.7 | monthly | `publishedAt` |
| `/blog/tag/{slug}` (if ≥1 post) | 0.5 | weekly | build date |

Only published posts (`publishedAt <= now`).

### robots.txt

No change per post. Blog paths remain crawlable (not under `/app/*`).

### GEO — llms.txt / llms-full.txt

Extend `buildLlmsTxt` / `buildLlmsFullTxt` dynamically:

- Static blog index URLs + RSS links (pt/en)
- **llms-full:** append 5 most recent published posts per locale (title + URL) from loader

### hreflang

| Page | hreflang |
|------|----------|
| `/blog` ↔ `/en/blog` | yes |
| `/blog/tag/{slug}` ↔ `/en/blog/tag/{slug}` | yes (same canonical slug) |
| Individual posts | no (independent locales) |

### RSS

Server handlers `/blog/rss.xml` and `/en/blog/rss.xml`:

- RSS 2.0, language pt-br / en
- Items: title, link, description (excerpt), pubDate (RFC 822), guid, enclosure (cover WebP)
- Only published posts, newest first
- `<link rel="alternate" type="application/rss+xml">` on index pages

---

## Author workflow

1. Add `content/blog/{pt|en}/{slug}.md` with frontmatter
2. Add `public/blog/covers/{name}.webp`
3. Preview: `pnpm dev` → `/blog/{slug}` or `/en/blog/{slug}`
4. Commit + push → Vercel deploy
5. Post goes live automatically when `publishedAt` passes (no extra deploy)

**New tag:** add entry to `tags.ts` once.

**Checklist** in `content/blog/README.md`:

- slug unique in locale
- cover exists
- tags valid
- publishedAt with timezone
- excerpt ≤ 160 chars recommended

---

## Error handling

| Condition | Behavior |
|-----------|----------|
| Invalid frontmatter | Build fails with Zod message |
| Duplicate slug (locale) | Build fails |
| Unknown tag slug | Build fails |
| Missing cover file | Build fails |
| `publishedAt` in future (prod) | 404 on post; excluded from lists, RSS, sitemap |
| Unknown slug | 404 |
| Tag with no published posts | 404 |
| Unsafe HTML in Markdown | Stripped by sanitizer |

---

## Testing

| Test | Validates |
|------|-----------|
| `loadBlogPosts(locale)` | publishedAt filter, sort desc |
| Zod schema | rejects invalid frontmatter |
| Slug uniqueness | duplicate detection |
| Tag validation | unknown slug rejected |
| `buildBlogPostingJsonLd` | fixture post JSON-LD |
| `buildBlogRss` | valid XML, item count |
| Sitemap extension | published URLs included |

Fixtures: `apps/web/src/blog/__fixtures__/` with sample `.md` files.

---

## Future evolution (out of scope)

- Admin UI at `/app/blog` or `/admin/blog` writing to PostgreSQL
- MDX for in-article Cultiv components
- Optional `alternate_post_id` for paired hreflang without mandating pairs
- Pagination when post count grows
- RSS/Atom enrichment (categories as RSS `<category>`)

---

## Acceptance criteria

- [ ] `/blog` and `/en/blog` render published posts in MarketingLayout
- [ ] Post pages render Markdown with Inter body and Playfair titles
- [ ] Cover required; OG image uses cover on share
- [ ] Tag filter works with canonical slugs
- [ ] `publishedAt` future → hidden in prod, 404 on direct URL
- [ ] sitemap, RSS, JSON-LD, meta update automatically when adding a `.md` file (no manual SEO edits)
- [ ] Header/footer link landing ↔ blog
- [ ] Author block fixed per locale
- [ ] Copy link + Web Share on post page
- [ ] Build fails on invalid frontmatter, duplicate slug, bad tag, missing cover
- [ ] Tests pass for loader, validation, RSS, JSON-LD
