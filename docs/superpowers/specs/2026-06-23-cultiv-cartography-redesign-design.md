---
title: Cultiv Cartography — Complete Platform Redesign
doc_type: design
status: approved
domain: design-system
last_updated: 2026-06-23
source_rebranding: docs/live/rebranding/
source_kickoff: docs/live/kickoff/rebranding-plan.md
supersedes_adr: docs/adr/0009-cultiv-imprint-identity.md
brainstorming_approach: Atlas Editorial
---

# Cultiv Cartography — Complete Platform Redesign

## Summary

Replace Cultiv's current **Imprint** visual identity (paper/press/ink, Bricolage Grotesque, Fraunces, Source Serif 4) with a **Cartography** identity guided by the synthesis of three artistic movements — **Modernism**, **Arts and Crafts**, and **Minimalism** — expressed through the metaphor **"A Voz como Território"**: authorial voice as a mappable, explorable territory.

**Non-negotiable:** product name **Cultiv** only.

**New brand mark:** compass logo from `docs/live/rebranding/logo.md` (replacing PressMark).

**Scope:** full platform — marketing (`/`, `/en`) and authenticated workspace (`/app/*`).

**Information architecture:** hybrid — same sections and screens defined in `docs/live/rebranding/`, but layout, composition, and motion completely reimagined.

**Motion personality:** premium contained — precise ease-out transitions, no elastic bounce.

**Brand promise (pt-BR):** *"Sua voz. Seu território. Suas palavras."*

**Brand promise (en):** *"Your voice. Your territory. Your words."*

**Supporting promise:** *"A IA que aprende o mapa da sua voz — e escreve como se fosse você."*

---

## Problem

The current **Cultiv Imprint** identity (ADR 0009) is internally coherent but does not match the strategic repositioning defined in `docs/live/rebranding/`. The Imprint metaphor (letterpress, paper grain, press edge) competes with the cartography metaphor (territory, routes, compass) that the product narrative now requires.

Additionally, the user requires a **complete visual break** — new structure, copy voice, information layout, and animations — while preserving the product name and adopting the compass logo.

## Goals

1. Codify the cartography design system from `docs/live/rebranding/base.md` into an operational token and component library.
2. Create a **recognizable cartographic signature** — aged paper texture, dotted/double borders, compass mark, route line — identifiable without reading the wordmark.
3. Unify marketing and workspace under **one token set**, varying surface volume via `data-surface="marketing"` / `"workspace"`.
4. Reimagine layout and composition for all 11 marketing sections and 6 workspace screens while keeping their information architecture.
5. Retire all Imprint legacy assets: PressMark, Bricolage Grotesque, Fraunces, Source Serif 4, `imprint-grain`, `press-edge`, `radius-press`, botanical scenes, `data-intensity`.
6. Establish a 7-phase rollout that minimizes broken intermediate states.

## Non-Goals (v1 Cartography)

- Dark mode UI (tokens stubbed for future phase).
- Full custom icon set beyond cartographic SVG stroke icons defined in base.md.
- Email templates, social assets, native mobile app reskin.
- Actual map engine (pan/zoom GIS) — cartography is visual metaphor only.
- Changes to backend API, billing logic, or generation pipeline behavior.
- Elastic/bounce animations from base.md Prompt 0 (explicitly rejected in favor of premium contained motion).

---

## Foundation

### Three movements as operational rules

Every visual decision answers three questions, in order:

1. **Is it functional and precise?** (Modernism) — If not, remove it.
2. **Does it convey care and authenticity?** (Arts and Crafts) — If not, add texture or warmth.
3. **Does it disappear when text must be protagonist?** (Minimalism) — If not, simplify.

### Approach: Atlas Editorial

A strict modernist 12-column grid (baseline 8px) with cartography as a **semantic layer** — coordinates, route lines, margin annotations — not decorative clutter.

**Signature element:** a continuous SVG route line threading through marketing sections (draws on scroll) and serving as wizard progress indicator in the workspace.

### Principles

