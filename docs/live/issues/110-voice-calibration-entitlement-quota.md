---
title: Voice Calibration Entitlement and Quota Charge
doc_type: issue
status: ready-for-agent
domain: voice
slice_type: AFK
last_updated: 2026-06-30
---

# Voice Calibration Entitlement and Quota Charge

## Parent

- [`voice-calibration-cold-start.md`](../prd/voice-calibration-cold-start.md)
- [`issue-voice-calibration-cold-start.md`](../prd/issue-voice-calibration-cold-start.md)
- [ADR 0011](../../adr/0011-voice-calibration-cold-start.md)

## User stories covered

4, 5, 6, 9

## What to build

**Voice Calibration Entitlement** resolver and **Calibration Quota Charge** for free plan.

Deliver:

- `resolveVoiceCalibrationEntitlement(planId, completedRounds)` → `{ maxRounds, remainingRounds, chargesQuota, maxConfidenceFromCalibration, quotaCostPerRound }`
- Constants: free 3 / criador 10 / pro 10; free charges quota, paid do not
- `GET /me/voice-calibration/entitlement` route
- `calibration-quota-charge.ts`: reserve/capture `canonicalCreditCost` credits on free round complete; release on abandon
- Integrate with **Generation Preview** quota helpers for consistent “1 geração” copy
- Insufficient balance → typed error `calibration_quota_insufficient` with upgrade hint
- Unit tests per plan; wallet ledger entries tagged `purpose: voice_calibration_round`

## Acceptance criteria

- [ ] Free user with 0 quota cannot complete round (fail before attest persist).
- [ ] Paid user completes round with zero wallet mutation.
- [ ] Entitlement API returns correct remaining rounds after each completion.
- [ ] Ledger shows calibration charge distinct from generation execution id.

## Blocked by

- [109-voice-calibration-contracts-provenance.md](./109-voice-calibration-contracts-provenance.md)
