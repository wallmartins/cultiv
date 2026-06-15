---
title: Step-Level Routing Resolution In Execution Snapshot
doc_type: issue
status: ready-for-agent
domain: ai-implementation
last_updated: 2026-05-26
---

# Step-Level Routing Resolution In Execution Snapshot

## Parent

- `docs/archive/prd/versioned-ai-routing-profiles-and-provider-activation.md`

## What to build

Build the slice that resolves a **Routing Profile** per LLM **Step Execution**
 and carries the ordered provider/model attempts into the immutable execution
 snapshot used by runtime execution.

This slice should prove the end-to-end behavior that:

- routing is resolved per LLM step rather than globally per request
- only LLM steps carry resolved attempts into the execution snapshot
- the selected `policyVersion` and step-level routing remain deterministic for
  the whole execution

## Acceptance criteria

- [ ] The AI policy runtime resolves a **Routing Profile** per LLM step and includes the resulting attempts in the execution snapshot.
- [ ] Local steps do not carry provider/model attempts or routing metadata meant for LLM steps.
- [ ] Trusted execution validation rejects snapshots whose LLM-step routing shape is structurally invalid.

## Blocked by

- `01-routing-profile-schema-and-boot-validation.md`