| # | Principle | Rule |
|---|-----------|------|
| P1 | Text wins | In reading/validation screens, visual chrome ≤ 10% of attention |
| P2 | Texture, not decoration | Paper noise and hand-drawn SVG accents exist as *material*, never ornament |
| P3 | Grid before curve | All composition starts from a modernist grid; organicity lives in icons and borders |
| P4 | Color with intent | One dominant pigment per viewport; deep-blue for structure, terracotta for action, ochre for growth |
| P5 | One grammar, two volumes | Marketing and app share tokens; marketing is louder (texture 6%, parallax), app is quieter (texture 3%, no parallax) |
| P6 | Recognizable in isolation | A card must read as Cultiv: cream + dotted border + Playfair title + terracotta accent |

### Cartography metaphor

Writing is not produced — it is **inhabited territory**. Cultiv is the instrument that helps the user map, explore, and expand that territory without losing their signature.

| Concept | Visual translation |
|---------|-------------------|
| Territory | Sections as atlas sheets with coordinate labels (`§01 · O Território`) |
| Route | SVG path line connecting sections and wizard steps |
| Compass | Logo mark; navigation anchor |
| Expedition | Generation wizard; history as logbook |
| Coordinates | Form fields, breadcrumbs, mono tags |
| Margin notes | Caveat signatures (max 2 per viewport) |

---

## Color System

| Token | Hex | Role |
|-------|-----|------|
| `deep-blue` | `#1A2E3C` | Primary — nav, headings, compass, inverted sections |
| `cream` | `#F5F0E6` | Base background — aged paper |
| `off-white` | `#FAF8F3` | Elevated surfaces — cards, inputs |
| `ochre` | `#C4A484` | Growth, progress, voice confidence |
| `terracotta` | `#B55A3B` | CTAs, active states, focus rings |
| `ink` | `#2C2C2C` | Primary text |
| `ink-muted` | `#5A5A5A` | Secondary text |
| `ink-ghost` | `#8A8A8A` | Borders, dividers, auxiliary |
| `moss` | `#4A5D4E` | Success, balance — rare use |
| `error` | `#B55A3B` muted variant | Error states |

**Usage rules:**

- One dominant pigment per viewport.
- Terracotta = primary actions and focus.
- Ochre = progress, confidence, completed steps.
- Deep-blue = structural chrome and inverted sections (waitlist).
- Reading surfaces (generated text, preview) stay cream/off-white + ink only — no accent pigment in body text.
- Moss for success toasts and "Concluída" status only.

**Dark mode:** out of scope v1. CSS custom properties prepared with commented dark stubs.

---

## Typography

| Role | Font | Usage | Frequency |
|------|------|-------|-----------|
| **Autoridade** | Playfair Display | Titles, wordmark "Cultiv", display headlines, pull quotes | Headings only |
| **Condução** | Inter | UI, nav, labels, body, buttons, form fields | ~80% |
| **Margem** | Caveat | Human signatures, margin notes, brand asides | Max 2 per viewport |
| **Coordenadas** | JetBrains Mono | Tags, metrics, status, filters, breadcrumbs, coordinates | Metadata |

### Type scale

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `display-xl` | clamp(3rem, 8vw, 5rem) | 500 | Hero headline |
| `display` | clamp(2rem, 4vw, 3rem) | 500 | Section titles |
| `display-sm` | clamp(1.5rem, 3vw, 2rem) | 500 | Sub-section titles |
| `heading` | 1.25rem | 600 | Card titles, nav items |
| `body-lg` | 1.125rem | 400 | Subheadlines, lead paragraphs |
| `body` | 1rem | 400 | Body text |
| `label` | 0.8125rem | 600 | Form labels, CTAs |
| `meta` | 0.75rem | 500 | Eyebrows, stamps, metadata |
| `caption` | 0.6875rem | 500 | Fine print, disclaimers |
| `mono` | 0.75rem | 400 | Coordinates, tags, status |

Workspace (`data-surface="workspace"`): display sizes reduced ~15%; body increased to 1.0625rem for screen reading comfort.

