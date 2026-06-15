---
title: PRD - AI Policy, Generation Preview, and Real LLM Execution
doc_type: prd
status: active
domain: ai-implementation
last_updated: 2026-05-16
---

# PRD: AI Policy, Generation Preview, and Real LLM Execution

## Problem Statement

The current AI generation flow does not reliably call a real LLM when it
should. Both **Sync Run** and **Async Run** share the same **Runtime Base**,
but the backend still uses a synthetic transport in the execution path. That
means the system can orchestrate steps and traces, but it does not yet produce
the real text generation behavior the product needs.

At the same time, the public generation surface is still too close to internal
pipeline structure. The product direction is that clients should submit a
**Generation Request**, not define **Pipelines** or arbitrary steps. The
product also needs fixed commercial pricing that is transparent to the client,
legally safe for billing, and stable across retries, early exits, and provider
fallbacks.

The current state creates multiple product and engineering problems:

- the application cannot reliably generate the real text outputs expected from
  production LLM execution
- public clients are too close to internal orchestration concerns
- billing is not yet fully aligned with fixed commercial **Pricing Envelope**
  behavior by **plan tier**, **quality mode**, and **Content Type**
- there is no canonical **Generation Preview** flow that explains cost,
  recommendation, allowed options, and projected credit impact before
  generation
- provider/model routing, fallback, and per-step **Step Execution** rules are
  not yet governed by a single versioned AI policy capability

From the user's perspective, they need a generation product that:

- actually calls the LLM when text should be generated or transformed
- gives transparent credit pricing before generation
- lets them choose a **Content Type** and **quality mode** without seeing
  internal pipeline details
- preserves consistent billing and legal auditability when plans or policies
  change
- keeps **Sync Run** and **Async Run** behavior aligned

## Solution

Introduce a first-class **AI Policy** capability in the backend product layer
that resolves a versioned execution and pricing snapshot before generation,
drives a public **Generation Preview** flow, and supplies execution with an
immutable resolved policy snapshot.

The product-facing flow will be:

1. The client submits a **Generation Request** centered on **Content Type**,
   briefing, voice-related inputs, and desired **quality mode**.
2. The backend product layer resolves entitlement, current balance, allowed
   options, fixed commercial price, recommendation, and a deterministic
   `quoteId`.
3. The client confirms generation using the previewed combination.
4. The backend validates entitlement again, resolves the same **Pricing
   Snapshot**, compares the incoming `quoteId` when present, and fails clearly
   if the commercial snapshot diverged.
5. The backend product layer resolves an immutable AI policy snapshot and
   passes it to internal execution.
6. The shared runtime executes the internal **Pipeline**, calling real provider
   transport only for steps whose **Step Execution** is `llm`.
7. **Sync Run** and **Async Run** preserve the same execution policy and
   provider routing behavior.

This solution keeps public product behavior simple while giving the backend the
control it needs over policy versioning, **Pricing Envelope** resolution,
provider/model routing, fallback chains, recommendation heuristics, and audit
traceability.

## User Stories

1. As a customer, I want to choose a **Content Type**, so that I can request
   the kind of text I actually need without understanding internal pipeline
   details.
2. As a customer, I want to choose a **quality mode**, so that I can trade off
   speed, quality, and credit usage intentionally.
3. As a customer, I want to see the credit price before generation, so that I
   know what the request will cost me.
4. As a customer, I want to see my projected credit balance after generation,
   so that I can decide whether to proceed without doing my own math.
5. As a customer, I want blocked **quality modes** to appear as unavailable
   with a clear upgrade path, so that I understand my current plan limits.
6. As a customer, I want blocked **Content Types** to appear as unavailable
   with a clear reason, so that the product feels transparent rather than
   broken.
7. As a customer, I want a recommendation for which **quality mode** to use,
   so that I can choose confidently without guessing.
8. As a customer, I want that recommendation to stay within the options my plan
   already allows, so that I do not feel manipulated toward an upgrade.
9. As a customer, I want to ignore the recommendation and choose another valid
   option, so that I remain in control.
