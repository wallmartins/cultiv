# Cultiv Imprint Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Cultiv's editorial/botanical visual language with the unified **Imprint** identity (Modernism + Arts and Crafts + Minimalism) across marketing and app surfaces.

**Architecture:** Rebuild `packages/ui` tokens and primitives first, then reskin marketing (`data-intensity="expressive"`) and app (`data-intensity="quiet"`) using the same components. Retire botanical assets, Playfair/Caveat, moss/golden palette, and ADR 0003 workspace split. Governance tests enforce the ban on legacy visual imports.

**Tech Stack:** Tailwind CSS v4 (`@theme`), React 19, GSAP + Lenis (marketing only), Vitest, `@fontsource/*` or Google Fonts.

**Spec:** [`docs/superpowers/specs/2026-06-22-cultiv-imprint-identity-design.md`](../specs/2026-06-22-cultiv-imprint-identity-design.md)

**Kickoff:** [`docs/live/kickoff/redisign-cultiv.md`](../../live/kickoff/redisign-cultiv.md)

---

## Locked decisions

| Decision | Value |
|----------|--------|
| Creative direction | Imprint (letterpress / paper / stamp) |
| Scope | Unified marketing + app |
| Survivors | Name "Cultiv" only |
| Primary sans | Bricolage Grotesque |
| Accent serif | Fraunces (scarce) |
| Reading serif | Source Serif 4 |
| Primary pigment | Terracotta `#C4705A` |
| Intensity modes | `expressive` (marketing), `quiet` (app) |
| ADR 0003 | Superseded |

## File map

| File | Responsibility |
|------|----------------|
| `packages/ui/src/styles/theme.css` | Imprint tokens, utilities, textures |
| `packages/ui/src/tokens/motion.ts` | Imprint motion tokens |
| `packages/ui/src/primitives/PressMark.tsx` | SVG logo mark |
| `packages/ui/src/primitives/PaperSurface.tsx` | Grain + press-edge wrapper |
| `packages/ui/src/primitives/ReadingSurface.tsx` | Immersive text preview shell |
| `packages/ui/src/primitives/InkBleed.tsx` | Decorative marketing background |
| `packages/ui/src/primitives/Button.tsx` | Terracotta CTA + press edge |
| `packages/ui/src/primitives/Text.tsx` | condução / impressão / leitura variants |
| `packages/ui/src/primitives/Input.tsx` | Press-edge inset + terracotta focus |
| `packages/ui/src/patterns/ComparisonCard.tsx` | Source Serif outputs |
| `packages/ui/src/index.ts` | Export new primitives |
| `apps/web/src/brand/head-links.ts` | Imprint font loading |
| `apps/web/src/brand/assets.ts` | New logo/OG paths |
| `apps/web/public/cultiv-press-mark.svg` | Favicon + app icon |
| `apps/web/public/cultiv-og-imprint.svg` | OG image |
| `apps/web/src/styles/app.css` | Intensity overrides (replace workspace token fork) |
| `apps/web/src/marketing/sections/*.tsx` | Marketing reskin (9 sections) |
| `apps/web/src/marketing/components/BrandMark.tsx` | Press Mark lockup |
| `apps/web/src/marketing/animations/use-stamp-reveal.ts` | Hero stamp motion |
| `apps/web/src/app/layouts/AppLayout.tsx` | `data-intensity="quiet"` |
| `apps/web/src/app/shell/AppShell.tsx` | Imprint quiet chrome |
| `apps/web/src/app/generation/**` | ReadingSurface preview |
| `tests/governance/imprint-visual-governance.test.ts` | Ban legacy fonts/colors/components |
| `tests/ui/imprint-primitives.test.tsx` | PressMark, Text variants |
| `docs/adr/0009-cultiv-imprint-identity.md` | Supersedes ADR 0003 |
| `docs/live/web-structure/design-system.md` | Updated reference |

## Out of scope

- Dark mode activation, custom engraved icon set (phase 3 polish), email templates, mobile app, product behavior changes.

