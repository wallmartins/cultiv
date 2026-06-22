# Step planner — smoke & COGS runbook

Validate **StepPlanner v1** and quota presentation on the live stack before commercial repricing.

## Prerequisites

- Backend built (`apps/backend/dist/…`) — see **VPS build** below if `git pull` only updated source
- API + worker online
- Flags on API **and** worker:
  - `COMPOSITOR_V1_ENABLED=true`
  - `STEP_PLANNER_V1_ENABLED=true`
- Repo root `.env` or VPS `~/app/.env`:
  - `CALIBRATION_ACCESS_TOKEN` — JWT for calibration user (credits + voice profile)
  - `DATABASE_URL` — PostgreSQL (job polling)
  - `CALIBRATION_BASE_URL` — default `http://127.0.0.1:3001`

See also [compositor-parity-runbook.md](./compositor-parity-runbook.md) for token and wallet setup.

## VPS build (after `git pull`)

`git pull` updates **TypeScript source only**. Harness scripts run from **bundled** `apps/backend/dist/scripts/*.js`. The build uses `esbuild`, which is a **devDependency** — a production-only `pnpm install --prod` (CI deploy) does not install it.

**Do not** run bare `pnpm build` after prod install — you will get `Cannot find package 'esbuild'`.

From the app root (`/home/cultiv/app`):

```bash
git pull
bash infra/integrator/scripts/manual-build-deploy.sh
```

That script runs `pnpm install --frozen-lockfile` (includes dev deps), `pnpm build:backend`, migrations, and PM2 reload.

Harness-only rebuild (no PM2 restart):

```bash
pnpm install --frozen-lockfile
pnpm build:backend
```

Automated path: merge to `main` and let CI deploy the pre-built artifact (no local build on VPS).

## 1. Smoke (fast — 5 curated scenarios)

Dry-run only (no LLM):

```bash
pnpm --filter @my-ai-orchestrator/backend step-planner:smoke
```

Live preview + execute:

```bash
pnpm --filter @my-ai-orchestrator/backend step-planner:smoke -- --execute
```

One scenario:

```bash
pnpm --filter @my-ai-orchestrator/backend step-planner:smoke -- --execute --fixture engage-audience-no-question
```

Report: `docs/superpowers/reports/step-planner-smoke-report.md`

## 2. COGS variance (18 rows = 6 fixtures × 3 briefing variants)

Dry-run (planner math only):

```bash
pnpm --filter @my-ai-orchestrator/backend step-planner:cogs
```

Live execution — **all 18 rows** (~high credit cost):

```bash
pnpm --filter @my-ai-orchestrator/backend step-planner:cogs -- --execute
```

Cheaper: only rows where the planner applies patches:

```bash
pnpm --filter @my-ai-orchestrator/backend step-planner:cogs -- --execute --execute-patched-only
```

Single fixture (3 variants):

```bash
pnpm --filter @my-ai-orchestrator/backend step-planner:cogs -- --execute --fixture explain-deeply-long-blog
```

Report: `docs/superpowers/reports/step-planner-cogs-report.md`

### Useful env overrides

```bash
CALIBRATION_BASE_URL=http://127.0.0.1:3001
STEP_PLANNER_COGS_POLL_MS=5000
STEP_PLANNER_COGS_TIMEOUT_MS=900000
STEP_PLANNER_COGS_LONG_TIMEOUT_MS=1800000
STEP_PLANNER_COGS_DELAY_MS=3000
```

## 3. Recommended VPS sequence

1. `step-planner:smoke` (dry) — instant pass/fail on rules
2. `step-planner:smoke -- --execute` — validates quota UX + `telemetry.planner`
3. `step-planner:cogs -- --execute --execute-patched-only` — USD samples for patched paths
4. If gate passes → recalibrate `pricing.json` and plan allowances (hybrid pricing Track C)

## 4. Repricing gate

From the Phase 3 one-pager — proceed when either:

- ≥80% of runs keep the same `planSignature` after patches, **or**
- p90 USD within ±30% of bucket median per `(planSignature, tier, balanced)`
