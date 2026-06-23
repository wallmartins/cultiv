# Issue 06 — Marketing Illustrations & SVG Scenes

## What to build

Redesign the marketing illustration scenes to reflect the three-movement identity synthesis. All scenes should use the refined palette, simpler geometry, and more breathing space.

### Scene Redesigns

#### HeroImprintArt.tsx
**Current:** Voice waveform + paper elements
**New:** Three-movement synthesis — a clean geometric frame (Modernism) containing organic ink strokes (Arts & Crafts) with generous white space (Minimalism). The illustration should feel like a framed piece of calligraphy on paper.

- Use `--color-pigment-terracotta` for the primary ink stroke
- Use `--color-pigment-ochre` for subtle accent elements
- Use `--color-paper-elevated` for the frame background
- Keep the existing animation (GSAP reveal on mount)
- Ensure it scales well from 200px to 600px width

#### GenericOutputStack.tsx
**Current:** Stacked generic text blocks representing AI output
**Simplify:** Fewer elements (3 blocks instead of 5+), more white space, terracotta accent border on each block. The blocks should look like a整齐 stack of identical, soulless output — emphasizing the "industrial" problem.

- Use `--color-ink-ghost` for block backgrounds
- Use `--color-pigment-terracotta` for the left border accent
- Reduce visual complexity — each block is just a rounded rectangle with 2-3 horizontal lines inside

#### FragilePromptCollage.tsx
**Current:** Collage of prompt fragments
**Simplify:** Single floating prompt card with slightly frayed/irregular edges (Arts & Crafts imperfection). The card should look like a handwritten note on paper — warm, personal, but fragile.

- Use `--color-paper-elevated` background
- Use `--color-ink-muted` for the text lines
- Add subtle paper texture (grain overlay at low opacity)
- Irregular edges suggest the fragility of prompt-only voice control

#### TeachVoiceScene.tsx
**Current:** Voice teaching illustration
**Refine:** Clean geometric container (Modernist frame) with organic handwriting overlay (Arts & Crafts). Shows examples flowing into a profile container.

- Use `--color-paper-elevated` for the frame
- Use `--color-pigment-terracotta` for the handwriting strokes
- Use `--color-pigment-ochre` for the profile container accent
- Simple flow arrows connecting examples to profile

#### BriefingScene.tsx
**Current:** Briefing form illustration
**Refine:** Structured form with warm paper background. Shows the rational flow: objective → audience → context.

- Use `--color-paper-elevated` background
- Use `--color-ink` for form labels
- Use `--color-pigment-indigo` for the form field borders
- Clean geometric layout with clear hierarchy

#### PreviewConfidenceScene.tsx
**Current:** Preview with confidence ring
**Refine:** Minimal reading surface (Leitura-style) with ochre accent. Shows text with a subtle confidence indicator.

- Use `--color-paper-elevated` for the reading surface
- Use `--color-ink` for the text lines
- Use `--color-pigment-ochre` for the confidence indicator
- Minimal — the text is the protagonist

### SVG Scene Primitives Updates

Update the shared scene primitives to use the new palette:

- `apps/web/src/marketing/visual/scenes/chat-scene-primitives.tsx`
- `apps/web/src/marketing/visual/scenes/briefing-scene-primitives.tsx`
- `apps/web/src/marketing/visual/scenes/preview-scene-primitives.tsx`

Changes:
- Replace any hardcoded colors with Tailwind token references
- Simplify element counts (fewer decorative elements)
- Use consistent stroke widths (1.5px for outlines, 1px for details)
- Use `--color-ink-ghost` for subtle elements, `--color-ink` for primary elements

### IllustrationFrame.tsx & ProblemSceneMat.tsx

Update the container components:
- `IllustrationFrame.tsx` — ensure it uses the refined palette and consistent padding
- `ProblemSceneMat.tsx` — simplify the halo/underlay treatment, use consistent shadow tokens

### Files to Modify

- `apps/web/src/marketing/visual/illustrations/HeroImprintArt.tsx`
- `apps/web/src/marketing/visual/illustrations/ImprintVoiceLine.tsx` (if still used)
- `apps/web/src/marketing/visual/illustrations/voice-root-silhouette-path.ts`
- `apps/web/src/marketing/visual/scenes/GenericOutputStack.tsx`
- `apps/web/src/marketing/visual/scenes/FragilePromptCollage.tsx`
- `apps/web/src/marketing/visual/scenes/TeachVoiceScene.tsx`
- `apps/web/src/marketing/visual/scenes/BriefingScene.tsx`
- `apps/web/src/marketing/visual/scenes/PreviewConfidenceScene.tsx`
- `apps/web/src/marketing/visual/scenes/chat-scene-primitives.tsx`
- `apps/web/src/marketing/visual/scenes/briefing-scene-primitives.tsx`
- `apps/web/src/marketing/visual/scenes/preview-scene-primitives.tsx`
- `apps/web/src/marketing/visual/IllustrationFrame.tsx`
- `apps/web/src/marketing/visual/ProblemSceneMat.tsx`

## Acceptance criteria

- [ ] HeroImprintArt renders the new three-movement synthesis illustration
- [ ] GenericOutputStack uses simplified geometry (3 blocks, terracotta borders)
- [ ] FragilePromptCollage shows a single warm card with irregular edges
- [ ] TeachVoiceScene shows clean geometric frame with organic overlay
- [ ] BriefingScene shows structured form with warm paper background
- [ ] PreviewConfidenceScene shows minimal reading surface with ochre accent
- [ ] All SVG scene primitives use Tailwind token references (no hardcoded colors)
- [ ] All scenes scale correctly from mobile (200px) to desktop (600px+)
- [ ] No visual artifacts at any breakpoint
- [ ] GSAP reveal animations still work on HeroImprintArt
- [ ] IllustrationFrame and ProblemSceneMat use consistent shadow/padding tokens

## Blocked by

- **Issue 02** — New color tokens must be available for scene palette references
