<!-- SYNC 2026-07-09: regenerated from code by `$impeccable document`. Sources of truth: packages/ui/src/tokens.css (tokens), apps/landing/src/styles/global.css (type ramp, buttons, reveals), apps/landing/src/layouts/Layout.astro + src/components/* (patterns). The seed's synthesized font shortlist and component defaults have been replaced with the real, shipped values. -->
<!-- SYNC 2026-07-11: typographic system replaced by owner decision — Instrument Serif (H1/wordmark/slogan + headers de cards e páginas) + Mona Sans (body/nav/H2) + Fraunces (títulos internos/números/preços); Bricolage Grotesque and Fragment Mono removed. Visual rhyming: buttons/badges pill 100px, cards 24px, inputs 16px, circular icon containers, numbers in rounded badges. Sections 3 and the frontmatter reflect the new system; older prose sections may still reference the previous type system. -->
---
name: Cultiv
description: Your authenticity, at scale — an AI writing engine that sounds like you.
colors:
  # Light theme (canonical). Dark-theme siblings suffixed -dark. OKLCH is the
  # source of truth, defined in packages/ui/src/tokens.css.
  bg: "oklch(0.990 0 0)"
  surface: "oklch(0.965 0 0)"
  ink: "oklch(0.190 0 0)"
  primary: "oklch(0.240 0 0)"
  accent: "oklch(0.830 0.190 128)"
  on-accent: "oklch(0.190 0 0)"
  muted: "oklch(0.440 0 0)"
  line: "oklch(0.885 0 0)"
  bg-dark: "oklch(0.160 0 0)"
  surface-dark: "oklch(0.205 0 0)"
  ink-dark: "oklch(0.930 0 0)"
  primary-dark: "oklch(0.930 0 0)"
  accent-dark: "oklch(0.860 0.200 128)"
  muted-dark: "oklch(0.700 0 0)"
  line-dark: "oklch(0.285 0 0)"
typography:
  headline: # H1 + wordmark "Cultiv" (--font-headline)
    fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif"
    fontSize: "2.8rem"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0"
  display: # variante hero do H1
    fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.8rem, 6vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0"
  subtitle: # H2 (--font-body)
    fontFamily: "'Mona Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 600
    lineHeight: 1.3
  title: # H3 / títulos internos (--font-ui)
    fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif"
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "'Mona Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 425
    lineHeight: 1.6
    letterSpacing: "0em"
  label: # navegação / labels
    fontFamily: "'Mona Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
  num: # números, métricas, preços (--font-ui, 700–800)
    fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif"
    fontWeight: 700
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  input: "16px" # inputs/textarea; foco com borda chartreuse
  card: "24px" # cards e painéis
  pill: "100px" # botões, badges, tags
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  "2xl": "64px"
  "3xl": "96px"
components:
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.bg}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-ghost:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "13px 27px"
  chip:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
---

# Design System: Cultiv

## 1. Overview

**Creative North Star: "The Signal in the Noise"**

Cultiv is a near-silent instrument with one electric nerve. The surface is graphite — a disciplined monochrome architecture of near-black, off-white, and true greys that carries no hue and makes no noise. Against that quiet, a single **acid chartreuse** does every meaningful thing: the primary CTA, the moment where flat generic-AI text ignites into the author's own voice, the marked sentence in the founder's note, the one phrase that matters. The restraint is the entire point. On a page selling *authenticity in a sea of generic AI*, a loud multi-color palette would be the lie; a single unforgettable signal against monochrome is the argument, rendered in color.

This system is **register: brand** — the landing page IS the product. It must read as an awwwards-caliber instrument built by people who love sentences, not "another AI tool." It explicitly rejects three things, carried verbatim from `PRODUCT.md`: **generic AI-SaaS** (no violet gradients, no Inter-on-white template, no sparkle/robot iconography, no hero-metric grids); **the saturated editorial-magazine reflex** (no display-serif-italic + tiny tracked mono labels + ruled three-column broadsheet); and **timid minimalism** (monochrome here is committed and high-contrast, never beige-and-forgettable).

The system is fully **dual-mode**. Light is a bright gallery wall; dark is a graphite room with the signal glowing. Neither is the default — every token, component, and contrast ratio is defined for both, and the acid signal is the constant that survives the flip. Dark mode compensates for light-on-dark reading on two axes: body line-height opens from 1.6 to 1.68 and body tracking from 0 to 0.012em.

Motion is choreographed but never load-bearing. Every section is **visible by default**; JavaScript *arms* the hidden reveal state (`html.js`), an IntersectionObserver releases it as a human scrolls, and any signal that no human is present — hidden tab (`visibilitychange`), `beforeprint`, a 3-second no-input human-presence watchdog, `prefers-reduced-motion`, or the reveal script simply failing to run — snaps everything visible with zero transition. A link unfurler, SERP thumbnailer, print engine, or JS-off reader can never photograph a blank or half-faded page.

**Key Characteristics:**
- Monochrome graphite architecture (zero hue in the neutrals) + one saturated acid-chartreuse signal (hue 128°).
- The acid appears on **≤10%** of any screen. Its rarity is what makes it a signal.
- Three-voice type system with rigid roles — Instrument Serif signs (H1/wordmark/slogan + card/page headers), Mona Sans works (body/nav/H2), Fraunces counts (títulos internos/números/preços); voice-switch and weight carry hierarchy, not color or ornament.
- Choreographed motion with a signature **Signal Handoff** ("voice ignites") moment; content never depends on JS or motion to be visible; full reduced-motion path.
- Light and dark are co-equal; contrast is verified in both (body ≥4.5:1, ink ≥7:1).

## 2. Colors

A hue-free graphite ramp under one electric acid-chartreuse signal — the same two-part palette in a bright gallery (light) and a graphite room (dark).

### Primary
- **Graphite Ink** (light `oklch(0.240 0 0)` / dark `oklch(0.930 0 0)`): The structural brand color — solid primary buttons (including the nav CTA, which is graphite always), the "most chosen" plan flag, the active pricing-toggle option, rules, dense type blocks. Chroma is exactly 0; it is a *true* neutral, never warm-tinted, never cool-tinted. In dark mode it inverts to near-white and does the same structural job.

### Secondary
- **Acid Chartreuse** (light `oklch(0.830 0.190 128)` / dark `oklch(0.860 0.200 128)`): The signal. The single saturated color in the system. It is an *electric* green-yellow, never a botanical leaf-green — high chroma, paired only with graphite, never with earthy or organic tones. Reserved for: the conversion CTA of the fold that owns the signal (the hero CTA while the Transform is still grey, the featured plan CTA, the final CTA, the mobile sheet CTA), the Voice Transform's ignited mark, the founder-note mark, nav-link hover underlines (2px), text `::selection`, and the focus ring in dark mode only. Text on an acid fill is always **On-Accent** — see Neutral below.
- **On-Accent** (`oklch(0.190 0 0)`, theme-invariant): The ink for anything sitting on an acid fill. Acid stays bright in both modes, so its text stays dark in both modes — this token deliberately does not flip with the theme.

### Neutral
- **Bg** (light `oklch(0.990 0 0)` off-white / dark `oklch(0.160 0 0)` graphite): The page surface. Both chroma 0.
- **Surface** (light `oklch(0.965 0 0)` / dark `oklch(0.205 0 0)`): Cards, panels, raised sections — bg pulled toward ink.
- **Ink** (light `oklch(0.190 0 0)` / dark `oklch(0.930 0 0)`): Body and heading text. Contrast vs bg exceeds 7:1 in both modes. Also the blinking carets (brand hover, calibration cursor) — carets are ink, not acid; they carry no signal.
- **Muted** (light `oklch(0.440 0 0)` / dark `oklch(0.700 0 0)`): Secondary text, captions, metadata, the "setup" line of a crescendo heading. Verified ≥4.5:1 vs its bg — never a decorative light-grey that fails contrast.
- **Line** (light `oklch(0.885 0 0)` / dark `oklch(0.285 0 0)`): Hairline borders, dividers, section rules, chip and ghost-button borders. 1px only.

### Named Rules
**The One Signal Rule.** Acid chartreuse appears on ≤10% of any screen and never carries body text. It is a verb, not a wallpaper — it marks the single most important action or the exact instant of transformation. The moment a second element also glows acid, both stop being the signal. Its final form is the **Signal Handoff** (see Components): within the hero fold the acid lives on exactly one element at a time — the CTA holds it until the Transform ignites, then yields it to the mark. The nav CTA is graphite everywhere, always; the signal belongs to the folds that earn it.

**The Zero-Hue Rule.** Every neutral is chroma 0 — pure graphite, pure off-white, pure grey. No hidden warmth, no cool tint "for elegance." The acid is the only color in the building; tinting the neutrals would dilute it and drift toward the AI cliché.

## 3. Typography

**Headline Font (H1 + wordmark + headers):** **Instrument Serif** (400, seu único peso) — display serif. **Self-hosted** via `@fontsource/instrument-serif`, importada em `src/styles/fonts.css`. Exposta como `--font-headline`. Usada nos H1 (tagline "Escreve como você pensa.", títulos de página), na wordmark "Cultiv" (nav, identidade, footer, OG image) e nos headers de cards (plano, painel de nó, resultado da demo) e de páginas/overlays. Sem caixa-alta nem tracking largo — a wordmark é "Cultiv", nunca "CULTIV".
**Body Font:** **Mona Sans** (variável, wght 200–900), self-hosted via `@fontsource-variable/mona-sans` com `@font-face` hand-rolled para registrar `"Mona Sans"`. Exposta como `--font-body`. Corpo (peso 425), navegação e labels (peso 500), subtítulos/H2 (peso 600).
**UI Font:** **Fraunces** (variável, opsz 9–144 + wght 100–900), self-hosted via `@fontsource-variable/fraunces`, registrada como `"Fraunces"`. Exposta como `--font-ui`. Títulos internos/H3 (600) e todos os números — preços, métricas, contadores — em 700–800, sempre dentro de badges/círculos arredondados (visual rhyming).

**Character:** Três vozes com papéis rígidos: a cursiva assina (só H1 e wordmark — rara, portanto memorável), a sans trabalha (todo o texto funcional), a serif conta (títulos internos e números). Hierarquia vem da troca de voz + peso, não de cor; o sinal acid mantém seu monopólio.

### Hierarchy
- **Headline / H1** (Instrument Serif 400, `2.8rem`, line-height 1.15, tracking 0): tagline, títulos de página e headers de cards/overlays; `.display` é a variante hero (`clamp(2.8rem, 6vw, 4.5rem)`).
- **Subtitle / H2** (Mona Sans 600, `1.1rem`, line-height 1.3): subtítulos de seção.
- **Title / H3** (Fraunces 600, `1.2rem`, line-height 1.25): títulos internos e de card.
- **Body** (Mona Sans 425, `1rem`, line-height 1.6 light / 1.68 dark, tracking 0 light / 0.012em dark): prosa. Capped at **68ch** (`--measure`).
- **Label** (Mona Sans 500, `1rem`, line-height 1.3, 0.01em): navegação, labels de UI, captions. Button text `0.9375rem` 500. **Sentence case by default.**
- **Num** (Fraunces 700–800, lining + tabular nums): preços, métricas, contadores — dentro de badges arredondados ou círculos.

### Named Rules
**The No-Eyebrow Rule.** No tiny uppercase tracked kicker above section headings. That scaffold ("ABOUT" / "PROCESS") is an AI tell. Sections open on the Headline itself; if a section needs framing, it earns it with a full sentence or the acid signal, not a label.

**The Weight-Not-Color Rule.** Emphasis comes from weight and size, never from coloring a word — except the single acid mark permitted by The One Signal Rule. The one sanctioned tonal move is the **crescendo**: a heading's setup line sits in Muted and its punch line lands in Ink (the hero's "Escreva mais. / Sem soar como todo mundo." and the note's heading both use it). That is graphite tone, not hue — the acid monopoly is untouched.

## 4. Elevation

Flat by default, with structural tonal layering rather than decorative shadow. Depth is read from the graphite ramp — surface sits a step off bg, a raised panel a step further; the featured pricing plan is a Surface tonal step where a lesser system would reach for a shadow. Shadows appear only as a **response to state** (hover, focus, a lifted CTA), never as ambient card decoration. The one exception is the acid signal, which may cast a diffuse *glow* (a colored shadow) to sell the "ignition" moment — that glow is a motion material, not a resting elevation, and reduced-motion removes even the ignited panel's resting glow.

### Shadow Vocabulary
- **State-lift** (`--shadow-lift`; light `0 6px 20px oklch(0 0 0 / 0.14)` / dark `0 6px 20px oklch(0 0 0 / 0.5)`): Applied on hover to interactive graphite elements only (primary buttons), paired with a −2px translate. Defined, not a soft ghost-cloud.
- **Signal-glow** (`--glow-signal`; light `0 0 32px oklch(0.83 0.19 128 / 0.45)` / dark `0 0 36px oklch(0.86 0.2 128 / 0.5)`): The acid ignition glow. Used on the Transform panel at ignition and on the acid CTA's hover. Never on a resting card.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest and separated by tone. If you reach for a resting drop shadow to make a card "pop," the layout has failed — restructure with the graphite ramp instead. Never pair a 1px border with a soft ≥16px drop shadow (the ghost-card tell).

## 5. Components

Extracted from the shipped code: `apps/landing/src/components/*.astro` + `src/styles/global.css`, on the tokens in `packages/ui/src/tokens.css`. Motion runs on two easings — `--ease-out` quint `cubic-bezier(0.22, 1, 0.36, 1)` for state changes (160ms fast / 260ms medium), `--ease-out-expo` `cubic-bezier(0.16, 1, 0.3, 1)` for entrances (600ms slow and up).

### Buttons
- **Shape:** Full pill (`999px`). Confident, tactile, singular. Text: grotesque `0.9375rem` weight 500.
- **Accent (the conversion CTA):** Acid chartreuse fill, On-Accent text, `14px 28px`. This is a fold's one loud element. On hover: −2px lift + Signal-glow. The final-fold CTA scales up to `18px 40px` at `1.0625rem`.
- **Primary (structural):** Graphite Ink fill (near-black light / near-white dark), bg-colored text. The nav CTA (compact: `10px 20px`, `0.875rem`) and the JS-off/reduced-motion hero CTA. On hover: −2px lift + State-lift.
- **Ghost:** Transparent fill, 1px Line border, Ink text, `13px 27px`. Tertiary actions; border shifts to Ink on hover, −2px lift, no shadow.
- **Press / Focus:** `:active` compresses to `scale(0.98)`. `:focus-visible` shows a 2px ring offset 2px in `--focus-ring` — **Ink in light mode** (acid fails 3:1 non-text contrast on the light bg, ≈1.4:1), **acid in dark mode**, where it passes comfortably. Transitions: transform 160ms, box-shadow 260ms, both ease-out quint.

### Chips & Toggles
- **Chip (intent chips):** Transparent fill, 1px Line border, full pill, `8px 16px`, Label type. Hover: border → Ink. Informational, not selectable.
- **Segmented toggle (billing period / currency):** A pill group (1px Line border, 3px inner padding); the active option fills Graphite Ink with bg-colored text, inactive options are Muted on transparent. Script-only controls stay `hidden` until JS wires them (a JS-off visitor never sees dead toggles), with their height reserved so nothing reflows when they arrive; without JS the whole control row collapses (`html:not(.js)`) instead of leaving a dead gap.

### Cards / Containers
- **Corner Style:** `24px` (`--r-card`) — visual rhyming: cards/painéis 24px, inputs 16px (`--r-input`, foco com borda chartreuse), botões/badges pill 100px (`--r-pill`), ícones em contêineres circulares.
- **Background:** Surface, on a bg page (Transform panel, calibration prompts). Plan cards invert the recipe: transparent with a 1px Line border, and the *featured* plan drops the border for a Surface fill — a tonal step instead of a shadow. Nested cards are prohibited.
- **Border:** Optional 1px Line. **Do not** combine a border with a soft drop shadow.
- **Internal Padding:** 24px (lg), scaling via clamp up to 40px (xl) on feature panels (Transform panel, plan cards).

### Navigation
- **Style:** Fixed 64px top bar, fully transparent over the hero; past 8px of scroll it gains a translucent bg (`color-mix(in oklch, var(--bg) 88%, transparent)` + 12px backdrop blur) and a 1px Line bottom border. Brand wordmark at weight 620; on hover an ink caret blinks after the name (the name is still being written).
- **Links:** Label-size grotesque, Muted at rest → Ink on hover, with a 2px acid underline growing left-to-right (background-size transition).
- **CTA:** A compact **graphite primary** pill, right-aligned, persistent. Never acid — see The One Signal Rule.
- **Tools:** 40px pill buttons (1px Line border, 44px invisible hit-area) for language and theme; border → Ink on hover, `scale(0.94)` on press. Script-only: like the pricing toggles, they (and the burger) hide under `html:not(.js)` — links and CTAs are real anchors and remain.
- **Mobile (≤760px):** Bar keeps brand + CTA + burger; links and tools move into a full-height native `<dialog>` sheet (bg fill, `oklch(0 0 0 / 0.4)` backdrop) with items at Title size and an acid CTA. Tapping dead space dismisses.

### Scroll Reveals
Content is **visible by default**. `html.js` arms `.reveal` elements (opacity 0, 18px rise); an IntersectionObserver (−8% bottom rootMargin) releases them with a 600ms ease-out-expo transition, staggered 70ms per `--i` index. The hero runs its own entrance (`hero-rise`, 0.8s expo, cascading 90–520ms delays). **Release-all triggers:** reduced motion, tab hidden at load or mid-visit (`visibilitychange`), `beforeprint` (plus a `@media print` CSS fallback), and a **3s human-presence watchdog** — if no pointer/wheel/touch/key input arrives after load (headless captures never produce any), everything off-screen snaps visible with transitions zeroed (`html.reveal-now`). A second watchdog in `<head>` drops the `js` class entirely if the reveal module never runs. **The Never-Invisible Rule:** content must never stay hidden in a non-interactive context; choreography is a reward for a present human, not a gate.

### Signature: The Voice Transform & the Signal Handoff
The defining component (hero fold, `Hero.astro`). A Surface panel holds two overlaid states of the same request: the "before" — grey, Muted, Fragment-Mono generic-AI filler — and the "after" — the author's voice, grotesque at `clamp(1.35rem, 2.6vw, 1.8rem)` weight 500 (a full step larger than the mono; the size gap IS the argument), with one sentence marked acid (`mark`: accent fill, On-Accent text, 4px radius, `0.25em` vertical padding, `box-decoration-break: clone` — wrapped clone boxes overlap past the half-leading and merge invisibly, same-color on same-color).

**Resting default (JS-off):** the ignited "after" state, mark lit, CTA graphite. **With JS + motion allowed:** the panel arms to "before" and the fold's acid signal moves to the hero CTA. Ignition is **audience-gated**: if the panel is ≥70% visible at load (tall viewports), it holds ~2.2s (so the hero entrance lands and the grey text gets read) and ignites; otherwise — including the common case where the armed panel merely peeks above the fold — it waits for a real scroll/wheel/touch/key event that brings the panel's **midpoint** into the viewport, then ignites 500ms later. The midpoint always crosses the viewport as the panel scrolls through, so ignition is reachable on every viewport, short landscape included. Igniting: the mono "before" blurs out (6px), the author's words cascade in per-word (28ms stagger, 0.5s expo rises), the acid mark lands last, the panel takes the Signal-glow — and the CTA **yields the signal**, draining from acid back to graphite over 700ms. Exactly one element glows acid at any moment in the fold. A "Replay" text button re-arms and re-runs it; the signal returns to the CTA while armed. The hero's ghost CTA ("See it work") is a real `#transform` anchor that also replays: already ignited → re-arm + re-ignite; still armed → the anchor scroll trips the gate naturally.

The "Generic AI / Your voice" pill tags in the panel header are a **segmented control** (toggle buttons, `aria-pressed`, keyboard operable): at rest they flip the stage between before and after with a quick whole-paragraph crossfade — the per-word cascade stays exclusive to ignition/replay. Flipping to "before" removes glow and mark (zero acid on the fold — allowed; two acids never are); the CTA does not reclaim the signal. Clicking "Your voice" before the first ignition runs the full ceremony instead. Styling follows the segmented-toggle recipe: active fills graphite with bg text, inactive is Muted on transparent (full ≥4.5:1 contrast, no opacity fade). The buttons ship `disabled` and JS enables them — a JS-off visitor sees plain state labels, never dead controls.

**Reduced motion:** the CTA never paints acid (enforced in CSS), the transform collapses to a near-instant crossfade, and the ignited panel carries no glow. **Accessibility:** screen readers get each sentence whole via an `sr-only` span; the per-word spans are `aria-hidden` visual material; the figure is `aria-live="off"`.

A quieter sibling, the founder-note mark (`FounderNote.astro`), carries the same acid mark treatment on one clause of real Cultiv output, closed by the mono provenance receipt. Selecting any acid mark inverts it to graphite (`mark::selection`) — a small reward for readers who select as they read.

## 6. Do's and Don'ts

### Do:
- **Do** keep every neutral at chroma 0 (The Zero-Hue Rule). Pure graphite and off-white; the acid is the only color.
- **Do** reserve acid chartreuse for ≤10% of the screen — one CTA per conversion fold, the transform mark, the note mark, the 2px nav hover underline, selection, the dark-mode focus ring (The One Signal Rule).
- **Do** put On-Accent (theme-invariant dark ink) text on every acid fill; acid stays bright in both modes, so its text stays dark in both.
- **Do** define and verify both light and dark for every token: body ≥4.5:1, ink ≥7:1, in *both* modes — and ring focus in Ink on light (acid fails 3:1 there), acid on dark.
- **Do** build hierarchy by switching voices (Instrument Serif assina, Mona trabalha, Fraunces conta) and weight; display tracking stays at 0 and clamp max ≤ 6rem.
- **Do** keep cards flat and tonally layered; radius = 24px (`--r-card`), inputs 16px, botões/badges pill; shadows only on state; a featured card is a Surface tonal step, not a glow.
- **Do** keep content visible by default and hand choreography only to a present human — every reveal must release on reduced motion, hidden tabs, print, and the no-input watchdog (The Never-Invisible Rule).
- **Do** self-host both fonts with the metric-matched fallback so the swap is layout-shift-free; never load type from a third-party CDN.

### Don't:
- **Don't** drift toward **generic AI-SaaS** — no violet/purple gradients, no Inter-on-white template, no sparkle/robot/magic-wand icons, no hero-metric big-number grid, no identical icon-heading-text card grids. (PRODUCT.md anti-reference, verbatim.)
- **Don't** fall into the **saturated editorial-magazine reflex** — no display-serif italic + tiny tracked mono labels + ruled three-column broadsheet. (PRODUCT.md anti-reference.)
- **Don't** ship **timid minimalism** — monochrome here is high-contrast and committed, never beige-and-forgettable. (PRODUCT.md anti-reference.)
- **Don't** tint the neutrals warm or cool "for elegance"; that dilutes the signal and drifts to cliché.
- **Don't** let a second element glow acid on the same fold — the moment two things are the signal, nothing is. The Signal Handoff exists precisely so the hero never breaks this; the nav CTA stays graphite forever.
- **Don't** color the carets — blinking cursors (brand hover, calibration wizard) are Ink; they carry presence, not signal.
- **Don't** use a tiny uppercase tracked eyebrow above sections, or ornamental `01 / 02` numbering as section scaffolding. (The How-It-Works `<ol>` steps are the one earned sequence: they are the product's actual order, not decoration.)
- **Don't** pair a 1px border with a ≥16px soft drop shadow (ghost-card), round cards past 24px (`--r-card`), or use gradient text / `background-clip: text`.
- **Don't** communicate errors or status with color alone — the acid is the only saturated color and it means "signal," not "success."
