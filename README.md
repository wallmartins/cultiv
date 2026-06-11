# Cultiv

**Your authenticity, at scale.**

Cultiv is an AI writing engine that learns an author's personal voice and generates text that sounds like them — not a generic assistant. Visitors teach their voice with real writing samples, pick a content format (blog, LinkedIn, thread, newsletter, and more), review a preview, and generate aligned output at scale.

This repository is a **pnpm monorepo** containing the public marketing site, the writing backend, shared domain packages, and the client SDK. The public product name is **Cultiv**; internal workspace packages use the `@my-ai-orchestrator/*` scope.

**Status:** Pre-launch — [cultiv.app](https://cultiv.app) marketing surface with waitlist. Authenticated product (phase 2) is in active development.

---

## Product in brief

| Concept | What it means |
|---------|----------------|
| **Voice Profile** | Durable model of tone, cadence, vocabulary, and constraints — learned from the author's samples |
| **Content Type** | Kind of text (blog post, LinkedIn post, thread, newsletter, …) — each with its own pipeline |
| **Generation Request** | User-facing request to generate text (briefing + voice inputs) without exposing internal pipeline structure |
| **Marketing Surface** | Unauthenticated experience: editorial showcase + waitlist — separate from the authenticated app |
| **Waitlist Submission** | Signup forwarded to Loops; does **not** create an application user or touch the product backend |

Full domain language: [`CONTEXT.md`](./CONTEXT.md).

---

## Architecture overview

Development is split into two phases. Phase 1 (marketing) is largely complete; phase 2 (authenticated app) builds on the same design system and backend.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PHASE 1 — Marketing Surface (apps/web, deployed to Vercel)              │
│  Editorial landing · showcase · FAQ · legal · waitlist → Loops             │
│  No Auth0 · no product backend · Effect at service boundaries only       │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  PHASE 2 — Authenticated app (planned: apps/web/routes/app/*)           │
│  Auth0 · TanStack Query · client-sdk → backend Public API Surface        │
│  Generation · voice training · execution history · billing                 │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  WRITING ENGINE (apps/backend + packages/*)                              │
│  Pipelines · voice derivation · quality lanes · credits · PostgreSQL       │
└──────────────────────────────────────────────────────────────────────────┘
```

### Boundary rules

- The **marketing site never calls the product backend** — governance enforced in `tests/governance/frontend-client-boundary.test.ts`.
- **Waitlist** uses a server-only route (`POST /api/waitlist`) → Loops adapter. Secrets stay off the client.
- **Phase 2** frontends consume the backend only through `@my-ai-orchestrator/client-sdk`, not raw HTTP to internal routes.
- **Auth** (signup/signin) is Auth0 — not the client SDK.

---

## Writing engine (backend)

The engine orchestrates structured generation pipelines: analyze → draft → voice alignment → refine, with optional parallel **quality lanes** and candidate selection.

```
Generation Request
       │
       ▼
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Voice Profile│────▶│ Pipeline (per   │────▶│ AI Adapters  │
│ (derived from│     │  Content Type)  │     │ (LLM providers)│
│  examples)   │     └─────────────────┘     └──────────────┘
└──────────────┘              │
                              ▼
                    ┌─────────────────┐
                    │ Text Quality ·  │
                    │ Candidates ·    │
                    │ Credit capture  │
                    └─────────────────┘
```

| Package / app | Role |
|---------------|------|
| `apps/backend` | Hono HTTP API, auth, Postgres persistence, job/sync execution |
| `packages/core` | Pipeline orchestration, runtime base |
| `packages/domain` | Domain types and invariants |
| `packages/orchestrator` | Step execution and pipeline wiring |
| `packages/skills` | Built-in and declarative skills (analyze, draft, voice-match, refine) |
| `packages/ai-adapters` | Agent-agnostic LLM adapters |
| `packages/text-quality` | Candidate comparison and refinement |
| `packages/database` | Schema and repository layer |
| `packages/payments` | Credit budget, reservations, pricing envelopes |
| `packages/contracts` | Shared API contracts |
| `packages/client-sdk` | Typed client for web/mobile (phase 2) |

**Stack:** TypeScript, [Hono](https://hono.dev/), [Effect](https://effect.website/), [Fastify](https://fastify.dev/) (legacy paths), PostgreSQL, [Zod](https://zod.dev/) validation.

Run locally: `pnpm dev` (backend). Requires `DATABASE_URL` and related env — see `apps/backend/`.

---

## Marketing surface (web)

Single-scroll **Product Showcase** with anchored sections, bilingual routes, and SEO/GEO metadata.

### Routes

| Route | Locale | Purpose |
|-------|--------|---------|
| `/` | pt-BR | Home + showcase + waitlist |
| `/en` | en | English equivalent |
| `/privacy`, `/terms` | pt | Legal |
| `/en/privacy`, `/en/terms` | en | Legal |
| `/llms.txt`, `/llms-full.txt` | pt/en | LLM-oriented product docs |
| `/robots.txt`, `/sitemap.xml` | — | Crawlers |

### Waitlist flow

```
Browser (WaitlistForm)
    → submitWaitlistAction (TanStack Start server fn)
    → Waitlist Service (Effect)
    → Loops adapter (POST contacts/create)
    → Loops audience + optional workflow email
```

### Showcase content

Curated **Showcase Samples** (blog, LinkedIn, thread) live in `apps/web/src/content/showcase/` — generic AI output vs voice-aligned output per locale. Content is typed catalogs, not embedded in JSX.

### SEO & GEO

- Per-route title, description, canonical, `hreflang`, Open Graph
- JSON-LD: Organization, WebSite, SoftwareApplication, FAQPage
- `llms.txt` / `llms-full.txt` for AI crawlers; explicit allowlist in `robots.txt`

---

## Design system (`packages/ui`)

Shared tokens and components for marketing and future app UI.

| Layer | Contents |
|-------|----------|
| **Tokens** | CSS variables — paper surface, moss/golden accents, editorial spacing |
| **Primitives** | `Button`, `Text`, `Container`, `Input`, … |
| **Patterns** | `SectionHeader`, `ComparisonCard`, `Accordion`, … |

**Visual language (marketing):** editorial light theme, botanical illustrations, discrete motion. Typography: Playfair Display (display), Caveat (handwritten accents), Inter (body), JetBrains Mono (meta/labels). Palette centers on warm paper (`#f5f0e8`), rich soil foreground, moss, and golden highlights.

---

## Tech stack

### Marketing site (`apps/web`)

| Layer | Technology |
|-------|------------|
| Framework | [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) |
| UI | React 19, `packages/ui`, [Tailwind CSS](https://tailwindcss.com/) v4 |
| Motion | [GSAP](https://gsap.com/) + [Lenis](https://lenis.darkroom.engineering/) smooth scroll; `prefers-reduced-motion` guards |
| Server | [Nitro](https://nitro.build/) (Vercel preset in CI) |
| Boundaries | [Effect](https://effect.website/) for waitlist service |
| Email / waitlist | [Loops](https://loops.so) API |
| Deploy | [Vercel](https://vercel.com) — root directory `apps/web` |

### Backend & shared packages

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| HTTP | Hono (+ Fastify where legacy) |
| Effects & errors | Effect-TS |
| Database | PostgreSQL |
| Validation | Zod |
| Tests | Vitest |
| Monorepo | pnpm workspaces |

### Planned (phase 2)

| Layer | Technology |
|-------|------------|
| Auth | Auth0 Universal Login |
| Client data | TanStack Query |
| API access | `@my-ai-orchestrator/client-sdk` only |

---

## Repository layout

```
.
├── apps/
│   ├── web/              # TanStack Start — marketing (+ future /app routes)
│   ├── backend/          # Writing engine HTTP API
│   └── mobile/           # Placeholder
├── packages/
│   ├── ui/               # Design system
│   ├── client-sdk/       # Typed backend client
│   ├── core/             # Orchestration
│   ├── domain/           # Domain model
│   ├── orchestrator/     # Pipeline execution
│   ├── skills/           # Writing skills
│   ├── ai-adapters/      # LLM adapters
│   ├── text-quality/     # Output quality
│   ├── database/         # Persistence
│   ├── payments/         # Credits & billing
│   ├── contracts/        # API contracts
│   └── …
├── docs/live/            # PRD, plans, issues, ADRs
├── tests/                # Unit, integration, governance
└── CONTEXT.md            # Domain glossary
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (18+ minimum)
- [pnpm](https://pnpm.io/) 9+

---

## Quick start — marketing site

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
# Set LOOPS_API_KEY, LOOPS_MAILING_LIST_ID (and SITE_URL for production builds)

pnpm dev:web
```

- Portuguese: [http://localhost:3000](http://localhost:3000)
- English: [http://localhost:3000/en](http://localhost:3000/en)

### Environment variables (`apps/web`)

| Variable | Required | Description |
|----------|----------|-------------|
| `LOOPS_API_KEY` | Waitlist | Loops API key — **server-only**, never `VITE_*` / `PUBLIC_*` |
| `LOOPS_MAILING_LIST_ID` | Waitlist | Mailing list ID; contacts tagged with `userGroup` (`pt` / `en`) |
| `SITE_URL` | Production | e.g. `https://cultiv.app` (no trailing slash) — canonical & OG URLs |

Do not commit `.env`.

### Build and preview

```bash
pnpm --filter @my-ai-orchestrator/web build
pnpm --filter @my-ai-orchestrator/web preview
```

---

## Deploy — Vercel (marketing site)

1. Import this repository in Vercel.
2. **Root Directory:** `apps/web`.
3. Environment variables for Production: `LOOPS_API_KEY`, `LOOPS_MAILING_LIST_ID`, `SITE_URL`.
4. Point `cultiv.app` DNS to Vercel.

`vercel.json` installs dependencies from the monorepo root (`cd ../.. && pnpm install`) so `packages/ui` resolves. Only the web app is deployed.

---

## Quick start — backend (optional)

```bash
pnpm install
# Configure DATABASE_URL and backend env in apps/backend

pnpm dev
```

See `docs/live/plan/phase-2-implementation-plan.md` for the authenticated app architecture.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev:web` | Marketing site dev server (port 3000) |
| `pnpm dev` | Backend dev server |
| `pnpm build` | Build all workspaces with a build script |
| `pnpm test` | Run Vitest suite |
| `pnpm lint` | Typecheck across workspaces |
| `pnpm showcase:voice-setup` | Dev helper — voice profile token for showcase generation |

---

## Documentation

| Resource | Description |
|----------|-------------|
| [`CONTEXT.md`](./CONTEXT.md) | Domain glossary and entity relationships |
| [`docs/live/prd/`](./docs/live/prd/) | Product requirements (phase 1 & 2) |
| [`docs/live/plan/`](./docs/live/plan/) | Implementation plans and decisions |
| [`docs/live/issues/`](./docs/live/issues/) | Vertical implementation slices |
| [`docs/progress-log.md`](./docs/progress-log.md) | Development progress log |

---

## Roadmap

| Phase | Scope | Status |
|-------|--------|--------|
| **1 — Marketing Surface** | Landing, showcase, waitlist, legal, SEO, Vercel | Code complete; production deploy & QA pending |
| **2 — Authenticated app** | Auth0, `/app`, generation, voice, billing via client-sdk | Planned |

---

## License

MIT
