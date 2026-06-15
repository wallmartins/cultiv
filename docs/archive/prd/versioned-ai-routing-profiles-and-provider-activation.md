---
title: PRD - Versioned AI Routing Profiles and Provider Activation
doc_type: prd
status: active
domain: ai-implementation
last_updated: 2026-05-26
---

# PRD: Versioned AI Routing Profiles and Provider Activation

## Problem Statement

The backend can already execute a **Generation Request** through a versioned
AI policy, but the current model still centers provider routing around
`fallbackProfile` and only supports a limited provider set. That makes the
system harder to evolve into a multi-provider runtime where operators can
introduce Gemini and DeepSeek, tune routing by LLM step, and activate a new
`policyVersion` in production without a deploy.

From the product perspective, users should continue to choose only **Content
Type** and **quality mode**. They should not see provider names, model names,
or operational routing controls. At the same time, devs and admins need a safe
operational mechanism to move future executions to a new versioned routing
policy when provider health, timeout behavior, cost fit, or quality evidence
changes.

The current shape is therefore insufficient in four ways:

- provider routing semantics are not explicit enough for long-term
  multi-provider governance
- Gemini and DeepSeek are not yet first-class native providers in the runtime
- the active `policyVersion` is not yet controlled through a persisted
  operational activation mechanism that works across multiple backend instances
- the project needs a clearer separation between automatic fallback for the
  current request and human-approved activation of a new `policyVersion` for
  future requests

## Solution

Introduce a first-class **Routing Profile** model inside the versioned **AI
Policy** and add a database-backed **Active AI Policy Pointer** that controls
which published `policyVersion` new previews and executions use.

The new product and operational behavior will be:

1. Users continue to submit a **Generation Request** using **Content Type**,
   briefing, and **quality mode** only.
2. The backend resolves the active `policyVersion` through the **Active AI
   Policy Pointer** before preview and execution.
3. The resolved policy chooses a **Routing Profile** per LLM **Step
   Execution**, based on internal product and pipeline rules that may depend on
   **Content Type** and **quality mode**.
4. Each **Routing Profile** defines preferred provider/model attempts, fallback
   attempts, and operational constraints such as timeout and retry/fallback
   behavior.
5. Gemini and DeepSeek become native provider-specific integrations in the same
   adapter and transport model as the existing providers.
6. If a provider fails during the current request, the runtime falls back
   automatically inside the same `policyVersion` and the same commercial
   promise.
7. If operators need to move future traffic away from a degrading provider,
   they activate a different published `policyVersion` through an internal API
   or routine, with human approval and auditability.
8. Multiple backend instances converge on the new active version through
   controlled runtime reload and short eventual consistency, while in-flight
   previews and executions remain pinned to the version they already resolved.

## User Stories

1. As a customer, I want to keep choosing only **Content Type** and **quality
   mode**, so that provider complexity stays invisible to me.
2. As a customer, I want the backend to use the best available provider/model
   path for my request, so that I receive the best result without configuring
   routing manually.
3. As a customer, I want the product to keep generating text even when one
   provider times out, so that transient provider failures do not block my
   request.
4. As a customer, I want fallback behavior to stay inside the same commercial
   promise, so that reliability does not silently change what I agreed to pay.
5. As a customer, I want preview and execution to stay aligned to the same
   `policyVersion`, so that confirmation remains trustworthy.
6. As a customer, I want stale preview detection to remain explicit when the
   active policy changes, so that I never confirm against outdated conditions.
7. As a customer, I want my in-flight execution not to change provider policy
   halfway through the run, so that results remain reproducible and auditable.
8. As a customer, I want **Sync Run** and **Async Run** to behave the same way
   with respect to routing and fallback, so that I can trust either execution
   path.
9. As a product team, we want users to remain on **Generation Request**
   semantics, so that provider routing remains an internal concern.
10. As a product team, we want provider choice to stay decoupled from plan UI,
    so that commercial packaging does not leak operational complexity.
11. As a product team, we want Gemini available as a native provider, so that
    we can evaluate it on equal footing with other providers.
12. As a product team, we want DeepSeek available as a native provider, so
    that we can compare cost and quality directly.
13. As a product team, we want the runtime to support multiple native providers
    behind the same execution boundary, so that provider experiments do not
    require route changes.
14. As a product team, we want **Routing Profile** to become the canonical
    routing concept, so that policy language matches what the runtime actually
    does.
15. As a product team, we want **Routing Profile** to be resolved per LLM
    step, so that drafting, refinement, critique, and validation can evolve
    independently.
16. As a product team, we want many LLM steps to be able to reuse the same
    **Routing Profile**, so that policy stays expressive without duplication.
17. As a product team, we want **Routing Profile** to include operational
    constraints, so that timeout and retry behavior is governed alongside
    provider choice.
