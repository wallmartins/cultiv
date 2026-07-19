# Cultiv

**Your authenticity, at scale.**

Cultiv is an AI writing engine that learns an author's personal voice and generates text that sounds like them — not a generic assistant. Visitors teach their voice with real writing samples, pick a content format (blog, LinkedIn, thread, newsletter, and more), review a preview, and generate aligned output at scale.

This repository is a **pnpm monorepo** containing the marketing site, the authenticated workspace, the writing backend, shared domain packages, and the client SDK. The public product name is **Cultiv**; internal workspace packages use the `@my-ai-orchestrator/*` scope.

**Status:** Pre-launch — marketing surface and authenticated workspace are implemented in code; production deploy (Vercel for the web surfaces, Integrator VPS for the backend) and final QA are pending.

---

## Product in brief

| Concept | What it means |
|---------|----------------|
| **Voice Profile** | Durable model of tone, cadence, vocabulary, and constraints — learned from the author's samples |
| **Content Type** | Kind of text (blog post, LinkedIn post, thread, newsletter, …) — each with its own pipeline |
| **Generation Request** | User-facing request to generate text (briefing + voice inputs) without exposing internal pipeline structure |
| **Marketing Surface** | Unauthenticated experience: editorial showcase + signup CTAs |
| **Authenticated Workspace** | Auth0-protected `/app` routes: generation, voice, history, settings |

Full domain language: [`CONTEXT.md`](./CONTEXT.md).

---

## Architecture overview

```
                         ┌─────────────────────────────────┐
                         │  Vercel — apps/web              │
                         │  Marketing (/ , /en)            │
                         │  Workspace (/app/*) + Auth0     │
                         │  Signup → Auth0 → /app/generate │
                         └────────────┬────────────────────┘
                                      │ client-sdk (HTTPS)
                                      ▼
                         ┌──────────────────────────────────┐
                         │  Integrator VPS — apps/backend   │
                         │  Cloudflare Tunnel → nginx → PM2 │
                         │  api  → dist/cli/main.js         │
                         │  worker → dist/cli/worker-main.js│
                         └────────────┬─────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
            ┌───────────────┐                   ┌───────────────┐
            │  PostgreSQL   │                   │  Redis        │
            │  system of    │                   │  jobs · SSE · │
            │  record       │                   │  rate limits  │
            └───────────────┘                   └───────────────┘

         packages/* — domain, orchestrator, contracts, client-sdk, …
```

### Boundary rules

- **Marketing CTAs** route anonymous visitors through Auth0 login with `returnTo=/app/generate` (free) or plan checkout paths (paid). Auth-aware links use `buildMarketingConversionUrl` in `apps/web/src/marketing/auth/marketing-auth-intent.ts`.
- **Authenticated workspace** consumes the backend only through `@my-ai-orchestrator/client-sdk`, not raw HTTP to internal routes.
- **Auth** (login/signup) is Auth0 — not the client SDK.
- **Production** uses durable async execution (`EXECUTION_MODE=async`): API enqueues jobs; a separate **worker** process drains the queue.

