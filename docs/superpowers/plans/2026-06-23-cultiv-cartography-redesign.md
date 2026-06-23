# Cultiv Cartography Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Cultiv Imprint with the **Cartography** identity (Atlas Editorial) across marketing and authenticated workspace — compass logo, cartographic tokens, reimagined layouts, premium contained motion.

**Architecture:** Rebuild `packages/ui` tokens and cartography primitives first, add governance banning Imprint remnants, then reskin marketing (`data-surface="marketing"`) and workspace (`data-surface="workspace"`) using shared components. Copy rewrite in i18n files precedes or runs parallel to visual tasks per phase. Retire PressMark, Bricolage, Fraunces, Source Serif 4, `imprint-grain`, `press-edge`, `data-intensity`, botanical scenes.

**Tech Stack:** Tailwind CSS v4 (`@theme`), React 19, TanStack Router/Start, GSAP + Lenis (marketing only), Vitest + Testing Library, Google Fonts (Inter, Playfair Display, Caveat, JetBrains Mono).

**Spec:** [`docs/superpowers/specs/2026-06-23-cultiv-cartography-redesign-design.md`](../specs/2026-06-23-cultiv-cartography-redesign-design.md)

**Rebranding source:** [`docs/live/rebranding/`](../../live/rebranding/)

---

## Locked decisions

| Decision | Value |
|----------|--------|
| Creative direction | Cartography — "A Voz como Território" |
| Layout approach | Atlas Editorial |
| Scope | Full platform (marketing + `/app/*`) |
| Logo | Compass mark (replaces PressMark) |
| IA | Hybrid — same sections/screens, layout reimagined |
| Motion | Premium contained — no elastic bounce |
| Primary sans | Inter |
| Display serif | Playfair Display |
| Margin script | Caveat (max 2/viewport) |
| Mono | JetBrains Mono |
| Primary structural color | Deep blue `#1A2E3C` |
| Primary action color | Terracotta `#B55A3B` |
| Surface modes | `data-surface="marketing"` / `"workspace"` |
| ADR 0009 (Imprint) | Superseded by ADR 0010 |

## File map

| File | Responsibility |
|------|----------------|
| `docs/adr/0010-cultiv-cartography-identity.md` | Accept Cartography ADR, supersede 0009 |
| `packages/ui/src/styles/theme.css` | Cartography tokens, utilities, paper noise |
| `packages/ui/src/tokens/motion.ts` | Cartography motion scale (ease-out, durations) |
| `packages/ui/src/primitives/compass-mark-geometry.ts` | SVG path data for compass variants |
| `packages/ui/src/primitives/CompassMark.tsx` | Logo component |
| `packages/ui/src/primitives/CartographySurface.tsx` | Paper noise + optional vignette wrapper |
| `packages/ui/src/primitives/RouteLine.tsx` | SVG route path + draw animation |
| `packages/ui/src/primitives/CoordinateLabel.tsx` | `§01 · Label` mono marker |
| `packages/ui/src/primitives/ExpeditionCard.tsx` | Selectable dotted-border card |
| `packages/ui/src/primitives/LogbookProse.tsx` | Playfair italic reading surface |
| `packages/ui/src/primitives/Text.tsx` | autoridade / condução / margem / mono variants |
| `packages/ui/src/primitives/Button.tsx` | Terracotta + asymmetric shadow |
| `packages/ui/src/primitives/Input.tsx` | Dotted border + terracotta focus |
| `packages/ui/src/primitives/icons/cartography-icons.tsx` | Organic stroke SVG icons |
| `packages/ui/src/index.ts` | Export new primitives; deprecate Imprint exports |
| `apps/web/src/brand/head-links.ts` | Inter + Playfair critical; Caveat + JetBrains deferred |
| `apps/web/src/brand/assets.ts` | Compass SVG / OG paths |
| `apps/web/public/cultiv-compass-mark.svg` | Favicon + app icon |
| `apps/web/public/cultiv-og-cartography.svg` | OG image |
| `apps/web/src/styles/app.css` | `data-surface` overrides; remove `data-intensity` |
| `apps/web/src/marketing/layouts/MarketingLayout.tsx` | Atlas wrapper + route line column |
| `apps/web/src/marketing/components/SiteHeader.tsx` | Floating cartography nav |
| `apps/web/src/marketing/components/BrandMark.tsx` | CompassMark lockup |
| `apps/web/src/marketing/sections/*.tsx` | 10 section reskins |
| `apps/web/src/marketing/animations/use-route-draw.ts` | Section route line draw |
| `apps/web/src/marketing/animations/use-section-reveal.ts` | Scroll fade-up (replace stamp reveal) |
| `apps/web/src/i18n/marketing/locales/pt.ts` | Cartography marketing copy pt-BR |
| `apps/web/src/i18n/marketing/locales/en.ts` | Cartography marketing copy en |
| `apps/web/src/i18n/app/messages/pt.ts` | Workspace copy pt-BR |
| `apps/web/src/i18n/app/messages/en.ts` | Workspace copy en |
| `apps/web/src/i18n/generation-intents.ts` | 6 expedition intent labels |
| `apps/web/src/i18n/field-labels.ts` | Coordinate field labels |
| `apps/web/src/app/shell/AppSidebar.tsx` | Fixed narrow sidebar (replace dock) |
| `apps/web/src/app/shell/AppBottomNav.tsx` | Mobile bottom bar |
| `apps/web/src/app/shell/AppHeader.tsx` | Mono breadcrumb + credits |
| `apps/web/src/app/generation/**` | Expedition wizard reskin |
| `apps/web/src/app/voice/**` | Voice atlas reskin |
| `apps/web/src/app/history/**` | Logbook card list |
| `apps/web/src/app/plans/**` | Journey resources cards |
| `apps/web/src/app/settings/**` | Navigation adjustments |
| `apps/web/src/app/onboarding/**` | Two-step logbook flow |
| `apps/web/src/app/shell/ActiveExecutionDrawer.tsx` | Route progress drawer |
| `tests/governance/cartography-visual-governance.test.ts` | Ban Imprint + legacy patterns |
| `tests/ui/cartography-primitives.test.tsx` | CompassMark, CartographySurface, Text |
| `docs/live/web-structure/design-system.md` | Updated reference |
| `docs/live/web-structure/design-system-creative-direction.md` | Cartography direction |
| `CONTEXT.md` | Glossary update (Cartography replaces Imprint terms) |

