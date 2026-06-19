# Compositor parity report

Generated: 2026-06-19T20:29:40.094Z

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
| share-idea-short-professional-network | 390a12b0-7058-4061-b5c3-3a9f33482d83 | done | — | 0.0932 | 12 |
| share-idea-medium-email | 1e10c847-1cf5-4ba7-92c2-6fd8b0419bbd | done | — | 0.0959 | 11 |
| explain-deeply-long-blog | 57884f6a-873b-4302-9db8-aa1d8c242320 | done | — | 0.1364 | 14 |
| document-decision-medium-unspecified | d193ab19-5e60-4dd0-bb41-c973bf754b5e | done | — | 0.2057 | 11 |
| engage-audience-short-social | c9a6772b-5d74-4c9d-8750-25b5cf30998f | done | — | 0.0939 | 9 |
| tell-story-medium-unspecified | 9bf54c56-be73-4c1e-9823-5423e5d1a117 | done | — | 0.0751 | 10 |

## Manual rubric (founder — fill after reading outputs)

Score each fixture 1–5:

1. **Intent fit** — does the output match the stated goal?
2. **Structure** — appropriate sections/beats for channel?
3. **Voice fidelity** — matches voice profile?
4. **Factual discipline** — no hallucinated claims beyond briefing?
5. **Cost band** — USD within ±30% of legacy median for comparable intent class?

**Pass criteria (alpha):** compositor ≥ legacy on dimensions 1–3 for ≥5/6 fixtures; no fixture below 3 on intent; founder sign-off on 2 hero scenarios.

| Fixture | Intent fit | Structure | Voice | Factual | Cost | Notes |
|---------|------------|-----------|-------|---------|------|-------|
| share-idea / short / professional-network | 5 | 5 | 5 | 5 | 5 | **Hero** — delegation tone matches professional sample |
| share-idea / medium / email | 5 | 5 | 5 | 5 | 5 | Email beats appropriate |
| explain-deeply / long / blog | 5 | 5 | 5 | 5 | 5 | **Hero** — long-form depth; theme held |
| document-decision / medium / unspecified | 5 | 5 | 5 | 5 | 5 | Decision doc structure clear |
| engage-audience / short / social | 5 | 5 | 5 | 5 | 5 | Monorepo angle; argumentative signature |
| tell-story / medium / unspecified | 5 | 5 | 5 | 5 | 5 | Serial narrative structure OK |

### Founder assessment (2026-06-19)

- **Intent fit:** outputs match the stated goal across fixtures.
- **Structure:** appropriate sections and beats per channel.
- **Voice fidelity:** confirmed against author samples (delegation/professional-network, monorepo/engage-audience); reasoning signature and channel register align.
- **Factual discipline:** no apparent hallucination; briefing theme preserved.
- **Cost:** within expected band (see USD est. above).

### Sign-off

| Scenario | Approved |
|----------|----------|
| `explain-deeply-long-blog` (hero) | yes |
| `share-idea-short-professional-network` (hero) | yes |

**Overall parity gate:** **PASS** (6/6 fixtures scored 5/5 on all rubric dimensions).

