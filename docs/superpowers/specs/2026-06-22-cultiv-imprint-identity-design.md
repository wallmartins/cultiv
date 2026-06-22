---
title: Cultiv Imprint — Unified Visual Identity
doc_type: design
status: approved
domain: design-system
last_updated: 2026-06-22
source_kickoff: docs/live/kickoff/redisign-cultiv.md
supersedes_adr: docs/adr/0003-workspace-visual-refresh.md
---

# Cultiv Imprint — Unified Visual Identity

## Summary

Replace Cultiv's current editorial/botanical marketing language and separate workspace chrome with a **unified visual identity** guided by the synthesis of three artistic movements — **Modernism**, **Arts and Crafts**, and **Minimalism** — expressed through the **Imprint** metaphor: authorial voice as a material mark on paper.

Only the name **Cultiv** is non-negotiable. Logo, palette, typography, botanical illustrations, editorial frames, and the marketing/app split defined in ADR 0003 are retired.

**Brand promise:** *"Tecnologia de ponta, feita com alma de artesão."*

## Problem

The current Cultiv visual language is technically coherent but **not proprietary**. Playfair Display + warm paper + botanical decoration reads as "premium organic editorial studio" — a category shared by many writing and creativity products. Users cannot connect isolated visual elements to Cultiv specifically.

The workspace (Jardim de Vidro) and marketing surface (editorial/GlyphsLabs-inspired) follow **different grammars**, reinforcing the sense of two products rather than one brand.

## Goals

1. Codify the three-movement philosophy from the kickoff into an operational design system.
2. Create a **recognizable Imprint signature** — paper grain, press edge, stamp mark — identifiable without the logo.
3. Unify marketing and authenticated app under **one token set and primitive library**, varying only **intensity** (`expressive` vs `quiet`).
4. Retire all legacy visual assets: Playfair, Caveat, moss/golden palette, botanical illustrations, editorial utilities, pen-and-sprout logo.
5. Establish rollout phases that minimize broken intermediate states.

## Non-Goals (v1 Imprint)

- Active dark mode UI (tokens prepared only).
- Full custom icon set (24 engraved icons) — phase 3; phase 1 uses customized stroke icons.
- Email templates, social assets, mobile app reskin.
- Stamp animation on every micro-interaction (hero + onboarding only in v1).
- Changes to product behavior, copy strategy, or information architecture beyond visual reskin.

---

## Foundation

### Three movements as operational rules

Every visual decision answers three questions, in order:

1. **Is it functional and precise?** (Modernism) — If not, remove it.
2. **Does it convey care and authenticity?** (Arts and Crafts) — If not, add texture or warmth.
3. **Does it disappear when text must be protagonist?** (Minimalism) — If not, simplify.

### Principles

| # | Principle | Rule |
|---|-----------|------|
| P1 | Text wins | In reading/validation screens, visual chrome ≤ 10% of attention |
| P2 | Texture, not decoration | Grain, emboss, manual stroke exist as *material*, never ornament |
| P3 | Grid before curve | All composition starts from a modernist grid; organicity lives in details |
| P4 | Color with intent | Neutral default; earthy pigments for accent, state, or brand only |
| P5 | One grammar, two volumes | Marketing and app share tokens; marketing is louder, app is quieter |
| P6 | Recognizable in isolation | A card, button, or divider must read as Cultiv without the logo |

### Imprint metaphor

Authorial voice leaves a **material mark** — like letterpress, stamp, or ink on paper fiber. AI **records**; it does not erase. The visual language translates printing acts into form, texture, and motion.

---

## Typography

**Rule:** *Sans conduz, serif imprime, leitura respira.*

### Three roles

| Role | Movement | Font | Usage | Frequency |
|------|----------|------|-------|-----------|
| Condução | Modernism | **Bricolage Grotesque** | UI, nav, headings, labels, buttons, marketing titles | ~85% |
| Impressão | Arts and Crafts | **Fraunces** | Taglines, voice quotes, brand emphasis | ~10%, intentional |
| Leitura | Minimalism | **Source Serif 4** | Generated text, preview, execution drawer, showcase | 100% of content surfaces |
| Mono | — | **JetBrains Mono** | Credits, timestamps, technical meta | As needed |

