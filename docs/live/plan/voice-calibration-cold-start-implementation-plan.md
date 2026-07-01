# Voice Calibration Cold Start — implementation plan

**Status:** draft · **ADR:** [0011](../../adr/0011-voice-calibration-cold-start.md) · **PRD:** [voice-calibration-cold-start.md](../prd/voice-calibration-cold-start.md)

## Goal

Let authors without a writing portfolio build an attested **Voice Profile** through **Voice Calibration**, with margin-safe **Voice Calibration Entitlement** on free and full depth on paid plans.

## Epics (issues 109–116)

| Epic | Scope | Depends on |
|------|-------|------------|
| **109 — Contracts & provenance** | `VoiceExampleProvenance`, session/round DTOs, DB columns, SDK types | ADR 0011 |
| **110 — Entitlement & quota** | Plan resolver, **Calibration Quota Charge**, preview integration | 109, billing wallet |
| **111 — Candidate generation** | `voice-calibration-candidate` LLM purpose, round orchestration, persist calibrated examples | 109, 110 |
| **112 — Confidence & rebuild** | Attestation-aware confidence, provenance weights, diagnostics | 109, existing rebuild |
| **113 — Gateway UI** | **Voice Onboarding Gateway**, redirect rules, i18n | 109 |
| **114 — Session UI** | A/B picker, editor, attest, quota disclosure, upgrade CTA | 110, 111 |
| **115 — Preference resolution** | Divergence detect, prompt API, rebuild input | 112 |
| **116 — Eval & observability** | Personas, `pnpm eval:voice-calibration`, metrics | 111, 112 |

## API surface (target)

```
POST /me/voice-calibration/sessions          → start session (entitlement snapshot)
GET  /me/voice-calibration/sessions/:id      → session state, rounds completed
POST /me/voice-calibration/sessions/:id/rounds/:roundId/candidates → generate A/B (idempotent)
POST /me/voice-calibration/sessions/:id/rounds/:roundId/complete   → { selected, editedText, attested }
GET  /me/voice-calibration/entitlement       → { maxRounds, completedRounds, chargesQuota, maxConfidence, ... }

POST /me/voice-preference-resolution         → { conflictId, choice: keep_calibrated | follow_authored | blend }
GET  /me/voice-preference-resolution/pending → optional pending conflict card
```

Wallet: free round complete calls existing reserve/capture with fixed debit amount = `canonicalCreditCost` (1 quota).

## Calibration round dimension sequence (v1)

Designed diversity for confidence — not random:

| Round | Dimension | Target |
|-------|-----------|--------|
| 1 | Short opinion | ~80–120 words, direct register |
| 2 | Medium reflection | ~150–220 words, moderate density |
| 3 | Closing style | author picks conclusion vs open question in briefing seed |
| 4+ (paid) | Rotate content-type slices | validation-post, linkedin-post, newsletter snippets |

## Confidence formula (sketch)

```
base = f(attestedRoundCount, designedDimensionCoverage, editDepth)
cap  = entitlement.maxConfidenceFromCalibration
if any authored examples: allow high regardless of calibration cap
global Voice Confidence = min(base, cap) unless authored boost applies
```

Implement in `voice-rebuild-derivation.ts` successor module; keep **Voice Adaptation Mode** derived from global confidence.

## Divergence detection (sketch)

Trigger **Voice Direction Conflict** when new `authored` example rebuild produces:

- Register shift ≥ 2 steps (formal ↔ conversational), or
- ≥ 2 **Development Traits** `disputed` vs calibrated baseline, or
- Core `certaintyLevel` / `authoritySource` enum flip with ≥ 1 authored example

## File map (expected)

| Area | Files |
|------|-------|
| Contracts | `packages/contracts/src/voice-calibration.ts`, extend `voice.ts` |
| Domain | `packages/domain/src/voice-calibration.ts` |
| Backend | `apps/backend/src/product/voice/voice-calibration-*.ts` |
| Billing hook | `apps/backend/src/product/voice/calibration-quota-charge.ts` |
| Web | `apps/web/src/app/onboarding/VoiceOnboardingGateway.tsx`, `apps/web/src/app/voice/calibration/*` |
| SDK | `packages/client-sdk/src/voice-calibration.ts` |
| Tests | `tests/backend/voice-calibration-*.test.ts`, `tests/web/voice-calibration-*.test.ts` |
| Eval | `scripts/eval-voice-calibration.ts`, `tests/fixtures/voice-calibration/` |

## Rollout

1. Ship backend + gateway behind `voice.calibrationV1` (recommended) even if extraction stays on `voice.reasoningSignatureV1`.
2. Internal dogfood on staging with free and paid test accounts.
3. Enable for 10% new signups → 100% after eval green.

## Estimates

| Epic | Effort |
|------|--------|
| 109–112 backend | ~3–4 weeks |
| 113–114 web | ~2 weeks |
| 115–116 | ~1–2 weeks |
| **Total** | **~6–8 weeks** (1 experienced dev, parallel web/backend) |
