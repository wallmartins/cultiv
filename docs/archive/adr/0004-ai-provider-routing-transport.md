# ADR 0004: AI Provider Routing and Transport

## Status

Accepted

## Context

The backend already has:

- a shared sync runtime
- async execution that reuses the same runtime
- billing policy versioning and credit reservation
- quality lanes that determine the execution envelope

What is still missing is the actual provider routing and transport strategy for
the AI runtime.

The current synthetic transport is useful for orchestration tests, but it does
not exercise real provider calls. That makes output debugging and model
comparisons weak.

We need a design that:

- stays model-agnostic at the product layer
- supports multiple providers over time
- keeps sync and async on the same execution path
- makes the resolved provider/model visible in traces and telemetry
- avoids hardcoding provider decisions in HTTP routes

## Decision

Provider routing is resolved in the backend runtime, not in HTTP routes and not
inside the transport adapter itself.

The architecture is:

1. `packages/payments` defines the commercial envelope:
   - plan tier
   - credit policy
   - `policyVersion`
   - allowed model/provider envelope

2. The backend resolves the runtime policy before generation starts:
   - active plan
   - active policy version
   - requested quality mode
   - selected provider/model for the run

3. `packages/ai-adapters` owns provider-specific transport implementations:
   - request building
   - response normalization
   - provider-specific fallback handling

4. `apps/backend/src/execution` remains the shared execution runtime for sync
   and async.

The synthetic transport is not the production transport. It may remain useful
for tests and local stubs, but production execution must reach a real provider
call.

## Alternatives considered

### Route-level provider selection

Rejected. It leaks product policy into transport concerns and makes traceability
harder.

### Provider selection inside the adapter only

Rejected. It hides policy from the runtime and makes the selected provider/model
harder to record before execution starts.

### Single provider only

Rejected. The product direction is model-agnostic and cost-aware. We need the
ability to vary providers and models by tier and quality mode.

## Consequences

Positive:

- provider/model choice is testable and auditable
- sync and async remain consistent
- the product can vary cost/quality by plan tier without changing routes
- provider swaps become a policy change, not a rewrite

Trade-offs:

- the runtime needs a policy resolution step before generation
- provider envelopes must be versioned and maintained
- the transport layer still needs provider-specific code for each supported API

## Related documents

- [AI Implementation Index](../indexes/ai-implementation-index.md)
- [AI Roadmap](../plans/ai-roadmap.md)
- [Billing Model Policy](../policies/billing-model-policy.md)
- [Billing Model Implementation Plan](../plans/billing-model-implementation-plan.md)
