---
name: effectts
description: Effect-TS core rules (concise). For examples, use MCP Context7 or @references.
---

# Effect-TS – Regras Essenciais

## Core
- `Effect<A,E,R>` – never erase error channel
- Prefer `Effect.gen` for sequential logic; `pipe` for transformations
- Errors: `Data.TaggedError` (never generic `Error`)
- Services: `Context.Tag` + `Layer`
- Resources: `Effect.acquireRelease`
- Never `throw` inside `Effect.gen` (use `Effect.fail` / `Effect.try`)

## Patterns
- `yield*` extracts value and propagates error
- `catchTag` / `catchTags` for typed errors
- `Effect.runPromise` only at entry point

## Anti-patterns
- `Effect.promise` without error handling → use `Effect.tryPromise`
- Global service instances → use `Layer` + `Context.Tag`
- `catchAll` that silences errors → use specific `catchTag` or `orElse`
- `Schema.parse` (throws) → `Schema.decodeUnknown` returning `Effect`

## Quick Checklist
- [ ] Errors are `Data.TaggedError`
- [ ] Dependencies are `Context.Tag` services
- [ ] Resources use `acquireRelease`
- [ ] No `throw` in `Effect.gen`
- [ ] `Effect.run*` only in entry point or explicit tests

> For examples: use MCP Context7 or ask to load `@references/effect-core.md`