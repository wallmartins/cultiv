---
title: Onboarding and Account Settings
doc_type: issue
status: in-review
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-12
---

# Onboarding and Account Settings

## Parent

- [`issue-authenticated-workspace-web-v2.md`](../prd/issue-authenticated-workspace-web-v2.md)
- Screen spec: [`web-v2-screen-specs.md`](../plan/web-v2-screen-specs.md) §3, §13

## User stories covered

2, 3, 4, 7, 8, 9, 27, 28, 29

## What to build

Ship two-step **Onboarding** and **Account Settings Screen** with **App Locale** preference and consent review placeholder.

This vertical slice proves end-to-end that:

- `/app/onboarding` step 1 wraps **Voice Example Composer** (from issue 32) with progress chrome and skip
- step 2 **Onboarding Welcome Step** shows confidence, credits (preview), CTA to generate
- skip step 1 sets flag and shows **ReminderBanner** on generate
- completing onboarding sets **Onboarding Completion** in localStorage
- `/app/settings` (avatar only): read-only email, locale selector (pt-BR/en), consent status section, revoke button disabled with explanation until API exists, logout
- locale change re-renders app strings without `/en` route prefix
- post-login redirect respects onboarding + example count rules

## Acceptance criteria

- [ ] First-time user with no examples lands on onboarding after login.
- [ ] User can skip onboarding steps and reach generate.
- [ ] Voice skip shows reminder banner on generate.
- [ ] Settings locale switch updates UI language.
- [ ] Logout clears session and returns to marketing or login.
- [ ] Onboarding step 1 uses same composer component as voice routes.

## Blocked by

- [32-voice-dashboard-and-example-composer.md](./32-voice-dashboard-and-example-composer.md)
- [29-generation-screen-end-to-end.md](./29-generation-screen-end-to-end.md) (for ReminderBanner on generate)