10. As a customer, I want the system to explain the recommendation briefly, so
    that it feels grounded in my request rather than arbitrary.
11. As a customer, I want the system to generate real text from the LLM, so
    that I receive usable output instead of synthetic placeholders.
12. As a customer, I want the generated text to reflect my **Voice Profile**,
    so that the output sounds like me or my brand.
13. As a customer, I want the product to honor my **Voice Example** inputs, so
    that generation quality improves with the writing context I provide.
14. As a customer, I want the same request to behave consistently in sync and
    async paths, so that I can trust the product regardless of execution mode.
15. As a customer, I want pricing to stay stable once I confirm generation, so
    that I am not surprised by a different charge.
16. As a customer, I want the product to ask for confirmation again if the
    preview became stale, so that I am not charged under changed conditions.
17. As a customer, I want the product to fail clearly when a stale quote no
    longer matches, so that I understand I need a fresh preview.
18. As a customer, I want the product not to expose internal **Pipeline** or
    step names, so that the interface stays simple and product-oriented.
19. As a customer, I want my plan's historical pricing to remain honored after
    policy changes, so that I am not repriced unexpectedly.
20. As a customer on an older plan, I want my frozen **Billing Policy Version**
    to remain respected while supported, so that my billing remains legally and
    commercially consistent.
21. As a customer, I want the system to charge a fixed commercial price per
    generation, so that I can predict my credit usage.
22. As a customer, I want that fixed commercial price to depend on the type and
    rigor of the output, so that short and long workflows are priced fairly.
23. As a customer, I want the product not to expose token pricing mechanics, so
    that pricing remains understandable.
24. As a product team, we want the public API to accept **Generation
    Requests** instead of explicit pipelines, so that the surface stays stable
    as internal orchestration evolves.
25. As a product team, we want **Generation Preview** to be a first-class flow,
    so that clients can build transparent generation UX.
26. As a product team, we want the backend to own recommendation logic, so that
    web and mobile do not drift.
27. As a product team, we want recommendation reason codes and explanations, so
    that we can evolve the UX without re-deriving business logic in clients.
28. As a product team, we want preview and execution to share the same pricing
    logic, so that cost transparency and billing correctness stay aligned.
29. As a product team, we want deterministic `quoteId` generation, so that we
    can correlate preview and execution without persistent preview state.
30. As a product team, we want quote mismatch to trigger a fresh preview flow,
    so that commercial integrity remains explicit.
31. As a product team, we want `planTier` to govern availability while AI
    policy governs pricing and execution details, so that entitlement and AI
    policy do not collapse into one module.
32. As a product team, we want **Content Type** to be explicit in the public
    product model, so that pricing and expectations are clear.
33. As a product team, we want internal **Pipeline** resolution to stay hidden,
    so that we can change step composition without breaking clients.
34. As a product team, we want **Step Execution** to be explicit per step, so
    that only the right steps call a provider.
35. As a product team, we want local steps to prepare context or post-process
    outputs without triggering providers, so that we reduce unnecessary cost.
36. As a product team, we want `analyze` to be local by default, so that we do
    not accidentally spend credits on interpretation where heuristics are
    sufficient.
37. As a product team, we want documented exceptions for `analyze = llm`, so
    that expensive behavior is intentional and auditable.
38. As a product team, we want structured local-to-LLM overrides, so that we
    can govern exceptions consistently.
39. As a product team, we want versioned AI policy files, so that policy
    evolution is reviewable and reproducible.
40. As a product team, we want a single canonical manifest per policy version,
    so that policy loading and validation stay deterministic.
41. As a product team, we want official and experimental policy catalogs
    separated, so that experimentation cannot leak accidentally into public
    behavior.
42. As a product team, we want experimental generations to use simulated
    credits by default, so that exploration does not contaminate commercial
    billing.
43. As a product team, we want experimental runs to capture internal cost and
    provider telemetry, so that we can evaluate whether a model is operationally
    viable.
44. As a product team, we want promotion from experimental to official policy
    to require evidence of quality, cost fit, fallback safety, and traceability,
    so that official policy remains defensible.
