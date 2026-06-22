# Option B viability — calibration analysis

Observed telemetry rows: 52

This report uses Phase 1 behavior: `intent × lengthTier` resolves to legacy pipelines.
High spread within an intent suggests tier-driven execution economics — supports hybrid/Option B pricing.

## Per-intent tier cost spread

| Intent | Tiers sampled | Distinct pipelines | Spread (max/min mean USD) | Signal |
|--------|---------------|--------------------|---------------------------|--------|
| share-idea | 3 | 2 | 1.35× | moderate |
| explain-deeply | 3 | 3 | 2.38× | strong |
| engage-audience | 3 | 3 | 1.38× | strong |
| tell-story | 3 | 2 | 1.89× | strong |
| update-subscribers | 3 | 2 | 1.14× | moderate |
| document-decision | 3 | 2 | 2.38× | strong |

## Tier detail

### share-idea

| Tier | Legacy pipeline | n | mean USD | min | max |
|------|-----------------|---|----------|-----|-----|
| short | linkedin-post | 21 | $0.1093 | $0.0436 | $0.1463 |
| medium | linkedin-post | 21 | $0.1093 | $0.0436 | $0.1463 |
| long | long-form-blog | 8 | $0.1472 | $0.1297 | $0.2105 |

### explain-deeply

| Tier | Legacy pipeline | n | mean USD | min | max |
|------|-----------------|---|----------|-----|-----|
| short | validation-post | 8 | $0.0902 | $0.0853 | $0.0968 |
| medium | architecture-post | 8 | $0.2146 | $0.1862 | $0.2750 |
| long | long-form-blog | 8 | $0.1472 | $0.1297 | $0.2105 |

### engage-audience

| Tier | Legacy pipeline | n | mean USD | min | max |
|------|-----------------|---|----------|-----|-----|
| short | validation-post | 8 | $0.0902 | $0.0853 | $0.0968 |
| medium | linkedin-post | 21 | $0.1093 | $0.0436 | $0.1463 |
| long | newsletter | 5 | $0.1241 | $0.1089 | $0.1718 |

### tell-story

| Tier | Legacy pipeline | n | mean USD | min | max |
|------|-----------------|---|----------|-----|-----|
| short | twitter-thread | 2 | $0.0777 | $0.0766 | $0.0788 |
| medium | twitter-thread | 2 | $0.0777 | $0.0766 | $0.0788 |
| long | long-form-blog | 8 | $0.1472 | $0.1297 | $0.2105 |

### update-subscribers

| Tier | Legacy pipeline | n | mean USD | min | max |
|------|-----------------|---|----------|-----|-----|
| short | linkedin-post | 21 | $0.1093 | $0.0436 | $0.1463 |
| medium | newsletter | 5 | $0.1241 | $0.1089 | $0.1718 |
| long | newsletter | 5 | $0.1241 | $0.1089 | $0.1718 |

### document-decision

| Tier | Legacy pipeline | n | mean USD | min | max |
|------|-----------------|---|----------|-----|-----|
| short | validation-post | 8 | $0.0902 | $0.0853 | $0.0968 |
| medium | architecture-post | 8 | $0.2146 | $0.1862 | $0.2750 |
| long | architecture-post | 8 | $0.2146 | $0.1862 | $0.2750 |

## Recommendation

- **Option B / hybrid tier modifiers:** Economically justified — tier changes pipeline and/or cost spread is material.
- Phase 2: prefer **4 named profiles + tier in pricing matrix**; defer full parametric composer to Phase 3 unless quality tests demand it.

