---
title: Client SDK and Backend Cleanup Plan
doc_type: plan
status: active
domain: client-integration-surface
last_updated: 2026-06-03-refined
---

# Client SDK and Backend Cleanup Plan

## Purpose

This plan turns the `client-sdk` into the project's **Client Integration Surface**
for web and mobile while removing the legacy public generation routes that do not
fit the product-facing backend contract.

## Status summary

- The backend already exposes a product-oriented surface for preview, executions,
  content types, and voice flows.
- The current `client-sdk` still reflects a narrower legacy shape centered on
  `/api/pipelines` and `/api/jobs`.
- The target state is a framework-agnostic, versioned SDK that exposes product
  capabilities, owns authenticated backend consumption, fails fast on contract
  drift, and leaves frontend state ownership outside the SDK.

## Design decisions

- **Dual API (Effect primary, Promise helper):** All domain methods return `Effect.Effect<T, ClientSdkError, never>` for consumers who use Effect. A root helper `client.toPromise(effect)` is available for non-Effect consumers. The core remains framework-agnostic.
- **Auto-generated idempotency keys:** The SDK generates `idempotencyKey` automatically for every mutating request (`POST`, `PUT`, `PATCH`). Consumers never see or pass this field. This makes retry of mutating requests safe by default.
- **AbortSignal support:** Every `Named Method Input` accepts an optional `signal?: AbortSignal`. This lets frontend frameworks cancel requests when a component unmounts or a user navigates away.
- **Differentiated retry policy:** `GET` requests retry up to 3 times on `429` and `5xx`. `POST/PUT/PATCH` retry up to 2 times only on `429`, `503`, and `504` (safer for mutating requests with auto-generated idempotency keys).
- **Execution Watch resilience:** SSE is the primary observation path. If SSE fails, the SDK falls back to HTTP polling with a 5-second interval. Bounded rules: max 5 SSE reconnect attempts, max 12 polling failures, total observation timeout of 10 minutes. After exhaustion, `onObservationFailure` is called with a typed error.
- **Flat Domain Methods:** No nested method trees. Each subclient exposes primary capabilities at the first level (e.g., `client.executions.create`, not `client.executions.runs.create`).

## Checkpoints

### Checkpoint 1: Freeze the product client boundary

Goal:
- make the product-facing backend surface the only public contract for frontend clients
- keep legacy pipeline/job routes out of the new SDK boundary

Dependencies:
- `docs/archive/adr/0028-client-sdk-as-client-integration-surface.md`

Success criteria:
- the canonical surface is limited to preview, content types, executions, execution events, and voice routes
- `/api/pipelines` and `/api/jobs` are marked as legacy and excluded from the SDK design
- docs and code use product capability language instead of route-first language

Related docs:
- `docs/archive/adr/0026-typescript-native-client-sdk-as-primary-consumer.md`
- `docs/archive/adr/0028-client-sdk-as-client-integration-surface.md`
- `docs/archive/api/backend-api.md`

### Checkpoint 2: Complete contracts for the product client surface

Goal:
- make `@my-ai-orchestrator/contracts` the full typed source of truth for the client-facing backend surface
- cover request, response, and execution watch event shapes explicitly

Dependencies:
- Checkpoint 1

Success criteria:
- preview, content types, executions, execution events, voice profile, voice examples, and batch flows have schemas and decoders
- contract tests cover valid and invalid payloads for each product-facing endpoint
- execution watch event shapes are explicit instead of implied by backend internals

Related docs:
- `docs/archive/api/backend-api.md`
- `CONTEXT.md`

### Checkpoint 3: Redesign the SDK around product capabilities

Goal:
- replace the legacy pipeline/job-oriented SDK surface with domain-oriented modules
- keep the SDK framework-agnostic and transport-aware without becoming a UI state container

Dependencies:
- Checkpoint 2

Success criteria:
- the SDK public API is organized around `preview`, `contentTypes`, `executions`, `voice`, `transport`, and `errors`
- no public SDK capability is named after legacy pipeline/job routes
- the SDK core has no dependency on Next.js, React-specific adapters, or UI cache libraries

Related docs:
- `docs/archive/adr/0028-client-sdk-as-client-integration-surface.md`
- `CONTEXT.md`

### Checkpoint 4: Harden authenticated transport and fail-fast contract handling

Goal:
- keep the SDK as an authenticated consumer of the backend surface
- enforce explicit typed failures when contract drift occurs

Dependencies:
- Checkpoint 3