## Migration aliases (Phase 0 only)

During rollout, keep temporary CSS aliases in `theme.css` so incremental reskins compile:

```css
--color-surface: var(--color-paper);
--color-foreground: var(--color-ink);
--color-muted: var(--color-ink-muted);
--color-accent: var(--color-pigment-terracotta);
--color-moss: var(--color-pigment-terracotta);
--color-golden: var(--color-pigment-ochre);
```

Remove aliases in Task 12 (governance cleanup).

---

## Task 1: ADR and spec status

**Files:**
- Create: `docs/adr/0009-cultiv-imprint-identity.md`
- Modify: `docs/adr/0003-workspace-visual-refresh.md`
- Modify: `docs/superpowers/specs/2026-06-22-cultiv-imprint-identity-design.md`

- [ ] **Step 1: Create ADR 0009**

```markdown
---
title: Cultiv Imprint Unified Identity
doc_type: adr
status: accepted
last_updated: 2026-06-22
supersedes: docs/adr/0003-workspace-visual-refresh.md
---

# Cultiv Imprint unified visual identity

Marketing and authenticated workspace share one Imprint design system with intensity modes (`expressive` / `quiet`). ADR 0003 workspace-only overrides are retired. See `docs/superpowers/specs/2026-06-22-cultiv-imprint-identity-design.md`.
```

- [ ] **Step 2: Mark ADR 0003 superseded**

Add frontmatter field `superseded_by: docs/adr/0009-cultiv-imprint-identity.md` and status note at top of `0003-workspace-visual-refresh.md`.

- [ ] **Step 3: Set spec status to `approved`**

Change `status: draft` → `status: approved` in the Imprint spec.

- [ ] **Step 4: Commit**

```bash
git add docs/adr/0009-cultiv-imprint-identity.md docs/adr/0003-workspace-visual-refresh.md docs/superpowers/specs/2026-06-22-cultiv-imprint-identity-design.md
git commit -m "docs: accept Cultiv Imprint identity ADR, supersede workspace-only refresh"
```

---

## Task 2: Imprint tokens and motion

**Files:**
- Modify: `packages/ui/src/styles/theme.css`
- Modify: `packages/ui/src/tokens/motion.ts`

- [ ] **Step 1: Write failing motion token test**

Create `tests/ui/imprint-motion-tokens.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { motionTokens } from "../../packages/ui/src/tokens/motion.js";

describe("imprint motion tokens", () => {
  it("defines press stamp duration", () => {
    expect(motionTokens.press.duration).toBe(0.45);
  });

  it("defines slow reveal for sections", () => {
    expect(motionTokens.reveal.duration).toBe(0.6);
    expect(motionTokens.reveal.y).toBe(12);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm exec vitest run tests/ui/imprint-motion-tokens.test.ts`

- [ ] **Step 3: Replace motion tokens**

```typescript
// packages/ui/src/tokens/motion.ts
export const motionTokens = {
  instant: { duration: 0.1, ease: "power1.out" },
  fast: { duration: 0.2, ease: "power2.out" },
  base: { duration: 0.35, ease: "power2.out" },
  slow: { duration: 0.6, ease: "power2.out" },
  press: { duration: 0.45, ease: "power3.out" },
  reveal: { duration: 0.6, y: 12, ease: "power2.out" },
  hover: { duration: 0.1, ease: "power1.out" },
  stagger: { tight: 0.06, base: 0.1, wide: 0.15 }
} as const;
```

- [ ] **Step 4: Replace `@theme` block in theme.css**

Replace fonts and colors at top of `packages/ui/src/styles/theme.css`:

