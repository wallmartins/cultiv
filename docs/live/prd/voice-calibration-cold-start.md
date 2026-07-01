---
title: PRD - Voice Calibration Cold Start
doc_type: prd
status: ready-for-agent
domain: voice
last_updated: 2026-06-30
---

# PRD: Voice Calibration Cold Start

## Problem Statement

Cultiv derives **Voice Profile**, **Core Reasoning Signature**, and **Argument Development Signature** from imported **Voice Examples**. Authors without an existing writing portfolio cannot reach a mature profile, which limits who can benefit from the product and contradicts the launch promise of personal, non-generic text.

**Symptoms:**

- New users stall at **Voice Example Composer** with no texts to paste.
- **Voice Confidence** stays `low`; **Voice Adaptation Mode** stays conservative.
- Conversion suffers when the only path to voice quality requires prior authorship.
- Free-tier LLM cost would scale unsustainably if full calibration were offered without commercial guardrails.

**Root cause:** Single **Voice Entry Path** (import only) and confidence formula that measures example count/diversity without author attestation or plan-scoped entitlement.

## Product Rule (non-negotiable)

> **Voice Calibration** produces real **Voice Examples** with provenance `calibrated` — not a parallel questionnaire-only profile. **Author Affirmation** after each **Calibration Round** is required before persistence. On conflict with later **authored** material, **Author Voice Preference Resolution** asks the author; silent overwrite is forbidden.

## Solution

Ship [ADR 0011](../../adr/0011-voice-calibration-cold-start.md):

1. **Voice Onboarding Gateway** — parallel choice: import texts or **Voice Calibration Session**.
2. **Calibration Round** — two candidate texts, author pick, optional edit, attestation.
3. **Voice Example Provenance** — `authored` | `calibrated` on every example.
4. **Voice Calibration Entitlement** — plan caps, quota debit on free, confidence ceiling.
5. **Calibration Quota Charge** — free plan debits one generation unit per completed round.
6. **Author Voice Preference Resolution** — confirmation when authored signal diverges from calibrated profile.
7. **Format Expression Profile** — remains optional per **Content Type**; no channel requirement.

### Commercial model (hybrid)

| Plan | Max rounds | Quota debit | Max confidence (calibration only) |
|------|------------|-------------|-----------------------------------|
| Free | 3 | 1 generation / round | `medium` |
| Criador | 10 | none | `high` |
| Pro | 10 | none | `high` |

Importing **authored** examples never applies **Calibration Quota Charge**.

Governance: [ADR 0011](../../adr/0011-voice-calibration-cold-start.md) · [implementation plan](../plan/voice-calibration-cold-start-implementation-plan.md) · [issue parent](./issue-voice-calibration-cold-start.md)

**Prerequisites:** `voice.reasoningSignatureV1` (reasoning + development extraction on rebuild), billing wallet + **Generation Preview** quota fields, existing **Voice Profile Rebuild** pipeline.

## User Stories

1. As an **End User** without prior texts, I want to choose “develop my voice with Cultiv” at onboarding, so that I can start without a writing portfolio.

2. As an **End User**, I want to pick between two text options and lightly edit the winner, so that the profile reflects how I want to sound — not abstract quiz answers.

3. As an **End User**, I want to attest that each calibrated text sounds like me, so that I trust what Cultiv learned.

4. As a **Free End User**, I want to see that each calibration round uses one of my monthly generations before I confirm, so that I understand the trade-off.

5. As a **Free End User**, I want a short taste (up to 3 rounds) and a clear upgrade path, so that I can try cold start without unlimited platform cost.

6. As a **Criador / Pro End User**, I want full calibration (up to 10 rounds) without spending generations, so that onboarding feels like a paid benefit.

7. As an **End User** who later imports real texts, I want Cultiv to ask which voice direction to keep when they diverge, so that my profile does not change silently.

8. As an **End User** with existing texts, I want “import my texts” unchanged, so that I am not forced through calibration.

9. As a **product owner**, I want calibration COGS bounded per plan, so that free users do not erode margin without conversion pressure.

10. As a **QA engineer**, I want calibrated persona fixtures and eval, so that `medium`/`high` attested profiles meet generation quality bars.

## Scope

### In scope (Fase 1)

