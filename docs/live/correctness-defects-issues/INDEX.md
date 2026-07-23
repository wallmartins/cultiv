# Correctness-defects issues — index

Promoted 2026-07-22 (FU-6) from `.scratch/defeitos-de-corretude/` (wayfinder issues 01–08).
Plan: [`docs/live/plan/correctness-defects-plan.md`](../plan/correctness-defects-plan.md).
Every `file:line` traces to `.scratch/adaptacao-por-dominio/research/survey-vies.md` §6/§9.

Each issue **verifies before deciding** — the survey found states that contradict the docs. The genuine
product decisions are flagged `DECISÃO` with a recommendation; they are confirmed in the implementation
sessions under the per-phase review gate (reviewer on a different model than the implementer).

| Issue | Source | Cut | One line |
|---|---|---|---|
| [CD-1](CD-1-config-drift-reasoning-signature.md) | 02 | after beta | reasoning-signature default `false` (repo) vs `true` (VPS) — dev/CI validate a different product |
| [CD-2](CD-2-dupla-contagem-penalidade.md) | 03 | before beta* | lexical penalty subtracted twice (100→60→24); bug or calibration? |
| [CD-3](CD-3-metafora-ligar-ou-deletar.md) | 04 | delete (likely) | metaphor dimension computed + persisted + never wired — turn on or delete all of it |
| [CD-4](CD-4-postura-de-localizacao.md) | 05 | posture: after / `resolveTone`: before | bilingual vs pt-BR-first; 5× duplicated pt regex; `resolveTone` misclassifies anglophones |
| [CD-5](CD-5-mensagem-erro-word-count-en.md) | 05↑ | before beta | crude English `Text must contain at least N words` in the pt-BR onboarding |
| [CD-6](CD-6-guarda-de-vazamento.md) | 06 | reconciliation: before / rest: after | leak guard's 3 holes (reconciliation, retry, observability, `minHits`) |
| [CD-7](CD-7-seams-web-backend.md) | 07 | after beta | web↔backend duplicated rules that already diverge; dead step-planner branches |

**Already closed on this branch:** FU-5 (double voice resolution on the sync path) — one resolution + one
snapshot per sync generation. Routed here from the sibling map's Phase-6 gate; done, no issue remains.

\* CD-2 enters "before beta" only if git-blame clears it as a real bug and the before/after eval is green.
