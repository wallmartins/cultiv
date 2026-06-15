# ADR: Effect-TS Hardening Rules

## Status

Accepted

## Context

The monorepo is standardizing on Effect as the execution model for shared packages before backend, web, and mobile continue on top of them.

The main failure modes found during the audit were:

- untyped failures escaping through `throw`
- sync schema decodes in runtime code
- `Promise` contracts in packages that are supposed to compose through `Effect`
- helper-level runtime execution instead of deferring `runSync` / `runPromise` to entrypoints and tests

## Decision

Shared Effect packages must follow these rules:

1. Public fallible APIs return `Effect.Effect<A, E, R>`.
2. Error channel `E` uses discriminated tagged errors.
3. Runtime code uses `Schema.decodeUnknown`, not `Schema.decodeUnknownSync`.
4. IO boundaries use `Effect.try` or `Effect.tryPromise`.
5. `Effect.runSync` and `Effect.runPromise` are allowed only in:
   - application entrypoints
   - explicit tests
6. Layers own dependency wiring. Factories stay pure or return `Effect`.
7. Hidden state and import-time side effects are not allowed in shared packages.

## Package Notes

- `contracts`: exports effectful decoders and typed decode errors
- `client-sdk`: maps contract decode failures into SDK-specific tagged errors
- `ai-adapters`: request validation, provider lookup, and response normalization are effectful
- `database`: repository operations that can fail are effectful and typed
- `feature-flags`: registry validation and provider refresh are effectful
- `payments`: plan validation and credit consumption are effectful
- `skills`: loader, store, template execution, and declarative execution flow through `Effect`

## Consequences

- package APIs are more explicit and composable
- tests must execute effects directly instead of expecting thrown exceptions
- governance can block regressions with static checks