```css
@theme {
  --font-conducao: "Bricolage Grotesque", system-ui, sans-serif;
  --font-impressao: "Fraunces", Georgia, serif;
  --font-leitura: "Source Serif 4", Georgia, serif;
  --font-body: var(--font-conducao);
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --color-paper: #f3f0ea;
  --color-paper-elevated: #faf8f4;
  --color-paper-pressed: #e8e4dc;
  --color-ink: #1a1a18;
  --color-ink-muted: #6b6860;
  --color-ink-ghost: #c8c4bc;
  --color-pigment-terracotta: #c4705a;
  --color-pigment-indigo: #3d4f7c;
  --color-pigment-ochre: #c4a35a;
  --color-success: #5a8c6b;
  --color-warning: #c4a35a;
  --color-error: #c45a5a;
  --color-info: #3d4f7c;

  --radius-press: 2px;
  --spacing-gutter: clamp(1.25rem, 4vw, 2.5rem);
  --spacing-section: 5.5rem;
  --spacing-section-sm: 3.5rem;
  --shadow-press-edge:
    inset 0 1px 0 rgb(255 255 255 / 0.4),
    inset 0 -1px 0 rgb(0 0 0 / 0.06);

  /* migration aliases — remove in Task 12 */
  --color-surface: var(--color-paper);
  --color-surface-elevated: var(--color-paper-elevated);
  --color-foreground: var(--color-ink);
  --color-muted: var(--color-ink-muted);
  --color-border-subtle: var(--color-ink-ghost);
  --color-accent: var(--color-pigment-terracotta);
  --color-moss: var(--color-pigment-terracotta);
  --color-golden: var(--color-pigment-ochre);
  --color-invert: var(--color-ink);
  --color-invert-foreground: var(--color-paper);
}
```

- [ ] **Step 5: Add Imprint utilities**

Append to `@layer utilities` in `theme.css`:

```css
.font-conducao { font-family: var(--font-conducao); }
.font-impressao { font-family: var(--font-impressao); }
.font-leitura { font-family: var(--font-leitura); }

.press-edge { box-shadow: var(--shadow-press-edge); }

.imprint-grain {
  position: relative;
}
.imprint-grain::after {
  content: "";
  pointer-events: none;
  position: absolute;
  inset: 0;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
}
[data-intensity="expressive"] .imprint-grain::after { opacity: 0.05; }
[data-intensity="quiet"] .imprint-grain::after,
:root:not([data-intensity]) .imprint-grain::after { opacity: 0.03; }

.ui-type-display-xl {
  font-family: var(--font-conducao);
  font-size: clamp(2.5rem, 6vw, 3.052rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-wrap: balance;
}
.ui-type-reading {
  font-family: var(--font-leitura);
  font-size: 1.125rem;
  line-height: 1.75;
  letter-spacing: 0.01em;
}
.ui-type-imprint {
  font-family: var(--font-impressao);
  font-size: 1.25rem;
  line-height: 1.4;
  letter-spacing: 0.02em;
}
```

- [ ] **Step 6: Run motion test — expect PASS**

Run: `pnpm exec vitest run tests/ui/imprint-motion-tokens.test.ts`

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/styles/theme.css packages/ui/src/tokens/motion.ts tests/ui/imprint-motion-tokens.test.ts
git commit -m "feat(ui): add Cultiv Imprint design tokens and motion scale"
```

---

## Task 3: Font loading

**Files:**
- Modify: `apps/web/src/brand/head-links.ts`

- [ ] **Step 1: Replace Google Fonts URLs**

```typescript
export const GOOGLE_FONTS_CRITICAL_STYLESHEET =
  `${GOOGLE_FONTS_BASE}?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600&display=swap`;

export const GOOGLE_FONTS_DEFERRED_STYLESHEET =
  `${GOOGLE_FONTS_BASE}?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=JetBrains+Mono:wght@400;500&display=swap`;
```

- [ ] **Step 2: Update mask-icon color**

In `brandHeadLinks()`, change `color: "#243830"` → `color: "#1A1A18"`.

- [ ] **Step 3: Verify dev server loads fonts**

Run: `pnpm --filter web dev` — open `/` and confirm computed `font-family` on body is Bricolage Grotesque.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/brand/head-links.ts
git commit -m "feat(web): load Imprint typography (Bricolage, Fraunces, Source Serif 4)"
```

