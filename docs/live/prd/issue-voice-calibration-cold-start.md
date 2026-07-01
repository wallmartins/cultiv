---
title: Voice Calibration Cold Start Program
doc_type: issue
status: ready-for-agent
domain: voice
slice_type: AFK
last_updated: 2026-06-30
---

# Voice Calibration Cold Start Program

## Parent

- PRD: [`voice-calibration-cold-start.md`](./voice-calibration-cold-start.md)
- ADR: [`../../adr/0011-voice-calibration-cold-start.md`](../../adr/0011-voice-calibration-cold-start.md)
- Domain glossary: [`../../CONTEXT.md`](../../CONTEXT.md)
- Plan: [`../plan/voice-calibration-cold-start-implementation-plan.md`](../plan/voice-calibration-cold-start-implementation-plan.md)

## User stories covered

1–10 (full PRD)

## What to build

End-to-end **Voice Calibration Cold Start**: **Voice Onboarding Gateway**, **Voice Calibration Session** with **Calibration Rounds**, **Voice Example Provenance**, **Voice Calibration Entitlement**, **Calibration Quota Charge** on free, revised confidence for calibrated profiles, **Author Voice Preference Resolution**, and eval corpus.

Child issues are sliced as issues `109`–`116` below.

## Child issues

| # | Issue | Epic |
|---|-------|------|
| 109 | [Voice calibration contracts and provenance](../issues/109-voice-calibration-contracts-provenance.md) | A — Contracts |
| 110 | [Voice calibration entitlement and quota charge](../issues/110-voice-calibration-entitlement-quota.md) | B — Commercial |
| 111 | [Calibration candidate generation service](../issues/111-calibration-candidate-generation.md) | C — Backend session |
| 112 | [Calibrated confidence and rebuild weighting](../issues/112-calibrated-confidence-rebuild.md) | D — Rebuild |
| 113 | [Voice onboarding gateway UI](../issues/113-voice-onboarding-gateway-ui.md) | E — Web gateway |
| 114 | [Voice calibration session UI](../issues/114-voice-calibration-session-ui.md) | F — Web session |
| 115 | [Author voice preference resolution](../issues/115-author-voice-preference-resolution.md) | G — Conflict |
| 116 | [Voice calibration eval and observability](../issues/116-voice-calibration-eval-observability.md) | H — QA |

## Program acceptance criteria

- [ ] ADR 0011 accepted; PRD and plan indexed in live docs READMEs.
- [ ] All child issues `done`; `pnpm eval:voice-calibration` passes on CI corpus.
- [ ] Gateway shows both **Voice Entry Path** options; post-login redirect respects gateway when no voice material.
- [ ] Free: max 3 rounds, 1 quota charge per completed round, `medium` confidence cap from calibration alone.
- [ ] Criador / Pro: max 10 rounds, no quota charge, `high` path when thresholds met.
- [ ] **authored** import path unchanged; no **Calibration Quota Charge** on import.
- [ ] **Author Voice Preference Resolution** blocks silent overwrite on divergence.
- [ ] **Voice Training Consent** required before calibration persist (same as examples today).
- [ ] i18n pt-BR + en for gateway, session, conflict, upgrade CTAs.

## Suggested order

`109 → 110 → 111 → 112 → (113 ∥ 114) → 115 → 116`

Web gateway (113) can start once contracts (109) exist; session UI (114) needs 110–111 APIs. Conflict resolution (115) after rebuild weighting (112). Eval (116) last.
