# Web v2 — QA Checklist (Authenticated Workspace)

Manual verification for issues 28–34. Run with backend (`:3001`) and web (`:3000`) locally.

## Workspace Visual Refresh (issues 39–47)

Manual verification after visual refresh. Marketing (`/`, `/en`) must remain unchanged.

### Visual system

- [ ] `/app/*` titles use sans-serif (no Caveat/Playfair on screen `h1`)
- [ ] Workspace glass cards, warm shadows, moss/golden accents only
- [ ] `prefers-reduced-motion`: no stagger/slide on drawer and confidence ring

### Desktop

- [ ] Generation: split layout, sticky preview panel, segmented quality modes
- [ ] Active drawer: ~520px slide-over, reading typography
- [ ] Voice dashboard: confidence growth ring
- [ ] History rows: status dots, result reading polish
- [ ] Onboarding: progress bar + glass cards
- [ ] Settings: grouped cards

### Mobile

- [ ] Generation: single column, preview below form
- [ ] Active drawer: full-screen sheet
- [ ] Bottom nav + dock styling intact

### Marketing smoke

- [ ] `/` hero still uses editorial typography (Playfair/Caveat)

---

## Desktop

- [ ] Login → smart redirect (onboarding vs generate)
- [ ] App shell: sidebar nav, credits, active executions empty state
- [ ] Generate: content type, briefing fields, preview debounce, async submit
- [ ] Active list + drawer: progress, completion toast, copy/regenerate
- [ ] History: list, filters, detail, regenerate prefill
- [ ] Voice: dashboard, examples list, composer single + batch
- [ ] Onboarding: skip/continue, welcome step
- [ ] Settings: locale switch (pt/en), logout

## Mobile

- [ ] Bottom nav (3 items), avatar → settings
- [ ] Active executions drawer from header icon
- [ ] Generate form scroll + submit
- [ ] History table horizontal scroll

## i18n / errors

- [ ] App locale switch re-renders workspace strings
- [ ] SDK safety error shows localized banner on generate
