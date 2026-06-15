---
title: Fallback Execution Inside Routing Profile
doc_type: issue
status: ready-for-agent
domain: ai-implementation
last_updated: 2026-05-26
---

# Fallback Execution Inside Routing Profile

## Parent

- `docs/archive/prd/versioned-ai-routing-profiles-and-provider-activation.md`

## What to build

Build the slice that makes runtime execution honor preferred and fallback
attempts from a resolved **Routing Profile**, so the current request can stay
alive inside the same `policyVersion` and the same commercial promise when one
provider fails.

This slice should prove the end-to-end behavior that:

- the preferred attempt is tried first for an LLM step
- fallback attempts are tried in policy order when allowed failure conditions
  happen
- the request stays inside the same `policyVersion` and pricing semantics

## Acceptance criteria

- [ ] Runtime execution uses preferred and fallback attempts from the resolved **Routing Profile** for the current request.
- [ ] Provider timeout or transport failure can move execution to the next allowed attempt without changing the commercial envelope.
- [ ] Sync and async execution paths preserve the same fallback behavior and final output semantics for equivalent routing conditions.

## Blocked by

- `02-step-level-routing-resolution-in-execution-snapshot.md`
- `03-gemini-native-adapter-and-transport-path.md`
- `04-deepseek-native-adapter-and-transport-path.md`
