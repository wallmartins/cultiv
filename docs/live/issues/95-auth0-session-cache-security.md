---
title: Auth0 Session Cache Security
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: HITL
last_updated: 2026-06-24
---

# Auth0 Session Cache Security

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Auth ADR 0021

## What to build

**HITL:** Decide Auth0 SPA **`cacheLocation`** strategy for Cultiv given billing and voice data sensitivity.

Options to evaluate:

| Option | Tradeoff |
|--------|----------|
| `memory` | XSS cannot read persisted tokens; re-auth on full page reload |
| `localstorage` | Better UX across reloads; tokens exfiltratable via XSS |

Deliver:

1. Short ADR or decision section in plan/decisions.md with chosen default and rationale
2. Implementation in `ClientAuthProviders.tsx` matching decision
3. If memory: document silent refresh / redirect UX expectations
4. If localstorage: document accepted risk + CSP/monitoring mitigations

## Acceptance criteria

- [ ] Written decision approved (HITL gate).
- [ ] `cacheLocation` matches decision.
- [ ] Auth flow manual checklist: login → `/app/generate` → refresh → still authenticated (per chosen mode).
- [ ] No secrets in repo.

## Blocked by

None — can start immediately (decision meeting may gate merge).
