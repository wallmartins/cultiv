# E09 — Critic regression fixtures

## What to build

Create critic regression fixtures in `packages/eval/src/fixtures/critic-regression/`. These cases validate that the critic module correctly detects problematic text patterns.

Each fixture contains:
- An `input.text` (pre-generated, no LLM needed)
- `expectations.mustTriggerCritic` — list of critic finding categories that must fire
- `expectations.maxCriticScore` — the critic score should be low because the text has obvious problems

Categories to cover:
- `performative-llm-language` — "It's important to note", "Let's dive in", "In this comprehensive guide"
- `cliche` — "game-changer", "unlock potential", "take it to the next level"
- `meta-commentary` — "In this article, I will explain", "As we all know"
- `repetition` — same phrase or structure repeated within 3 sentences
- `filler` — "essentially", "basically", "actually" used unnecessarily

Target: 10 fixtures minimum, at least 2 per category.

## Acceptance criteria

- [x] 10+ fixture JSON files in `critic-regression/`
- [x] Each fixture has a pre-generated text with deliberate quality issues
- [x] Each fixture specifies which critic categories must trigger
- [x] Each fixture has a maxCriticScore expectation (text should score poorly)
- [x] Fixtures pass schema validation via the case loader
- [x] Coverage of all 5 critic categories listed above

## Blocked by

- E02 (types must exist)