Success criteria:
- token acquisition remains injected from platform identity integrations
- the SDK does not own signup, signin, redirect, or session-establishment flows
- transport, decode, and HTTP status errors are typed and surfaced explicitly
- contract mismatches fail fast instead of degrading silently

Related docs:
- `docs/archive/adr/0021-auth0-owns-signup-and-signin-backend-owns-domain-onboarding.md`
- `docs/archive/adr/0028-client-sdk-as-client-integration-surface.md`

### Checkpoint 5: Make executions the primary generation capability

Goal:
- make async and sync generation observable through product execution capabilities only
- support reattachment and lifecycle tracking through canonical execution identity

Dependencies:
- Checkpoints 2-4

Success criteria:
- the SDK exposes `executions.create`, `executions.list`, `executions.get`, `executions.watch`, and `executions.resume`
- `executions.create` is always async and returns a `QueuedExecutionView`; the SDK auto-generates `idempotencyKey` for safe retry
- `executionId` is the canonical identity for retrieval, observation, and resume
- the flow "run -> leave screen -> return -> continue watching -> open result" works without frontend-owned transport logic

Related docs:
- `CONTEXT.md`
- `docs/archive/api/backend-api.md`

### Checkpoint 6: Implement execution watch and resilience

Goal:
- provide a product-level execution observation capability
- hide SSE, reconnect, retry, and polling fallback from consuming applications

Dependencies:
- Checkpoint 5

Success criteria:
- `Execution Watch` emits typed transitions such as started, progressed, completed, and failed
- the SDK uses SSE as the preferred path and polling as bounded fallback
- reconnect and retry remain inside the SDK until observation must fail explicitly
- active-session completion can drive frontend completion notifications without a separate notification domain

Related docs:
- `docs/archive/api/backend-api.md`
- `CONTEXT.md`

### Checkpoint 7: Cover content types, preview, and voice end to end

Goal:
- make the SDK sufficient to build the initial generation and voice-management flows for web and mobile
- keep route semantics hidden behind product capabilities

Dependencies:
- Checkpoints 2-4

Success criteria:
- the SDK exposes `contentTypes.list`
- the SDK exposes `preview.get`
- the SDK exposes voice profile, voice example, and voice batch capabilities
- a frontend can implement onboarding and generation without direct backend HTTP calls

Related docs:
- `docs/archive/api/backend-api.md`
- `CONTEXT.md`

### Checkpoint 8: Add governance against direct backend access from apps

Goal:
- make the SDK boundary enforceable rather than advisory
- prevent `apps/web` and `apps/mobile` from bypassing the client integration surface

Dependencies:
- Checkpoints 3-7

Success criteria:
- repository governance tests or lint rules fail if frontend apps call backend routes directly
- approved frontend integrations flow through the SDK only
- examples and tests demonstrate the intended consumption pattern

Related docs:
- `docs/archive/adr/0028-client-sdk-as-client-integration-surface.md`
- `tests/governance`

### Checkpoint 9: Remove legacy public generation routes and dead code

Goal:
- eliminate the old public route language once the product SDK surface is complete
- reduce ambiguity between execution language and job/pipeline legacy language

Dependencies:
- Checkpoints 2-8

Success criteria:
- `/api/pipelines` and `/api/jobs` are no longer part of the product-facing backend surface
- the SDK contains no first-class pipeline/job capabilities
- legacy public tests and compatibility code tied only to those routes are removed or rewritten

Related docs:
- `docs/archive/adr/0028-client-sdk-as-client-integration-surface.md`
- `docs/archive/api/backend-api.md`

### Checkpoint 10: Publish reference usage and refresh live docs

Goal:
- make the new boundary easy to adopt in future web and mobile clients
- keep implementation and documentation aligned

Dependencies:
- Checkpoints 1-9

Success criteria:
- docs describe the SDK as the client integration surface and the backend as the public API surface
- example consumers show framework-agnostic usage patterns that can later be wrapped by TanStack or similar tools
- outdated auth ownership guidance is superseded or updated to match ADR 0028

Related docs:
- `docs/archive/adr/0005-auth-in-client-sdk.md`
- `docs/archive/adr/0028-client-sdk-as-client-integration-surface.md`
- `docs/archive/api/backend-api.md`

## Execution order

1. Freeze the product client boundary
2. Complete contracts for the product client surface
3. Redesign the SDK around product capabilities
4. Harden authenticated transport and fail-fast contract handling
5. Make executions the primary generation capability
6. Implement execution watch and resilience
7. Cover content types, preview, and voice end to end
8. Add governance against direct backend access from apps
9. Remove legacy public generation routes and dead code
10. Publish reference usage and refresh live docs
