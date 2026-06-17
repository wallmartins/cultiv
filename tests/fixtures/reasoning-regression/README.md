# Reasoning regression corpus

Baseline fixtures for author reasoning signature evaluation (issue 73).

## Profiles (7 personas, 37 briefings)

- `author-moderate-observer.json` — moderate certainty, slow conclusions, low judgment
- `author-formal-architect.json` — formal register, technical density high
- `author-conversational-linkedin.json` — conversational LinkedIn expression
- `author-fast-concluder.json` — fast conclusions, data-backed authority
- `author-high-confidence-twelve.json` — slow conclusions, anti numbered-thesis patterns
- `author-low-judgment-newsletter.json` — observational newsletter tone
- `author-measured-mentor.json` — mentor relationship, reference-backed guidance

## Usage

```bash
pnpm test tests/reasoning-regression/reasoning-regression.test.ts
pnpm eval:reasoning
```

Baseline metrics: [reasoning-regression-baseline.md](../../docs/live/plan/reasoning-regression-baseline.md)

## Policy note

When Voice Judge uses Groq, author material may be sent to Groq under **Voice Training Consent**. See [voice-judge-groq-subprocessor.md](../../docs/live/plan/voice-judge-groq-subprocessor.md).