### Reading surfaces

Generated text and preview content use **Playfair Display italic** for body prose and **Inter** for UI chrome around the reading area. This replaces Source Serif 4 from Imprint.

---

## Logo — Compass Mark

From `docs/live/rebranding/logo.md`:

- **Symbol:** stylized compass; four cardinal points as pen strokes; center mark (X or concentric circle).
- **Wordmark:** "Cultiv" in Playfair Display; letter "C" slightly open or with coastline-like stroke.
- **Variants:** horizontal (symbol + text), vertical (symbol above text), symbol only.
- **Colors:** deep-blue (default), ochre (alternate), white (dark backgrounds).
- **Formats:** SVG (primary), PNG transparent (16–512px), favicon, apple-touch-icon, OG template.

**Animation:** breathing scale 1.0 ↔ 1.02, 4s ease-in-out loop on mount. Disabled under `prefers-reduced-motion`.

**Replaces:** `PressMark.tsx`, `press-mark-geometry.ts`, `cultiv-press-mark.svg`, all Imprint logo assets.

---

## Surface Language

| Surface | Treatment | Use |
|---------|-----------|-----|
| **Base** | Cream + paper noise SVG (~6% marketing, ~3% workspace) + optional radial vignette (marketing only) | All screens |
| **Elevated** | Off-white + dotted or double border + asymmetric shadow `4px 4px 0 rgba(26,46,60,0.08)` | Cards, panels, form islands |
| **Pressed** | Cream darkened, inset shadow | Active/selected card states |
| **Reading** | Off-white, no noise, Playfair italic for content | Generated text, preview, drawer |
| **Inverted** | Deep-blue background, cream/off-white text | Waitlist section, critical modals |

**Border styles:**

- Dotted: `1px dotted ink-ghost` — default card border.
- Double: `3px double deep-blue` — pricing card, comparison frame.
- Solid terracotta: selected/active states.

**Corner radius:** 4–6px (artisanal, not pill). No `radius-press` 2px from Imprint.

**Retired:** `imprint-grain`, `press-edge`, `InkBleed`, `PaperSurface` grain variants, `ReadingSurface` Imprint styling, botanical `scene-artifact-mat`.

---

## Icons

Replace all emoji with organic-stroke SVG icons (stroke-width 1.5, linecap round, linejoin round).

Themes: compass, map, coastline, landmark, route trace, pen, signature.

Palette: deep-blue and terracotta priority.

---

## Motion System

**Dominant easing:** `cubic-bezier(0.25, 0.1, 0.25, 1)` (smooth ease-out).

| Context | Animation | Duration | Notes |
|---------|-----------|----------|-------|
| Marketing scroll reveal | opacity + translateY 12px→0 | 400ms, stagger 80ms | Intersection Observer |
| Marketing route line | stroke-dashoffset draw | 1.2s ease-out | Per section entry |
| Marketing parallax | texture shift 2–3% | Scroll-linked | Lenis optional; disabled reduced-motion |
| Marketing hero headline | word opacity | 60ms/word | Mount |
| Workspace route transition | opacity crossfade | 200ms | TanStack Router |
| Workspace wizard step | slide 24px + fade | 300ms | Step advance/back |
| Execution drawer | translateX 100%→0 | 350ms ease-out | Desktop 520px; full-screen mobile |
| Accordion | height + opacity | 300ms | Voice dashboard layers |
| Card hover | translateY -2px | 250ms | No bounce |
| Focus ring | terracotta 2px outline | instant | All interactives |
| Logo breathing | scale 1.0↔1.02 | 4s ease-in-out | Marketing + sidebar |

**`prefers-reduced-motion: reduce`:** all animations collapse to opacity-only or static. Route line appears complete. Parallax off. Logo static.

**Retired from Imprint:** elastic bounce easing, scroll-pinning chapter panels, botanical tree draw, ink bleed animation, word rotation on fade-in.

---

## Marketing Surface

Single bilingual scroll page: pt-BR at `/`, en at `/en/`. Same 11 sections; layout reimagined as **unfolded atlas** connected by left-margin route line (desktop) or top route line (mobile).

