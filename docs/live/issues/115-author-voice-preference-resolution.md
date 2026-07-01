---
title: Author Voice Preference Resolution
doc_type: issue
status: ready-for-agent
domain: voice
slice_type: AFK
last_updated: 2026-06-30
---

# Author Voice Preference Resolution

## Parent

- [`voice-calibration-cold-start.md`](../prd/voice-calibration-cold-start.md)
- [`issue-voice-calibration-cold-start.md`](../prd/issue-voice-calibration-cold-start.md)
- [ADR 0011](../../adr/0011-voice-calibration-cold-start.md)

## User stories covered

7

## What to build

**Voice Direction Conflict** detection and **Author Voice Preference Resolution** flow.

Deliver:

- `voice-direction-conflict.ts` — heuristic module post-rebuild when new `authored` examples present
- Persist pending conflict on diagnostics or separate table: `voice_preference_resolution`
- `GET /me/voice-preference-resolution/pending` — contrast payload (calibrated summary vs authored summary, plain language)
- `POST /me/voice-preference-resolution` — `keep_calibrated` | `follow_authored` | `blend`
- Rebuild applies weighting policy per choice; clear pending state
- Dashboard modal or dedicated card on **Voice Dashboard** (not blocking generation)
- **Voice Next Step** when pending conflict exists
- i18n for three choices + explanation

## Acceptance criteria

- [ ] Importing authored text that flips register triggers pending conflict on calibrated-only profile (fixture test).
- [ ] User choice `follow_authored` increases authored weight; next generation uses authored-heavy hints.
- [ ] No silent profile swap without recorded resolution event in audit/diagnostics.
- [ ] Dismiss without choice keeps last active profile; conflict remains pending.

## Blocked by

- [112-calibrated-confidence-rebuild.md](./112-calibrated-confidence-rebuild.md)
