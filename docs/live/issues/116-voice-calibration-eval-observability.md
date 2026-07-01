---
title: Voice Calibration Eval and Observability
doc_type: issue
status: ready-for-agent
domain: voice
slice_type: AFK
last_updated: 2026-06-30
---

# Voice Calibration Eval and Observability

## Parent

- [`voice-calibration-cold-start.md`](../prd/voice-calibration-cold-start.md)
- [`issue-voice-calibration-cold-start.md`](../prd/issue-voice-calibration-cold-start.md)
- [ADR 0011](../../adr/0011-voice-calibration-cold-start.md)

## User stories covered

9, 10

## What to build

Quality guardrails and ops visibility for calibrated profiles.

Deliver:

- `tests/fixtures/voice-calibration/` — ≥3 personas (free 3-round, paid 10-round, mixed authored+calibrated)
- `scripts/eval-voice-calibration.ts` + `pnpm eval:voice-calibration` — generation quality vs briefing on calibrated personas
- Metrics events: `calibration_session_started`, `calibration_round_completed`, `calibration_quota_charged`, `voice_direction_conflict_prompted`, `voice_preference_resolved`
- Dashboard counters for product (conversion free→paid after calibration cap)
- Document regression baseline in `docs/live/plan/voice-calibration-regression-baseline.md`
- CI job step or documented manual gate before `voice.calibrationV1` GA

## Acceptance criteria

- [ ] Eval script runs locally and in CI with deterministic fixtures (mock LLM or recorded candidates).
- [ ] Calibrated `medium` personas meet minimum voice drift thresholds on validation-post briefings.
- [ ] Observability events emitted with `userId`, `planId`, `roundIndex`, `provenance` (no raw example text in logs).

## Blocked by

- [111-calibration-candidate-generation.md](./111-calibration-candidate-generation.md)
- [112-calibrated-confidence-rebuild.md](./112-calibrated-confidence-rebuild.md)