### Navigation

Floating centered bar, max-width 960px, off-white 92% + blur 8px, dotted double border.

- Logo: compass 32px + "Cultiv" Playfair 500.
- Links: O território · A rota · Ferramentas · Perguntas.
- CTA: "Explorar sua voz" — terracotta, asymmetric shadow.
- Mobile: hamburger → full-height drawer with coordinate sidebar.

### §00 Hero

- **Badge (mono):** "Acesso antecipado — mapa em construção"
- **Headline:** "A IA que aprende o mapa da sua voz — e escreve como se fosse você."
- **Subheadline:** "Cultiv aprende seu tom, sua cadência, sua assinatura. E gera textos que parecem ter saído da sua mão — não de um template."
- **CTAs:** "Explorar sua voz" (primary) · "Ver a rota" (secondary ghost).
- **Visual:** side-by-side comparison (generic vs Cultiv) in aged-map frame with worn-corner SVG mask. Desktop: 5/7 grid. Mobile: horizontal swipe between panels.

### §01 O Território (Problem)

- **Title:** "Por que a escrita com IA ainda não soa como você?"
- **Layout:** 3 cards in subtle fan arc (not flat grid).
- **Cards:** Voz genérica · Voz que não evolui · Voz diluída — each with organic SVG icon.

### §02 A Rota (How it works)

- **Title:** "Cinco passos para mapear sua voz"
- **Layout:** vertical timeline with continuous route line (not horizontal steps).
- **Steps:** 1 Entre · 2 Ensine sua voz · 3 Mapa gerado · 4 Coordenadas · 5 Dê forma ao texto.
- Active step on scroll: circle fills terracotta (Intersection Observer).

### §03 Ferramentas (Formats)

- **Title:** "Seis territórios para sua mensagem"
- **Layout:** asymmetric hex-grid — 6 cards with varied sizes (Artigo aprofundado largest).
- Each card: mono format tag, Playfair title, one-line Inter description.

### §04 A Diferença é Real (Comparison)

- **Layout:** 50/50 split with central meridian line.
- Same briefing header (mono). Left: generic output (Inter, muted). Right: Cultiv output (Playfair + Caveat margin note).
- **Verdict:** "A autenticidade não é um luxo. É o que faz seu público voltar."
- **Signature (Caveat):** "Tecnologia de ponta, feita com alma de artesão."
- Mobile: tabs instead of split.

### §05 Depoimento

- Single centered quote, max-width 640px. Playfair italic display-sm.
- "Ps." in Caveat, right-aligned margin note. No carousel.

### §06 Preço

- **Title:** "Recursos da jornada"
- Single centered card, double deep-blue border, "Créditos por geração" mono seal.

### §07 FAQ

- Numbered accordion (01, 02…). Playfair question, Inter answer. 5–7 items covering product, privacy, access, pricing.

### §08 Lista de espera

- Inverted deep-blue section. Cream Playfair title: "Comece a mapear sua voz."
- Form: off-white input, terracotta submit. Mono fine print: "Sem spam. Apenas atualizações sobre o acesso antecipado."

### §09 Rodapé

- 3 columns: brand + description · Product/Legal/Contact · locale toggle + "Feito à mão com IA" pen seal.
- Caveat signature: "Com ♥ e ✦, Cultiv" (SVG icons, not native emoji).

### SEO

- **Title:** `Cultiv — Sua voz. Seu território. Suas palavras.`
- **Description:** cartography promise + voice preservation keywords.
- **OG image:** compass + headline on cream textured background.

---

## Authenticated Workspace

Intensity quiet: texture 3%, no vignette, no parallax.

### Shell

**Replace** floating press-edge dock with **fixed narrow sidebar** (64px collapsed / 220px on hover expand).