## Out of scope

- Dark mode activation (stubs only)
- Backend / API / billing logic changes
- Email templates, social assets, native mobile
- GIS map engine
- Elastic bounce animations from `rebranding/base.md`

## Migration aliases (Phase 1 only)

During rollout, keep temporary CSS aliases so incremental reskins compile:

```css
--color-paper: var(--color-cream);
--color-paper-elevated: var(--color-off-white);
--color-ink: var(--color-texto);
--color-ink-muted: var(--color-texto-sec);
--color-pigment-terracotta: var(--color-terracotta);
--color-pigment-ochre: var(--color-ochre);
--font-conducao: var(--font-inter);
--font-impressao: var(--font-playfair);
--font-leitura: var(--font-playfair);
```

Remove aliases in Task 20 (governance cleanup).

---

## Task 1: ADR 0010 and spec status

**Files:**
- Create: `docs/adr/0010-cultiv-cartography-identity.md`
- Modify: `docs/adr/0009-cultiv-imprint-identity.md`
- Modify: `docs/superpowers/specs/2026-06-23-cultiv-cartography-redesign-design.md`

- [ ] **Step 1: Create ADR 0010**

```markdown
---
title: Cultiv Cartography Unified Identity
doc_type: adr
status: accepted
last_updated: 2026-06-23
supersedes: docs/adr/0009-cultiv-imprint-identity.md
---

# Cultiv Cartography unified visual identity

Marketing and authenticated workspace share one Cartography design system with surface modes (`marketing` / `workspace`). ADR 0009 Imprint identity is retired. See `docs/superpowers/specs/2026-06-23-cultiv-cartography-redesign-design.md`.
```

- [ ] **Step 2: Mark ADR 0009 superseded**

Add to frontmatter of `docs/adr/0009-cultiv-imprint-identity.md`:

```yaml
status: superseded
superseded_by: docs/adr/0010-cultiv-cartography-identity.md
```

- [ ] **Step 3: Set spec status to `approved`** (already done — verify frontmatter)

- [ ] **Step 4: Commit**

```bash
git add docs/adr/0010-cultiv-cartography-identity.md docs/adr/0009-cultiv-imprint-identity.md
git commit -m "docs: accept Cultiv Cartography ADR, supersede Imprint identity"
```

---

## Task 2: Cartography design tokens

**Files:**
- Modify: `packages/ui/src/styles/theme.css`
- Test: `tests/ui/cartography-primitives.test.tsx` (token smoke test added in Task 4)

- [ ] **Step 1: Replace Imprint font tokens with Cartography roles**

In `@theme` block, set:

```css
--font-inter: "Inter", system-ui, sans-serif;
--font-playfair: "Playfair Display", Georgia, serif;
--font-caveat: "Caveat", cursive;
--font-mono: "JetBrains Mono", ui-monospace, monospace;
--font-autoridade: var(--font-playfair);
--font-conducao: var(--font-inter);
--font-margem: var(--font-caveat);
--font-coordenadas: var(--font-mono);
--font-body: var(--font-inter);
```

- [ ] **Step 2: Promote cartography colors to canonical tokens**

```css
--color-deep-blue: #1A2E3C;
--color-cream: #F5F0E6;
--color-off-white: #FAF8F3;
--color-ochre: #C4A484;
--color-terracotta: #B55A3B;
--color-ink: #2C2C2C;
--color-ink-muted: #5A5A5A;
--color-ink-ghost: #8A8A8A;
--color-moss: #4A5D4E;
--color-error: #a84848;
--radius-cartography: 5px;
--shadow-cartography: 4px 4px 0 rgba(26, 46, 60, 0.08);
--spacing-gutter: clamp(1.25rem, 4vw, 2.5rem);
--spacing-section: 5.5rem;
```

Add migration aliases from plan header.

- [ ] **Step 3: Add cartography utilities**

Replace `imprint-grain`, `press-edge`, `ui-type-reading` (Bricolage/Fraunces) with:

```css
@utility cartography-grain {
  background-image: url("data:image/svg+xml,...");
  background-size: 200px 200px;
  opacity: 0.06;
}
@utility cartography-grain-quiet {
  opacity: 0.03;
}
@utility border-dotted-cartography {
  border: 1px dotted var(--color-ink-ghost);
}
@utility border-double-cartography {
  border: 3px double var(--color-deep-blue);
}
@utility shadow-cartography {
  box-shadow: var(--shadow-cartography);
}
@utility ui-type-autoridade {
  font-family: var(--font-autoridade);
}
@utility ui-type-conducao {
  font-family: var(--font-conducao);
}
@utility ui-type-margem {
  font-family: var(--font-margem);
}
@utility ui-type-mono {
  font-family: var(--font-coordenadas);
}
@utility ui-type-logbook {
  font-family: var(--font-autoridade);
  font-style: italic;
}
```