---

## Task 4: PressMark and brand assets

**Files:**
- Create: `packages/ui/src/primitives/PressMark.tsx`
- Create: `apps/web/public/cultiv-press-mark.svg`
- Create: `apps/web/public/cultiv-og-imprint.svg`
- Modify: `packages/ui/src/index.ts`
- Modify: `apps/web/src/brand/assets.ts`
- Create: `tests/ui/imprint-primitives.test.tsx`

- [ ] **Step 1: Write failing PressMark test**

```tsx
// tests/ui/imprint-primitives.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PressMark } from "../../packages/ui/src/primitives/PressMark.js";

describe("PressMark", () => {
  it("renders accessible logo mark", () => {
    render(<PressMark />);
    expect(screen.getByRole("img", { name: /cultiv/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm exec vitest run tests/ui/imprint-primitives.test.tsx`

- [ ] **Step 3: Implement PressMark**

```tsx
// packages/ui/src/primitives/PressMark.tsx
import type { SVGProps } from "react";
import { cn } from "../lib/cn.js";

export interface PressMarkProps extends SVGProps<SVGSVGElement> {
  readonly size?: number;
}

export function PressMark({ size = 48, className, ...props }: PressMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Cultiv"
      className={cn("press-edge", className)}
      {...props}
    >
      <path
        d="M4 6 L44 5 L46 43 L5 44 Z"
        fill="var(--color-paper-elevated)"
        stroke="var(--color-ink-ghost)"
        strokeWidth="0.5"
      />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fontFamily="var(--font-conducao)"
        fontSize="22"
        fontWeight="600"
        fill="var(--color-ink)"
      >
        C
      </text>
    </svg>
  );
}
```

- [ ] **Step 4: Export from index.ts**

Add: `export { PressMark, type PressMarkProps } from "./primitives/PressMark.js";`

- [ ] **Step 5: Update brand asset paths**

```typescript
// apps/web/src/brand/assets.ts
export const BRAND_ICON_PATH = "/cultiv-press-mark.svg";
export const BRAND_OG_IMAGE_PATH = "/cultiv-og-imprint.svg";
// Remove unused wordmark paths or point to new SVGs
```

- [ ] **Step 6: Add static SVGs** matching PressMark geometry for favicon and OG (1200×630, paper background, grain, wordmark in Bricolage).

- [ ] **Step 7: Run test — expect PASS**

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/primitives/PressMark.tsx packages/ui/src/index.ts apps/web/public/cultiv-press-mark.svg apps/web/public/cultiv-og-imprint.svg apps/web/src/brand/assets.ts tests/ui/imprint-primitives.test.tsx
git commit -m "feat(ui): add Press Mark logo primitive and brand SVGs"
```

---

## Task 5: Surface primitives (PaperSurface, ReadingSurface, InkBleed)

**Files:**
- Create: `packages/ui/src/primitives/PaperSurface.tsx`
- Create: `packages/ui/src/primitives/ReadingSurface.tsx`
- Create: `packages/ui/src/primitives/InkBleed.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `tests/ui/imprint-primitives.test.tsx`

- [ ] **Step 1: Add ReadingSurface test**

```tsx
it("ReadingSurface renders children with leitura typography", () => {
  render(<ReadingSurface>Sample output</ReadingSurface>);
  const el = screen.getByText("Sample output");
  expect(el.className).toMatch(/ui-type-reading/);
});
```

- [ ] **Step 2: Implement primitives**

```tsx
// PaperSurface.tsx
export function PaperSurface({ className, children, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("imprint-grain bg-paper press-edge", className)} {...props}>
      {children}
    </div>
  );
}

// ReadingSurface.tsx
export function ReadingSurface({ className, children, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("bg-paper px-6 py-8", className)} {...props}>
      <div className="ui-type-reading text-ink">{children}</div>
    </div>
  );
}

// InkBleed.tsx — marketing/onboarding only
export function InkBleed({ pigment = "terracotta", className }: { pigment?: "terracotta" | "ochre"; className?: string }) {
  const color = pigment === "ochre" ? "var(--color-pigment-ochre)" : "var(--color-pigment-terracotta)";
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        background: `radial-gradient(ellipse 60% 50% at 70% 20%, color-mix(in srgb, ${color} 8%, transparent), transparent 70%)`
      }}
    />
  );
}
```