Operational runbooks: [`infra/integrator/docs/runbooks/`](./infra/integrator/docs/runbooks/) (go-live, disaster recovery, graceful shutdown, monitoring).

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
| `apps/backend` | Hono HTTP API, Auth0 JWT validation, Postgres persistence, BullMQ worker |
| `packages/core` | Pipeline orchestration, runtime base |
| `packages/domain` | Domain types and invariants |
| `packages/orchestrator` | Step execution and pipeline wiring |
| `packages/skills` | Built-in and declarative skills (analyze, draft, voice-match, refine) |
| `packages/ai-adapters` | Agent-agnostic LLM adapters |
| `packages/text-quality` | Candidate comparison and refinement |
| `packages/database` | Schema and repository layer |
| `packages/payments` | Credit budget, reservations, pricing envelopes |
| `packages/contracts` | Shared API contracts ([Effect Schema](https://effect.website/docs/schema/introduction/)) |
| `packages/client-sdk` | Typed client for web (and future mobile) |
| `packages/feature-flags` | Feature flag registry |
| `packages/config` | Shared TS / ESLint / Prettier config |

**Stack:** TypeScript, [Hono](https://hono.dev/), [Effect](https://effect.website/), PostgreSQL ([Kysely](https://kysely.dev/) + `pg`), [BullMQ](https://docs.bullmq.io/) + Redis.

**Production build:** esbuild → `apps/backend/dist/cli/{main,worker-main,migrate}.js` (`pnpm build:backend`).

### Backend `src/` layout

```
apps/backend/src/
├── cli/              # main.ts, worker-main.ts, migrate.ts
├── app/              # bootstrap, routes wiring, production hardening
├── routes/           # Hono route modules (*-routes.ts)
├── config/           # env loading and validation
├── http/             # HTTP helpers, errors, error-response
├── jobs/             # worker, job-store, job-events (SSE)
├── product/          # domain services (voice, billing, generation, …)
├── execution/        # runtime, pipeline, quality lanes
├── safety/           # input/output gates, voice field protection
├── auth/             # Auth0 JWT, application users, operators
├── infra/            # Postgres repos, migrations, Redis bootstrap
├── runtime/          # durable job runtime, rate-limit store
└── production/       # readiness, rate limiter, trusted client IP
```

---

## Web app (`apps/web`)

TanStack Start app serving both the **marketing surface** and the **authenticated workspace** from one deploy.

### Routes

| Route | Locale | Purpose |
|-------|--------|---------|
| `/`, `/en` | pt / en | Home + showcase + signup CTAs |
| `/privacy`, `/terms`, `/en/*` | pt / en | Legal |
| `/llms.txt`, `/llms-full.txt` | pt / en | LLM-oriented product docs |
| `/robots.txt`, `/sitemap.xml` | — | Crawlers |
| `/login`, `/callback` | — | Auth0 |
| `/app/generate` | — | Generation workspace |
| `/app/history` | — | Execution history |
| `/app/voice/*` | — | Voice profile & examples |
| `/app/settings` | — | Account settings |
| `/app/onboarding` | — | First-run onboarding |

### Web `src/` layout

```
apps/web/src/
├── routes/           # TanStack Router file routes (do not move)
├── marketing/        # public site: sections, showcase content, SEO, motion
├── app/              # authenticated UI: generation, voice, history, shell
├── platform/         # client-sdk context, server handlers, shared UI primitives
├── i18n/
│   ├── marketing/    # landing copy (pt / en)
│   └── app/          # workspace copy
├── brand/            # logos, head links
└── styles/
```

### Launch conversion

Marketing CTAs (hero, header, pricing, blog, launch section) use `MarketingConversionLink` and `buildMarketingConversionUrl`:

```
Anonymous visitor
    → MarketingConversionLink (free intent)
    → /login?returnTo=%2Fapp%2Fgenerate
    → Auth0 signup/login
    → /app/generate

Authenticated visitor → /app/generate (skips login)
Paid plan CTAs → /login?returnTo=<checkout path> or direct checkout when logged in
```

Showcase samples live in `apps/web/src/marketing/content/showcase/`.

---

## Design system (`packages/ui`)

Shared tokens and components for marketing and workspace UI.

| Layer | Contents |
|-------|----------|
| **Tokens** | CSS variables — paper surface, moss/golden accents, editorial spacing |
| **Primitives** | `Button`, `Text`, `Container`, `Input`, … |
| **Patterns** | `SectionHeader`, `ComparisonCard`, `Accordion`, … |

**Visual language:** editorial light theme, botanical illustrations, discrete motion. Typography: Playfair Display, Caveat, Inter, JetBrains Mono.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | pnpm 11 workspaces |
| **Runtime** | Node.js ≥ 22.13 |
| **Web** | TanStack Start + Router, React 19, Tailwind 4, Nitro, GSAP + Lenis |
| **Backend** | Hono, Effect-TS, PostgreSQL, Redis, BullMQ |
| **Contracts** | Effect Schema (`packages/contracts`) |
| **Auth** | Auth0 (SPA + API JWT) |
| **Tests** | Vitest (~582 unit tests; durable suite behind `pnpm test:durable`) |
| **CI** | GitHub Actions — lint, build, test, durable-runtime job |

---

## Repository layout

```
.
├── apps/
│   ├── web/                 # TanStack Start — marketing + /app workspace
│   ├── backend/             # Writing engine API + worker
│   └── mobile/              # Placeholder
├── packages/
│   ├── ui/                  # Design system
│   ├── client-sdk/          # Typed backend client
│   ├── contracts/           # API schemas & types
│   ├── core/                # Orchestration
│   ├── domain/              # Domain model
│   ├── orchestrator/        # Pipeline execution
│   ├── skills/              # Writing skills
│   ├── ai-adapters/         # LLM adapters
│   ├── text-quality/        # Output quality
│   ├── database/            # Persistence abstractions
│   ├── payments/            # Credits & billing
│   ├── feature-flags/       # Feature flags
│   └── config/              # Shared tooling config
├── tests/                   # Unit, integration, governance
├── docs/live/               # Plans and issues (ADRs live in docs/adr/)
├── infra/integrator/        # Deploy real: scripts, configs e runbooks da VPS
├── scripts/                 # CI helpers, showcase, restructure tooling
├── ecosystem.config.cjs     # PM2 — processos api + worker em produção
├── docker-compose.yml       # Local Postgres + Redis
└── CONTEXT.md               # Domain glossary
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) **≥ 22.13** (required by pnpm 11)
- [pnpm](https://pnpm.io/) **11.3** (`corepack enable` or `npm i -g pnpm`)

---

## Quick start

```bash
git clone git@github.com:wallmartins/cultiv.git
cd cultiv
pnpm install

cp .env.example .env          # backend + shared secrets
cp apps/web/.env.example apps/web/.env
```

### Marketing + workspace (web)

```bash
pnpm dev:web
```

- Portuguese: [http://localhost:3000](http://localhost:3000)
- English: [http://localhost:3000/en](http://localhost:3000/en)
- Workspace (requires Auth0 + backend): [http://localhost:3000/app/generate](http://localhost:3000/app/generate)

Set `VITE_API_BASE_URL=http://localhost:3001` in `apps/web/.env` when the backend runs locally.

### Backend — memory mode (fast dev)

```bash
# In .env: BACKEND_ALLOW_IN_MEMORY_RUNTIME=true
pnpm dev:backend
```

API default: [http://localhost:3001](http://localhost:3001).

### Backend — durable runtime (PostgreSQL + Redis)

```bash
docker compose up -d postgres redis

# In .env: DATABASE_URL, REDIS_URL, GEMINI_API_KEY (or other provider)
# EXECUTION_MODE=async — do NOT set BACKEND_ALLOW_IN_MEMORY_RUNTIME=true

pnpm --filter @my-ai-orchestrator/backend migrate:dev   # dev
pnpm dev:backend                                        # terminal A — API
pnpm --filter @my-ai-orchestrator/backend worker        # terminal B — worker
```

Smoke: `pnpm hitl:durable-smoke` · Integration: `pnpm test:durable`

---

## Environment variables

### Root `.env` (backend)

See [`.env.example`](./.env.example). Key production fields:

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | PostgreSQL (required in production) |
| `REDIS_URL` | Redis (required for async runtime) |
| `EXECUTION_MODE` | `async` in production |
| `AUTH_ISSUER_URL`, `AUTH_AUDIENCE`, `AUTH_JWKS_URL` | Auth0 API JWT validation |
| `CORS_ALLOWED_ORIGINS` | e.g. `https://www.cultiv.app` |
| `VOICE_DATA_PROTECTION_KEY` | ≥32 chars — encrypts voice examples at rest |
| `GEMINI_API_KEY` | At least one LLM provider |

### `apps/web/.env`

See [`apps/web/.env.example`](./apps/web/.env.example).

| Variable | Notes |
|----------|-------|
| `SITE_URL` | Canonical URL for SEO / OG |
| `VITE_API_BASE_URL` | Backend public API |
| `VITE_AUTH0_*` | Auth0 SPA client |

Do not commit `.env` files.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev:web` | Web dev server (port 3000) |
| `pnpm dev:backend` | Backend API dev (`tsx watch`, port 3001) |
| `pnpm build` | Build all workspaces with a build script |
| `pnpm build:web` | Build web (`apps/web`) |
| `pnpm build:backend` | Production esbuild bundle (`apps/backend/dist/`) |
| `pnpm test` | Vitest suite (unit + governance; skips PG/Redis integration by default) |
| `pnpm test:durable` | Durable runtime integration tests (PG + Redis) |
| `pnpm test:web` | Web + frontend-boundary tests |
| `pnpm hitl:durable-smoke` | Manual smoke — async job survives API restart |
| `pnpm lint` | `tsc --noEmit` across all workspaces |
| `pnpm eval` | Run eval suite (deterministic + heuristic) |
| `pnpm eval:ci` | Run eval with JSON report + baseline comparison |
| `pnpm eval:nightly` | Run eval with Voice Judge + save baseline |

Eval CLI options:
- `--suite <name>` — filter to `voice-fidelity`, `drift-regression`, or `critic-regression`
- `--include-judge` — enable Layer 3 Voice Judge (uses LLM tokens)
- `--judge-provider <p>` / `--judge-model <m>` — override judge provider/model
- `--generator <name>` — `placeholder` (default) or `orchestrator`
- `--compare` — compare against the latest saved baseline
- `--save-baseline` — persist results as a new baseline
- `--report <format>` — `console`, `json`, or `markdown`

Judge env vars: `EVAL_JUDGE_PROVIDER`, `EVAL_JUDGE_MODEL`, `GROQ_API_KEY` (or `<PROVIDER>_API_KEY`).
| `pnpm showcase:voice-setup` | Dev helper — voice profile token for showcase |
| `pnpm showcase:generate` | Dev helper — generate showcase sample via backend |

---

## Deploy

### Vercel (web)

1. Import repo → **Root Directory:** `apps/web`
2. **Node.js:** 22.x
3. `vercel.json` installs from monorepo root:
   `cd ../.. && npx -y pnpm@11.3.0 install --frozen-lockfile`
4. Production env: `SITE_URL`, `VITE_*`, Auth0 vars

### Integrator VPS (backend) — o deploy real

O backend **não** roda em Railway. Roda numa VPS (Integrator, datacenter Brasil) com Cloudflare Tunnel
como único ingresso (zero portas abertas), nginx em `127.0.0.1` e PM2 rodando `api` + `worker`.
Postgres e Redis sobem por `docker compose` na própria VPS.

| Processo | Config | Entrypoint |
|----------|--------|------------|
| `cultiv-api` | [`ecosystem.config.cjs`](./ecosystem.config.cjs) | `apps/backend/dist/cli/main.js` |
| `cultiv-worker` | [`ecosystem.config.cjs`](./ecosystem.config.cjs) | `apps/backend/dist/cli/worker-main.js` |

O deploy é automático: push em `main` que toque o backend dispara o job `deploy-vps`
(`.github/workflows/ci.yml`), que só roda depois de lint + testes + eval + build + suíte durable
passarem. Ele executa [`infra/integrator/scripts/deploy-app.sh`](./infra/integrator/scripts/deploy-app.sh)
— que roda as migrations antes de recarregar o PM2.

Toda a infra, scripts e runbooks: [`infra/integrator/`](./infra/integrator/README.md).
Checklist de go-live: [`infra/integrator/scripts/go-live-check.sh`](./infra/integrator/scripts/go-live-check.sh)
e [`infra/integrator/docs/runbooks/integrator-deploy-go-live.md`](./infra/integrator/docs/runbooks/integrator-deploy-go-live.md).
Primeiro deploy, passo a passo: [`first-deploy-step-by-step.md`](./infra/integrator/docs/runbooks/first-deploy-step-by-step.md).

> `railway.toml` / `railway.worker.toml` são de uma tentativa anterior de deploy e **não são usados
> por nada**. Mantidos só como referência até a decisão de removê-los.

---

## CI

GitHub Actions (`.github/workflows/ci.yml`):

- **test** — `pnpm lint`, `pnpm build:backend`, `pnpm test`, `pnpm build:web` on Node 22
- **durable-runtime** — `pnpm test:durable` with service containers (Postgres + Redis)

---

## Documentation

| Resource | Description |
|----------|-------------|
| [`CONTEXT.md`](./CONTEXT.md) | Domain glossary |
| [`docs/adr/`](./docs/adr/) | Architecture decision records (0001–0008) |
| [`docs/live/plan/`](./docs/live/plan/) | Implementation plans |
| [`docs/live/issues/`](./docs/live/issues/) | Issue breakdowns |
| [`infra/integrator/docs/runbooks/`](./infra/integrator/docs/runbooks/) | Production runbooks (deploy, DR, monitoring) |

---

## Roadmap

| Phase | Scope | Status |
|-------|--------|--------|
| **Marketing Surface** | Landing, showcase, signup CTAs, legal, SEO | Code complete |
| **Authenticated Workspace** | Auth0, `/app`, generation, voice, history, billing | Implemented in repo; production hardening in progress |
| **Go-live** | Vercel (web) + Integrator VPS (backend) + Auth0 + Cloudflare + smoke tests | Pending |

---

## License

MIT
