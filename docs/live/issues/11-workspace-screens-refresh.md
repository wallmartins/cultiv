# Issue 11 — Workspace Screen Refresh

## What to build

Refresh all authenticated workspace screens to reflect the new brand identity. This covers the Generation Screen, Voice Dashboard, Execution History, Settings, and Onboarding.

### Generation Screen

**File:** `apps/web/src/app/generation/screens/GenerationScreen.tsx`

Changes:
- Update briefing form card: keep press-edge shadow, remove excess shadows
- Quality mode segmented control: use `--color-pigment-terracotta` for selected state (already the case via `AppSegmentedControl`)
- Preview panel: ensure ReadingSurface with Leitura font (already the case)
- Add subtle ink-bleed accent on the generation button on hover
- Update all copy references to match Issue 08/09 structure

**Components to update:**
- `apps/web/src/app/generation/components/BriefingForm.tsx`
- `apps/web/src/app/generation/components/BriefingGuidancePanel.tsx`
- `apps/web/src/app/generation/components/GenerationPreviewSidebar.tsx`
- `apps/web/src/app/generation/components/IntentWizard.tsx`
- `apps/web/src/app/generation/components/QualityModeHelpContent.tsx`

### Voice Dashboard

**File:** `apps/web/src/app/voice/components/VoiceDashboard.tsx`

Changes:
- Update all copy references to match Issue 08/09 structure
- VoiceMirrorHero: keep confidence ring with ochre→terracotta gradient, add subtle animation on load
- VoiceReasoningSection: use Leitura font in a ReadingSurface card for reasoning prose
- VoiceDevelopmentTraitsStrip: use `--color-paper-elevated` background with `--color-ink-ghost` border for trait chips
- VoiceNextStepPanel: use terracotta accent for the CTA button
- VoiceExampleComposer: keep multi-slot form, refine card styling
- VoiceExamplesList: use clean list with press-edge cards
- Detail layers: keep collapsible pattern, add terracotta accent on expand

**Components to update:**
- `apps/web/src/app/voice/components/VoiceMirrorHero.tsx`
- `apps/web/src/app/voice/components/VoiceConfidenceRing.tsx`
- `apps/web/src/app/voice/components/VoiceConfidenceDial.tsx`
- `apps/web/src/app/voice/components/VoiceReasoningSection.tsx`
- `apps/web/src/app/voice/components/VoiceDevelopmentTraitsStrip.tsx`
- `apps/web/src/app/voice/components/VoiceTraitChip.tsx`
- `apps/web/src/app/voice/components/VoiceTraitConfirmationCard.tsx`
- `apps/web/src/app/voice/components/VoiceNextStepPanel.tsx`
- `apps/web/src/app/voice/components/VoiceExampleComposer.tsx`
- `apps/web/src/app/voice/components/VoiceExamplesList.tsx`
- `apps/web/src/app/voice/components/VoiceRebuildStatusBanner.tsx`
- `apps/web/src/app/voice/components/VoiceTrainingConsentModal.tsx`

### Execution History

**File:** `apps/web/src/app/history/screens/ExecutionHistoryScreen.tsx`

Changes:
- Update all copy references to match Issue 08/09 structure
- Keep paginated list with filters
- Refine list item styling:
  - Background: transparent, hover `--color-paper-pressed`
  - Status: `--color-success` for completed, `--color-pigment-terracotta` for running, `--color-error` for failed
  - Content type badge: `--color-ink-ghost` background
- Empty state: use brand voice ("Nenhuma geração ainda.")

**Components to update:**
- `apps/web/src/app/history/screens/ExecutionHistoryDetail.tsx`

### Settings Screen

**File:** `apps/web/src/app/settings/screens/SettingsScreen.tsx`

Changes:
- Update all copy references to match Issue 08/09 structure
- Keep read-only identity display
- Refine card styling: press-edge, paper-elevated background
- Locale selector: use AppSelect with refined styling
- Voice training consent: link to voice dashboard
- Logout button: use `--color-error` for destructive action

### Onboarding

**File:** `apps/web/src/app/onboarding/screens/OnboardingFlow.tsx`

Changes:
- Update all copy references to match Issue 08/09 structure
- Step 1 (VoiceExampleComposer): keep multi-slot form, refine card styling
- Step 2 (WelcomeStep): use brand voice, show Voice Confidence indicator
- Keep two-step flow (no changes to flow structure)

### Platform UI Components

Update shared platform components for consistency:

- `apps/web/src/platform/ui/AppCard.tsx` — ensure press-edge styling
- `apps/web/src/platform/ui/AppField.tsx` — use refined label/input tokens
- `apps/web/src/platform/ui/AppSelect.tsx` — refine dropdown styling
- `apps/web/src/platform/ui/AppSegmentedControl.tsx` — use terracotta for selected state
- `apps/web/src/platform/ui/AppSkeleton.tsx` — use paper-elevated for skeleton background
- `apps/web/src/platform/ui/AppDisclosure.tsx` — refine expand/collapse styling
- `apps/web/src/platform/ui/HelpTooltip.tsx` — use indigo for tooltip accent

### Files to Modify

All files listed above across generation, voice, history, settings, onboarding, and platform/ui directories.

## Acceptance criteria

- [ ] Generation Screen form cards use refined press-edge styling
- [ ] Quality mode selector uses terracotta for selected state
- [ ] Preview panel uses ReadingSurface with Leitura font
- [ ] Voice Dashboard confidence ring animates on load
- [ ] Voice reasoning prose uses Leitura font in ReadingSurface
- [ ] Trait chips use paper-elevated background with ink-ghost border
- [ ] History list items have correct status colors
- [ ] Settings cards use press-edge styling
- [ ] Onboarding steps use brand voice copy
- [ ] All screen components use Tailwind token references (no hardcoded colors)
- [ ] Dark mode works correctly across all screens
- [ ] No TypeScript errors after changes
- [ ] No visual regressions in layout at any breakpoint

## Blocked by

- **Issue 02** — New tokens must be available
- **Issue 08** — Workspace copy must be finalized