- [ ] **Step 3: Export all three from `index.ts`**

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(ui): add PaperSurface, ReadingSurface, and InkBleed primitives"
```

---

## Task 6: Rebuild core primitives (Button, Text, Input)

**Files:**
- Modify: `packages/ui/src/primitives/Button.tsx`
- Modify: `packages/ui/src/primitives/ButtonLink.tsx`
- Modify: `packages/ui/src/primitives/Text.tsx`
- Modify: `packages/ui/src/primitives/Input.tsx`
- Modify: `packages/ui/src/styles/theme.css` (`.ui-btn` styles)
- Modify: `tests/ui/imprint-primitives.test.tsx`

- [ ] **Step 1: Add Button variant test**

```tsx
it("Button primary uses terracotta pigment", () => {
  render(<Button variant="primary">Join</Button>);
  expect(screen.getByRole("button").className).toMatch(/bg-pigment-terracotta/);
});
```

- [ ] **Step 2: Update Button variants**

```typescript
const variantClasses = {
  primary:
    "border border-pigment-terracotta bg-pigment-terracotta text-paper-elevated hover:brightness-105 press-edge",
  ghost:
    "border border-ink-ghost bg-transparent text-ink hover:bg-paper-pressed press-edge",
  invert:
    "border border-paper bg-paper text-ink hover:bg-transparent hover:text-paper press-edge"
} as const;
```

Update `.ui-btn` in theme.css: remove `text-transform: uppercase` and editorial tracking; use `letter-spacing: 0.04em` only on caption-sized buttons.

- [ ] **Step 3: Replace Text variants**

```typescript
const variantClasses = {
  "display-xl": "ui-type-display-xl",
  display: "font-conducao text-[clamp(1.75rem,4vw,2.441rem)] font-medium leading-[1.15] tracking-[-0.01em]",
  "heading-lg": "font-conducao text-[clamp(1.5rem,3vw,1.953rem)] font-semibold leading-[1.2]",
  heading: "font-conducao text-[clamp(1.25rem,2.5vw,1.563rem)] font-semibold leading-[1.25]",
  "body-lg": "font-conducao text-[1.25rem] leading-[1.5]",
  body: "font-conducao text-base leading-[1.6]",
  reading: "ui-type-reading",
  imprint: "ui-type-imprint",
  caption: "font-conducao text-[0.8rem] font-medium uppercase tracking-[0.04em] text-ink-muted",
  label: "font-conducao text-[0.8rem] font-medium uppercase tracking-[0.04em] text-ink-muted",
  meta: "font-conducao text-sm leading-[1.65] text-ink-muted",
  mono: "font-mono text-xs leading-relaxed text-pigment-indigo"
} as const;
```

Remove: `chapter`, `handwritten`, legacy `h1`/`h2`/`h3` that used Caveat — map call sites to `display` / `heading-lg` / `heading` during Task 8–9.

- [ ] **Step 4: Update Input** — add `press-edge rounded-[var(--radius-press)] focus-visible:ring-2 focus-visible:ring-pigment-terracotta/40`

- [ ] **Step 5: Run tests — expect PASS**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(ui): rebuild Button, Text, and Input for Imprint identity"
```

---

## Task 7: Intensity modes and app.css simplification

**Files:**
- Modify: `apps/web/src/app/layouts/AppLayout.tsx`
- Modify: `apps/web/src/routes/__root.tsx` or marketing layout root
- Modify: `apps/web/src/styles/app.css`

- [ ] **Step 1: Set intensity on marketing root**