- [ ] **Step 4: Add surface mode selectors**

```css
[data-surface="marketing"] {
  --cartography-grain-opacity: 0.06;
}
[data-surface="workspace"] {
  --cartography-grain-opacity: 0.03;
}
[data-surface="workspace"] .cartography-grain {
  opacity: var(--cartography-grain-opacity);
}
```

- [ ] **Step 5: Verify build**

```bash
pnpm --filter @my-ai-orchestrator/ui build
```

Expected: PASS (no CSS parse errors)

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/styles/theme.css
git commit -m "feat(ui): Cartography design tokens and utilities"
```

---

## Task 3: Motion tokens

**Files:**
- Modify: `packages/ui/src/tokens/motion.ts`

- [ ] **Step 1: Replace Imprint motion with cartography scale**

```typescript
export const motionTokens = {
  easing: {
    default: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    easeOut: "cubic-bezier(0.25, 0.1, 0.25, 1)"
  },
  duration: {
    instant: 0,
    fast: 200,
    normal: 300,
    reveal: 400,
    routeDraw: 1200,
    drawer: 350,
    logoBreath: 4000
  },
  distance: {
    revealY: 12,
    wizardSlide: 24,
    cardHover: 2
  }
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/tokens/motion.ts
git commit -m "feat(ui): Cartography motion tokens"
```

---

## Task 4: CompassMark logo primitive

**Files:**
- Create: `packages/ui/src/primitives/compass-mark-geometry.ts`
- Create: `packages/ui/src/primitives/CompassMark.tsx`
- Create: `apps/web/public/cultiv-compass-mark.svg`
- Modify: `packages/ui/src/index.ts`
- Test: `tests/ui/cartography-primitives.test.tsx`

- [ ] **Step 1: Write failing CompassMark test**

Create `tests/ui/cartography-primitives.test.tsx`:

```tsx
/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompassMark } from "../../packages/ui/src/primitives/CompassMark.js";