18. As a product team, we want provider routing to vary by internal product and
    pipeline rules, so that different kinds of work can use different model
    paths.
19. As a product team, we want **quality mode** to continue shaping routing
    indirectly, so that product semantics stay stable while runtime tuning
    evolves.
20. As a product team, we want commercial pricing to remain separate from
    routing mechanics, so that provider swaps do not force pricing rewrites.
21. As an operator, I want a persisted **Active AI Policy Pointer**, so that I
    can activate a published policy without a deploy.
22. As an operator, I want the active pointer to live in the database, so that
    multiple instances can converge on the same operational state.
23. As an operator, I want activation to apply only to new previews and
    executions, so that requests already in flight remain stable.
24. As an operator, I want the system to recommend a new `policyVersion` when a
    provider is degrading, so that I can react quickly.
25. As an operator, I do not want the system to auto-activate a new policy on
    its own, so that high-impact routing changes remain human-governed.
26. As an operator, I want activation changes to record actor and timestamp, so
    that operational history is auditable.
27. As an operator, I want to list published policy versions, so that I can see
    which candidates are safe to activate.
28. As an operator, I want to inspect the currently active `policyVersion`, so
    that support and incident response have a single source of truth.
29. As an operator, I want backend instances to refresh their active policy in
    runtime, so that I do not need a rolling deploy for routing changes.
30. As an operator, I want short eventual consistency across instances, so that
    the system remains practical to operate without distributed invalidation
    infrastructure on day one.
31. As an operator, I want quote mismatch semantics to absorb policy propagation
    lag safely, so that stale preview/execution combinations fail clearly
    instead of drifting silently.
32. As an engineer, I want to retire `fallbackProfile` as the central routing
    concept, so that the code matches the domain model.
33. As an engineer, I want **Routing Profile** to be a deep module with a small
    interface, so that provider routing remains easy to test and evolve.
34. As an engineer, I want policy validation to fail at boot when routing
    profiles are invalid, so that production never starts with incoherent
    provider behavior.
35. As an engineer, I want each LLM step to point to an explicit routing
    profile, so that the runtime does not invent provider behavior implicitly.
36. As an engineer, I want the execution snapshot to include resolved routing
    attempts per LLM step, so that runtime execution stays deterministic.
37. As an engineer, I want timeout and retry/fallback rules versioned with the
    policy, so that operational behavior is reproducible later.
38. As an engineer, I want routing rules to be versioned artifacts published by
    PR, so that provider strategy changes stay reviewable.
39. As an engineer, I want the database to store only the active pointer, not
    mutable policy bodies, so that policy remains immutable once published.
40. As an engineer, I want Gemini request building and response normalization to
    live in provider-specific adapter code, so that API drift stays isolated.
41. As an engineer, I want DeepSeek request building and response normalization
    to live in provider-specific adapter code, so that provider support does
    not depend on compatibility assumptions.
42. As an engineer, I want all providers to report trace and telemetry through
    the same runtime contract, so that provider comparisons remain coherent.
43. As an engineer, I want provider-specific timeout and failure classes to be
    normalized into a shared fallback decision model, so that the runtime does
    not branch on route-specific behavior.
44. As an engineer, I want the internal activation API to stay separate from the
    public generation surface, so that customers cannot influence routing
    policy.
45. As an engineer, I want activation and reload logic to be testable in
    isolation, so that multi-instance behavior can be validated without full
    end-to-end environments.
46. As a support engineer, I want execution history and trace to show the
    selected provider/model path, so that I can explain degraded or recovered
    runs.
47. As a support engineer, I want to know which `policyVersion` was active for
    a preview and for an execution, so that customer issues can be diagnosed
    accurately.
48. As a finance stakeholder, I want provider swaps to remain separated from the
    **Pricing Envelope**, so that runtime contingency does not automatically
    change customer pricing.
49. As a governance stakeholder, I want policy activation to require human
    approval, so that significant routing changes are deliberate and
    accountable.
50. As a future maintainer, I want the routing model to be explicit enough to
    add more providers later, so that Gemini and DeepSeek are not special-case
    hacks.

## Implementation Decisions

- Replace `fallbackProfile` as the main routing concept with versioned
  **Routing Profile** definitions inside the **AI Policy**.
- Model **Routing Profile** as a policy-owned deep module whose stable
  interface exposes preferred attempts, fallback attempts, and operational
  constraints for one LLM step.
- Resolve **Routing Profile** per LLM **Step Execution**, not as one global
  route-level choice for the whole **Generation Request**.
- Allow internal product and pipeline rules to choose different routing
  profiles for different LLM steps, even when many steps initially reuse the
  same profile.
- Keep **quality mode** user-facing and product-owned, but let it participate
  indirectly in internal routing-profile resolution.