- Top: compass symbol 28px.
- Nav: Gerar · Caderno de bordo · Mapa da voz — organic SVG icons + labels on expand.
- Active: terracotta 3px left bar + off-white background.
- Header: mono breadcrumb (`§ Gerar · Passo 2/3`) + credit badge + avatar menu.
- Avatar menu: Ajustes de navegação · Recursos da jornada · Sair.
- Mobile: bottom bar (Gerar, Histórico, Voz, Conta).

### Onboarding

Two steps, centered max-width 560px:

1. **"Ensine sua voz"** — large logbook textarea, dotted border.
2. **"Mapa inicial traçado"** — compass confirmation, CTA "Iniciar expedição".

### Generation — 3-step expedition wizard

**Progress bar:** Explorar · Escala · Coordenadas.

**Step 1 — "O que você quer explorar?"**
- 2×3 selectable card grid (6 intents from rebranding docs, SVG icons not emoji).
- Footer: Continuar · Voltar (disabled).

**Step 2 — "Escala e destino"**
- Segmented control: Curta / Média / Longa.
- Optional publication territory input.
- Footer: Voltar · Continuar.

**Step 3 — "Coordenadas da viagem"**
- Desktop split 65/35. Left: form fields (Tema, Audiência, Ângulo, Pontos de prova, Materiais de apoio, Idioma do mapa, Estilo de navegação: Leve/Equilibrado/Polido). Right sticky: credit cost card + "Traçar rota" CTA.
- Mobile: single column; credit bar sticky bottom.

**Active execution drawer:** 520px slide-over (full-screen mobile). Route line SVG progress loop. Message: "Sua rota está sendo traçada… Você pode fechar esta janela." Result in Playfair italic reading surface. Toolbar: Copiar · Exportar · Nova expedição.

### Voice — Mapa da voz

- Hero: Playfair title, confidence ring (ochre→terracotta SVG), mono label "Saúde da expedição".
- Two columns: "Como você navega" + "Como você traça rotas" — AI prose in logbook cards, trait chips below.
- Accordions: Rotas por território · Terrenos a evitar · Saúde da expedição.
- CTA: "Nova expedição".

### History — Caderno de bordo

- **Subtitle:** "Todas as suas expedições em um só lugar."
- Horizontal scroll filter toggles (period, status, format).
- Card list (not table): format, date, theme preview, status dot (moss/ochre/ghost).
- Empty: "Nenhuma expedição ainda. Trace sua primeira rota."
- CTA: "Nova expedição".

### Plans — Recursos da jornada

Three stacked cards: Equipamento atual (terracotta border) · Novos instrumentos · Suprimentos adicionais (credit packs 2×2 grid).

### Settings — Ajustes de navegação

Clean list max-width 560px: Identidade do explorador (email read-only) · Idioma do mapa · Apagar pegadas (destructive, modal confirm) · Salvar ajustes.

---

## Empty, Error, and Loading States

| State | Copy (pt-BR) |
|-------|--------------|
| Loading global | aria-live "Carregando" — compass stroke loop |
| Loading generation | "Sua rota está sendo traçada…" |
| Empty history | "Nenhuma expedição ainda. Trace sua primeira rota." |
| Empty voice | "Seu mapa ainda está em branco. Ensine sua voz para começar." |
| Error network | "Conexão perdida. Verifique sua rede e tente novamente." |
| Error generation | "A rota não pôde ser traçada. Seus créditos não foram consumidos." |
| 404 | "Território não encontrado." |
| Success generation | "Rota concluída. Seu texto está pronto." |
| Success settings | "Ajustes salvos." |

Errors explain what happened and how to fix — no apologies. Empty states include visible CTA.

---

## Accessibility (WCAG 2.1 AA)

- **Contrast:** deep-blue on cream 11.2:1 · terracotta on cream 4.6:1 · ink on off-white 12.6:1.
- **Focus:** terracotta 2px ring, 2px offset, all interactives.
- **Keyboard:** logical tab order; Escape closes drawer/modal; arrow keys in wizard where applicable.
- **ARIA:** landmarks, `aria-current="step"`, `aria-expanded`, `aria-live="polite"` on toasts.
- **Touch targets:** minimum 44×44px on mobile.
- **Motion:** `prefers-reduced-motion` disables non-essential animation.
- **Decorative SVG/Caveat:** `aria-hidden="true"` when non-semantic.

