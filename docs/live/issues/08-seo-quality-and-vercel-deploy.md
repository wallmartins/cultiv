---
title: SEO Quality and Vercel Deploy
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: HITL
last_updated: 2026-06-09
---

# SEO Quality and Vercel Deploy

## Parent

- `docs/live/prd/cultiv-marketing-surface-phase-1.md`

## User stories covered

18, 20, 21

## What to build

Complete the **Marketing Surface** for public launch with correct SEO metadata, quality verification, and Vercel production deployment.

This vertical slice proves end-to-end that:

- **SEO Meta Resolver** sets title, description, canonical, Open Graph, and `hreflang` alternates per route and **Marketing Locale**
- `<html lang>` reflects pt-BR or en correctly
- Lighthouse performance and accessibility scores reach at least 90 on the showcase page
- responsive QA passes at 375px, 768px, and 1280px across showcase, legal, and waitlist flows
- Vercel project is configured with `apps/web` as root, server env vars for Loops, and preview deploys on PRs (`vercel.json`, `nitro.config.ts`, `.env.example`)
- production deploy is smoke-tested: locale toggle, legal pages, **Waitlist Submission** reaches Loops
- custom domain DNS is configured when available (HITL — requires human access to DNS and Loops credentials)

## Acceptance criteria

- [x] Every public route exposes correct `lang`, canonical, and `hreflang` pairs between pt and en equivalents.
- [x] Open Graph tags render appropriate title and description per locale (`og:url`, `og:locale`, Twitter summary card).
- [x] `robots.txt` and `sitemap.xml` served for all six public routes.
- [x] Font loading uses `font-display: swap` and preconnect hints; does not cause layout shift regressions.
- [ ] Lighthouse performance ≥ 90 and accessibility ≥ 90 on `/` (mobile audit) — run after deploy or `pnpm preview:web` + Lighthouse CLI.
- [ ] Production URL is live on Vercel with Loops secrets configured server-side only.
- [ ] Manual smoke test confirms waitlist signup appears in Loops from production.
- [ ] Custom domain DNS configured (if using `cultiv.app`).

## Agent-complete (code)

| Item | Location |
|------|----------|
| SEO resolver | `apps/web/src/utils/resolve-page-seo.ts` |
| GEO head + llms | `apps/web/src/utils/resolve-page-head.ts`, `utils/geo/` |
| JSON-LD | `utils/geo/json-ld.ts` + `GeoStructuredData`, `LegalStructuredData` |
| Citable HTML | `GeoCitationBlock` in About section (`#product-definition`) |
| llms.txt / llms-full.txt | `/llms.txt`, `/en/llms.txt`, `/llms-full.txt`, `/en/llms-full.txt` |
| AI crawler policy | `buildGeoRobotsTxt` (GPTBot, ClaudeBot, PerplexityBot, etc.) |
| Per-route head | `apps/web/src/routes/*.tsx` |
| Document lang | `apps/web/src/hooks/use-document-lang.ts` |
| robots / sitemap | `apps/web/src/routes/robots[.]txt.ts`, `sitemap[.]xml.ts` |
| Vercel / Nitro | `apps/web/vercel.json`, `nitro.config.ts` |
| Env template | `apps/web/.env.example` |
| Tests | `tests/web/seo-meta.test.ts`, `tests/web/geo.test.ts` |

## HITL — information required from you

### 1. Vercel project

| Setting | Value |
|---------|--------|
| Root Directory | `apps/web` |
| Framework | TanStack Start (auto via `vercel.json`) |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |
| Build Command | `pnpm build` |

Connect the GitHub repo and enable preview deploys on PRs.

### 2. Environment variables (Vercel → Project Settings → Environment Variables)

| Variable | Scope | Notes |
|----------|--------|--------|
| `LOOPS_API_KEY` | Production, Preview | Server-only; from [Loops API settings](https://loops.so) |
| `LOOPS_MAILING_LIST_ID` | Production, Preview | Mailing list ID for waitlist contacts |
| `SITE_URL` | Production | `https://cultiv.app` (no trailing slash) |
| `SITE_URL` | Preview | Optional; defaults to `VERCEL_URL` if unset |

Never prefix Loops keys with `VITE_` or `PUBLIC_`.

### 3. DNS (custom domain)

If using `cultiv.app`:

- Add domain in Vercel → Domains
- Point registrar DNS to Vercel (A record `76.76.21.21` or CNAME `cname.vercel-dns.com` per Vercel instructions)
- Set `SITE_URL=https://cultiv.app` in production env after DNS propagates

### 4. Post-deploy smoke test

1. Open `/` and `/en` — locale toggle switches without losing anchors
2. Open `/privacy`, `/terms`, `/en/privacy`, `/en/terms`
3. Submit waitlist with a test email on production
4. Confirm contact appears in Loops dashboard with correct locale tag
5. Run Lighthouse mobile on `/` (Chrome DevTools or `npx lighthouse <url> --only-categories=performance,accessibility --form-factor=mobile`)

### 5. Responsive QA (manual)

Verify at **375px**, **768px**, **1280px**:

- Hero + scroll sections readable
- Showcase horizontal pin (or vertical fallback with reduced motion)
- Waitlist form usable
- Legal pages readable

### 6. Post-deploy audit

- **Lighthouse performance** — GSAP/Lenis and Google Fonts may pull score below 90; audit after deploy and optimize if needed
- **OG preview** — verify `https://<domain>/og.png` and social cards via [opengraph.xyz](https://www.opengraph.xyz/) or platform debuggers

## Blocked by

- `06-waitlist-loops-end-to-end.md` ✅
- `07-motion-system-and-accessibility.md` ✅