45. As an engineer, I want a dedicated `AIPolicyService`, so that pricing,
    routing, and fallback rules are centralized in a deep module.
46. As an engineer, I want the AI policy module to follow Effect idioms, so
    that errors, validation, and dependency injection remain explicit and
    composable.
47. As an engineer, I want declarative policy files validated at boot, so that
    configuration failures surface early.
48. As an engineer, I want boot to fail hard on invalid official policy, so
    that the app never starts in a commercially inconsistent state.
49. As an engineer, I want `AIPolicyService` to resolve a stable execution
    snapshot, so that runtime execution does not recompute policy repeatedly.
50. As an engineer, I want the snapshot to include ordered provider/model
    attempts for LLM steps, so that fallback behavior is auditable and
    reproducible.
51. As an engineer, I want the snapshot to include internal estimated cost by
    step, so that operational tuning has a planning baseline.
52. As an engineer, I want trace data to include observed provider cost by
    step, so that we can compare planned versus real cost.
53. As an engineer, I want only LLM steps to carry preferred plans, so that
    snapshot noise stays low.
54. As an engineer, I want execution to receive an immutable resolved snapshot
    from product, so that product policy and runtime concerns stay separated.
55. As an engineer, I want execution to perform minimal defensive validation on
    the incoming snapshot, so that integration bugs are caught without
    duplicating product authority.
56. As an engineer, I want execution integrity errors to be separate from AI
    policy repository errors, so that failures remain semantically clear.
57. As an engineer, I want the shared runtime to reach real provider transport,
    so that output debugging and provider comparison become meaningful.
58. As an engineer, I want **Sync Run** and **Async Run** to reuse the same
    routing and provider transport path, so that parity stays high.
59. As an engineer, I want fallback chains to stay within the same **Pricing
    Envelope**, so that runtime resilience does not silently change the
    commercial promise.
60. As an engineer, I want controlled model downgrade within explicit fallback
    order, so that we preserve availability while keeping routing auditable.
61. As an engineer, I want fallback order to be defined by step name with
    optional pipeline overrides, so that policy stays reusable without
    exploding in duplication.
62. As an engineer, I want quote mismatch behavior to be explicit in the public
    contract, so that the SDK can recover deterministically.
63. As an engineer, I want the SDK to refresh preview automatically but still
    require user confirmation, so that commercial changes are never auto-accepted.
64. As an engineer, I want public routes to live in product orchestration, so
    that execution remains an internal runtime boundary.
65. As an engineer, I want internal explicit pipeline execution preserved for
    tests, debug, and controlled exploration, so that we can develop and tune
    flows without exposing that surface publicly.
66. As an engineer, I want internal explicit pipeline execution to be guarded by
    role, environment, and feature flag, so that production safety is preserved.
67. As an operator, I want version lifecycle states that distinguish active
    policy from supported legacy policy, so that contract honoring and rollout
    management are unambiguous.
68. As an operator, I want one active version per environment and multiple
    loadable legacy versions, so that new runs are consistent while old
    contracts remain replayable.
69. As an operator, I want quote, recommendation, and final execution choice
    correlated in telemetry, so that we can tune the preview and recommendation
    model with real data.
70. As an operator, I want internal cost visibility by step and model, so that
    we can identify unprofitable routing or fallback choices.
71. As a support team member, I want deterministic quote correlation, so that I
    can explain to a customer what was shown and what was charged.
72. As a support team member, I want public failures on stale quotes to be
    explicit rather than silent, so that billing disputes are easier to resolve.
73. As a legal or finance stakeholder, I want frozen policy versions to remain
    honored for existing customers, so that pricing commitments stay defensible.

## Implementation Decisions

- Build a dedicated **AI Policy** capability in the backend product layer as a
  deep module with a simple public interface and strong internal responsibility
  boundaries.
- Model the AI policy capability as a canonical Effect service using
  `Context.Tag`, `Schema`, typed domain errors, and boot-time validation.
- Keep public clients on **Generation Request** semantics and remove explicit
  **Pipeline** control from the public surface.
- Preserve explicit pipeline execution only for internal tests, debug, and
  controlled experimentation.
