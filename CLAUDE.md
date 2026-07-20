# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- **Comments**: Keep code comments to a minimum; only explain unusual patterns.

## What this is

Cultiv — an AI writing engine that learns an author's personal voice and generates text that sounds like them. A **pnpm 11 monorepo** (`cultiv`) requiring **Node ≥ 22.13**. Public product name is **Cultiv**; internal workspace packages use the `@my-ai-orchestrator/*` scope. See `README.md` for the product overview and `CONTEXT.md` for the authoritative domain glossary (Voice Profile, Reasoning Signature, Pipeline, Content Type, etc.) — use those exact terms and heed each entry's `_Avoid_` list.

> **Web is mid-recreation.** Recent commits removed `packages/ui` and are "recreating web entirely". The README still documents `apps/web` and `packages/ui`, but neither exists on disk right now (`apps/landing` holds only build artifacts). Treat README's web/design-system sections as aspirational, not current. The **backend and `packages/*` are the real, live code.**

## Commands

Run from the repo root unless noted. All package scripts run under pnpm.

```bash
pnpm install                      # install workspace

pnpm test                         # vitest run — full unit suite
pnpm vitest run <path/to.test.ts> # a single test file
pnpm vitest run -t "name"         # tests matching a name
pnpm test:watch                   # vitest watch
pnpm test:coverage                # coverage (80% line/fn/branch/stmt thresholds)

pnpm lint                         # recursive; each package's lint IS `tsc --noEmit` (typecheck)
pnpm build                        # recursive build (backend → esbuild dist/)
pnpm dev:backend                  # tsx watch apps/backend/src/cli/main.ts

pnpm smoke                        # monorepo governance test (fast sanity)
pnpm guardrails:effect            # effect-hardening governance test
```

Integration suites are gated and excluded from `pnpm test`:

```bash
pnpm test:postgres    # needs BACKEND_TEST_DATABASE_URL; runs apps/backend/tests/postgres-*-repository.test.ts
pnpm test:durable     # durable runtime integration (runs in forks, serial)
```

CI uses `test:ci:backend` / `test:ci:web` (path-filtered per changed area) and mirrors these excludes.

There is **no separate lint/format step** — "lint" means typecheck. Type errors are the primary CI gate alongside tests.

## Architecture

Two runtime surfaces plus shared domain packages:

- **`apps/backend`** — Hono HTTP API + BullMQ worker. Auth0 JWT validation, Postgres (Kysely + `pg`) as system of record, Redis for jobs/SSE/rate-limits. Production runs `EXECUTION_MODE=async`: the API enqueues jobs, a **separate worker process** drains them. Built with esbuild to `dist/cli/{main,worker-main,migrate}.js`.
- **`packages/*`** — the writing engine, layered with **strictly enforced dependency directions** (see governance below):
  - `contracts` (Effect Schema, depends only on `effect`) → `domain`, `core` → `orchestrator` → `skills`, `text-quality` → consumed by `apps/backend`.
  - `ai-adapters` (LLM providers), `payments` (credits/pricing), `database` (schema/repos), `feature-flags`, `client-sdk` (typed backend client for web), `config` (shared TS config), `eval`.

The generation flow: a **Generation Request** resolves a **Voice Profile** (derived offline from **Voice Examples** via **Voice Profile Rebuild**), runs a **Pipeline** per **Content Type** (analyze → draft → voice-align → refine, with optional quality lanes + candidate selection), through **AI Adapters**, scored by `text-quality`, with credit capture in `payments`.

### Backend `src/` layout

```
apps/backend/src/
  cli/         main.ts (api), worker-main.ts, migrate.ts, billing/key-rotation CLIs
  app/         bootstrap, route wiring, production hardening
  routes/      Hono route modules (*-routes.ts)
  config/      env loading + validation
  http/        HTTP helpers, error-response
  jobs/        worker, job-store, job-events (SSE)
  product/     domain services — voice/, billing, generation, core/
  execution/   runtime, pipeline, quality lanes
  safety/      input/output gates, voice field protection (encryption + key rotation)
  auth/        Auth0 JWT, application users, operators
  infra/       Postgres repos, migrations, Redis bootstrap
  runtime/     durable job runtime, rate-limit store
  production/  readiness, rate limiter, trusted client IP
```

### Governance tests are load-bearing

`tests/governance/*.test.ts` enforce architectural invariants — treat failures there as design violations, not flaky tests:

- **`monorepo-governance`** — every package must be `private`, `type: module`, and export `./src/index.ts`; the allowed cross-package import graph is asserted explicitly. Adding a dependency edge means updating this allow-list intentionally.
- **`effect-hardening-governance`** — inside the Effect packages (`contracts`, `core`, `ai-adapters`, `database`, `feature-flags`, `payments`, `skills`, `orchestrator`) you may **not** use `throw new Error`, `Schema.decodeUnknownSync`, helper runtime execution, or `Promise`-typed contracts. Model errors and async as Effect values instead.
- **`voice-profile-centralization`** — `text-quality` must not import `@my-ai-orchestrator/database`; `voice-resolution.ts` must not re-infer voice signals (no `inferTone`/`inferCadence`/`resolveRequestFormat`/etc.). Voice inference happens once during rebuild, not at generation time.
- Others cover safety taxonomy, product-path async/runtime boundaries, structured prompts, and the frontend↔client-sdk boundary.

## Conventions

- **Lazy-senior-dev ("ponytail" rule, `.cursor/rules/ponytail.mdc`).** Before writing code, climb the ladder: does it need building (YAGNI) → does the helper already exist here → stdlib → platform → installed dep → one line → only then new code. Deletion over addition, boring over clever, fewest files. Fix bugs at the root (shared function), not per-caller. Mark deliberate shortcuts with a `ponytail:` comment naming the ceiling. Non-trivial logic leaves one runnable check behind.
- **Conventional commits**, atomic and small: `feat:` `fix:` `docs:` `refactor:` `test:` `chore:`. Branches: `feature/` `fix/` `docs/` `chore/`.
- **Docs workflow (`.cursor/rules/`).** Non-trivial work follows PRD → ADR → Issues under `docs/` (ADRs in `docs/adr`, runbooks in `docs/live`). Consult relevant `docs/*.md` before generating code; behavior changes to voice/entry-path semantics are governed by ADRs (e.g. ADR 0001: calibration is the only voice entry point in v1).
- **RTK (optional).** `.cursorrules` documents prefixing shell commands with `rtk` to cut token usage; it's a passthrough wrapper, safe to use or omit.

## Stack reference

TypeScript · Effect-TS · Hono · PostgreSQL (Kysely + `pg`) · Redis + BullMQ · Auth0 (SPA + API JWT) · ASAAS/Stripe (payments) · Effect Schema contracts · Vitest. Backend bundled with esbuild; deploy targets Railway (api + worker services, `railway*.toml`) with local Postgres/Redis via `docker-compose.yml`.
