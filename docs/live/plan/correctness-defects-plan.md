# Correctness-defects plan — `/implement`-ready task set

**Promoted:** 2026-07-22 (FU-6) from the wayfinder `.scratch/defeitos-de-corretude/` (map.md + issues 01–08).
**Sibling:** the Practice Profile map (ADR 0010 + `practice-profile-plan.md`). Where the two touch, this
plan names the order so `/implement` does not do the same work twice or wait for what never comes.
**Source of every `file:line`:** `.scratch/adaptacao-por-dominio/research/survey-vies.md` §6/§9 — no issue
re-discovers; each **verifies before deciding** (the survey found things whose state contradicts the docs).

> **Process (from the wayfinder + FU-6):** this promotion produces the plan + atomic issues. The genuine
> product decisions (localization posture, metaphor on/off, reasoning-signature default, penalty
> bug-vs-calibration) are **not decided here** — they are flagged in the issues with a recommendation and
> a verify-before-deciding step, and are resolved in the implementation sessions **with the per-phase
> review gate (reviewer on a different model than the implementer)**, exactly as the Practice Profile
> phases ran. An ADR is written when a decision that merits one is confirmed (see §ADR below) — none is
> written yet because none is confirmed.

## Triage criterion (ticket 01)

The wayfinder proposed one criterion — **"does this change what the beta-tester receives?"** — and named a
second that can outweigh it: **irreversibility** (a bug invisible now that corrupts persisted data poisons
everything later). This plan orders by **max(beta-visibility, irreversibility)**. The clock is the beta:
two known testers (senior marketing writer, climate-tech PM/founder), both writing in **Portuguese**, a
third (tech) to recruit; none has used it yet.

"Fix everything" is not a plan. What is acceptable-broken before two known users is named explicitly in the
cut below — deletion is delivery, not omission.

## The defects (promoted to atomic issues)

| Issue | Was | Defect | Kind | Changes product output? | Irreversible? |
|---|---|---|---|---|---|
| **CD-1** | 02 | `voice.reasoningSignatureV1` default drift (repo `false` / VPS `true`) | decision + CI guard | no (prod already on) | no, but dev/CI validate a *different* product |
| **CD-2** | 03 | lexical penalty counted twice (100→60→24) | bug-vs-calibration + fix | **yes** (candidate selection) | no |
| **CD-3** | 04 | metaphor dimension computed, persisted, never wired | on-or-delete decision | yes if turned on | no |
| **CD-4** | 05 | localization posture undecided; 5× duplicated pt regex; `resolveTone` misclassifies anglophones | posture decision + extraction | — | **yes** (`resolveTone` persists a wrong tone) |
| **CD-5** | 05↑ | `Text must contain at least N words` — crude English in the pt-BR onboarding UI | trivial fix | **yes** (beta-visible, first writing step) | no |
| **CD-6** | 06 | leak guard: reconciliation uncovered (+ raw example text), retry not re-verified, no observability | fix + decisions | — | **yes** (leaked voice-subject persists into the profile) |
| **CD-7** | 07 | web↔backend seams: `minWords` cosmetic vs hard-gate; `WORD_TARGETS` hand-copied; `buildBriefing` field mismatch + unlabeled `keyPoints` | fix + delete-dead | yes (briefing shape) | no |
| ~~FU-5~~ | — | double voice resolution on the sync path | **DONE (this branch)** | — | — |

**FU-5 is already closed** on this branch (commit `fix: FU-5 …`) — one resolution + one snapshot per sync
generation. Listed here only so the map's "routed items" are visibly accounted for; no issue remains.

## The cut (before beta / after / delete)

**Before beta (small, beta-visible, or irreversible-data):**
- **CD-5** — trivial; a raw English error in the first pt-BR writing step is the worst possible place for it.
- **CD-4 · `resolveTone` only** — it persists a wrong tone into the `DerivedVoiceProfile`. The 2 known
  testers write in pt so it is dormant for them, but it corrupts data the moment a `en` author appears; the
  narrow fix (locale-aware linguistic signals, or at least not defaulting `en` → `"formal"`) is cheap and
  independent of the full posture decision. The rest of CD-4 waits.
- **CD-6 · reconciliation hole** — the one leak-guard hole that lets voice-*subject* substitute the verified
  drafts unconditionally; it persists into the profile. The retry/observability/`minHits` parts can follow.
- **CD-2** if the verification (git-blame) clears it as a real bug and the before/after eval is green.

