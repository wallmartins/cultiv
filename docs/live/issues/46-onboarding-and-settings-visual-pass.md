---
title: Onboarding and Settings Visual Pass
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-14
---

# Onboarding and settings visual pass

## Parent

- [`issue-workspace-visual-refresh.md`](../prd/issue-workspace-visual-refresh.md)

## What to build

Align **Onboarding** and **Account Settings Screen** with the workspace visual system — sans titles, glass cards, organic progress indicator, and contained motion.

This vertical slice delivers:

- **OnboardingFlow** — step progress as a growing line or stem (simplified, not marketing BotanicalStem); steps in `AppCard`
- **Onboarding Welcome Step** — warm glow accent allowed; sans headlines only
- **Voice Example Composer** routes under onboarding reuse `AppField` / card styling
- **SettingsScreen** — sections grouped in glass cards (locale, identity read-only, consent, logout)
- route-level mount stagger on step transitions where appropriate

Onboarding logic, skip flags, and consent revocation behavior unchanged.

## Acceptance criteria

- [ ] Onboarding steps visually consistent with Generation and Voice screens.
- [ ] Settings sections scannable in card groups; logout and consent actions clearly separated.
- [ ] Progress indicator reflects step 1/2 without marketing scroll scenes.
- [ ] No Playfair/Caveat on `/app/onboarding` or `/app/settings`.
- [ ] Reduced motion: step changes without slide stagger.

## Blocked by

- [40-workspace-ui-primitives.md](./40-workspace-ui-primitives.md)