- Keep provider/model definitions concrete and explicit in policy rather than
  introducing an extra abstraction layer for capabilities at this stage.
- Extend routing policy attempts to include operational fields such as timeout
  and retry/fallback behavior so the profile is actionable in production.
- Add Gemini as a native provider-specific integration with its own request
  construction, response normalization, and transport handling.
- Add DeepSeek as a native provider-specific integration with its own request
  construction, response normalization, and transport handling.
- Preserve a shared adapter contract so all providers continue to flow through
  the same execution runtime boundary.
- Preserve the principle that only LLM steps call providers and local steps do
  not carry provider attempts.
- Keep automatic fallback inside the same `policyVersion` and inside the same
  commercial promise for the current request.
- Separate current-request resilience from future-request contingency:
  fallback solves the current execution, while policy activation affects only
  future previews and executions.
- Introduce a persisted **Active AI Policy Pointer** in the database as the
  authoritative source of which published `policyVersion` is active for new
  work.
- Keep AI policy artifacts immutable and versioned in source control; operators
  activate an already published version rather than editing policy contents in
  the database.
- Provide an internal activation path that can list published policy versions,
  read the active version, and activate a different version with actor and
  timestamp audit data.
- Keep operational activation human-approved even when observability suggests a
  provider degradation event.
- Support multiple backend instances by combining a persisted active pointer
  with controlled runtime reload and short eventual consistency instead of
  requiring immediate distributed invalidation.
- Preserve consistency inside each preview/execution flow by pinning the
  resolved `policyVersion` into preview state, quote semantics, and execution
  snapshot behavior.
- Continue using quote mismatch semantics as the safety boundary when previews
  and executions cross a policy activation change.
- Keep pricing resolution and provider routing as related but separate policy
  concerns: pricing stays commercial and customer-facing, routing stays
  internal and operational.
- Maintain telemetry and trace parity for all providers, including selected
  provider/model, ordered attempts, timeout/failure outcomes, and observed cost
  signals where available.
- Treat this as a deliberate internal rupture rather than a gradual
  compatibility layer because the product is not yet in production and the
  correct domain model should be established now.

## Testing Decisions

- Good tests verify external behavior, invariants, and stable contracts rather
  than private helper structure.
- Good tests for this work should focus on observable routing outcomes:
  selected `policyVersion`, selected **Routing Profile**, ordered provider/model
  attempts, fallback behavior, activation behavior, and preview/execution
  consistency.
- The **Routing Profile** policy module should be tested in isolation for
  schema validation, step-level resolution, timeout/retry/fallback rule
  shaping, and rejection of incoherent provider attempts.
- Provider-specific adapters should be tested in isolation for request shape,
  response normalization, typed provider errors, and rejection of unsafe or
  unsupported message scenarios.
- Backend provider transport should be tested for Gemini and DeepSeek using the
  same standards currently used for the existing providers: typed transport
  errors, provider-specific auth/config validation, and normalized failure
  behavior.
- Execution snapshot composition should be tested to ensure only LLM steps
  receive resolved routing attempts and that the selected `policyVersion`
  remains pinned through execution.
- Runtime fallback behavior should be tested in sync and async flows so that a
  failed preferred attempt falls through to the next allowed attempt inside the
  same `policyVersion`.
- Active policy pointer behavior should be tested for activation, read-back,
  audit metadata, reload semantics, and multi-instance eventual-consistency
  assumptions.
- Preview and execution orchestration should be tested for safe behavior across
  policy activation boundaries, including stale preview rejection and quote
  mismatch recovery.
- Prior art should come from existing adapter package tests, backend execution
  worker tests, backend quote/preview correlation tests, AI policy tests, and
  backend support infrastructure tests.

## Out of Scope

- Exposing provider or model choice to end users.
- Building a backoffice or UI for policy activation in this phase.
- Auto-activating a new `policyVersion` without human approval.
- Editing policy artifacts directly in the database.
- Reworking customer-facing pricing semantics beyond what is needed to keep
  routing compatible with the current **Pricing Envelope** model.
- Distributed push invalidation infrastructure for zero-latency policy
  propagation between instances.
- Generalized capability-based model abstraction above concrete provider/model
  pairs in this phase.

## Further Notes

- This PRD is constrained by the glossary in `CONTEXT.md`, especially
  **Generation Request**, **Routing Profile**, **Active AI Policy Pointer**,
  **Step Execution**, **Generation Preview**, **Pricing Envelope**, **Sync
  Run**, and **Async Run**.
- This PRD builds directly on ADR 0003 for billing/versioning semantics, ADR 0004 for provider routing and transport boundaries, and ADR 0006 for
  versioned routing profiles and active-policy activation.
- The highest-leverage deep modules in this work are the **Routing Profile**
  resolver, the active-policy activation service, and the provider-specific
  adapter boundary.
