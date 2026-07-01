---
title: Calibration Candidate Generation Service
doc_type: issue
status: ready-for-agent
domain: voice
slice_type: AFK
last_updated: 2026-06-30
---

# Calibration Candidate Generation Service

## Parent

- [`voice-calibration-cold-start.md`](../prd/voice-calibration-cold-start.md)
- [`issue-voice-calibration-cold-start.md`](../prd/issue-voice-calibration-cold-start.md)
- [ADR 0011](../../adr/0011-voice-calibration-cold-start.md)

## User stories covered

1, 2, 3

## What to build

Backend **Voice Calibration Session** orchestration and LLM candidate generation.

Deliver:

- Session lifecycle: `draft` → `in_progress` → `completed` | `abandoned`
- `POST /me/voice-calibration/sessions` — requires **Voice Training Consent**
- Round planner: dimension sequence per implementation plan (round index → prompt seed)
- `POST .../rounds/:roundId/candidates` — returns `{ candidateA, candidateB }` via routing profile `voice-calibration-candidate` (fast model, temp ~0.7)
- Prompt uses prior attested rounds + dimension seed; no full **Derived Voice Profile** required on round 1
- `POST .../rounds/:roundId/complete` — validate edit bounds, call quota charge (110), persist **Voice Example** `provenance: calibrated`, enqueue coalesced rebuild
- Idempotency on round complete via round id
- Feature flag `voice.calibrationV1`

## Acceptance criteria

- [ ] Session completes 3 rounds on free; 4th returns `calibration_round_cap_reached`.
- [ ] Candidates differ measurably (not duplicate strings) on golden prompt fixtures.
- [ ] Rebuild queued after session complete; profile version increments.
- [ ] Consent revoked mid-session → fail closed, no persist.

## Blocked by

- [109-voice-calibration-contracts-provenance.md](./109-voice-calibration-contracts-provenance.md)
- [110-voice-calibration-entitlement-quota.md](./110-voice-calibration-entitlement-quota.md)
