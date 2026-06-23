# Issue 01 — Logo & Brand Mark Redesign

## What to build

Redesign the Cultiv PressMark logo across all variants and sizes. The new mark should fuse Modernism (geometric precision), Arts & Crafts (organic ink warmth), and Minimalism (breathing space) into a single cohesive symbol.

The concept is "The Mark of Authorship": a single flowing stroke that evokes both a handwritten signature and a growing plant stem. At small sizes it's a pure geometric mark (stroke + dot); at medium sizes it gains subtle ink-bleed texture; at large sizes the full texture, paper plate backdrop, and warm shadow are revealed.

### Logo Variants

| Variant | Use Case | Description |
|---------|----------|-------------|
| **Mark Only** | Favicon, app icon, header compact | Flowing stroke + dot, no text |
| **Mark + Wordmark Horizontal** | Header, footer | Mark left, "Cultiv" right in Bricolage Grotesque |
| **Mark + Wordmark Stacked** | Social, OG image | Mark above, "Cultiv" below |
| **Wordmark Only** | Inline text references | "Cultiv" in Bricolage Grotesque 500 |

### Assets to Produce

- SVG mark (all 4 variants, light + dark themes)
- PNG raster exports at 16, 32, 48, 64, 128, 256, 512px
- Favicon (`.ico` + `.svg`)
- Apple touch icon (180x180 PNG)
- OG image template (1200x630, mark + "Cultiv" wordmark + tagline on paper gradient)

### Component Rewrite

Rewrite `PressMark.tsx` in `packages/ui/src/primitives/` to render the new mark geometry. Rewrite `press-mark-geometry.ts` with the new SVG path data. The component must support:
- `size` prop (renders crisp at 16px to 512px)
- `variant` prop (compact / balanced / bold) with auto-detection from size
- CSS custom property theming (existing `--color-pigment-*`, `--color-paper-*`, `--color-ink-*`)
- `aria-label="Cultiv"` for accessibility

### File Updates

- `apps/web/public/cultiv-press-mark.svg` — replace with new mark SVG
- `apps/web/public/cultiv-og-imprint.svg` — new OG image
- `apps/web/public/favicon.svg` + `favicon.ico` — new favicons
- `apps/web/public/apple-touch-icon.png` — new Apple touch icon
- `apps/web/public/og.png` — raster fallback
- `apps/web/src/brand/assets.ts` — update asset paths if filenames change
- `apps/web/src/brand/head-links.ts` — update favicon/apple-touch-icon paths if needed

## Acceptance criteria

- [ ] New PressMark renders crisply at 16px, 32px, 48px, 64px, 128px, 256px, 512px
- [ ] All 4 logo variants (mark only, horizontal, stacked, wordmark) exist as SVG
- [ ] Light and dark theme variants both look correct
- [ ] `PressMark.tsx` component passes existing snapshot tests (update snapshots)
- [ ] Favicon displays correctly in Chrome, Firefox, Safari
- [ ] Apple touch icon renders on iOS home screen
- [ ] OG image displays correctly when sharing the site URL
- [ ] `aria-label="Cultiv"` is present on the SVG element
- [ ] No visual regressions in existing uses of `PressMark` (header, sidebar, onboarding)

## Blocked by

None — can start immediately.
