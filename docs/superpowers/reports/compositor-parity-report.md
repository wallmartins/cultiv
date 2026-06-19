# Compositor parity report

<<<<<<< Updated upstream
Generated: 2026-06-19T19:48:40.881Z
=======
Generated: 2026-06-19T19:53:20.135Z
>>>>>>> Stashed changes

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

HTTP runs executed against the live API (server flag determines legacy vs compositor path).

| Fixture | Job ID | Status | planSignature | USD est. | Progress events |
|---------|--------|--------|---------------|----------|-----------------|
| share-idea-short-professional-network | e33e74e0-f4fd-42fc-83d9-a55c4e280fad | done | — | 0.0871 | 12 |
| share-idea-medium-email | f45af196-3f10-4653-9035-b395d17d227f | done | — | 0.0930 | 12 |
| explain-deeply-long-blog | 8c0211c4-65e0-40a6-8a64-d917e26ca3d2 | failed | — | — | 7 |
| document-decision-medium-unspecified | eb4353e2-9912-403c-bc33-39a87bdb076d | failed | — | — | 3 |
| engage-audience-short-social | c3cb30e2-b259-48de-9210-d16b5fd8bd72 | failed | — | — | 2 |
| tell-story-medium-unspecified | 14bdb444-2479-47ae-846d-2c45c96c89a8 | failed | — | — | 1 |

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

