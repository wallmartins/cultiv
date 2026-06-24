---
title: Web File Size Governance
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-24
---

# Web File Size Governance

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Architecture Deepening: [`architecture-deepening-plan.md`](../plan/architecture-deepening-plan.md)
- Governance: [`tests/governance/file-size-governance.test.ts`](../../../tests/governance/file-size-governance.test.ts)

## What to build

Extend **file-size governance** (400-line budget) to **`apps/web/src/**/*.ts` and `*.tsx`**, matching backend and packages discipline.

Rollout strategy (avoid big-bang CI failure):

1. Add `apps/web/src` to `listProductionTypeScriptFiles` in governance test (exclude `*.gen.ts`, `routeTree.gen.ts`, `i18n/` message catalogs if needed — mirror backend exclusions).
2. Seed **allowlist** with current violators only; register baselines anti-regression.
3. Shrink allowlist as issues like 94 land; target empty allowlist over time.

Optional: document in Architecture Deepening plan as **Fase 7**.

Complements issue 94 (`GenerationScreen` ≤ 400 lines) — this issue makes the constraint **enforced in CI**, not voluntary.

## Acceptance criteria

- [ ] `file-size-governance.test.ts` scans `apps/web/src` production files.
- [ ] Allowlist documents every file currently over 400 lines with baseline counts.
- [ ] No allowlisted file grows beyond its baseline.
- [ ] `pnpm smoke` / governance suite passes in CI.
- [ ] README or architecture-deepening plan notes web scope extension.

## Blocked by

- [94-generation-screen-modularization.md](./94-generation-screen-modularization.md)