describe("CompassMark", () => {
  it("renders accessible logo mark", () => {
    render(<CompassMark />);
    expect(screen.getByRole("img", { name: /cultiv/i })).toBeInTheDocument();
  });

  it("renders four cardinal strokes at default size", () => {
    const { container } = render(<CompassMark size={32} />);
    const svg = container.querySelector("svg");
    expect(svg?.querySelectorAll("[data-cardinal]").length).toBe(4);
  });

  it("applies deep-blue color by default", () => {
    const { container } = render(<CompassMark color="deep-blue" />);
    expect(container.innerHTML).toMatch(/#1A2E3C|deep-blue/);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm vitest run tests/ui/cartography-primitives.test.tsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement compass-mark-geometry.ts**

```typescript
export type CompassMarkVariant = "symbol" | "horizontal" | "vertical";
export type CompassMarkColor = "deep-blue" | "ochre" | "white";

export const COMPASS_COLORS: Record<CompassMarkColor, string> = {
  "deep-blue": "#1A2E3C",
  ochre: "#C4A484",
  white: "#FFFFFF"
};

/** SVG viewBox 0 0 64 64 — symbol-only geometry */
export const COMPASS_SYMBOL_PATHS = {
  ring: "M32 4 A28 28 0 1 1 31.99 4",
  center: "M32 28 L32 36 M28 32 L36 32",
  north: "M32 8 L32 18",
  south: "M32 46 L32 56",
  east: "M46 32 L56 32",
  west: "M8 32 L18 32"
} as const;
```

- [ ] **Step 4: Implement CompassMark.tsx**

```tsx
import { COMPASS_COLORS, COMPASS_SYMBOL_PATHS, type CompassMarkColor, type CompassMarkVariant } from "./compass-mark-geometry.js";

export interface CompassMarkProps {
  readonly size?: number;
  readonly variant?: CompassMarkVariant;
  readonly color?: CompassMarkColor;
  readonly className?: string;
  readonly animate?: boolean;
}

export function CompassMark({
  size = 32,
  variant = "symbol",
  color = "deep-blue",
  className,
  animate = false
}: CompassMarkProps) {
  const stroke = COMPASS_COLORS[color];
  return (
    <svg
      role="img"
      aria-label="Cultiv"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      data-animate-breath={animate ? "true" : undefined}
    >
      <circle cx="32" cy="32" r="28" fill="none" stroke={stroke} strokeWidth="1.5" />
      {(["north", "south", "east", "west"] as const).map((dir) => (
        <path
          key={dir}
          data-cardinal={dir}
          d={COMPASS_SYMBOL_PATHS[dir]}
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}
      <path d={COMPASS_SYMBOL_PATHS.center} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      {variant !== "symbol" ? (
        <text x="32" y="62" textAnchor="middle" fill={stroke} fontFamily="Playfair Display, serif" fontSize="10">
          Cultiv
        </text>
      ) : null}
    </svg>
  );
}
```

- [ ] **Step 5: Export from index.ts and add static SVG to public/**

```typescript
export { CompassMark, type CompassMarkProps } from "./primitives/CompassMark.js";
export type { CompassMarkVariant, CompassMarkColor } from "./primitives/compass-mark-geometry.js";
```

- [ ] **Step 6: Run test — expect PASS**

```bash
pnpm vitest run tests/ui/cartography-primitives.test.tsx
```

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/primitives/compass-mark-geometry.ts packages/ui/src/primitives/CompassMark.tsx packages/ui/src/index.ts apps/web/public/cultiv-compass-mark.svg tests/ui/cartography-primitives.test.tsx
git commit -m "feat(ui): add CompassMark logo primitive"
```

---

## Task 5: Cartography surface primitives

**Files:**
- Create: `packages/ui/src/primitives/CartographySurface.tsx`
- Create: `packages/ui/src/primitives/RouteLine.tsx`
- Create: `packages/ui/src/primitives/CoordinateLabel.tsx`
- Create: `packages/ui/src/primitives/ExpeditionCard.tsx`
- Create: `packages/ui/src/primitives/LogbookProse.tsx`
- Modify: `packages/ui/src/index.ts`
- Test: `tests/ui/cartography-primitives.test.tsx`

- [ ] **Step 1: Add failing CartographySurface test**

```tsx
import { CartographySurface } from "../../packages/ui/src/primitives/CartographySurface.js";

describe("CartographySurface", () => {
  it("applies cartography-grain class", () => {
    render(<CartographySurface data-testid="surface">X</CartographySurface>);
    expect(screen.getByTestId("surface").className).toMatch(/cartography-grain/);
  });
});
```

- [ ] **Step 2: Implement CartographySurface**

```tsx
import { cn } from "../lib/cn.js";

export function CartographySurface({
  className,
  vignette = false,
  children,
  ...props
}: React.ComponentProps<"div"> & { vignette?: boolean }) {
  return (
    <div
      className={cn(
        "relative bg-cream",
        "before:pointer-events-none before:absolute before:inset-0 before:cartography-grain",
        vignette && "after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(26,46,60,0.06)_100%)]",
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Implement RouteLine**

Props: `progress` (0–1), `orientation: "vertical" | "horizontal"`, `animate`, `className`. Uses SVG path with `stroke-dasharray` / `stroke-dashoffset` driven by progress. Respects `prefers-reduced-motion` via CSS media query (offset = 0).

- [ ] **Step 4: Implement CoordinateLabel, ExpeditionCard, LogbookProse**

`CoordinateLabel`: renders `<span className="ui-type-mono text-ink-muted">§{index} · {label}</span>`.

`ExpeditionCard`: button or div with `border-dotted-cartography shadow-cartography rounded-[5px]`, selected state adds `border-terracotta border-solid`, hover `-translate-y-0.5 transition duration-250`.

`LogbookProse`: `bg-off-white border-dotted-cartography p-6 ui-type-logbook text-ink leading-relaxed`.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm vitest run tests/ui/cartography-primitives.test.tsx
git add packages/ui/src/primitives/CartographySurface.tsx packages/ui/src/primitives/RouteLine.tsx packages/ui/src/primitives/CoordinateLabel.tsx packages/ui/src/primitives/ExpeditionCard.tsx packages/ui/src/primitives/LogbookProse.tsx packages/ui/src/index.ts tests/ui/cartography-primitives.test.tsx
git commit -m "feat(ui): Cartography surface primitives"
```

---

## Task 6: Rebuild Text, Button, Input

**Files:**
- Modify: `packages/ui/src/primitives/Text.tsx`
- Modify: `packages/ui/src/primitives/Button.tsx`
- Modify: `packages/ui/src/primitives/Input.tsx`
- Test: `tests/ui/cartography-primitives.test.tsx`

- [ ] **Step 1: Update Text variants**

Map variants to cartography roles:

| Variant | Classes |
|---------|---------|
| `display-xl`, `display`, `display-sm`, `h1`–`h3` | `ui-type-autoridade` + size scale |
| `body`, `body-lg`, `label`, `caption` | `ui-type-conducao` |
| `margem` | `ui-type-margem` (replaces `imprint`, `handwritten`) |
| `mono`, `meta` | `ui-type-mono` |
| `logbook` | `ui-type-logbook` (replaces `reading`) |

Remove references to `font-conducao` (Bricolage), `font-impressao` (Fraunces), `font-leitura` (Source Serif 4).

- [ ] **Step 2: Update Button primary variant**

```tsx
const variants = {
  primary: cn(
    "bg-terracotta text-off-white shadow-cartography",
    "hover:-translate-y-0.5 transition duration-250",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
  ),
  // ...
};
```

- [ ] **Step 3: Update Input**

```tsx
className={cn(
  "bg-off-white border-dotted-cartography rounded-[5px]",
  "focus-visible:border-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/30"
)}
```

- [ ] **Step 4: Add tests and commit**

```bash
pnpm vitest run tests/ui/cartography-primitives.test.tsx
git commit -m "feat(ui): rebuild Text, Button, Input for Cartography"
```

---

## Task 7: Cartography icons

**Files:**
- Create: `packages/ui/src/primitives/icons/cartography-icons.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create icon components**

Export: `IconCompass`, `IconMap`, `IconRoute`, `IconPin`, `IconPen`, `IconScroll`, `IconLetter`, `IconFire`, `IconBrokenCompass`, `IconBlurredMap`.

Shared props: `size=24`, `className`, `stroke="currentColor"`. All use `strokeWidth={1.5}`, `strokeLinecap="round"`, `strokeLinejoin="round"`.

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/primitives/icons/cartography-icons.tsx packages/ui/src/index.ts
git commit -m "feat(ui): cartography SVG icon set"
```

---

## Task 8: Brand assets and font loading

**Files:**
- Modify: `apps/web/src/brand/assets.ts`
- Modify: `apps/web/src/brand/head-links.ts`
- Create: `apps/web/public/cultiv-og-cartography.svg`

- [ ] **Step 1: Update assets.ts**

```typescript
export const BRAND_ICON_PATH = "/cultiv-compass-mark.svg";
export const BRAND_OG_IMAGE_PATH = "/cultiv-og-cartography.svg";
```

- [ ] **Step 2: Verify head-links.ts** — already loads Inter + Playfair critical, Caveat + JetBrains deferred. Remove any Bricolage/Fraunces/Source Serif references if present.

- [ ] **Step 3: Create OG SVG** — compass + headline "Sua voz. Seu território." on cream background with subtle grain.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/brand/assets.ts apps/web/public/cultiv-og-cartography.svg
git commit -m "feat(web): Cartography brand assets and OG image"
```

---

## Task 9: Visual governance

**Files:**
- Create: `tests/governance/cartography-visual-governance.test.ts`
- Delete: `tests/governance/imprint-visual-governance.test.ts` (after new test passes)

- [ ] **Step 1: Write cartography governance test**

```typescript
const IMPRINT_BANNED = [
  /PressMark/,
  /press-mark-geometry/,
  /imprint-grain/,
  /press-edge/,
  /InkBleed/,
  /Bricolage Grotesque/,
  /font-conducao(?!:)/,  // ban old token usage outside aliases
  /Fraunces/,
  /Source Serif 4/,
  /data-intensity=/,
  /BotanicalTree/,
  /BotanicalStem/,
  /ui-type-reading(?!.*logbook)/,
];

const CARTOGRAPHY_REQUIRED_IN_THEME = [
  /--color-deep-blue/,
  /--font-autoridade/,
  /cartography-grain/,
];
```

Scan `packages/ui/src` and `apps/web/src` — expect zero IMPRINT_BANNED matches (except migration alias block in theme.css during Phase 1).

- [ ] **Step 2: Run governance**

```bash
pnpm vitest run tests/governance/cartography-visual-governance.test.ts
```

Expected: FAIL initially (Imprint still present) — note failures for Task 20 cleanup.

- [ ] **Step 3: Commit test file**

```bash
git add tests/governance/cartography-visual-governance.test.ts
git commit -m "test: add Cartography visual governance"
```

---

## Task 10: Marketing i18n copy rewrite

**Files:**
- Modify: `apps/web/src/i18n/marketing/locales/pt.ts`
- Modify: `apps/web/src/i18n/marketing/locales/en.ts`
- Modify: `apps/web/src/i18n/marketing/types.ts` (if new keys)
- Modify: `apps/web/src/marketing/seo/resolve-page-head.ts`

- [ ] **Step 1: Rewrite pt.ts section keys** per spec §Marketing:

| Key area | pt-BR headline |
|----------|----------------|
| `hero.badge` | Acesso antecipado — mapa em construção |
| `hero.title` | A IA que aprende o mapa da sua voz — e escreve como se fosse você. |
| `hero.subtitle` | Cultiv aprende seu tom, sua cadência, sua assinatura… |
| `nav.territory` | O território |
| `nav.route` | A rota |
| `nav.tools` | Ferramentas |
| `nav.faq` | Perguntas |
| `nav.cta` | Explorar sua voz |
| `problem.title` | Por que a escrita com IA ainda não soa como você? |
| `howItWorks.title` | Cinco passos para mapear sua voz |
| `formats.title` | Seis territórios para sua mensagem |
| `comparison.verdict` | A autenticidade não é um luxo… |
| `comparison.signature` | Tecnologia de ponta, feita com alma de artesão. |
| `waitlist.title` | Comece a mapear sua voz |
| `footer.signature` | Com ♥ e ✦, Cultiv |
| `footer.handmade` | Feito à mão com IA |

- [ ] **Step 2: Rewrite en.ts** with adapted metaphors (Logbook, Chart your route, etc.)

- [ ] **Step 3: Update SEO**

```typescript
title: "Cultiv — Sua voz. Seu território. Suas palavras.";
description: "Cultiv aprende o mapa da sua voz e gera textos com sua assinatura autoral.";
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/i18n/marketing/ apps/web/src/marketing/seo/
git commit -m "feat(i18n): Cartography marketing copy pt-BR and en"
```

---

## Task 11: Marketing layout and chrome

**Files:**
- Modify: `apps/web/src/marketing/layouts/MarketingLayout.tsx`
- Modify: `apps/web/src/marketing/components/SiteHeader.tsx`
- Modify: `apps/web/src/marketing/components/SiteMobileNav.tsx`
- Modify: `apps/web/src/marketing/components/BrandMark.tsx`
- Modify: `apps/web/src/marketing/sections/FooterSection.tsx`
- Modify: `apps/web/src/styles/app.css`

- [ ] **Step 1: Replace `data-intensity="expressive"` with `data-surface="marketing"`** in MarketingLayout.

- [ ] **Step 2: Wrap children in atlas layout**

```tsx
<div className="relative flex">
  <aside className="hidden lg:block w-12 shrink-0">
    <RouteLine orientation="vertical" className="sticky top-24 h-[calc(100vh-6rem)]" />
  </aside>
  <div className="min-w-0 flex-1">{children}</div>
</div>
```

- [ ] **Step 3: Rebuild SiteHeader** — floating centered bar, max-w-960, backdrop-blur, dotted border, CompassMark + Playfair wordmark, anchor links, terracotta CTA.

- [ ] **Step 4: Rebuild BrandMark** — use `<CompassMark variant="horizontal" />` instead of PressMark.

- [ ] **Step 5: Rebuild FooterSection** — 3-column cartography footer per spec.

- [ ] **Step 6: Verify dev server**

```bash
pnpm --filter web dev
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/marketing/layouts/ apps/web/src/marketing/components/SiteHeader.tsx apps/web/src/marketing/components/BrandMark.tsx apps/web/src/marketing/components/SiteMobileNav.tsx apps/web/src/marketing/sections/FooterSection.tsx apps/web/src/styles/app.css
git commit -m "feat(marketing): Cartography layout, header, and footer"
```

---

## Task 12: Hero and Problem sections

**Files:**
- Modify: `apps/web/src/marketing/sections/HeroSection.tsx`
- Modify: `apps/web/src/marketing/sections/ProblemSection.tsx`
- Create: `apps/web/src/marketing/visual/HeroComparisonFrame.tsx`

- [ ] **Step 1: Rebuild HeroSection**

- CoordinateLabel `§00 · Entrada`
- Badge mono, Playfair display-xl headline, Inter body-lg subtitle
- Dual CTA buttons (primary terracotta + ghost secondary)
- Right column: `HeroComparisonFrame` — split generic/Cultiv with map-style border
- Remove HeroImprintArt, botanical, stamp reveal

- [ ] **Step 2: Rebuild ProblemSection**

- CoordinateLabel `§01 · O Território`
- 3 cards in fan layout using CSS `rotate(-2deg)`, `rotate(0)`, `rotate(2deg)` on desktop; stack on mobile
- Icons: IconBrokenCompass, IconRoute (interrupted), IconBlurredMap
- Remove Imprint SVG scenes (GenericOutputStack, FragilePromptCollage)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/marketing/sections/HeroSection.tsx apps/web/src/marketing/sections/ProblemSection.tsx apps/web/src/marketing/visual/HeroComparisonFrame.tsx
git commit -m "feat(marketing): Cartography hero and problem sections"
```

---

## Task 13: HowItWorks, Formats, Comparison sections

**Files:**
- Modify: `apps/web/src/marketing/sections/HowItWorksSection.tsx`
- Modify: `apps/web/src/marketing/sections/FormatsSection.tsx`
- Modify: `apps/web/src/marketing/sections/ComparisonSection.tsx`

- [ ] **Step 1: Rebuild HowItWorksSection** — vertical timeline with RouteLine, 5 steps, Intersection Observer active fill on circles.

- [ ] **Step 2: Rebuild FormatsSection** — CSS grid with asymmetric spans:

```css
.formats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.formats-grid .format-featured { grid-column: span 2; grid-row: span 2; }
```

- [ ] **Step 3: Rebuild ComparisonSection** — 50/50 meridian split; mobile tabs component.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/marketing/sections/HowItWorksSection.tsx apps/web/src/marketing/sections/FormatsSection.tsx apps/web/src/marketing/sections/ComparisonSection.tsx
git commit -m "feat(marketing): route, formats, and comparison sections"
```

---

## Task 14: Testimonial, Pricing, FAQ, Waitlist sections

**Files:**
- Modify: `apps/web/src/marketing/sections/TestimonialSection.tsx`
- Modify: `apps/web/src/marketing/sections/PricingSection.tsx`
- Modify: `apps/web/src/marketing/sections/FaqSection.tsx`
- Modify: `apps/web/src/marketing/sections/WaitlistSection.tsx`

- [ ] **Step 1: TestimonialSection** — centered Playfair italic quote, Caveat "Ps." margin note.

- [ ] **Step 2: PricingSection** — single card, border-double-cartography, mono seal.

- [ ] **Step 3: FaqSection** — numbered accordion using `@my-ai-orchestrator/ui` Accordion with mono index prefix.

- [ ] **Step 4: WaitlistSection** — inverted deep-blue background, cream text, off-white input.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/marketing/sections/TestimonialSection.tsx apps/web/src/marketing/sections/PricingSection.tsx apps/web/src/marketing/sections/FaqSection.tsx apps/web/src/marketing/sections/WaitlistSection.tsx
git commit -m "feat(marketing): testimonial, pricing, FAQ, and waitlist sections"
```

---

## Task 15: Marketing motion

**Files:**
- Create: `apps/web/src/marketing/animations/use-route-draw.ts`
- Modify: `apps/web/src/marketing/animations/use-section-reveal.ts` (or create if missing)
- Modify: `apps/web/src/marketing/sections/HeroSection.tsx`
- Remove/retire: `apps/web/src/marketing/animations/use-stamp-reveal.ts`, botanical animation files

- [ ] **Step 1: Implement use-route-draw.ts**

Hook accepts `ref` to section element; on intersect, animates nearest RouteLine segment via GSAP `strokeDashoffset` over 1.2s ease-out. Skip when `prefers-reduced-motion`.

- [ ] **Step 2: Implement use-section-reveal.ts**

Fade-up 400ms, stagger 80ms, translateY 12px. Replace stamp reveal usage in all sections.

- [ ] **Step 3: Hero word animation** — split headline into spans, opacity 0→1 at 60ms/word on mount.

- [ ] **Step 4: Optional parallax** — `usePaperParallax` shifting background-position max 3% on scroll; marketing only; disabled reduced-motion.

- [ ] **Step 5: Delete retired animation files** and botanical imports.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/marketing/animations/ apps/web/src/marketing/sections/
git commit -m "feat(marketing): Cartography motion — route draw, reveal, hero words"
```

---

## Task 16: Workspace i18n copy

**Files:**
- Modify: `apps/web/src/i18n/app/messages/pt.ts`
- Modify: `apps/web/src/i18n/app/messages/en.ts`
- Modify: `apps/web/src/i18n/generation-intents.ts`
- Modify: `apps/web/src/i18n/field-labels.ts`
- Modify: `apps/web/src/i18n/content-types.ts`
- Modify: `apps/web/src/app/voice/lib/voice-dashboard-copy.ts`

- [ ] **Step 1: Rewrite navigation labels**

| Key | pt-BR |
|-----|-------|
| `nav.generate` | Gerar |
| `nav.history` | Caderno de bordo |
| `nav.voice` | Mapa da voz |
| `nav.settings` | Ajustes de navegação |
| `nav.plans` | Recursos da jornada |

- [ ] **Step 2: Rewrite generation wizard copy** per `rebranding/generation-screen.md` — step titles, intent labels, "Traçar rota", drawer message.

- [ ] **Step 3: Rewrite voice dashboard copy** per `rebranding/voice-screen.md` — "Como você navega", "Como você traça rotas", accordion titles.

- [ ] **Step 4: Rewrite empty/error states** from spec table.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/i18n/ apps/web/src/app/voice/lib/voice-dashboard-copy.ts
git commit -m "feat(i18n): Cartography workspace copy pt-BR and en"
```

---

## Task 17: Workspace shell

**Files:**
- Modify: `apps/web/src/app/layouts/AppLayout.tsx`
- Modify: `apps/web/src/app/shell/AppShell.tsx`
- Modify: `apps/web/src/app/shell/AppSidebar.tsx`
- Modify: `apps/web/src/app/shell/AppBottomNav.tsx`
- Modify: `apps/web/src/app/shell/AppHeader.tsx`
- Modify: `apps/web/src/app/shell/app-shell-nav-ui.tsx`
- Modify: `apps/web/src/app/shell/app-shell-nav-icons.tsx`
- Modify: `apps/web/src/app/layouts/OnboardingLayout.tsx`

- [ ] **Step 1: Replace `data-intensity="quiet"` with `data-surface="workspace"`** in AppLayout, AppShell, OnboardingLayout.

- [ ] **Step 2: Rebuild AppSidebar** — fixed left, w-16 hover:w-55 transition 250ms, CompassMark top, vertical nav with terracotta active bar, cartography icons.

Remove `app-shell-dock`, `press-edge`, expandable dock pattern.

- [ ] **Step 3: Rebuild AppHeader** — mono breadcrumb via `CoordinateLabel`, credit badge, avatar menu.

- [ ] **Step 4: Rebuild AppBottomNav** — 4 items, 44px touch targets, terracotta active indicator.

- [ ] **Step 5: Adjust main content padding** — `pl-16 md:pl-16 lg:pl-20` for sidebar offset.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/layouts/ apps/web/src/app/shell/
git commit -m "feat(app): Cartography workspace shell and navigation"
```

---

## Task 18: Generation wizard and execution drawer

**Files:**
- Modify: `apps/web/src/app/generation/screens/GenerationScreen.tsx`
- Modify: `apps/web/src/app/generation/components/BriefingForm.tsx`
- Modify: `apps/web/src/app/generation/components/GenerationPreviewSidebar.tsx`
- Modify: `apps/web/src/app/shell/ActiveExecutionDrawer.tsx`

- [ ] **Step 1: Add wizard progress bar** — 3 markers (Explorar · Escala · Coordenadas) with RouteLine segment fill.

- [ ] **Step 2: Step 1** — replace intent UI with 2×3 `ExpeditionCard` grid using cartography icons.

- [ ] **Step 3: Step 2** — segmented depth control + optional territory input.

- [ ] **Step 4: Step 3** — 65/35 split; sticky credit card; "Traçar rota" primary button.

- [ ] **Step 5: Rebuild ActiveExecutionDrawer** — RouteLine progress loop, LogbookProse result, toolbar actions, 350ms slide transition.

- [ ] **Step 6: Replace ReadingSurface → LogbookProse** in preview sidebar.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/generation/ apps/web/src/app/shell/ActiveExecutionDrawer.tsx
git commit -m "feat(app): Cartography generation wizard and execution drawer"
```

---

## Task 19: Voice, history, plans, settings, onboarding

**Files:**
- Modify: `apps/web/src/app/voice/components/VoiceDashboard.tsx`
- Modify: `apps/web/src/app/voice/components/VoiceMirrorHero.tsx`
- Modify: `apps/web/src/app/voice/components/VoiceConfidenceRing.tsx`
- Modify: `apps/web/src/app/voice/components/VoiceReasoningSection.tsx`
- Modify: `apps/web/src/app/history/screens/ExecutionHistoryScreen.tsx`
- Modify: `apps/web/src/app/plans/screens/PlansScreen.tsx`
- Modify: `apps/web/src/app/settings/screens/SettingsScreen.tsx`
- Modify: `apps/web/src/app/onboarding/screens/OnboardingFlow.tsx`

- [ ] **Step 1: VoiceDashboard** — confidence ring ochre→terracotta, two-column logbook cards, numbered accordions, "Nova expedição" CTA.

- [ ] **Step 2: ExecutionHistoryScreen** — card list with status dots (moss/ochre/ghost), horizontal filter toggles, empty state with compass outline.

- [ ] **Step 3: PlansScreen** — 3 stacked cards (equipamento atual, novos instrumentos, suprimentos).

- [ ] **Step 4: SettingsScreen** — clean list, destructive "Apagar pegadas" with confirmation modal.

- [ ] **Step 5: OnboardingFlow** — logbook textarea step + compass confirmation step.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/voice/ apps/web/src/app/history/ apps/web/src/app/plans/ apps/web/src/app/settings/ apps/web/src/app/onboarding/
git commit -m "feat(app): Cartography voice, history, plans, settings, onboarding"
```

---

## Task 20: Retire Imprint and governance cleanup

**Files:**
- Delete: `packages/ui/src/primitives/PressMark.tsx`
- Delete: `packages/ui/src/primitives/press-mark-geometry.ts`
- Delete: `packages/ui/src/primitives/InkBleed.tsx`
- Modify: `packages/ui/src/primitives/PaperSurface.tsx` (re-export CartographySurface or delete)
- Modify: `packages/ui/src/primitives/ReadingSurface.tsx` (re-export LogbookProse or delete)
- Delete: `tests/ui/imprint-primitives.test.tsx`
- Delete: `tests/governance/imprint-visual-governance.test.ts`
- Delete: `apps/web/public/cultiv-press-mark.svg`, `cultiv-og-imprint.svg`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles/theme.css` (remove migration aliases)
- Modify: `docs/live/web-structure/design-system.md`
- Modify: `docs/live/web-structure/design-system-creative-direction.md`
- Modify: `CONTEXT.md`

- [ ] **Step 1: Remove Imprint exports from index.ts**

- [ ] **Step 2: Grep and replace remaining imports**

```bash
rg "PressMark|PaperSurface|ReadingSurface|InkBleed|imprint-grain|press-edge|data-intensity" apps/web packages/ui
```

Replace each with Cartography equivalent.

- [ ] **Step 3: Delete retired files**

- [ ] **Step 4: Remove migration aliases from theme.css**

- [ ] **Step 5: Run full governance + tests**

```bash
pnpm vitest run tests/governance/cartography-visual-governance.test.ts tests/ui/cartography-primitives.test.tsx
pnpm test
pnpm --filter web build
```

Expected: all PASS

- [ ] **Step 6: Update design system docs and CONTEXT.md** — replace Imprint glossary with Cartography terms.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: retire Cultiv Imprint, complete Cartography migration"
```

---

## Task 21: Quality verification gate

**Files:**
- Modify: `docs/progress-log.md`
- Modify: `docs/superpowers/specs/2026-06-23-cultiv-cartography-redesign-design.md` (status → implemented)

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 2: Production build**

```bash
pnpm --filter web build
```

Expected: PASS

- [ ] **Step 3: Manual QA checklist**

1. `/` and `/en/` — all 11 sections render; route line draws on scroll; reduced-motion disables draw
2. `/app/generate` — wizard 3 steps, expedition cards, drawer opens
3. `/app/voice` — confidence ring, logbook prose, accordions
4. `/app/history` — card list, filters, empty state
5. Compass crisp at 16px favicon and 512px OG
6. Keyboard: tab through nav, Escape closes drawer
7. Contrast spot-check: terracotta CTA on cream, deep-blue waitlist section

- [ ] **Step 4: Lighthouse (manual)**

Run on `/` mobile — target Performance ≥ 90, Accessibility ≥ 90.

- [ ] **Step 5: Update progress-log and spec status**

- [ ] **Step 6: Commit**

```bash
git add docs/progress-log.md docs/superpowers/specs/2026-06-23-cultiv-cartography-redesign-design.md
git commit -m "docs: mark Cartography redesign implemented"
```

---

## Spec coverage matrix

| Spec section | Task(s) |
|--------------|---------|
| Color system | 2 |
| Typography | 2, 6 |
| Compass logo | 4, 8 |
| Surface language | 2, 5 |
| Icons | 7 |
| Motion system | 3, 15 |
| Marketing §00–§09 | 10, 11, 12, 13, 14, 15 |
| Workspace shell | 17 |
| Onboarding | 16, 19 |
| Generation wizard | 16, 18 |
| Voice atlas | 16, 19 |
| History logbook | 16, 19 |
| Plans | 16, 19 |
| Settings | 16, 19 |
| Empty/error states | 16, 19 |
| Accessibility | 6, 17, 21 |
| i18n | 10, 16 |
| Retire Imprint | 20 |
| ADR 0010 | 1 |
| Success criteria | 21 |

---

## Execution order summary

```
Task 1 (ADR) → 2 (tokens) → 3 (motion) → 4 (CompassMark) → 5 (primitives) → 6 (Text/Button/Input) → 7 (icons) → 8 (assets) → 9 (governance test)
  → 10 (marketing copy) ∥ 16 (workspace copy)  [parallel OK]
  → 11–15 (marketing visual + motion)
  → 17–19 (workspace visual)
  → 20 (retire Imprint)
  → 21 (QA gate)
```

**Recommended:** Execute in a dedicated git worktree (`using-git-worktrees` skill) on branch `feat/cultiv-cartography-redesign`.