- Treat **Pipeline** resolution as an internal backend product concern derived
  from **Content Type** and catalog policy.
- Introduce a public **Generation Preview** operation that composes
  entitlement, balance, **Pricing Snapshot** resolution, and recommendation.
- Keep **Generation Preview** as an orchestrated product read model rather than
  a new central domain capability.
- Make preview informative only. It must never reserve credits.
- Reserve credits only at execution start.
- Use fixed commercial pricing per generation, governed by a versioned
  **Pricing Envelope**.
- Compute fixed commercial price by `planTier + qualityMode + contentType or
  internal pipeline`.
- Keep customer-facing billing fixed even when runtime uses early exit,
  retries, candidate selection, or fallback.
- Continue using billing or product state as the canonical owner of which
  **Billing Policy Version** is frozen for a given customer.
- Make the AI policy capability consume a resolved policy version rather than
  deciding contractual attachment itself.
- Store official AI policy as declarative versioned files rather than
  TypeScript logic.
- Organize official policy as one folder per version with a canonical
  `manifest.json` that references separated files for pricing, step rules,
  fallback profiles, and pipeline overrides.
- Separate official and experimental catalogs physically and semantically.
- Use policy lifecycle states `draft`, `active`, `legacy-supported`, and
  `retired`.
- Allow exactly one active official policy per environment for new executions.
- Keep multiple historical policy versions loadable for replay and customers
  frozen to earlier contracts.
- Resolve a composed immutable execution snapshot before generation starts.
- Include in that snapshot: policy version, plan tier, resolved commercial
  price, allowed **Step Execution** rules, LLM-only preferred ordered attempts,
  and internal estimated step costs.
- Limit ordered provider/model plans to steps whose **Step Execution** is
  `llm`.
- Keep step-level provider choice inside the ordered resolved plan rather than
  recomputing policy at runtime.
- Make **Step Execution** explicit in `step.config.execution`.
- Support two explicit execution values: `local` and `llm`.
- Allow local steps to prepare prompt context and post-process data, but forbid
  them from calling a provider.
- Make `analyze` local by default.
- Allow `analyze = llm` only through explicit pipeline override when semantic
  extraction, routing-sensitive interpretation, quality evidence, and pricing
  support justify the exception.
- Model local-to-LLM overrides as a structured step policy block with stable
  reason codes, justification, allowed quality modes, and fallback profile.
- Require `pipelineOverrideId` for any local-to-LLM exception and format it as
  `pipeline:step:reason`.
- Make provider fallback automatic only within the same **Pricing Envelope**.
- Allow controlled model downgrade inside an explicit ordered fallback chain.
- Define fallback order by reusable step name with optional pipeline-specific
  overrides.
- Keep public generation orchestration inside the product layer and treat
  execution as an internal runtime.
- Make product responsible for request normalization, entitlement checks, quote
  consistency, policy resolution, preview orchestration, and debug/staff guards.
- Pass execution an immutable resolved snapshot rather than asking execution to
  call the AI policy capability directly.
- Allow execution to enforce only structural and operational invariants on that
  snapshot.
- Keep execution integrity errors separate from AI policy repository or
  validation errors.
- Share the same canonical pricing logic between **Generation Preview** and
  execution.
- Generate a deterministic hash-based `quoteId` from the commercial
  **Pricing Snapshot** rather than from the full internal routing plan.
- Limit `quoteId` inputs to the customer-facing commercial promise, including
  policy version, plan tier, **Content Type**, **quality mode**, and fixed
  credit price.
- Exclude operational noise such as timestamps, fallback chains, or internal
  estimated costs from `quoteId`.
- Accept `quoteId` as optional in public execution requests, but have the SDK
  send it by default whenever a preview happened.
- Recalculate the commercial snapshot at execution time and fail the public
  request if any commercial field diverges from the provided `quoteId`.
- Return a specific public error that instructs the client to refresh preview
  instead of silently accepting a changed commercial snapshot.
- Keep the execution endpoint from inlining a replacement preview.
- Let the client SDK handle the technical recovery of refreshing preview, but
  require the UI or user to confirm the new preview before re-execution.
