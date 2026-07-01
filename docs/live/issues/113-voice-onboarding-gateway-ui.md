---
title: Voice Onboarding Gateway UI
doc_type: issue
status: ready-for-agent
domain: voice
slice_type: AFK
last_updated: 2026-06-30
---

# Voice Onboarding Gateway UI

## Parent

- [`voice-calibration-cold-start.md`](../prd/voice-calibration-cold-start.md)
- [`issue-voice-calibration-cold-start.md`](../prd/issue-voice-calibration-cold-start.md)
- [ADR 0011](../../adr/0011-voice-calibration-cold-start.md)

## User stories covered

1, 8

## What to build

**Voice Onboarding Gateway** as first onboarding step when user has no voice material.

Deliver:

- `VoiceOnboardingGateway.tsx` — two **ExpeditionCard** paths: “Enviar meus textos” / “Desenvolver com a Cultiv”
- Subcopy: free calibration uses generations (honest disclosure); paid benefit teaser without hard paywall on gateway
- Update `OnboardingFlow` route: gateway → composer OR calibration session
- Update `post-login-redirect.ts` / `shouldEnterOnboarding` if needed
- i18n pt-BR + en; governance test for key parity
- Skip link → existing onboarding skip behavior

## Acceptance criteria

- [ ] New user with 0 examples lands on gateway, not composer directly.
- [ ] Import path routes to existing **Voice Example Composer**.
- [ ] Calibrate path routes to `/app/onboarding/calibration` (or equivalent).
- [ ] User with ≥1 example bypasses gateway to welcome or generate per existing rules.

## Blocked by

- [109-voice-calibration-contracts-provenance.md](./109-voice-calibration-contracts-provenance.md)