**Alternatives:** Condução — Figtree (more neutral), Söhne (licensed premium). Leitura — Literata, Newsreader.

### Type scale (Major Third, 1.250, base 16px)

| Token | Size | Line-height | Weight | Tracking | Usage |
|-------|------|-------------|--------|----------|-------|
| `display-xl` | 3.052rem | 1.1 | 500 | -0.02em | Marketing hero |
| `display` | 2.441rem | 1.15 | 500 | -0.01em | Section titles |
| `heading-lg` | 1.953rem | 1.2 | 600 | 0 | App page titles |
| `heading` | 1.563rem | 1.25 | 600 | 0 | Card titles |
| `body-lg` | 1.25rem | 1.5 | 400 | 0 | Lead paragraphs |
| `body` | 1rem | 1.6 | 400 | 0 | UI body, forms |
| `caption` | 0.8rem | 1.4 | 500 | 0.04em | Labels, meta |
| `reading` | 1.125rem | 1.75 | 400 | 0.01em | Generated text |
| `imprint` | 1.25rem | 1.4 | 400 | 0.02em | Voice quotes (Fraunces) |

### Typography rules

1. Condução never competes with Leitura — form uses Bricolage, preview uses Source Serif 4.
2. Impressão is scarce — Fraunces at most 1–2 times per viewport.
3. Uppercase only on `caption` tokens with wide tracking.
4. Minimum weight 400 — no thin/light.
5. No handwritten fonts (Caveat retired).

---

## Color, Texture, and Materiality

### Neutrals (universal base)

| Token | Hex | Role |
|-------|-----|------|
| `paper` | `#F3F0EA` | Main background |
| `paper-elevated` | `#FAF8F4` | Cards, modals |
| `paper-pressed` | `#E8E4DC` | Hover, selection |
| `ink` | `#1A1A18` | Primary text |
| `ink-muted` | `#6B6860` | Secondary text |
| `ink-ghost` | `#C8C4BC` | Dividers, subtle borders |

### Pigments (craft accents)

| Token | Hex | Role |
|-------|-----|------|
| `pigment-terracotta` | `#C4705A` | Primary accent, CTA, active states |
| `pigment-indigo` | `#3D4F7C` | Secondary accent, links, trust |
| `pigment-ochre` | `#C4A35A` | Subtle highlight, badges, confidence |
| `pigment-fade` | `#C4705A` @ 12% | Accent backgrounds |

### Semantics

| Token | Hex | Role |
|-------|-----|------|
| `success` | `#5A8C6B` | Confirmation |
| `warning` | `#C4A35A` | Attention |
| `error` | `#C45A5A` | Error |
| `info` | `#3D4F7C` | Information |

### Dark mode (prepared, not productized v1)

| Token | Hex |
|-------|-----|
| `paper-dark` | `#1A1A18` |
| `paper-elevated-dark` | `#2A2A26` |
| `ink-dark` | `#F3F0EA` |

Pigments gain +10% luminosity in dark contexts.

### Textures

1. **Paper grain** — SVG/CSS noise at 3% (app) / 5% (marketing) over `paper`. Universal signature.
2. **Press edge** — Inset shadow on containers simulating embossed paper:
   `inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.06)`
3. **Ink bleed** — Organic pigment gradient at low opacity. Marketing and onboarding only.

### Color rules

1. Reading surfaces use `paper` + `ink` only — zero pigment.
2. One pigment per viewport maximum.
3. Primary CTA = terracotta; one chromatic button per screen.
4. Borders = `ink-ghost`, never pigment.
5. No gradients in functional UI.

### Accessibility

- `ink` on `paper`: 14.8:1 (AAA)
- `ink-muted` on `paper`: 5.2:1 (AA)
- CTA text white `#FAF8F4` on terracotta: 5.1:1 (AA)

---

## Shape Grammar and Brand

### Press Mark (logo)

Square ~1:1 with slightly irregular corners (hand-cut paper). Bold **C** inside with subtle ink-bleed imperfection on the stroke. Default: `ink` on `paper`. No drop shadow — press edge only.

**Wordmark:** "Cultiv" in Bricolage Grotesque Medium, sentence case, tracking `-0.01em`.

