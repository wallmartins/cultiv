# Step planner COGS variance report

Generated: 2026-06-19T21:38:39.230Z

## Summary

- Fixtures × variants: 18
- p50 absolute LLM step delta: 0
- p90 absolute LLM step delta: 0
- planSignature drift rate: 0.0%

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

## Optional HTTP execution

Skipped — dry-run only. Pass `--execute` when live calibration env is wired (future).

