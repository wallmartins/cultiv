# Calibration sweep — Option B viability

Run structured generation sweeps on the production VPS to collect telemetry before Phase 2 pricing and pipeline decisions.

## Prerequisites

- API (`cultiv-api`) and worker (`cultiv-worker`) online via PM2
- Your user has an active voice profile and enough credits (or Pro plan)
- Auth0 access token for your user

## 1. Get an access token

From the web app (logged in as your user), obtain a Bearer token for the backend API audience (`VITE_AUTH0_AUDIENCE`). Set:

```bash
export CALIBRATION_ACCESS_TOKEN="eyJ..."
export DATABASE_URL="postgresql://..."
export CALIBRATION_USER_ID="your_internal_user_id"   # optional, for logs
export CALIBRATION_BASE_URL="http://127.0.0.1:3001"
```

## 2. Dry-run the sweep plan

Default profile `tier-variance` runs **intent × tier (balanced)** only where tier changes the legacy pipeline (~15 cells × 3 repeats = 45 runs):

```bash
cd /home/cultiv/app
pnpm billing:calibration-sweep -- --dry-run --profile tier-variance --repeats 3
```

Full grid (54 cells × repeats) for complete pricing:

```bash
pnpm billing:calibration-sweep -- --dry-run --profile full --repeats 3
```

## 3. Run the sweep

```bash
pnpm billing:calibration-sweep -- --profile tier-variance --repeats 3 --delay-ms 3000
```

Manifest: `docs/superpowers/reports/calibration-sweep-manifest.json`

## 4. Export + calibrate + analyze Option B

```bash
pnpm billing:export-jobs docs/superpowers/reports/calibration-jobs-sweep.json
pnpm billing:calibrate docs/superpowers/reports/calibration-jobs-sweep.json \
  --report docs/superpowers/reports/calibration-after-sweep.md
pnpm billing:analyze-option-b docs/superpowers/reports/calibration-jobs-sweep.json
```

Read `docs/superpowers/reports/calibration-option-b-viability.md` for the recommendation.

## Profiles

| Profile | Purpose | ~Runs (repeats=3) |
|---------|---------|-------------------|
| `tier-variance` | Option B viability proxy | ~45 |
| `full` | Complete intent×tier×mode pricing grid | 162 |

## Notes

- Uses real `/me/executions/run` (debits credits) with your user account
- Jobs tagged with `context.calibrationSweep` for filtering
- Phase 1 resolver: tier changes **legacy pipeline** for many intents — this is the economic signal for tier-aware pricing