**Lockups:**
- Horizontal: `[Press Mark] Cultiv`
- Compact: Press Mark only (favicon, app icon)

Tagline lives separately in Fraunces — not in primary logo lockup.

### Shape vocabulary

**Primary (Modernism):** rectangle, horizontal rule, 12-column grid.

**Secondary (Crafts, detail only):** irregular corners, manual SVG stroke dividers, organic ink-blur backgrounds.

**Forbidden:** perfect circle containers (except small avatars/icons), editorial hard-edge frames, botanical illustrations, uncustomized generic icon fills.

### Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-none` | `0` | Dividers |
| `radius-press` | `2px` | Inputs, buttons, cards |
| `radius-mark` | irregular SVG | Press Mark, highlight containers |

No pill buttons. No large SaaS radii except avatars.

### Layout

- Grid: 12 columns, gutter `clamp(1.25rem, 4vw, 2.5rem)`, max-width `1200px`
- Vertical rhythm: 8px baseline; spacing `[4, 8, 12, 16, 24, 32, 48, 64, 96]`
- Minimum ~40% viewport negative space

### Recognition test

An isolated Cultiv card contains: `paper` + grain, press edge, Bricolage title, Source Serif 4 body, one terracotta accent. No illustration, no botanics, no gradient. Must read as Cultiv without logo.

---

## Motion Language

**Narrative:** precision → impression → silence.

### Principles

| # | Rule |
|---|------|
| M1 | Grid-aligned entries — no bounce/elastic |
| M2 | Elements appear as if printed — fade + micro-settle |
| M3 | Zero continuous motion on reading surfaces |
| M4 | `prefers-reduced-motion` → opacity-only, no Lenis/GSAP |
| M5 | One entrance sequence per viewport section |

### Motion tokens

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `motion-instant` | 100ms | ease-out | Hover, focus |
| `motion-fast` | 200ms | cubic-bezier(0.25, 0.1, 0.25, 1) | Buttons, toggles |
| `motion-base` | 350ms | cubic-bezier(0.25, 0.1, 0.25, 1) | Cards, drawer |
| `motion-slow` | 600ms | cubic-bezier(0.16, 1, 0.3, 1) | Section reveal |
| `motion-press` | 450ms | cubic-bezier(0.34, 1.2, 0.64, 1) | Stamp effect |
| `stagger-tight` | 60ms | — | Lists, form fields |
| `stagger-base` | 100ms | — | Cards, grids |
| `stagger-wide` | 150ms | — | Hero, marketing |

**Forbidden:** bounce, elastic, overshoot, aggressive parallax, long scrollytelling.

### Patterns

- **Marketing section reveal:** opacity + translateY(12px→0), motion-slow, ScrollTrigger at 80%
- **Hero stamp:** Press Mark scale 0.92→1 + opacity (motion-press), then headline stagger
- **App form mount:** fields stagger-tight; preview opacity-only after 200ms delay
- **Drawer:** slide 520px desktop / full-screen mobile; content opacity-only after open
- **Route transition:** crossfade opacity, motion-fast — no slide
- **Hover:** press edge intensifies 10%, motion-instant

### Retired motion

FallingLeavesLayer, scrollytelling, typewriter hero, botanical draw-stroke, scroll chapters.

### Surface scroll

| Surface | Scroll |
|---------|--------|
| Marketing | Lenis smooth (~1.2 duration) + section reveals |
| App | Native scroll, no Lenis |

---

## Surface Modes and Design System Architecture

### Package structure

```
packages/ui/
├── styles/theme.css          # Imprint tokens (replaces legacy editorial tokens)
├── tokens/                   # motion, spacing
├── primitives/               # Button, Text, Card, Input, PressMark, PaperSurface, ReadingSurface...
└── patterns/                 # SectionHeader, ComparisonCard...

apps/web/
├── src/styles/app.css        # minimal intensity overrides
├── src/marketing/            # expressive compositions
└── src/app/                  # quiet compositions
```

No marketing-only tokens in `packages/ui`. Intensity is a composition concern, not a token fork.

### Intensity modes

Root attribute `data-intensity`:

