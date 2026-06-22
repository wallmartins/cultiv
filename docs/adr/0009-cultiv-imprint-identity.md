---
title: Cultiv Imprint Unified Identity
doc_type: adr
status: accepted
last_updated: 2026-06-22
supersedes: docs/adr/0003-workspace-visual-refresh.md
---

# Cultiv Imprint unified visual identity

Marketing and authenticated workspace share one Imprint design system with intensity modes (`expressive` / `quiet`). ADR 0003 workspace-only overrides are retired. See [`docs/superpowers/specs/2026-06-22-cultiv-imprint-identity-design.md`](../superpowers/specs/2026-06-22-cultiv-imprint-identity-design.md).

## Context

[ADR 0003](./0003-workspace-visual-refresh.md) scoped a separate **Jardim de Vidro** workspace grammar (sans-only, moss/golden accents, app-local token overrides) while marketing kept editorial Playfair, botanical scenes, and editorial frames. The split reinforced two products under one name and produced a visual language that reads as category-generic rather than Cultiv-specific.

## Decision

Adopt **Cultiv Imprint** — authorial voice as a material mark on paper — as the single visual identity for marketing and `/app/*`. Every decision follows three movements in order: **Modernism** (functional, precise), **Arts and Crafts** (care, texture, authenticity), **Minimalism** (text wins in reading surfaces). Marketing and app share one token set and primitive library; only **intensity** varies: `expressive` on the marketing surface, `quiet` in the authenticated workspace.

## Considered Options

1. **Keep ADR 0003 split (marketing editorial + workspace Jardim de Vidro)** — Rejected. Two grammars, two token paths, no proprietary signature.
2. **Global rebrand without Imprint metaphor** — Rejected. Needs a recognizable material signature beyond palette swaps.
3. **Unified Imprint with intensity modes** — Accepted.

## Consequences

- [ADR 0003](./0003-workspace-visual-refresh.md) is **superseded**; workspace-only overrides (`data-surface="workspace"`, Playfair/Caveat bans, moss/golden palette, Jardim de Vidro tokens) are retired.
- **Single token set** in `packages/ui`; no parallel marketing vs app theme files.
- **Intensity modes** (`expressive` / `quiet`) replace surface-specific CSS layers; app chrome stays reading-first.
- Legacy assets (Playfair, Caveat, botanical illustrations, pen-and-sprout logo, editorial utilities) are removed during rollout phases defined in the design spec.
- Implementation issues trace to the design spec and this ADR, not ADR 0003.

## References

- [Cultiv Imprint — Unified Visual Identity (design spec)](../superpowers/specs/2026-06-22-cultiv-imprint-identity-design.md)
- [ADR 0003 — Workspace Visual Refresh (superseded)](./0003-workspace-visual-refresh.md)
