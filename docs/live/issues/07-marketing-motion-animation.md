# Issue 07 — Marketing Motion & Animation Refinement

## What to build

Refine the marketing surface animations for the new brand identity. The goal is faster, subtler motion that feels like paper being printed — grid-aligned entries, fade + micro-settle, no bounce or elastic.

### Animation Changes

#### Timing Refinements

Reduce animation durations by ~15% across the board for snappier feel:

| Animation | Current Duration | New Duration |
|-----------|-----------------|-------------|
| Section reveal | 0.6s | 0.5s |
| Stagger base | 0.1s | 0.085s |
| Stagger tight | 0.06s | 0.05s |
| Hover transform | 0.2s | 0.18s |
| Ink bleed opacity | 0.6s | 0.5s |

Update `packages/ui/src/tokens/motion.ts`:
```ts
export const motion = {
  instant: { duration: 0.1, ease: "power2.out" },
  fast: { duration: 0.18, ease: "power2.out" },
  base: { duration: 0.32, ease: "power2.inOut" },    // was 0.35
  slow: { duration: 0.52, ease: "power2.inOut" },     // was 0.6
  press: { duration: 0.4, ease: "power2.inOut" },     // was 0.45
  reveal: { duration: 0.5, ease: "power2.out" },      // was 0.6
  hover: { duration: 0.18, ease: "power2.out" },      // was 0.2
  stagger: {
    tight: 0.05,   // was 0.06
    base: 0.085,   // was 0.1
    wide: 0.14,    // was 0.15
  },
};
```

#### New: Paper Texture Parallax

Add a subtle parallax effect on paper surfaces during scroll. The grain texture moves at 97% of scroll speed (3% lag), creating a sense of physical paper depth.

- Apply to `PaperSurface` components in marketing sections
- Only on desktop (skip on mobile for performance)
- Only when `prefers-reduced-motion: no-preference`
- Use `IntersectionObserver` + `requestAnimationFrame` for performance

#### New: Solution Keyword Chip Hover

Add subtle scale + shadow on solution keyword chips:
```css
@media (prefers-reduced-motion: no-preference) {
  .solution-keyword-chip {
    transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
  }
  .solution-keyword-chip:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--color-ink) 8%, transparent);
  }
}
```

#### Reduced Motion Compliance

Audit all marketing animations for `prefers-reduced-motion` compliance:
- All GSAP animations should fall back to opacity-only transitions
- Scroll-triggered reveals should use opacity fade only (no transform)
- Stagger animations should be instant (all elements appear at once)
- Parallax should be disabled entirely

Update `apps/web/src/marketing/animations/prefers-reduced-motion.ts` to export a consistent detection hook used by all animation files.

### Files to Modify

- `packages/ui/src/tokens/motion.ts` — timing refinements
- `apps/web/src/marketing/animations/use-section-reveal.ts` — update duration
- `apps/web/src/marketing/animations/use-stagger.ts` — update stagger timing
- `apps/web/src/marketing/animations/use-stamp-reveal.ts` — update duration
- `apps/web/src/marketing/animations/use-scroll-reveal.ts` — update duration
- `apps/web/src/marketing/animations/use-differentiator-chapters.ts` — verify timing
- `apps/web/src/marketing/animations/use-mobile-breath-beats-reveal.ts` — verify timing
- `apps/web/src/marketing/animations/prefers-reduced-motion.ts` — ensure consistent detection
- `apps/web/src/marketing/components/SolutionBreathChip.tsx` — add hover effect
- `packages/ui/src/primitives/PaperSurface.tsx` — add parallax (marketing only)
- `apps/web/src/marketing/components/ProductShowcase.tsx` — wire parallax provider

## Acceptance criteria

- [ ] Motion tokens in `motion.ts` match the refined durations
- [ ] Section reveals complete in ~0.5s (was 0.6s)
- [ ] Stagger animations feel snappier (tight: 0.05s, base: 0.085s)
- [ ] Paper texture parallax works on desktop (3% scroll lag)
- [ ] Paper texture parallax is disabled on mobile
- [ ] Solution keyword chips scale 1.02x on hover with shadow
- [ ] All `prefers-reduced-motion` fallbacks are opacity-only
- [ ] No animation jank on mid-range devices
- [ ] GSAP animations respect `prefers-reduced-motion: reduce`
- [ ] No console warnings about motion or performance

## Blocked by

- **Issue 05** — Marketing components must be updated before animation refinements