| Aspect | `expressive` (marketing) | `quiet` (app) |
|--------|--------------------------|---------------|
| Paper grain | 5% | 3% |
| Press edge | all cards | cards + inputs |
| Ink bleed | hero, waitlist | onboarding only |
| Fraunces | tagline, pull quotes | voice labels only |
| Pigments | terracotta + ochre | terracotta CTA only |
| Section reveal | all sections | initial mount only |
| Lenis | yes | no |
| Negative space | ~35% viewport | ~45% viewport |

### Primitives to rebuild

| Component | Imprint change |
|-----------|----------------|
| `Button` | press edge, radius-press, terracotta primary |
| `Text` | variants: condução / impressão / leitura |
| `Card` | paper + grain + press edge |
| `Input` | press edge inset, terracotta focus ring |
| `SectionHeader` | Bricolage display |
| `ComparisonCard` | Source Serif 4 outputs |
| **New** `PressMark` | SVG logo |
| **New** `PaperSurface` | grain + press edge wrapper |
| **New** `ReadingSurface` | immersive preview — zero chrome |
| **New** `InkBleed` | decorative background (marketing) |

### Assets and components to remove

- All botanical components (`BotanicalTree`, `BotanicalStem`, `BotanicalVine`, `BotanicalLeaf`, `FallingLeavesLayer`)
- `HandwrittenNote`, `WaveformScript`, `TypeVine`, editorial `WordReveal`
- CSS utilities: `editorial-rule`, `editorial-frame`
- `SolutionBreathScrolly` and horizontal scroll pin patterns
- Legacy logos: `cultiv-logo-*.svg`, `cultiv-icon.svg`, `cultiv-og.svg`

### Documentation to update

| Document | Action |
|----------|--------|
| ADR 0003 | Mark **superseded** by this spec |
| `design-system-creative-direction.md` | Rewrite for Imprint |
| `product-showcase-asset-bible.md` | Rewrite asset inventory |
| `CONTEXT.md` | Update Brand Tone, Design System, Workspace Typography glossary |
| PRD marketing phase 1 | Update visual section |

---

## Rollout Phases

### Phase 0 — Foundation

- Imprint tokens in `theme.css`
- Font loading: Bricolage Grotesque, Fraunces, Source Serif 4
- New primitives: `PressMark`, `PaperSurface`, `ReadingSurface`
- Core primitive rebuild: Button, Text, Card, Input

### Phase 1 — Marketing

- Reskin hero, sections, footer
- New logo and OG image
- Motion: stamp reveal, section reveal, press settle
- Remove botanical and editorial assets

### Phase 2 — App

- App shell, nav, forms (quiet intensity)
- Generation Screen: Bricolage form + ReadingSurface preview
- Immersive execution drawer
- Voice dashboard terracotta accents

### Phase 3 — Polish

- Custom engraved icon set (24)
- Dark mode token validation (not activated)
- Lighthouse + a11y audit
- Favicon, email template stubs

---

## Testing and Quality

| Area | Criterion |
|------|-----------|
| Accessibility | WCAG AA on all functional color pairs |
| Reduced motion | Zero animation with `prefers-reduced-motion` |
| Performance | CSS/SVG grain only; Lighthouse ≥ 90 |
| Recognition | Card test passes — Cultiv identifiable without logo |
| Consistency | Marketing and app use same token lint rules |
| Governance | No Playfair, Caveat, moss/golden legacy, or botanical imports in codebase |

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Identity scope | Unified marketing + app | User chose single grammar, two intensities |
| Change magnitude | Full reinvention | Only name Cultiv survives |
| Creative direction | Imprint metaphor | Best balance of three movements; avoids generic botanics/audio clichés |
| Primary sans | Bricolage Grotesque | Distinctive yet functional; subtle craft irregularity |
| Primary accent | Terracotta | Warm craft pigment; one CTA color per screen |
| ADR 0003 | Superseded | Separate marketing/app typography rule no longer applies |

---

## References

- Kickoff: [docs/live/kickoff/redisign-cultiv.md](../../live/kickoff/redisign-cultiv.md)
- Superseded: [docs/adr/0003-workspace-visual-refresh.md](../../adr/0003-workspace-visual-refresh.md)
- Current design system: [docs/live/web-structure/design-system.md](../../live/web-structure/design-system.md)
