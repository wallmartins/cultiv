# Issue 02 — Design Token Refresh

## What to build

Update the design token system in `packages/ui/src/styles/theme.css` to reflect the refined Cultiv Imprint identity. This includes color palette adjustments, type scale refinements, and surface treatment standardization.

### Color Token Updates

Refine the pigment palette with stricter usage rules:

| Token | Current | New | Role |
|-------|---------|-----|------|
| `--color-paper` | `#f3f0ea` | `#f3f0ea` (keep) | Base background |
| `--color-paper-elevated` | `#faf8f4` | `#faf8f4` (keep) | Cards, elevated surfaces |
| `--color-paper-pressed` | `#e8e4dc` | `#e8e4dc` (keep) | Pressed states |
| `--color-ink` | `#1a1a18` | `#1a1a18` (keep) | Primary text |
| `--color-ink-muted` | `#6b6860` | `#6b6860` (keep) | Secondary text |
| `--color-ink-ghost` | `#c8c4bc` | `#c8c4bc` (keep) | Borders, dividers |
| `--color-pigment-terracotta` | `#c4705a` | `#c4705a` (keep) | Primary CTA, active states |
| `--color-pigment-indigo` | `#3d4f7c` | `#3d4f7c` (keep) | Links, technical meta |
| `--color-pigment-ochre` | `#c4a35a` | `#c4a35a` (keep) | Growth, warmth, voice confidence |
| `--color-success` | `#5a8c6b` | `#5a8c6b` (keep) | Success states |
| `--color-error` | `#c45a5a` | `#c45a5a` (keep) | Error states |

Dark mode refinements:

| Token | Current | New |
|-------|---------|-----|
| `--color-paper` (dark) | `#1a1a18` | `#1a1a18` (keep) |
| `--color-paper-elevated` (dark) | `#2a2a26` | `#242420` (slightly warmer) |
| `--color-paper-pressed` (dark) | `#33332f` | `#2e2e2a` (slightly warmer) |

### Type Scale Updates

Refine the `display-xl` size for stronger visual impact:

```css
.ui-type-display-xl {
  font-size: clamp(3rem, 8vw, 5rem);  /* was clamp(2.75rem, 7vw, 4.25rem) */
  letter-spacing: -0.04em;            /* was -0.03em */
}
```

Add a new `ui-type-display-hero` utility for the marketing hero headline only:

```css
.ui-type-display-hero {
  font-family: var(--font-conducao);
  font-size: clamp(3.5rem, 9vw, 5.5rem);
  font-weight: 500;
  line-height: 1.02;
  letter-spacing: -0.045em;
  text-wrap: balance;
}
```

### Surface Treatment Audit

Verify and standardize:
- `imprint-grain` opacity: 0.08 for `expressive`, 0.04 for `quiet` (already correct)
- `--shadow-press-edge` consistency across all surfaces
- `--radius-press: 2px` applied consistently (no border-radius creep)
- Dark mode grain overlay opacity adjustment (reduce to 0.03 for quiet, 0.06 for expressive in dark)

### Tailwind Integration

Ensure all new tokens are available as Tailwind utilities. Run a search for any hardcoded color values that should use tokens instead.

## Acceptance criteria

- [ ] All color tokens in `theme.css` match the refined palette
- [ ] Dark mode overrides use the updated warmer elevated/pressed values
- [ ] `ui-type-display-xl` uses the refined size and spacing
- [ ] New `ui-type-display-hero` utility works correctly
- [ ] `imprint-grain` opacity is correct per intensity mode and color scheme
- [ ] No hardcoded color values remain in component files (all use Tailwind tokens)
- [ ] `--radius-press: 2px` is applied consistently across all card/button/input components
- [ ] Dark mode grain overlay is refined for reduced visual noise
- [ ] All existing Tailwind classes still resolve correctly after token changes

## Blocked by

- **Issue 01** — New logo colors may inform final token adjustments
