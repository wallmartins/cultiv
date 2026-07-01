---
title: Voice Calibration Session UI
doc_type: issue
status: ready-for-agent
domain: voice
slice_type: AFK
last_updated: 2026-06-30
---

# Voice Calibration Session UI

## Parent

- [`voice-calibration-cold-start.md`](../prd/voice-calibration-cold-start.md)
- [`issue-voice-calibration-cold-start.md`](../prd/issue-voice-calibration-cold-start.md)
- [ADR 0011](../../adr/0011-voice-calibration-cold-start.md)

## User stories covered

2, 3, 4, 5, 6

## What to build

Full **Voice Calibration Session** reading/writing UX.

Deliver:

- Session shell: progress (round N of max), entitlement from API
- A/B card picker with **LogbookProse** preview
- Inline editor on selected candidate (textarea, char limit)
- Attest step: primary CTA disabled until selection + checkbox/confirm
- Free: quota banner before attest (“Usa 1 de suas X gerações”)
- Loading/error states for candidate generation
- Session complete → **Onboarding Welcome Step** or **Voice Dashboard** with mirror
- Cap reached on free → upgrade card (Criador CTA via billing checkout intent)
- SDK methods in `client-sdk` voice-calibration domain
- Component tests for quota disclosure and cap state

## Acceptance criteria

- [ ] E2E happy path: 1 round select → edit → attest → example visible on voice dashboard.
- [ ] Free user sees quota decrease after round (header or preview refresh).
- [ ] Paid user sees no quota warning on calibration attest.
- [ ] Mobile layout usable (single column stack).

## Blocked by

- [110-voice-calibration-entitlement-quota.md](./110-voice-calibration-entitlement-quota.md)
- [111-calibration-candidate-generation.md](./111-calibration-candidate-generation.md)
- [113-voice-onboarding-gateway-ui.md](./113-voice-onboarding-gateway-ui.md) (routing)
