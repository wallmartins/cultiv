---
title: Calibrated Confidence and Rebuild Weighting
doc_type: issue
status: ready-for-agent
domain: voice
slice_type: AFK
last_updated: 2026-06-30
---

# Calibrated Confidence and Rebuild Weighting

## Parent

- [`voice-calibration-cold-start.md`](../prd/voice-calibration-cold-start.md)
- [`issue-voice-calibration-cold-start.md`](../prd/issue-voice-calibration-cold-start.md)
- [ADR 0011](../../adr/0011-voice-calibration-cold-start.md)

## User stories covered

5, 6, 10

## What to build

Revise **Voice Confidence** and rebuild weighting for mixed provenance.

Deliver:

- `deriveConfidence` considers: attested calibrated count, designed dimension coverage, `authored` count boost, entitlement cap
- Free calibrated-only profiles capped at `medium`; paid can reach `high` at thresholds (≥5 attested rounds + diversity score)
- `authored` examples weighted higher in `voice-hints` example slice order vs `calibrated`
- **Voice Diagnostics** `materialBase` adds `byProvenance: { authored, calibrated }`
- New `reasonCode`s: `calibration_cap_reached`, `calibration_quota_limited`
- New `nextActionCode`s: `upgrade_for_full_calibration`, `add_authored_examples`
- Unit tests: free 3 rounds → medium max; paid 10 → high path; authored unlocks high on free

## Acceptance criteria

- [ ] Legacy example-only users: confidence unchanged (regression test on existing fixtures).
- [ ] `voice-hints` prefers pinned authored over calibrated when both match content type.
- [ ] Dashboard diagnostics show provenance breakdown in detail layer.

## Blocked by

- [109-voice-calibration-contracts-provenance.md](./109-voice-calibration-contracts-provenance.md)
- [111-calibration-candidate-generation.md](./111-calibration-candidate-generation.md)
