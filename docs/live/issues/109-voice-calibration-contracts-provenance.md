---
title: Voice Calibration Contracts and Provenance
doc_type: issue
status: ready-for-agent
domain: voice
slice_type: AFK
last_updated: 2026-06-30
---

# Voice Calibration Contracts and Provenance

## Parent

- [`voice-calibration-cold-start.md`](../prd/voice-calibration-cold-start.md)
- [`issue-voice-calibration-cold-start.md`](../prd/issue-voice-calibration-cold-start.md)
- [ADR 0011](../../adr/0011-voice-calibration-cold-start.md)

## User stories covered

8, 10

## What to build

Domain contracts and persistence for **Voice Calibration** and **Voice Example Provenance**.

Deliver:

- `VoiceExampleProvenanceSchema`: `authored` | `calibrated`
- Extend `VoiceExample` / DB record: `provenance`, `attestedAt?`, `calibrationSessionId?`, `calibrationRoundId?`, `editDeltaScore?` (0–1 optional)
- `VoiceCalibrationSession`, `CalibrationRound`, `CalibrationRoundStatus` contracts
- `VoiceCalibrationEntitlementView` (read model for UI)
- Postgres migration for new columns (defaults: existing rows → `authored`)
- SDK + mappers round-trip provenance on create/list/get examples
- Update `CONTEXT.md` terms already added — ensure contracts match glossary

## Acceptance criteria

- [ ] Existing examples migrate as `provenance: authored` without rebuild regression.
- [ ] Schema decode tests for all new types in `tests/contracts/`.
- [ ] Voice example API accepts optional provenance on create; calibrated path set server-side only.
- [ ] No breaking change to public voice profile screen shape (additive fields only).

## Blocked by

None (first issue in program).
