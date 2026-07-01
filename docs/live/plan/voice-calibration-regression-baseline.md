# Voice calibration regression baseline

Captured **2026-06-30** after implementing Voice Calibration Cold Start (issues 109–116). Use as the reference before enabling `voice.calibrationV1` in production.

## Corpus

| Persona | Plan | Rounds | Confidence cap |
|---------|------|--------|----------------|
| `free-3-round-medium` | free | 3 | medium |
| `paid-10-round-high` | criador | 10 | high |
| `mixed-authored-calibrated` | free | 2 | medium |

**Totals:** 3 personas, 8 briefings (threshold: ≥3 personas).

## Drift gates (deterministic fixtures)

| Candidate kind | Gate |
|----------------|------|
| `recordedCandidates` | `evaluateVoiceDrift` score ≥ 70 |
| `badCandidates` | score &lt; 70 |

| Metric | Baseline |
|--------|----------|
| Personas passing drift gate | 3 / 3 |
| Candidate failures | 0 |
| `pnpm eval:voice-calibration` exit code | 0 |

## Commands

```bash
pnpm vitest run tests/backend/voice-calibration-*.test.ts
pnpm eval:voice-calibration
```

## Observability events

Backend counters (no raw example text in details):

- `calibration_session_started`
- `calibration_round_completed`
- `calibration_quota_charged`
- `voice_direction_conflict_prompted`
- `voice_preference_resolved`

## GA gate

1. `VOICE_CALIBRATION_V1=true` in staging
2. `pnpm eval:voice-calibration` exit 0
3. Full `pnpm test:ci` green
4. Manual smoke: gateway → calibration → rebuild → dashboard
