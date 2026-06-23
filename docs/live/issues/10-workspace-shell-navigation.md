# Issue 10 — Workspace Shell & Navigation Refresh

## What to build

Update the authenticated workspace shell components to reflect the new brand identity. This includes the header, sidebar, bottom navigation, avatar menu, credit display, and active execution list.

### AppHeader.tsx

- Replace `PressMark` import with the new component from Issue 01
- Keep the existing layout: PressMark logo left, CreditDisplay center, ActiveExecutionMobileTrigger + AppAvatarMenu right
- Refine header height: `--site-header-height: 4.25rem` (mobile), `5.25rem` (desktop) — keep
- Add subtle bottom border using `--color-ink-ghost` (already has `border-b border-ink-ghost`)
- Ensure PressMark renders at compact size (<=32px) in header

### AppSidebar.tsx

- Replace `PressMark` with new component
- Keep the floating expandable dock pattern (Modernist precision)
- Refine dock styling:
  - Background: `--color-paper-elevated` with press-edge shadow
  - Active indicator: `--color-pigment-terracotta` pill (already exists)
  - Expand on hover/focus to reveal labels
  - Keep terracotta active state
- Update nav icons to use consistent stroke weight (1.5px)

### AppBottomNav.tsx

- Replace `PressMark` with new component (if used)
- Keep labeled bottom bar pattern for mobile
- Refine styling:
  - Background: `--color-paper-elevated` with press-edge
  - Active state: `--color-pigment-terracotta` text + icon
  - Inactive state: `--color-ink-muted`
- Ensure safe area insets for iPhone notch

### AppAvatarMenu.tsx

- Keep dropdown menu pattern
- Refine styling:
  - Background: `--color-paper-elevated`
  - Hover: `--color-paper-pressed`
  - Text: `--color-ink`
- Menu items: Settings, Plans (placeholder), Logout
- Use `--color-ink-muted` for menu item text, `--color-ink` on hover

### CreditDisplay.tsx

- Keep compact credit balance display in header
- Refine styling:
  - Use `--color-pigment-ochre` for the credit icon/accent
  - Use `--color-ink` for the number
  - Use `--color-ink-muted` for the label
- Ensure it doesn't break layout at extreme values (0 credits, 9999 credits)

### ActiveExecutionList.tsx

- Keep sidebar list of in-flight executions
- Refine styling:
  - List item background: transparent, hover `--color-paper-pressed`
  - Status indicator: `--color-pigment-terracotta` for running, `--color-success` for completed
  - Use `--color-ink` for execution title, `--color-ink-muted` for content type
- Keep "open in drawer" behavior on click

### ActiveExecutionDrawer.tsx

- Keep right slide-over pattern (~520px desktop, full-screen mobile)
- Refine styling:
  - Background: `--color-paper-elevated`
  - Header: PressMark + execution title + close button
  - Content: ReadingSurface with Leitura font
  - Footer: fixed action toolbar (copy, regenerate, close)
- Add `--color-ink-ghost` border between header and content

### app-shell-nav.ts

Keep the 3 nav items (generate, history, voice). No changes needed.

### app-shell-nav-icons.tsx

Refine icon set for consistency:
- Use single-weight line icons (1.5px stroke)
- Use `--color-ink-muted` for inactive, `--color-pigment-terracotta` for active
- Icons: Generate (pen/sparkle), History (clock), Voice (waveform)

### app-shell-nav-ui.tsx

Keep the dock UI with pill indicator. Refine:
- Pill color: `--color-pigment-terracotta` (already the case)
- Pill animation: fast ease-out (already the case)

### Files to Modify

- `apps/web/src/app/shell/AppHeader.tsx`
- `apps/web/src/app/shell/AppSidebar.tsx`
- `apps/web/src/app/shell/AppBottomNav.tsx`
- `apps/web/src/app/shell/AppAvatarMenu.tsx`
- `apps/web/src/app/shell/CreditDisplay.tsx`
- `apps/web/src/app/shell/ActiveExecutionList.tsx`
- `apps/web/src/app/shell/ActiveExecutionDrawer.tsx`
- `apps/web/src/app/shell/app-shell-nav.ts`
- `apps/web/src/app/shell/app-shell-nav-icons.tsx`
- `apps/web/src/app/shell/app-shell-nav-ui.tsx`
- `apps/web/src/app/shell/AppShell.tsx` (verify `data-intensity="quiet"`)
- `apps/web/src/app/shell/AppPage.tsx` (verify layout wrapper)

## Acceptance criteria

- [ ] Header renders new PressMark at compact size
- [ ] Sidebar dock uses new PressMark and refined styling
- [ ] Bottom nav uses new icons with consistent stroke weight
- [ ] Avatar menu uses refined paper tokens
- [ ] Credit display uses ochre accent for the credit indicator
- [ ] Active execution list items have correct status colors
- [ ] Active execution drawer uses ReadingSurface for content
- [ ] All shell components use `--color-paper-*` and `--color-ink-*` tokens (no hardcoded colors)
- [ ] `data-intensity="quiet"` is present on AppShell
- [ ] No visual regressions in shell layout at any breakpoint
- [ ] Dark mode works correctly across all shell components

## Blocked by

- **Issue 01** — New PressMark must be available
- **Issue 02** — New tokens must be available
- **Issue 08** — Workspace copy must be finalized for nav labels
