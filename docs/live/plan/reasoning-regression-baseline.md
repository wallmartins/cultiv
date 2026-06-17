# Reasoning regression baseline

Captured **2026-06-16** after implementing Author Reasoning Signature (issues 66–73). Use as the reference before enabling `voice.reasoningSignatureV1` in production.

## Corpus

| Persona | Briefings | Primary anti-pattern signal |
|---------|-----------|----------------------------|
| `author-moderate-observer` | 6 | absolutism / premature conclusion |
| `author-formal-architect` | 5 | hand-wavy architecture slogans |
| `author-conversational-linkedin` | 5 | generic LinkedIn coaching tone |
| `author-fast-concluder` | 5 | slow warmup / excessive hedging |
| `author-high-confidence-twelve` | 6 | rhetorical inflation / numbered thesis |
| `author-low-judgment-newsletter` | 5 | prescriptive you-should tone |
| `author-measured-mentor` | 5 | guru / absolute claims |

**Totals:** 7 personas, 37 briefings (threshold: ≥6 personas, ≥30 briefings).

## Heuristic drift gates (bad candidates)

For each persona, `badCandidates` in the fixture must score **drift &lt; 80** on the `draft` step when evaluated with `evaluateReasoningDrift`.

| Metric | Baseline |
|--------|----------|
| Personas passing drift gate | 7 / 7 |
| Bad-candidate failures | 0 |
| `pnpm eval:reasoning` exit code | 0 |

## Commands

```bash
pnpm test tests/reasoning-regression/reasoning-regression.test.ts
pnpm eval:reasoning
```

## Voice Judge (Groq)

Judge path is **not** exercised in CI (mocked transport). Manual smoke with `GROQ_API_KEY` optional. See [voice-judge-groq-subprocessor.md](./voice-judge-groq-subprocessor.md).

## HITL (issue 73)

Blind human review of 10+ generated drafts per persona remains a manual gate before full rollout; not automated in this repo.
