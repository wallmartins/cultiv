# Issue 05 — Marketing Surface Components Refresh

## What to build

Update all marketing section components in `apps/web/src/marketing/sections/` to reflect the new brand identity. This includes layout refinements, new illustration slots, updated component wiring for the new copy structure, and visual consistency with the refreshed tokens.

### Section-by-Section Changes

#### HeroSection.tsx
- Replace `display-xl` variant with new `display-hero` on the headline
- Update `BrandMark` import to use the new PressMark component
- Keep word-by-word headline animation, staggered fade-up for subheadline + CTAs
- Remove scroll cue (already removed)
- Keep botanical tree draw + falling leaves animation
- Replace `HeroImprintArt` with new illustration (see Issue 06)
- Ensure the imprint note uses `imprint` variant with `text-pigment-terracotta`

#### ProblemSection.tsx
- Update copy references to match new `problem` section structure
- Simplify the visual scenes (GenericOutputStack, FragilePromptCollage) — fewer elements, more breathing space
- Use terracotta accent lines to connect visuals to copy
- Keep alternating two-column layout (desktop) with typographic SVG scenes

#### SolutionBreathSection.tsx
- Update copy references for new `solutionBreath` structure (keywords are now single words: "Voz", "Memória", "Formato", "Escala")
- Keep organic constellation layout
- Add subtle ochre-to-terracotta gradient on keyword chips
- Keep hover/tap micro-copy reveal

#### DifferentiatorsSection.tsx
- Update copy references for new `differentiators` structure (4 chapters)
- Keep scroll-pinned chapter panels (desktop) and stacked cards (mobile)
- ShowcaseTeaser panel uses richer background (already the case)
- Other chapters use lighter scenes with terracotta accent rules

#### UseCasesSection.tsx
- Update copy references for new `useCases` structure
- Keep three-column editorial triptych with format badges
- No background imagery — clean paper + ink + terracotta accent

#### ProductFlowSection.tsx
- Update copy references for new `productFlow` structure
- Keep vertical BotanicalStem connector with 5 steps
- Simplify step icons — clean geometric shapes (Modernist)
- Add terracotta gradient on the active step

#### WaitlistSection.tsx
- Update copy references for new `socialProof` and `waitlist` structure
- Keep inverted dark section treatment
- Update consent text reference

#### FaqSection.tsx
- Update copy references for new `faq` array structure
- Keep accordion pattern (already using `Accordion` primitive from `packages/ui`)

#### FooterSection.tsx
- Update copy references for new `footer` structure
- Keep brand mark + contact + privacy + terms + locale toggle layout
- Add social links placeholder (optional, can be empty for now)

### Component-Wide Changes

- Update all `getLocaleMessages(locale)` destructuring to match new type structure
- Ensure all section IDs match navigation anchors (`#hero`, `#problema`, `#solution`, `#diferenciais`, `#casos-de-uso`, `#product-flow`, `#waitlist`)
- Verify all responsive layouts work at 320px, 768px, 1024px, 1280px, 1536px breakpoints
- Ensure `data-intensity="expressive"` is set on all marketing layout roots

### Files to Modify

- `apps/web/src/marketing/sections/HeroSection.tsx`
- `apps/web/src/marketing/sections/ProblemSection.tsx`
- `apps/web/src/marketing/sections/SolutionBreathSection.tsx`
- `apps/web/src/marketing/sections/DifferentiatorsSection.tsx`
- `apps/web/src/marketing/sections/UseCasesSection.tsx`
- `apps/web/src/marketing/sections/ProductFlowSection.tsx`
- `apps/web/src/marketing/sections/WaitlistSection.tsx`
- `apps/web/src/marketing/sections/FaqSection.tsx`
- `apps/web/src/marketing/sections/FooterSection.tsx`
- `apps/web/src/marketing/components/BrandMark.tsx`
- `apps/web/src/marketing/components/ImprintSectionLead.tsx`
- `apps/web/src/marketing/components/SolutionBreathChip.tsx`
- `apps/web/src/marketing/components/ProblemPerspectiveRow.tsx`
- `apps/web/src/marketing/visual/typography/StampBadge.tsx`
- `apps/web/src/marketing/components/ViewportBelowFoldSections.tsx`
- `apps/web/src/marketing/components/BelowFoldSections.tsx`

## Acceptance criteria

- [ ] All 9 marketing sections render without TypeScript errors
- [ ] All sections display the new copy from Issues 03/04
- [ ] Hero headline uses the new `display-hero` type utility
- [ ] Solution keyword chips have ochre-to-terracotta gradient on hover
- [ ] Differentiator chapters maintain scroll-pinned behavior on desktop
- [ ] Product flow steps use simplified geometric icons
- [ ] Waitlist section renders updated consent text
- [ ] FAQ accordion works with new copy structure
- [ ] All responsive breakpoints render correctly (no layout breaks)
- [ ] No visual regressions in section ordering or navigation anchors
- [ ] `data-intensity="expressive"` is present on marketing layout roots

## Blocked by

- **Issue 01** — New PressMark must be available for BrandMark component
- **Issue 02** — New tokens must be available for Tailwind classes
- **Issue 03** — pt-BR copy must be finalized for component wiring
