---
title: AI Policy Generation Preview Implementation Coordination
doc_type: coordination
status: active
domain: ai-implementation
last_updated: 2026-05-24
---

# AI Policy Generation Preview Implementation Coordination

This document is the working coordination guide for implementing the
`ai-policy-generation-preview` issue set.

It is not the implementation itself. It exists so the slices can be executed in
the right order, with the right module boundaries, and with the correct
engineering constraints from the start.

## Purpose

The goal of this workstream is to move the backend from a synthetic execution
path to a product-oriented generation system with:

- public `Generation Request` semantics
- product-owned `Generation Preview`
- versioned AI policy loading and validation
- internal pipeline governance
- explicit `Step Execution`
- real provider transport for `llm` steps
- deterministic quote integrity and trace correlation

## Current Baseline

The implementation order was corrected so the backend no longer starts from
preview-first assumptions.

Implemented:

- Slice 01: official AI policy boot loader and typed validation
- Slice 02: policy-governed internal pipeline catalog guard with explicit
  `local` versus `llm` step execution
- Slice 03: pricing envelope resolution with active and `legacy-supported`
  policy versions
- Slice 04: generation preview backed by policy pricing instead of ad-hoc
  defaults
- Slice 05: backend-owned quality mode recommendation heuristics with stable
  reason codes and entitlement-safe fallback
- Slice 06: deterministic pricing snapshot quote hashing with public stale
  quote rejection and refresh-preview recovery signaling
- Slice 07: product-owned public generation command with content-type semantics
  and internal trusted execution boundary
- Slice 08: immutable execution snapshot with defensive runtime validation
- Slice 09: real provider transport for `llm` steps in sync and async flows
- Slice 10: ordered fallback chains that stay inside the same pricing envelope
- Slice 11: preview-to-execution trace and telemetry correlation
- Slice 12: separate experimental policy catalog with guarded debug execution
  and simulated credits by default

Still open:

- no remaining slices in this issue set

## Coordination Principles

All implementation must follow:

- `software-engineering`
- `effect-ts`

Non-negotiable constraints:

- prefer deep modules with stable interfaces
- keep files small and cohesive
- preserve single responsibility per file
- model errors explicitly
- use Effect services and Layers where the domain crosses boundaries
- do not let public clients define pipelines or steps
- do not move product policy into execution
- do not introduce a god module that owns pricing, policy, preview, and transport

## Target Module Boundaries

The implementation should converge on the following responsibilities:

- `AIPolicyService`
  - loads and validates versioned AI policy
  - resolves pricing, step execution, fallback, and execution snapshots
- product generation orchestration
  - resolves entitlement, preview, quote consistency, and execution commands
- execution runtime
  - consumes an immutable resolved snapshot
  - validates only structural and operational invariants
- provider transport
  - executes real provider calls for `llm` steps
- telemetry and trace
  - correlates preview, quote, recommendation, selected model, and observed cost

## Implementation Order

### Slice 01

Boot the official policy loader and fail fast on invalid policy.

Why first:

- every later slice depends on the policy contract existing
- invalid policy should fail at boot before any preview or execution work

Output expected:

- one validated official policy version can be loaded
- invalid policy blocks startup

### Slice 02

Add internal pipeline catalog guard and explicit step execution rules.

Why second:

- execution semantics must be known before preview and pricing can be trusted

Output expected:

- internal pipelines reject unknown steps
- `local` and `llm` step execution are explicit

### Slice 03

Resolve the commercial pricing envelope from billing policy.

Why third:

- preview and execution both depend on stable pricing before anything else

Output expected:

- fixed commercial price is derived from plan tier, quality mode, and content
  type or pipeline
- frozen policy versions remain honored

### Slice 04

Build the generation preview read model.

Why fourth:

- the product surface needs a preview before execution becomes trustworthy

Output expected:

- allowed options
- current balance
- projected balance after generation
- fixed price

### Slice 05

Add quality mode recommendation heuristics.

Why fifth:

- recommendation should be shown with preview, but only after preview exists

Output expected:

- backend-owned recommendation
- reason codes
- short explanation

### Slice 06

Add pricing snapshot and quote consistency rules.

Why sixth:

- quote integrity must match the preview model before public execution is
  allowed

Output expected:

- deterministic `quoteId`
- public rejection on commercial snapshot divergence
- explicit refresh-preview recovery path

### Slice 07

Move public generation orchestration into the product layer.

Why seventh:

- public generation should consume product semantics, not pipeline internals

Output expected:

- generation request orchestration in product
- execution command normalized in product
- no public pipeline control

### Slice 08

Define the execution snapshot contract and defensive validation.

Why eighth:

- execution should receive one immutable snapshot, not recompute policy

Output expected:

- resolved execution snapshot passed from product to execution
- minimal execution integrity validation

### Slice 09

Replace synthetic transport with real provider transport for `llm` steps.

Why ninth:

- provider calls only make sense once execution semantics and snapshot shape are
  locked

Output expected:

- `llm` steps call a real provider
- `local` steps stay provider-free

### Slice 10

Add fallback chains inside the pricing envelope.

Why tenth:

- fallback should be added after real transport exists and snapshot shape is
  stable

Output expected:

- ordered fallback plan
- controlled downgrade
- same pricing envelope

### Slice 11

Correlate preview, quote, execution, and observed cost in trace and telemetry.

Why eleventh:

- operational learning becomes useful only after the main flows exist

Output expected:

- preview recommendation appears in trace
- quote and execution correlate
- observed cost is measurable

### Slice 12

Add the experimental catalog and guarded debug flow.

Why twelfth:

- experimentation should stay separate from the official path

Output expected:

- experimental policy catalog
- guarded access
- simulated credits by default

### Slice 13

Bring docs and public contract references into parity.

Why last:

- docs should reflect the final shape, not the temporary shape

Output expected:

- live docs match the public-facing product contract
- internal pipeline semantics are clearly marked as non-public

## Deep Modules To Preserve

These are the modules that should stay small, testable, and stable:

- policy loader and validator
- pricing resolver
- preview read model
- recommendation heuristics
- quote snapshot hash builder
- execution snapshot composer
- defensive execution validator
- provider transport adapter
- fallback resolver
- trace/telemetry correlator

## Testing Strategy

Tests should verify external behavior, not implementation details.

Recommended coverage:

- policy boot validation
- internal pipeline rejection
- pricing envelope resolution
- preview payload shape and balance impact
- recommendation behavior
- quote mismatch rejection
- snapshot validation in execution
- real provider transport for `llm` steps
- fallback ordering inside the same pricing envelope
- trace correlation across preview and execution

## File Size Guardrail

If a file starts to accumulate unrelated logic, split it immediately.

Expected signs that a file is too large:

- more than one domain responsibility
- more than one primary exported service or resolver
- mixed policy, transport, and preview logic in one file
- repeated helper logic that should become a dedicated module

The implementation should prefer:

- one service per responsibility
- one resolver per concept
- one file per coherent module

## Start Condition

Work begins with Slice 01 only.

Do not start lower slices before the blockers are implemented.

## Completion Condition

This coordination file is complete when:

- the slice order is stable
- the module boundaries are respected
- the guardrails are explicit
- the code changes can be executed incrementally without re-litigating design
