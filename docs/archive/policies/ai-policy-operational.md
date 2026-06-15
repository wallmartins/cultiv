---
title: AI Policy Operational Design
doc_type: policy
status: active
domain: ai-implementation
last_updated: 2026-05-16
---

# AI Policy Operational Design

## Purpose

Define the operational policy model for AI generation after the shift to:

- public product-oriented generation requests
- internal pipeline resolution only
- fixed commercial pricing by versioned policy
- explicit per-step LLM execution rules
- shared sync/async runtime with real provider transport

This document is the working operational policy for the current AI
implementation.

## Canonical decisions

### 1. Public surface is product-oriented

Public clients do not send pipelines or steps.

Public generation is expressed as a product request containing at least:

- content type
- briefing/input
- voice-related inputs
- quality mode
- quote identifier when available

The backend resolves the internal pipeline from product rules and catalog
policy.

`ExplicitPipelineRequest` remains an internal-only path for tests, debug, and
controlled experimentation.

### 2. Pipeline is internal and policy-governed

Pipelines and steps are internal product assets.

- unknown steps must be rejected against the active policy catalog
- public clients must never be able to define arbitrary steps
- experimental pipelines may exist, but only in a separate experimental catalog

### 3. Step execution is explicit

Each step declares execution behavior in `step.config.execution`:

- `local`
- `llm`

`local` means the step may prepare context, transform data, or post-process
results, but may not trigger a provider call.

`llm` means the step uses provider/model routing and fallback defined by AI
policy.

### 4. Local-to-LLM exceptions are structured

When a step that is usually local is allowed to run through an LLM, the step
must carry a structured policy block in `step.config`.

Recommended shape:

```ts
{
  execution: "local" | "llm",
  llmPolicy?: {
    pipelineOverrideId: string,
    reasonCode:
      | "semantic_extraction"
      | "routing_sensitive_interpretation"
      | "quality_validated_exception",
    justification: string,
    allowedQualityModes?: ("fast" | "balanced" | "strict")[],
    fallbackProfile?: string
  }
}
```

Rules:

- `pipelineOverrideId` is mandatory for any local-to-LLM exception
- `pipelineOverrideId` format is `pipeline:step:reason`
- the exception must also be summarized in live docs

### 5. Analyze is local by default

`analyze` is local by default and may become `llm` only by explicit pipeline
override.

An override is allowed only when at least one condition is true:

1. the briefing is long or ambiguous free text and needs semantic extraction
2. the interpretation materially changes downstream routing or generation
3. quality testing showed measurable gain over local analysis
4. the extra cost is already accounted for by the pricing envelope

### 6. AI Policy is a product capability

AI policy is a distinct product capability and should live in the backend
product layer, not in the generic orchestrator layer.

It should be implemented as an Effect service:

- `AIPolicyService` via `Context.Tag`
- declarative file loading validated by `Schema`
- typed domain errors via `Data.TaggedError`
- Layer-based boot validation that fails fast on invalid policy

### 7. AI Policy has separated responsibilities

`AIPolicyService` should expose separated APIs and one composed resolver.

Expected split:

- pricing resolution
- step execution rule resolution
- preferred provider/model plan resolution
- fallback profile resolution
- execution snapshot composition

The main high-level output is a resolved execution snapshot.

### 8. Snapshot model

Product resolves an immutable policy snapshot before execution.

The snapshot contains stable run-level decisions, including:

- policy version
- plan tier
- pricing envelope
- resolved commercial price
- allowed step execution rules
- LLM-only preferred ordered attempts by step
- internal estimated cost by step

Step-level provider choice may still be finalized at execution time, but only
inside the ordered preferred plan already resolved by the snapshot.

### 9. Pricing is fixed commercially

Commercial pricing is fixed per generation, not token-priced to the customer.

The fixed commercial price is determined by:

- `planTier`
- `qualityMode`
- `contentType` or internal pipeline

The runtime may spend less internally via early exit, but customer billing does
not partially refund unused headroom in this cycle.

### 10. Policy version is the legal anchor

One `policyVersion` governs pricing, routing, overrides, and fallback in this
cycle.

The client's frozen policy version is resolved by billing/product state.
`AIPolicyService` consumes that version; it does not decide contractual
attachment.

Policy lifecycle:

- `draft`
- `active`
- `legacy-supported`
- `retired`

Rules:

- one active version per environment for new executions
- multiple versions may remain loadable for replay and existing customers
- `legacy-supported` versions remain valid for customers already frozen to them

### 11. Policy files are declarative and versioned

Official policy must be stored as declarative files, not TypeScript logic.

Recommended layout:

```text
apps/backend/src/product/ai-policy/
  official/
    v1/
      manifest.json
      pricing.json
      step-rules.json
      fallback-profiles.json
      pipeline-overrides.json
  experimental/
    ...
```

`manifest.json` is the canonical entry point and references the other files.

### 12. Experimental catalog is separate

Experimental policy and pipeline definitions must be isolated from official
policy.

Experimental execution:

- is gated by role + environment + feature flag
- is never public
- may use simulated credits by default
- still records normal internal cost and provider telemetry
- may only be promoted after quality, cost, fallback, trace, and PR review

## Generation preview model

### 13. Generation Preview is public, informative, and non-reserving

Public UX should use a preview operation before execution.

Domain/backend name:

- `Pricing Snapshot`

Public/API/SDK name:

- `Generation Preview`

Preview is informative only.

- it does not reserve credits
- reservation still happens only at execution start

### 14. Generation Preview is not a new central capability

Generation Preview is a product read operation composed from:

- billing/entitlement
- balance
- AI pricing snapshot resolution
- recommendation heuristics

It belongs in the backend product layer.

### 15. Pricing snapshot and quote integrity

Preview returns a deterministic commercial snapshot and a hash-based `quoteId`.

The `quoteId` is built from the commercial promise, not the internal fallback
plan.

It should include at least:

- `policyVersion`
- `planTier`
- `contentType`
- `qualityMode`
- `creditPrice`
- allowance/blocking outcome when relevant

It must not include temporal noise such as `quoteGeneratedAt`.

### 16. Execution must share the same pricing logic

Execution must use the same canonical backend pricing logic used by preview.

If the public execution request includes a `quoteId`, the backend recalculates
the commercial snapshot and compares all commercial fields.

If any commercial field diverges:

- public execution fails explicitly
- the error instructs the client to refetch preview
- the execution endpoint does not inline a new preview payload

The SDK may refresh preview automatically, but must always return the new
preview for user confirmation instead of re-executing automatically.

## Recommendation model

### 17. Recommendation is backend-owned

Recommendation belongs to backend product logic.

The SDK presents it, but does not derive it.

### 18. Recommendation uses structural heuristics first

Initial recommendation should be deterministic and non-semantic.

Suggested signals:

- content type
- briefing length
- number of explicit constraints
- output shape and expected size
- voice context availability
- known pipeline complexity

Recommendation output should include:

- recommended quality mode
- reason codes
- short textual explanation

The recommendation must stay inside the already-allowed option space for the
current client. It must never recommend a blocked mode.

### 19. Recommendation divergence is analytical only

If the user chooses a different quality mode than recommended:

- the user choice still wins
- no extra friction is added
- the divergence is tracked analytically

Preview records what was recommended.
Execution records what was chosen and whether it diverged.

## Execution boundary

### 20. Product owns public orchestration

Public request handling belongs to the backend product layer.

Product is responsible for:

- request normalization
- entitlement checks
- quote consistency checks
- policy resolution
- generation preview orchestration
- debug/staff guards

Execution is an internal runtime that receives a normalized internal command.

### 21. Execution receives a resolved policy snapshot

Product sends execution a resolved immutable snapshot.

Execution must not recompute product policy.
It may apply only minimal defensive validation:

- structural schema validation
- step compatibility validation
- operational invariants

Examples:

- an `llm` step must have a non-empty preferred plan
- a `local` step must not carry provider fallback
- a public execution command must carry a valid pricing snapshot

These failures are execution integrity errors, not policy repository errors.

## Current implementation implication

The current backend still uses a synthetic transport in the shared execution
runtime. Both sync and async paths therefore pass through the same runtime but
do not yet reach a real provider transport.

The next implementation cycle should align the codebase with this policy by:

1. introducing `AIPolicyService`
2. moving public orchestration to product-facing commands
3. introducing Generation Preview / Pricing Snapshot flow
4. making step execution explicit in internal pipeline definitions
5. replacing synthetic transport with real provider transport