---

## i18n

| Locale | Marketing | Workspace |
|--------|-----------|-----------|
| pt-BR | `/` | `/app/*` |
| en | `/en/` | `/en/app/*` |

Portuguese written first; English equivalent (not literal translation). Cartographic metaphors adapted per locale (e.g. pt "Caderno de bordo" · en "Logbook").

Files to rewrite: `i18n/marketing/locales/*`, `i18n/app/messages/*`, `content-types`, `generation-intents`, `field-labels`, `briefing-guidance`, `voice-dashboard-copy`.

---

## Package Architecture

`packages/ui` retains layers: tokens → primitives → patterns.

### New / rewritten primitives

| Component | Role |
|-----------|------|
| `CompassMark` | Logo SVG (replaces PressMark) |
| `CartographySurface` | Base surface with paper noise + optional vignette |
| `ExpeditionCard` | Selectable card with dotted border + asymmetric shadow |
| `RouteLine` | SVG path progress/threading component |
| `CoordinateLabel` | Mono section marker (`§01 · Label`) |
| `LogbookProse` | Reading surface for AI-generated profile text |
| `Text` | Updated variants for Playfair/Inter/Caveat/Mono roles |
| `Button` / `ButtonLink` | Terracotta primary, asymmetric shadow |
| `Input` | Dotted border, terracotta focus ring |

### Retired primitives

`PressMark`, `PaperSurface` (Imprint), `ReadingSurface` (Imprint), `InkBleed`, Imprint `Text` variants referencing Bricolage/Fraunces/Source Serif 4.

---

## Rollout Phases

| Phase | Scope | Duration |
|-------|-------|----------|
| **1 — Foundation** | Tokens, CompassMark SVG, typography, base primitives | Week 1–2 |
| **2 — Marketing copy** | pt-BR + en locales, SEO metadata | Week 2–3 |
| **3 — Marketing visual** | 11 sections, route line, comparison illustrations | Week 3–4 |
| **4 — Workspace copy** | App messages, intents, field labels | Week 4–5 |
| **5 — Workspace visual** | Shell, wizard, voice atlas, history, plans, settings | Week 5–6 |
| **6 — Motion + QA** | Animations, a11y audit, responsive 320–2560px | Week 6–7 |
| **7 — Launch** | Lighthouse 90+, staging → production | Week 7–8 |

**ADR:** create ADR 0010 superseding ADR 0009 (Imprint → Cartography).

---

## Success Criteria

- [ ] Compass renders crisp at 16px–512px
- [ ] Marketing Lighthouse Performance ≥ 90
- [ ] WCAG 2.1 AA contrast on all text/background pairs
- [ ] `prefers-reduced-motion` disables non-essential animation
- [ ] Copy reads naturally in pt-BR and en
- [ ] Workspace readable for 30+ minutes without visual fatigue
- [ ] Isolated card recognizable as Cultiv (cream + dotted border + Playfair + terracotta)
- [ ] Zero Imprint visual references remain (PressMark, Bricolage, press-edge, botanical)
- [ ] Core flows functional: onboarding → voice → generation → history → plans

---

## References

- [Rebranding base — design system](../../live/rebranding/base.md)
- [Rebranding landing page](../../live/rebranding/landing-page.md)
- [Rebranding generation screen](../../live/rebranding/generation-screen.md)
- [Rebranding voice screen](../../live/rebranding/voice-screen.md)
- [Rebranding history screen](../../live/rebranding/history-screen.md)
- [Rebranding plan screen](../../live/rebranding/plan-screen.md)
- [Rebranding config screen](../../live/rebranding/config-screen.md)
- [Rebranding logo](../../live/rebranding/logo.md)
- [Rebranding kickoff plan](../../live/kickoff/rebranding-plan.md)
- [ADR 0009 — Cultiv Imprint (superseded)](../../adr/0009-cultiv-imprint-identity.md)
