---
title: Cultiv Cartography Unified Identity
doc_type: adr
status: accepted
last_updated: 2026-06-23
supersedes: docs/adr/0009-cultiv-imprint-identity.md
---

# Cultiv Cartography unified visual identity

## Context

[ADR 0009](./0009-cultiv-imprint-identity.md) established **Cultiv Imprint** — authorial voice as a material mark on paper — with Bricolage Grotesque, Fraunces, Source Serif 4, intensity modes (`expressive` / `quiet`), and the PressMark signature. That system is internally coherent but no longer matches strategic repositioning in [`docs/live/rebranding/`](../live/rebranding/).

The product narrative now requires the cartography metaphor **"A Voz como Território"** (voice as mappable territory): compass mark, Playfair Display + Inter typography, aged-paper texture, route lines and dotted borders, and **Atlas Editorial** layout composition. Marketing and workspace must share one cartographic grammar rather than Imprint's paper/press/ink vocabulary.

## Decision

Adopt **Cultiv Cartography** as the unified visual identity for marketing and `/app/*`.

- **Surface modes:** `data-surface="marketing"` and `data-surface="workspace"` replace Imprint's `data-intensity` (`expressive` / `quiet`).
- **Brand mark:** compass logo from `docs/live/rebranding/logo.md` replaces PressMark.
- **Token set:** single library in `packages/ui`; surface volume varies by `data-surface`, not parallel theme files.
- **Motion:** premium contained — precise ease-out transitions, no elastic bounce.

## Considered Options

1. **Retain Cultiv Imprint (ADR 0009)** — Rejected. Imprint metaphor (letterpress, paper grain, press edge) competes with cartography (territory, routes, compass) required by rebranding.
2. **Cartography tokens on marketing only; keep Imprint workspace** — Rejected. Two grammars under one name; no proprietary cartographic signature in daily-use surfaces.
3. **Unified Cultiv Cartography with surface modes** — Accepted.

## Consequences

- [ADR 0009](./0009-cultiv-imprint-identity.md) is **superseded**.
- Imprint tokens, PressMark, Bricolage Grotesque, Fraunces, Source Serif 4, `data-intensity`, `imprint-grain`, `press-edge`, `radius-press`, and botanical assets are retired during rollout phases defined in the design spec.
- Implementation issues trace to the design spec and this ADR, not ADR 0009.

## References

- [Cultiv Cartography — Complete Platform Redesign (design spec)](../superpowers/specs/2026-06-23-cultiv-cartography-redesign-design.md)
- [Cultiv Cartography rollout plan](../superpowers/plans/2026-06-23-cultiv-cartography-redesign.md)
- [ADR 0009 — Cultiv Imprint Unified Identity (superseded)](./0009-cultiv-imprint-identity.md)