- Keep recommendation logic in the backend rather than the SDK or client UI.
- Start recommendation with deterministic structural heuristics rather than a
  pre-preview LLM call.
- Base recommendation heuristics on **Content Type**, briefing length,
  constraint count, output shape, voice context availability, and known
  pipeline complexity.
- Return recommendation reason codes and a short explanation in preview.
- Restrict recommendations to options already allowed by entitlement.
- Treat divergence between recommended and chosen **quality mode** as
  analytical signal only, never as a blocker.
- Record recommendation at preview time and divergence at execution time for
  later tuning.
- Keep experimental execution gated by role, environment, and feature flag.
- Default experimental execution to simulated credits, while still recording
  internal estimated and observed costs.
- Require quality evidence, pricing fit, fallback validation, traceability, and
  explicit PR approval before promoting experimental policy into official
  policy.
- Replace the synthetic runtime transport with real provider transport while
  preserving the shared **Runtime Base** between **Sync Run** and **Async Run**.

## Testing Decisions

- Good tests must verify external behavior and stable contracts, not internal
  implementation details or incidental helper structure.
- Good tests for this work should assert:
  pricing correctness, quote consistency, policy validation outcomes, allowed
  versus blocked combinations, execution parity between **Sync Run** and
  **Async Run**, and provider routing behavior as seen from public or module
  contracts.
- The **AI Policy** capability should be tested in isolation as a deep module,
  covering declarative file loading, schema validation, version lifecycle, step
  execution resolution, pricing resolution, fallback plan composition, and
  snapshot composition.
- The product-layer **Generation Preview** orchestration should be tested for
  allowed options, blocked options, fixed credit pricing, projected balance,
  deterministic `quoteId`, recommendation payload, and recommendation staying
  within entitlement.
- Public generation orchestration should be tested for quote mismatch handling,
  stale preview recovery semantics, execution command shaping, and rejection of
  invalid or stale commercial snapshots.
- Internal execution should be tested for defensive validation of resolved
  snapshots, use of real provider transport only on `llm` steps, and parity
  between **Sync Run** and **Async Run**.
- Experimental execution should be tested for access control, simulated credit
  behavior, telemetry capture, and separation from official policy.
- Billing and entitlement integration should be tested for frozen policy
  behavior, fixed commercial pricing by **Pricing Envelope**, and legal safety
  of supported legacy versions.
- Telemetry and trace behavior should be tested for correlation among preview
  recommendation, `quoteId`, chosen **quality mode**, provider/model selection,
  and observed internal cost.
- Prior art for these tests should come from existing backend product tests,
  backend app execution tests, parity tests between sync and async execution,
  and current billing or routing tests already present in the monorepo.

## Out of Scope

- Exposing explicit **Pipeline** authoring or arbitrary step configuration to
  public web, mobile, or SDK consumers.
- Making the SDK or UI the source of truth for pricing, recommendation, or
  entitlement rules.
- Dynamic database-backed AI policy authoring in this cycle.
- Partial commercial refunds based on early exit or lower-than-expected runtime
  cost.
- Token-based customer billing.
- Degraded startup that allows the application to run with invalid official AI
  policy.
- Automatic re-execution after quote mismatch without renewed user
  confirmation.
- Promoting experimental policy automatically based only on runtime metrics.
- Reworking broader legacy or historical documentation outside the active AI
  implementation surface beyond what is required to keep live docs aligned.

## Further Notes

- This PRD assumes the project glossary in `CONTEXT.md` is canonical, including
  **Generation Request**, **Pricing Envelope**, **Step Execution**, **Sync
  Run**, **Async Run**, and **Runtime Base**.
- This PRD also assumes the active architectural direction captured in the live
  AI policy operational document and provider routing ADR remains in force.
- The deepest module in this work should be the **AI Policy** capability:
  simple interface, heavy internal responsibility, boot validation, and
  isolated testability.
- The implementation should preserve the principle that public product behavior
  is owned by the product layer and runtime behavior is owned by execution,
  with a resolved immutable snapshot crossing the boundary.
