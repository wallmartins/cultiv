# Step planner — smoke & COGS runbook

Validate **StepPlanner v1** and quota presentation on the live stack before commercial repricing.

Same operational model as [compositor-parity-runbook.md](./compositor-parity-runbook.md): harnesses run from **pre-built** `apps/backend/dist/scripts/*.js` (CI deploy or local `pnpm build:backend` on a dev machine). On the VPS you normally **do not** run `pnpm build` after `git pull`.

## Prerequisites

- `apps/backend/dist/scripts/step-planner-smoke-harness.js` present (from last CI deploy to `main`, or local build on dev)
- API + worker online
- Flags on API **and** worker:
  - `COMPOSITOR_V1_ENABLED=true`
  - `STEP_PLANNER_V1_ENABLED=true`
- Repo root `.env` or VPS `~/app/.env` (HTTP mode only):
  - `CALIBRATION_ACCESS_TOKEN`
  - `DATABASE_URL`
  - `CALIBRATION_BASE_URL` — default `http://127.0.0.1:3001`

Check the bundle landed on VPS:

```bash
ls apps/backend/dist/scripts/step-planner-smoke-harness.js
```

If missing, wait for **CI deploy** (`push` → `main` → `deploy-app.sh` copies `dist/`), not a local VPS build.

## 1. Smoke (fast — 5 curated scenarios)

Dry-run only (no LLM, no API):

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

Live execution — all 18 rows (~high credit cost):

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

## 3. Recommended sequence

1. Merge Phase 3 to `main` → CI `build-backend` + VPS deploy (updates `dist/`)
2. `step-planner:smoke` (dry) on VPS
3. `step-planner:smoke -- --execute` — quota UX + `telemetry.planner`
4. `step-planner:cogs -- --execute --execute-patched-only` — USD samples
5. If gate passes → recalibrate `pricing.json` (hybrid pricing Track C)

## 4. When to use manual build on VPS

Only when you intentionally change backend **without** going through CI deploy (same as any other backend change):

```bash
bash infra/integrator/scripts/manual-build-deploy.sh
```

See [integrator-deploy.md](../../../infra/integrator/docs/runbooks/integrator-deploy.md). For harness smoke after a normal release, **CI deploy is enough** — same as `compositor:parity`.

## 5. Repricing gate

From the Phase 3 one-pager — proceed when either:

- ≥80% of runs keep the same `planSignature` after patches, **or**
- p90 USD within ±30% of bucket median per `(planSignature, tier, balanced)`
