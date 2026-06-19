# Compositor parity report

Generated: 2026-06-19T19:36:51.834Z

## Dry plan comparison (local)

| Fixture | Legacy contentType | Compositor plan | Steps | Expression | Expectations OK |
|---------|-------------------|-----------------|-------|------------|-----------------|
| share-idea / short / professional-network | linkedin-post | short-piece | 4 (hook → draft → refine → sanitize) | professional-share-idea | yes |
| share-idea / medium / email | linkedin-post | edition-piece | 4 (draft → refine → tighten → sanitize) | email-share-idea | yes |
| explain-deeply / long / blog | long-form-blog | long-piece | 6 (research → outline → draft → refine → finalize → sanitize) | blog-explain-deeply | yes |
| document-decision / medium / unspecified | architecture-post | edition-piece | 5 (structure → draft → refine → tighten → sanitize) | document-decision-default | yes |
| engage-audience / short / social | validation-post | short-piece | 4 (hook → draft → refine → sanitize) | social-engage-audience | yes |
| tell-story / medium / unspecified | twitter-thread | serial-piece | 4 (analyze → draft → tighten → sanitize) | tell-story-default | yes |

## Optional HTTP execution

Skipped — set `CALIBRATION_ACCESS_TOKEN` and `DATABASE_URL`, then rerun with `--execute`.

## Manual rubric (founder — fill after reading outputs)

Score each fixture 1–5:

1. **Intent fit** — does the output match the stated goal?
2. **Structure** — appropriate sections/beats for channel?
3. **Voice fidelity** — matches voice profile?
4. **Factual discipline** — no hallucinated claims beyond briefing?
5. **Cost band** — USD within ±30% of legacy median for comparable intent class?

| Fixture | Intent fit | Structure | Voice | Factual | Cost | Notes |
|---------|------------|-----------|-------|---------|------|-------|
| share-idea / short / professional-network | | | | | | |
| share-idea / medium / email | | | | | | |
| explain-deeply / long / blog | | | | | | |
| document-decision / medium / unspecified | | | | | | |
| engage-audience / short / social | | | | | | |
| tell-story / medium / unspecified | | | | | | |

