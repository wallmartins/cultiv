---
title: Voice Calibration Cold Start
doc_type: adr
status: accepted
last_updated: 2026-06-30
---

# Voice calibration cold start

Authors without an existing writing portfolio could not reach a mature **Voice Profile** because Cultiv derived voice only from imported **Voice Examples**. We decided to add a parallel **Voice Entry Path**: a **Voice Onboarding Gateway** lets the author choose between importing texts or completing a **Voice Calibration Session** (A/B candidate choice, optional edits, **Author Affirmation** per **Calibration Round**).

**Voice Confidence** may reach `medium` or `high` from attested calibrated examples when round volume and designed diversity meet thresholds — not from raw example count alone. **Format Expression Profile** remains optional per **Content Type** until enough tagged examples exist; channel is not required. When **authored** material later diverges from calibrated signal, **Author Voice Preference Resolution** asks the author which direction to follow before rebuild applies the choice — no silent overwrite.

**Grill session:** June 2026 — extends ADR 0006–0008 without replacing example-based ingestion for authors who already have texts.

## Voice calibration entitlement (hybrid commercial model)

Calibration LLM cost is material on the free plan (no subscription revenue). We adopted a **hybrid** model that offers a taste of cold start on free while protecting margin and creating upgrade desire on paid plans.

| Plan | Max calibration rounds | Debits generation quota? | Max confidence from calibration alone |
|------|------------------------|--------------------------|---------------------------------------|
| **Free** | 3 | Yes — 1 quota per completed round (**Calibration Quota Charge**) | `medium` |
| **Criador** | 10 | No — onboarding COGS | `high` |
| **Pro** | 10 | No — onboarding COGS | `high` |

**Free path rules:**

- **Voice Onboarding Gateway** still shows both entry paths; the calibration path discloses quota cost before each round.
- Authors who prefer zero calibration cost import **authored** examples via **Voice Example Composer** instead.
- After three rounds or `medium` confidence, further calibration requires upgrade.

**Paid path rules:**

- Full **Voice Calibration Session** depth (up to ten rounds) without consuming monthly generation quota.
- Same round cap on Criador and Pro; plan differentiation stays on generations, quality modes, and features — not calibration volume.

**Rationale:** Unlimited free calibration would scale product COGS without conversion. Quota debit on free aligns LLM usage with the author's limited allowance; paid plans absorb calibration as activation cost (~2–4% of first-month revenue per user).

## Considered Options

1. **Questionnaire-only profile (no text)** — Rejected. Surface voice (lexicon, cadence) needs text-shaped signal; enums alone stereotype output.
2. **Calibration replaces onboarding composer for everyone** — Rejected. Authors with portfolios should not be forced through synthetic calibration.
3. **Silent preference for authored over calibrated on conflict** — Rejected. Product chose explicit **Author Voice Preference Resolution**.
4. **Calibration paid-only (free must import texts)** — Rejected. Removes cold-start proof on free; hurts activation for authors without portfolios.
5. **Unlimited free calibration outside quota** — Rejected. Scales LLM cost with low conversion risk.
6. **Hybrid free taste + paid full calibration (selected)** — Free: 3 rounds, quota debit, `medium` cap. Paid: 10 rounds, no debit, `high` path.

## Consequences

- New provenance on **Voice Example** (`authored` | `calibrated`), confidence formula, and **Voice Calibration Entitlement** per plan.
- **Generation Preview** and calibration UX must show **Calibration Quota Charge** on free before round completion.
- Onboarding grows a gateway screen before the existing composer path; calibration is a new product surface, not a tweak to **Voice Example Composer** alone.
- Eval corpus should include calibrated personas to validate that attested `high` matches acceptable generation quality.
- Marketing and upgrade CTAs should frame paid calibration as “build your full voice without spending generations.”
