# Compositor parity — runbook

Compare legacy `@phase1-legacy` resolution against **Generation Compositor v1** on the six spec fixtures before defaulting `generation.compositor_v1`.

## Prerequisites

- Backend built (`pnpm --filter @my-ai-orchestrator/backend build`)
- For dry comparison only: no services required (runs locally in Node)
- For optional HTTP execution:
  - API + worker online
  - Voice profile and credits for the calibration user
  - `CALIBRATION_ACCESS_TOKEN` and `DATABASE_URL` in repo root `.env` or VPS `~/app/.env`
  - Server started with `COMPOSITOR_V1_ENABLED=true` (or staging flag on) for compositor path

## 1. Dry plan comparison (local)

From repo root after backend build:

```bash
pnpm --filter @my-ai-orchestrator/backend compositor:parity -- --dry-run
```

Or via tsx during development:

```bash
pnpm dlx tsx apps/backend/scripts/compositor-parity-harness.ts -- --dry-run
```

This compares, for each fixture:

- Legacy `contentType` from intent resolver
- Compositor `planSignature`, step list, and expression profile

Report: `docs/superpowers/reports/compositor-parity-report.md`

## 2. Optional live execution

Set env vars (see calibration sweep runbook), ensure compositor flag is on for the target API, then:

```bash
pnpm --filter @my-ai-orchestrator/backend compositor:parity -- --execute
```

Polls PostgreSQL for terminal job status and records job ids, estimated USD, and `planSignature` in the report.

Useful env overrides:

```bash
CALIBRATION_BASE_URL=http://127.0.0.1:3001
COMPOSITOR_PARITY_POLL_MS=5000
COMPOSITOR_PARITY_TIMEOUT_MS=900000
COMPOSITOR_PARITY_LONG_TIMEOUT_MS=1800000
COMPOSITOR_PARITY_DELAY_MS=3000
```

Resume from a failing fixture or run one scenario:

```bash
pnpm --filter @my-ai-orchestrator/backend compositor:parity -- --execute --from explain-deeply-long-blog
pnpm --filter @my-ai-orchestrator/backend compositor:parity -- --execute --fixture document-decision-medium-unspecified
```

If fixtures 1–2 pass and later ones fail with `insufficient credits`, top up the calibration user wallet before continuing. `explain-deeply-long-blog` costs **8 credits** at balanced/long-piece vs **~6.5** for the first two fixtures combined.

## 3. Manual rubric

Open the generated report and score each fixture 1–5 on intent fit, structure, voice, factual discipline, and cost band. Pass criteria are in [`2026-06-19-generation-compositor-design.md`](../specs/2026-06-19-generation-compositor-design.md).

## 4. Rollback

Keep `generation.compositor_v1` default `false` until parity sign-off. Toggle off via config / feature flag to revert to legacy resolver without redeploying the wizard.

## 5. CI integration test

Postgres integration (skipped locally unless enabled):

```bash
export RUN_POSTGRES_TESTS=true
export BACKEND_TEST_DATABASE_URL=postgresql://...
export BACKEND_TEST_REDIS_URL=redis://...
pnpm exec vitest run tests/backend/compositor-execution.integration.test.ts
```