On marketing page wrapper (e.g. showcase route layout), add `data-intensity="expressive"`.

- [ ] **Step 2: Set intensity on app root**

In `AppLayout.tsx` root element, replace `data-surface="workspace"` with `data-intensity="quiet"`.

- [ ] **Step 3: Remove ADR 0003 workspace overrides from app.css**

Delete `[data-surface="workspace"]` typography overrides and `--workspace-*` custom properties. Imprint tokens from `theme.css` are now the single source.

Keep only app-specific layout vars (`--app-header-height`, bottom nav, drawer animations).

- [ ] **Step 4: Smoke test both surfaces**

Run: `pnpm --filter web dev` — visit `/` (expressive grain) and `/app/generate` (quiet grain, terracotta CTA).

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(web): replace workspace surface fork with Imprint intensity modes"
```

---

## Task 8: Remove legacy marketing visuals

**Files:**
- Delete: `apps/web/src/marketing/visual/illustrations/Botanical*.tsx`
- Delete: `apps/web/src/marketing/visual/FallingLeavesLayer.tsx`
- Delete: `apps/web/src/marketing/visual/typography/TypeVine.tsx`
- Delete: `apps/web/src/marketing/visual/typography/HandwrittenNote.tsx`
- Delete: `apps/web/src/marketing/visual/illustrations/WaveformScript.tsx`
- Delete: `apps/web/src/marketing/animations/use-botanical-upright.ts`
- Delete: `apps/web/src/marketing/animations/use-falling-leaves.ts`
- Delete: `apps/web/src/marketing/animations/use-draw-stroke.ts`
- Delete: `apps/web/src/marketing/components/SolutionBreathScrolly.tsx`
- Delete: `apps/web/public/cultiv-logo-full.svg`, `cultiv-logo-dark.svg`, `cultiv-icon.svg`, `cultiv-og.svg`
- Modify: `packages/ui/src/styles/theme.css` — remove `.editorial-rule`, `.editorial-frame`, `.organic-glow*`, `.hero-tree-layer`, `.solution-breath-*`, `.scene-artifact-mat*`, legacy `.ui-type-chapter/handwritten/display` Caveat rules

- [ ] **Step 1: Delete files listed above**

- [ ] **Step 2: Fix imports** — run `pnpm --filter web build` and resolve every broken import by removing usage (Tasks 9–10 will replace section content).

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(web): remove legacy botanical and editorial marketing assets"
```

---

## Task 9: Marketing reskin — hero, header, footer

**Files:**
- Modify: `apps/web/src/marketing/sections/HeroSection.tsx`
- Modify: `apps/web/src/marketing/components/BrandMark.tsx`
- Modify: `apps/web/src/marketing/components/SiteHeader.tsx`
- Modify: `apps/web/src/marketing/sections/FooterSection.tsx`
- Create: `apps/web/src/marketing/animations/use-stamp-reveal.ts`

- [ ] **Step 1: Create use-stamp-reveal hook**

```typescript
// use-stamp-reveal.ts — GSAP scale 0.92→1 + opacity, respects prefers-reduced-motion
export function useStampReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;
    gsap.fromTo(ref.current, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "power3.out" });
  }, []);
  return ref;
}
```

- [ ] **Step 2: Rebuild HeroSection**

Replace botanical tree + falling leaves with:

```tsx
<PaperSurface className="relative flex h-hero-viewport items-center justify-center">
  <InkBleed />
  <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-[var(--spacing-gutter)] text-center">
    <PressMark ref={stampRef} size={64} className="mb-8" />
    <Text as="h1" variant="display-xl" data-hero-item>{hero.headline}</Text>
    <Text as="p" variant="imprint" className="mt-4 text-ink-muted">{hero.tagline}</Text>
    <Text as="p" variant="body-lg" className="mt-6 max-w-xl text-ink-muted">{hero.subheadline}</Text>
    {/* CTAs unchanged structure, Imprint Button */}
  </div>
</PaperSurface>
```

