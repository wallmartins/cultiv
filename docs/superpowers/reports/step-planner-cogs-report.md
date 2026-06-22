# Step planner COGS variance report

Generated: 2026-06-22T14:49:24.592Z

## Summary

- Fixtures × variants: 18
- p50 absolute LLM step delta: 0
- p90 absolute LLM step delta: 0
- planSignature drift rate: 0.0%
- HTTP runs: 17/18 done
- p50 USD (executed): 0.1065
- p90 USD (executed): 0.1442

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
| share-idea / short / professional-network | minimal | done | 41dc9923-03c1-4b8f-91bb-98e58dd5292f | short-piece | 0.0753 | 0 |
| share-idea / short / professional-network | typical | done | 072c4fde-f29b-42dd-b24c-7df55f81b4e1 | short-piece | 0.0726 | 0 |
| share-idea / short / professional-network | heavy | failed | 8cab9555-51fe-4ebf-9a73-0cbe37faadc8 | short-piece | — | — |
| share-idea / medium / email | minimal | done | 31d32fe4-d84b-4121-a4ba-eb3768a115ec | edition-piece | 0.1065 | 0 |
| share-idea / medium / email | typical | done | c0579dfd-72cb-42e4-8e82-901f4d873566 | edition-piece | 0.1080 | 0 |
| share-idea / medium / email | heavy | done | 324b18c0-d635-4335-adf0-c95ef5afb018 | edition-piece | 0.1068 | 0 |
| explain-deeply / long / blog | minimal | done | 93855306-e42a-4b9b-921e-62008a2a15ee | long-piece | 0.1359 | 2 (removeStep:research, removeStep:outline) |
| explain-deeply / long / blog | typical | done | a4dbf7cc-50ed-4a7b-9a1a-1e2a0d2b3b6c | long-piece | 0.1328 | 2 (removeStep:research, removeStep:outline) |
| explain-deeply / long / blog | heavy | done | f53bbcc4-e339-4f94-ae75-fb477af80732 | long-piece | 0.1288 | 0 |
| document-decision / medium / unspecified | minimal | done | 617be9f4-abcc-4069-b837-a908237b91a0 | edition-piece | 0.1371 | 0 |
| document-decision / medium / unspecified | typical | done | b7ba5416-d61c-4776-9837-c68d1e1365f1 | edition-piece | 0.1442 | 0 |
| document-decision / medium / unspecified | heavy | done | 74f7e93b-c0a1-4f4d-82c0-5632f4e49d64 | edition-piece | 0.1546 | 1 (insertStep:structure:before:draft) |
| engage-audience / short / social | minimal | done | fc67def0-1ddb-4e72-8884-64d7a50b7721 | short-piece | 0.0476 | 1 (removeStep:hook) |
| engage-audience / short / social | typical | done | c3674eaf-6d5c-450e-adb3-c88904a45671 | short-piece | 0.0754 | 0 |
| engage-audience / short / social | heavy | done | 9eaa4063-0074-4a5b-907e-3daf52af0325 | short-piece | 0.0639 | 0 |
| tell-story / medium / unspecified | minimal | done | 340d8477-a65a-4811-9cf8-bf068a6ebdb7 | serial-piece | 0.0708 | 0 |
| tell-story / medium / unspecified | typical | done | 97eaa376-85e1-479b-86a8-1b4cff20eae2 | serial-piece | 0.0724 | 0 |
| tell-story / medium / unspecified | heavy | done | 8506f26e-287b-4f33-8a75-db77c2166d71 | serial-piece | 0.0722 | 0 |

### USD by final planSignature

| planSignature | Runs | p50 USD | p90 USD |
|---------------|------|---------|---------|
| edition-piece | 6 | 0.1080 | 0.1546 |
| long-piece | 3 | 0.1328 | 0.1359 |
| serial-piece | 3 | 0.0722 | 0.0724 |
| short-piece | 5 | 0.0726 | 0.0754 |

### HTTP failures

- **share-idea-short-professional-network/heavy**: Quality lane "short-piece:lane:1" failed while generating execution candidates for pipeline "short-piece": Pipeline "short-piece" failed at step "refine": AIAdapterTransportError: Provider "gemini" returned HTTP 503: {
  "error": {
    "code": 503,
    "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
    "status": "UNAVAILABLE"
  }
}


## Repricing gate (one-pager)

Proceed with full repricing when either:

- ≥80% of runs keep the same `planSignature` after patches, **or**
- p90 USD within ±30% of bucket median for each `(planSignature, tier, balanced)`.