**After beta (bigger or lower-risk):**
- **CD-1** default flip + eval CI guard · **CD-4** full localization posture + the 5×-regex extraction ·
  **CD-6** retry policy + observability + `minHits` calibration · **CD-7** the gate policy + briefing reshape
  (coordinated with the sibling map's briefing change — see §Sibling).

**Delete (delivery, list explicitly):**
- **CD-3** if the on-or-delete decision is *delete*: `formatMetaphorStylePromptBlock`, `buildStructuredPrompt`,
  `deriveMetaphorSignature`, the schema field, the DB column, and the converter — **all of it** (half-deletion
  leaves today's state with fewer clues).
- **CD-7** dead step-planner branches keyed on `briefing.question`/`briefing.systemContext` (fields
  `buildBriefing` never sets) — religar with the reshaped briefing, or delete.

## Dependencies & critical path

- **No blocking dependency between CD-1…CD-7** — each is independently implementable. The ordering above is
  by triage priority, not by dependency.
- **CD-2 and CD-3 change candidate selection** → each needs a **runnable before/after** (see §Verification).
- **CD-4, CD-6, CD-7 coordinate with the sibling map** (see §Sibling) — do not "fix" the briefing shape or
  the calibration prompts here without that effort; the correct fix is the same work.

## Verification (ticket 08 §3)

- **CD-2 / CD-3** move the product's output, not just a number. Required: a runnable check that shows the
  candidate-selection **before and after**. The repo has `packages/eval` regression fixtures — **known
  caveat: they are ~85% tech** (sibling map), so they do **not** cover regression outside tech. If the change
  matters outside tech, the issue must say what to do about it (add a non-tech fixture, or scope the claim).
- **CD-1** — the eval closes the CI gate with the flag **off** while production runs it **on**; the guard is
  to make CI/dev exercise the same path production uses (or make the default `true`). Verify: the eval's
  effective flag value in CI equals production's.
- **CD-5 / CD-7** — assert the specific user-facing message / the single-source word target with a test.
- **CD-6** — count guard firings (observability) and add a test that a leaking reconciliation output is
  caught; **never log voice content** (it is encrypted + key-rotated in `safety/`).

## Sibling-map coordination (ticket 08 §6)

- **Metaphor guard (CD-3)** ↔ the sibling's domain classifier/lexicon: if that effort wants this guard as
  part of the domain solution, turning it on here is a prerequisite there — order matters, verify before
  deciding in isolation. (Note: the sibling's Practice Profile work is now feature-complete through Phase 6,
  so the classifier was *retired*, not extended — re-confirm whether the metaphor guard is still wanted.)
- **Calibration prompts (CD-4)** ↔ the sibling deleted the 4 hardcoded prompts (they became generated from
  the Practice Profile, born in the requested language). That kills **one** row of CD-4's table by
  construction; it does **not** touch `resolveTone`, the stopwords, or `language: "pt-BR"`. Do not conflate.
- **Briefing shape (CD-7)** ↔ the sibling reshaped the briefing (Phase 1 clean cut). Re-check whether the
  dead step-planner branches are religados with the new fields or deleted.

## ADR

None yet — an ADR records a **confirmed** decision, and the decisions that would merit one are still open:
- *"the product is pt-BR-first (and the `en` i18n is removed or marked incomplete)"* (CD-4), or
- *"`voice.reasoningSignatureV1` stays off and the v2 path is X; `CONTEXT.md` records what actually runs"* (CD-1).

Each is hard to reverse, surprising without context, and a real trade-off — the three conditions for an ADR.
Write **ADR 0011** (next free number) at the moment one of these is confirmed in an implementation session.
Until then, `CONTEXT.md` must not describe a code path that does not run (ticket 08 §4).

## Open decisions carried into implementation (with recommendations)

Each is owned by its issue; summarized here so the reader sees the whole surface at once:

1. **CD-4 localization posture — bilingual vs pt-BR-first.** *Recommendation:* declare **pt-BR-first for v1**
   (both known testers write pt; bilingual is a large program), mark the `en` i18n incomplete rather than
   ship it as a false promise, but **still fix `resolveTone`'s data corruption now** (it is independent of the
   posture). Confirm before implementing.
2. **CD-3 metaphor on-or-delete.** *Recommendation:* **delete** unless the sibling still wants the guard —
   the classifier it was meant to support was retired. Verify the sibling need first; deletion is the ponytail
   default over paying to compute-and-persist what nothing reads.
3. **CD-1 reasoning-signature default.** *Recommendation:* make the default **`true`** to match production, so
   dev/CI stop validating a different product; add an eval CI guard asserting the CI flag equals prod.
4. **CD-2 penalty bug-vs-calibration.** *Recommendation:* treat as a **real bug** (double-subtraction of the
   same finding is not a defensible calibration), but **verify via git-blame** that no selection threshold was
   tuned on top of it before removing one subtraction; keep the `CriticFinding` subtraction (user-visible),
   drop the numeric `lexicalPenalty` re-subtraction.