Remove: `WordReveal`, `BotanicalTree`, `FallingLeavesLayer`, `useDrawStroke`, `useBotanicalUpright`.

- [ ] **Step 3: Update BrandMark** to `[PressMark] + wordmark` in Bricolage

- [ ] **Step 4: Update SiteHeader/Footer** — replace moss/editorial classes with ink/pigment-terracotta; remove Playfair references

- [ ] **Step 5: Visual check** — hero shows stamp animation, no botanics

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(marketing): Imprint hero, header, and footer"
```

---

## Task 10: Marketing reskin — remaining sections

**Files:**
- Modify: all remaining `apps/web/src/marketing/sections/*.tsx`
- Modify: `packages/ui/src/patterns/ComparisonCard.tsx`
- Modify: `packages/ui/src/patterns/SectionHeader.tsx`

- [ ] **Step 1: SectionHeader** — use `variant="display"` Bricolage, remove Playfair/chapter styles

- [ ] **Step 2: ComparisonCard** — wrap outputs in `ReadingSurface`; replace `editorial-rule` with `border-ink-ghost`; use `variant="reading"` for generic/voice outputs

- [ ] **Step 3: Reskin each section**

| Section | Key change |
|---------|------------|
| `ProblemSection` | Replace botanical scenes with `PaperSurface` + typographic proof |
| `SolutionBreathSection` | Replace scrolly with static `PaperSurface` grid of chips |
| `DifferentiatorsSection` | Remove voice-root botanical art; use Press Mark + text |
| `ProductFlowSection` | Replace `BotanicalStem` with numbered grid steps |
| `UseCasesSection` | Imprint cards with press edge |
| `FaqSection` | Standard accordion on paper |
| `WaitlistSection` | `InkBleed` + invert paper/ink; terracotta CTA |

- [ ] **Step 4: Replace all `variant="handwritten"` / `font-display` / `font-handwritten` usages** in marketing tree:

Run: `rg 'handwritten|font-display|Playfair|Caveat|editorial-rule|text-moss|text-golden' apps/web/src/marketing`

Fix every hit.

- [ ] **Step 5: Build passes**

Run: `pnpm --filter web build`

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(marketing): reskin all showcase sections to Imprint"
```

---

## Task 11: App reskin — shell and navigation

**Files:**
- Modify: `apps/web/src/app/shell/AppShell.tsx`
- Modify: `apps/web/src/app/shell/AppHeader.tsx`
- Modify: `apps/web/src/app/shell/AppBottomNav.tsx`
- Modify: `apps/web/src/app/shell/app-shell-nav-ui.tsx`

- [ ] **Step 1: Replace glass/organic-glow** with `PaperSurface` quiet chrome — press-edge nav dock, terracotta active state

- [ ] **Step 2: Update nav icons** — stroke color `ink` / active `pigment-terracotta` (keep existing SVG paths)

- [ ] **Step 3: App header** — Bricolage `heading-lg`, Press Mark compact icon

- [ ] **Step 4: Smoke test navigation** — all routes reachable, active state visible

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(app): Imprint quiet shell and navigation"
```

---

## Task 12: App reskin — generation, execution, voice

**Files:**
- Modify: `apps/web/src/app/generation/screens/GenerationScreen.tsx`
- Modify: `apps/web/src/app/generation/components/GenerationPreviewSidebar.tsx`
- Modify: `apps/web/src/app/execution/components/ExecutionResultView.tsx`
- Modify: `apps/web/src/app/shell/ActiveExecutionDrawer.tsx`
- Modify: `apps/web/src/app/voice/components/VoiceConfidenceRing.tsx`

- [ ] **Step 1: Generation preview** — wrap output in `ReadingSurface`; form labels stay Bricolage caption

- [ ] **Step 2: Execution drawer** — reading typography for result body; toolbar uses press-edge buttons; drawer slide animation unchanged

- [ ] **Step 3: Voice confidence ring** — replace moss/golden gradient with terracotta→ochre pigment arc

- [ ] **Step 4: Voice dashboard accents** — terracotta for primary actions only

- [ ] **Step 5: Run web tests**

Run: `pnpm exec vitest run tests/web`

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(app): Imprint generation preview, execution drawer, and voice accents"
```

---

## Task 13: Governance test and token cleanup

**Files:**
- Create: `tests/governance/imprint-visual-governance.test.ts`
- Modify: `packages/ui/src/styles/theme.css`

- [ ] **Step 1: Write governance test**

```typescript
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { globSync } from "glob";

const LEGACY_PATTERNS = [
  /Playfair Display/,
  /Caveat/,
  /font-handwritten/,
  /ui-type-handwritten/,
  /BotanicalTree/,
  /BotanicalStem/,
  /FallingLeavesLayer/,
  /editorial-rule/,
  /#6b9080/, // legacy moss
  /#d4a843/  // legacy golden
];

describe("imprint visual governance", () => {
  it("contains no legacy visual patterns in ui and web source", () => {
    const files = globSync("{packages/ui,apps/web}/src/**/*.{ts,tsx,css}", { nodir: true });
    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      for (const pattern of LEGACY_PATTERNS) {
        if (pattern.test(content)) violations.push(`${file}: ${pattern}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
```

- [ ] **Step 2: Run governance test — expect PASS** (fix any remaining violations)

Run: `pnpm exec vitest run tests/governance/imprint-visual-governance.test.ts`

- [ ] **Step 3: Remove migration aliases** from `theme.css` (the `--color-surface: var(--color-paper)` block)

- [ ] **Step 4: Run full test suite**

Run: `pnpm exec vitest run`

- [ ] **Step 5: Commit**

```bash
git commit -m "test: add Imprint visual governance and remove legacy token aliases"
```

---

## Task 14: Documentation and CONTEXT.md

**Files:**
- Modify: `docs/live/web-structure/design-system.md`
- Modify: `docs/live/web-structure/design-system-creative-direction.md`
- Modify: `CONTEXT.md`
- Modify: `docs/progress-log.md`

- [ ] **Step 1: Rewrite design-system.md** — Imprint tokens, typography roles, intensity modes, primitive inventory

- [ ] **Step 2: Replace creative-direction.md** with Imprint philosophy summary (link to spec)

- [ ] **Step 3: Update CONTEXT.md glossary** — replace Workspace Visual Refresh / Workspace Typography entries with Imprint unified identity terms

- [ ] **Step 4: Commit**

```bash
git commit -m "docs: update design system reference for Cultiv Imprint"
```

---

## Task 15: Quality verification

**Files:** none (verification only)

- [ ] **Step 1: Lighthouse audit on marketing page**

Run Lighthouse on `/` — target Performance ≥ 90, Accessibility ≥ 90

- [ ] **Step 2: Reduced motion check**

Enable `prefers-reduced-motion: reduce` in browser — confirm no Lenis, no GSAP transforms, stamp/static render

- [ ] **Step 3: Card recognition test**

Screenshot an isolated `PaperSurface` + `ComparisonCard` — confirm Cultiv signature without logo (manual design review)

- [ ] **Step 4: Update spec status to `implemented`**

- [ ] **Step 5: Final commit**

```bash
git commit -m "docs: mark Cultiv Imprint identity as implemented"
```

---

## Spec coverage checklist

| Spec section | Task |
|--------------|------|
| Foundation principles | Task 1, 2 |
| Typography | Task 2, 3, 6 |
| Color & texture | Task 2, 5 |
| Press Mark brand | Task 4 |
| Shape grammar | Task 4, 6 |
| Motion language | Task 2, 9 |
| Surface modes | Task 7 |
| Primitives rebuild | Task 5, 6 |
| Asset removal | Task 8 |
| Marketing reskin | Task 9, 10 |
| App reskin | Task 11, 12 |
| Governance tests | Task 13 |
| Documentation | Task 14 |
| Quality criteria | Task 15 |