- **Voice Onboarding Gateway** screen (pt-BR + en)
- **Voice Calibration Session** API + web flow (rounds, candidates, edit, attest)
- `VoiceExampleProvenance` on contracts, DB, rebuild, mappers
- **Voice Calibration Entitlement** resolver (plan → max rounds, quota debit, confidence cap)
- **Calibration Quota Charge** integrated with wallet reserve/capture on free
- Revised **Voice Confidence** for calibrated material (attestation + designed diversity + provenance weights)
- **Author Voice Preference Resolution** API + dashboard prompt
- Upgrade CTAs when free hits round cap or `medium` ceiling
- Observability: `calibration_round_completed`, `calibration_quota_charged`, `voice_direction_conflict_prompted`
- Regression: `pnpm eval:voice-calibration` (calibrated personas)

### Out of scope

- Questionnaire-only profile without text artifacts
- Author-editable derived reasoning / trait enums
- Format Expression Profile required at cold start
- Channel field revival for examples
- Separate feature flag (reuse `voice.reasoningSignatureV1` unless rollout risk demands otherwise)
- Marketing page rewrite beyond upgrade copy hooks in app

## Functional Requirements

### FR-1 — Voice Onboarding Gateway

- Shown when **End User** has no voice material and **Onboarding** not complete (replaces direct land on composer-only step).
- Two primary paths: **Import texts** → **Voice Example Composer**; **Develop with Cultiv** → **Voice Calibration Session**.
- Neither path is visually default; copy explains trade-offs (free quota debit on calibration path).
- Skip/dismiss still allowed; reminders on **Generation Screen** per existing onboarding rules.

### FR-2 — Calibration Round

- System generates two candidate texts for a designed dimension (length, intent, or content-type slice).
- Author selects one, may edit inline (plain text, bounded length).
- Author attests (“soa como eu quero”) before persist.
- Persist as **Voice Example** with `provenance: calibrated`, `attestedAt`, optional `editDelta` metric.
- Trigger **Voice Profile Rebuild** after session complete or batch of rounds (coalesced like today).

### FR-3 — Voice Calibration Entitlement

- Resolve from plan id: `free` | `criador` | `pro`.
- Enforce `maxRounds`, `chargesQuota`, `maxConfidenceFromCalibration`.
- Return remaining rounds + whether next round charges quota in session API.
- Block round start when cap reached; return upgrade `reasonCode` on free.

### FR-4 — Calibration Quota Charge

- On free only: before round completion, show **Generation Preview**-compatible quota cost (1 unit).
- Reserve → capture one generation-equivalent credit on attest success; release on abandon.
- Paid plans: skip wallet mutation for calibration.
- Calibration charges do not use full generation pipeline — separate LLM purpose `voice-calibration-candidate`.

### FR-5 — Voice Confidence (calibrated path)

- `authored` examples outweigh `calibrated` in confidence and conflict resolution.
- Free: cannot exceed `medium` from calibration alone.
- Paid: `high` when ≥ attestation thresholds + designed diversity across rounds (see ADR 0011).
- **Voice Diagnostics** exposes provenance breakdown in **Voice Dashboard Detail Layer**.

### FR-6 — Author Voice Preference Resolution

- Offline detection on rebuild when new `authored` examples diverge from calibrated profile (tone/register/trait dispute heuristics).
- Surface read-only contrast + three choices: keep calibration, follow authored, blend.
- Persist decision; re-queue rebuild.
- No generation block while prompt pending — use last harmonized profile until resolved (same spirit as reconciliation).

### FR-7 — Dashboard and upgrade

- **Voice Next Step** codes for `upgrade_for_full_calibration`, `resolve_voice_direction_conflict`, `add_authored_examples`.
- Free session end: CTA to Criador with copy “complete your voice without spending generations”.
- **Voice Reasoning Presentation** works for calibrated profiles (no special-case empty state).

## Non-Functional Requirements

- Calibration candidate generation p95 &lt; 8s (two short variants, fast model).
- Session API idempotent per round id.
- Encrypted at rest like existing **Voice Examples** (**Voice Training Consent** required).
- i18n pt-BR + en for gateway, session, conflict resolution.

## Success Metrics

- ≥ 40% of new users without texts start calibration path (vs bounce at composer).
- Free → paid conversion uplift vs import-only baseline (measure after 30 days).
- Calibrated `medium` personas pass `pnpm eval:voice-calibration` quality bar.
- Free calibration COGS &lt; R$ 3 per user (3 rounds); paid full session &lt; 5% first-month revenue per user.

## Open Questions (implementation)

- Exact divergence heuristics for **Voice Direction Conflict** (reuse trait dispute + register drift vs new classifier).
- Whether round 1–3 on free use a fixed dimension sequence or adaptive planner.
- Feature flag: ship under `voice.reasoningSignatureV1` or add `voice.calibrationV1` for gradual rollout.
