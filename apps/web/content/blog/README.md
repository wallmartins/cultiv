# Cultiv blog content

Markdown posts live in `pt/` and `en/` (added in later tasks). Before publishing a post, check:

- **slug** — unique within the locale directory
- **coverImage** — file exists under `public/` (typically `public/blog/covers/`)
- **tags** — use slugs from `tags.ts` only (`voice`, `product`, `writing`)
- **publishedAt** — ISO 8601 with timezone (e.g. `2026-06-25T10:00:00-03:00`)
- **excerpt** — ≤ 160 characters recommended for SEO/social previews

## Workflow

1. Create a `.md` file in `pt/` or `en/`.
2. Add the cover image to `public/blog/covers/`.
3. Commit and deploy.
