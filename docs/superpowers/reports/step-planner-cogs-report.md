# Step planner COGS variance report

Generated: 2026-06-22T14:41:50.382Z

## Summary

- Fixtures × variants: 18
- p50 absolute LLM step delta: 0
- p90 absolute LLM step delta: 0
- planSignature drift rate: 0.0%
- HTTP runs: 4/18 done
- p50 USD (executed): 0.1326
- p90 USD (executed): 0.1536

## Dry-run comparisons (local)

| Fixture | Variant | Base plan | Patched plan | Signature drift | Base LLM steps | Patched LLM steps | Δ LLM | Patch ops |
|---------|---------|-----------|--------------|-----------------|----------------|-------------------|-------|-----------|
| share-idea / short / professional-network | minimal | short-piece | short-piece | no | 3 | 3 | +0 | — |
| share-idea / short / professional-network | typical | short-piece | short-piece | no | 3 | 3 | +0 | — |
| share-idea / short / professional-network | heavy | short-piece | short-piece | no | 3 | 3 | +0 | — |
| share-idea / medium / email | minimal | edition-piece | edition-piece | no | 3 | 3 | +0 | — |
| share-idea / medium / email | typical | edition-piece | edition-piece | no | 3 | 3 | +0 | — |
| share-idea / medium / email | heavy | edition-piece | edition-piece | no | 3 | 3 | +0 | — |
| explain-deeply / long / blog | minimal | long-piece | long-piece | no | 2 | 2 | +0 | removeStep:research, removeStep:outline |
| explain-deeply / long / blog | typical | long-piece | long-piece | no | 2 | 2 | +0 | removeStep:research, removeStep:outline |
| explain-deeply / long / blog | heavy | long-piece | long-piece | no | 2 | 2 | +0 | — |
| document-decision / medium / unspecified | minimal | edition-piece | edition-piece | no | 4 | 4 | +0 | — |
| document-decision / medium / unspecified | typical | edition-piece | edition-piece | no | 4 | 4 | +0 | — |
| document-decision / medium / unspecified | heavy | edition-piece | edition-piece | no | 4 | 4 | +0 | insertStep:structure:before:draft |
| engage-audience / short / social | minimal | short-piece | short-piece | no | 3 | 2 | -1 | removeStep:hook |
| engage-audience / short / social | typical | short-piece | short-piece | no | 3 | 3 | +0 | — |
| engage-audience / short / social | heavy | short-piece | short-piece | no | 3 | 3 | +0 | — |
| tell-story / medium / unspecified | minimal | serial-piece | serial-piece | no | 2 | 2 | +0 | — |
| tell-story / medium / unspecified | typical | serial-piece | serial-piece | no | 2 | 2 | +0 | — |
| tell-story / medium / unspecified | heavy | serial-piece | serial-piece | no | 2 | 2 | +0 | — |

## HTTP execution

Live preview + execute against the running API (`COMPOSITOR_V1_ENABLED` + `STEP_PLANNER_V1_ENABLED`).

| Fixture | Variant | Status | Job | planSignature | USD est. | Planner patches |
|---------|---------|--------|-----|---------------|----------|-----------------|
| explain-deeply / long / blog | minimal | done | f0c4b9ba-28db-4712-81ec-4b342375c9d4 | long-piece | 0.1441 | 2 (removeStep:research, removeStep:outline) |
| explain-deeply / long / blog | typical | done | e8c28bb9-20b2-41d7-a7d7-9f189254b47f | long-piece | 0.1326 | 2 (removeStep:research, removeStep:outline) |
| document-decision / medium / unspecified | heavy | done | 4385e746-7f0f-41a7-a684-16e584c9036b | edition-piece | 0.1536 | 1 (insertStep:structure:before:draft) |
| engage-audience / short / social | minimal | done | f9843969-2bc0-4a47-893e-35beb9be4669 | short-piece | 0.0474 | 1 (removeStep:hook) |
| share-idea / short / professional-network | minimal | skipped | — | — | — | — |
| share-idea / short / professional-network | typical | skipped | — | — | — | — |
| share-idea / short / professional-network | heavy | skipped | — | — | — | — |
| share-idea / medium / email | minimal | skipped | — | — | — | — |
| share-idea / medium / email | typical | skipped | — | — | — | — |
| share-idea / medium / email | heavy | skipped | — | — | — | — |
| explain-deeply / long / blog | heavy | skipped | — | — | — | — |
| document-decision / medium / unspecified | minimal | skipped | — | — | — | — |
| document-decision / medium / unspecified | typical | skipped | — | — | — | — |
| engage-audience / short / social | typical | skipped | — | — | — | — |
| engage-audience / short / social | heavy | skipped | — | — | — | — |
| tell-story / medium / unspecified | minimal | skipped | — | — | — | — |
| tell-story / medium / unspecified | typical | skipped | — | — | — | — |
| tell-story / medium / unspecified | heavy | skipped | — | — | — | — |

### USD by final planSignature

| planSignature | Runs | p50 USD | p90 USD |
|---------------|------|---------|---------|
| edition-piece | 1 | 0.1536 | 0.1536 |
| long-piece | 2 | 0.1326 | 0.1441 |
| short-piece | 1 | 0.0474 | 0.0474 |

## Repricing gate (one-pager)

Proceed with full repricing when either:

- ≥80% of runs keep the same `planSignature` after patches, **or**
- p90 USD within ±30% of bucket median for each `(planSignature, tier, balanced)`.

