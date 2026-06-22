---
title: Workspace Visual Refresh
doc_type: adr
status: superseded
last_updated: 2026-06-14
superseded_by: docs/adr/0009-cultiv-imprint-identity.md
---

> **Superseded by [ADR 0009](./0009-cultiv-imprint-identity.md).**

# Workspace visual refresh (Authenticated Workspace only)

The **Authenticated Workspace** (`/app/*`) shipped in web v2 with functional screens but a visual language still inherited from the editorial **Marketing Surface** — serif titles, hard borders, and form-first layouts that read as prototype rather than premium product. The marketing showcase intentionally keeps Playfair Display, Caveat, scroll chapters, and botanical scenes; forcing the same chrome into daily-use screens would sacrifice readability, density, and contemporary product feel.

We decided on a **Workspace Visual Refresh** scoped exclusively to `/app/*`: **Jardim de Vidro** surface language (soft glass, warm diffuse shadows, medium radius, subtle organic glow), **sans-only typography**, **moss + golden** as the only chromatic accents, a **floating expandable nav dock** (refined, not replaced by a fixed sidebar), **Generation Screen** split on desktop with sticky **Generation Preview** and single column on mobile, **Voice Confidence** as a moss-to-golden growth ring, **contained fluid motion** (no bounce or marketing scroll storytelling), and **Active Execution Drawer** as a ~520px right slide-over on desktop and full-screen sheet on mobile for reading-first results. Marketing tokens in `packages/ui` stay unchanged; workspace overrides live in `apps/web` (for example `data-surface="workspace"` on **App Shell**).

## Considered Options

1. **Global rebrand (marketing + app)** — Rejected. Marketing editorial language is working; v2 scope is workspace only.
2. **Craft Flat (opaque cards, minimal blur, 8px radius)** — Rejected. Premium but cold; loses organic warmth central to **Brand Tone**.
3. **Craft Warm with violet accent (archived palette doc)** — Rejected for workspace. A third accent competes with moss/golden and reads as generic AI SaaS.
4. **Fixed sidebar navigation** — Rejected. Floating glass dock is already distinctive, preserves horizontal space for split layouts and reading surfaces.
5. **Generation Screen wizard or single-column desktop** — Rejected. Split with sticky preview keeps credit decision visible without scroll-to-confirm.
6. **Jardim de Vidro with app-local token overrides** — Accepted.

## Consequences

- **Typography:** Playfair and Caveat must not appear in `/app/*` chrome or screen titles; glossary term **Workspace Typography**.
- **Tokens:** Implement workspace overrides in `apps/web/src/styles/app.css` (or adjacent layer) under a workspace root attribute; avoid changing `packages/ui/styles/theme.css` in ways that alter the **Marketing Surface**.
- **Components:** Introduce app-scoped primitives (`AppCard`, `AppField`, `AppSegmentedControl`, refined drawer/sheet) composed from shared `packages/ui` where possible; marketing-specific sections remain in `apps/web` marketing paths only.
- **Generation Screen** is the recommended pilot screen after token foundation.
- **Voice Dashboard** gets the growth-ring treatment for **Voice Confidence**; other screens use moss/golden sparingly for state, not decoration.
- **Motion:** Route transitions, form mount staggers, drawer springs, and card hovers follow **Workspace Motion Language**; `prefers-reduced-motion` collapses to opacity-only.
- **Active Execution Drawer** presentation is reading-first (relaxed typography, fixed action toolbar); behavior terms in `CONTEXT.md` unchanged.
- Domain glossary entries in `CONTEXT.md` (**Workspace Visual Refresh**, **Workspace Surface Language**, **Workspace Navigation Chrome**, **Generation Screen Layout**, **Voice Confidence Presentation**, **Workspace Motion Language**, **Workspace Accent Palette**) are the product-language source of truth alongside this ADR.
