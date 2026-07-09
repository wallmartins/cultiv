# Design Brief — Cultiv Landing (Homepage + Pricing)

**Status:** confirmed (shape run, 2026-07-08)
**Scope:** `apps/landing` (Astro, SSG, zero-JS-by-default) — `/` and `/pricing`, pt-BR first, `/en/*`-ready
**Sources:** PRODUCT.md · DESIGN.md · ADR 0003 · `.claude/cmo/*` · `.claude/skills/cultiv-design/tokens/*`

## 1. Feature Summary

The public marketing surface for Cultiv, an AI writing engine that learns how the author reasons. Visitors are Brazilian founders/consultants arriving via pain ("ChatGPT soa genérico") — the pages must make them *feel* the difference between generic text and their own voice, then send them into signup at `/app` (Auth0). Production-ready.

## 2. Primary User Action

Recognize the problem in the voice demonstration ("this generic text is what I've been publishing"), then click the primary CTA into signup. Everything on the page exists to earn that one click.

## 3. Design Direction

**Color strategy: Restrained with one Drenched override.** Pure white body (`oklch(1 0 0)`, chroma exactly 0 — committed tokens), ink text, oxblood rationed hard — *except one full-bleed oxblood section* mid-page carrying "Você escreve. Cultiv aprende como." in Sora on near-white (`--oxblood-on`). One drenched moment per page, maximum (DESIGN.md per-surface permission).

**Scene sentence:** A founder at 7pm, between the last meeting and dinner, opens the page on a laptop in a bright home office after pasting yet another ChatGPT draft that didn't sound like him — the page must read like a well-set book under good light, not like software. → Light theme, pure white, ink.

**Anchor references:**
- **NYRB dustjacket / book-spine oxblood** — the drenched section and CTA treatment.
- **Substack's reading surface** — EB Garamond prose as the protagonist in the voice demo.
- **Type-specimen pages (Klim-style)** — metrics/traits as annotations *on real text*, never metric cards.

**Reflex-reject note:** the editorial-typographic lane is saturated, but Cultiv's identity (manuscript north star, EB Garamond, oxblood, DM Sans) is already committed — identity-preservation wins. Avoid the lane's *fingerprint* (italic display serif headline + mono labels + three ruled columns): Sora (geometric sans) carries all display; the serif appears **only** as product artifact.

**Typography:** Three-Voice Rule strictly. Sora 600 display (ls −0.03em, clamp ceiling 4.5rem), DM Sans for all chrome/body, EB Garamond exclusively where the visitor reads "the author's" text. The serif's scarcity is itself the demonstration.

## 4. Scope

- **Fidelity:** production-ready Astro pages consuming `packages/ui/tokens` custom properties.
- **Breadth:** homepage (long scroll) + pricing page.
- **Interactivity:** "editorial ousada" — one orchestrated hero load choreography, one interactive voice-comparison moment (single island max, CSS-only if achievable), restrained per-section reveals. Everything else static, zero JS.
- **Time intent:** polish until it ships.

## 5. Layout Strategy

**Homepage — a long scroll structured as an editorial argument, one dominant idea per fold:**

1. **Hero — the voice-morph.** "Textos que soam como você. Não como um robô." (Sora, `text-wrap: balance`). Signature moment: a short paragraph typeset in flat generic-assistant style (DM Sans, grey, uniform) that re-typesets on load into EB Garamond ink prose with rhythm — same message, now *voiced*. Reduced-motion: crossfade. Minimal nav: wordmark (oxblood dot), Preços, Entrar, CTA.
2. **The problem, in text.** Two typeset passages side-by-side (stacking on mobile): "o texto do assistente" vs "o seu texto" — same briefing, real contrast in vocabulary, sentence length, opening move. Sparse editor's marks in the margin. The artifact is prose — this is the page's imagery.
3. **Calibration sequence.** The one place numbers are earned: the real 5-step wizard (opinião → raciocínio → argumentação → adaptação → revisão), "15 minutos" as concrete fact inside prose. A rendered wizard-step artifact (app tokens) as product imagery.
4. **Anatomy of a voice — specimen treatment.** One real generated paragraph with marginal annotations pointing at concrete evidence (sentence length, vocabulary density, opening move, what it avoids). "14 métricas" / "7 traços" live inside annotations, never a stat grid.
5. **Drenched oxblood statement.** Full-bleed `--oxblood`, Sora display in `--oxblood-on`: "Você escreve. Cultiv aprende como." + "Cada sessão, o ChatGPT esquece quem você é. A Cultiv não." Secondary CTA. Arrives as a hard cut, no fade.
6. **Formats.** The 10 content types as typeset miniatures (LinkedIn post, thread, newsletter opener — tiny real artifacts in EB Garamond), asymmetric composition, not an identical card grid.
7. **Final CTA + price anchor.** Short editorial close, primary CTA to signup, and one line of prose: **"Planos a partir de R$49/mês"** linking to `/pricing`. Concrete number on the homepage; full comparison one click away. Footer: minimal, locale switch, legal.

**Pricing (`/pricing`):** "Escolha o plano que publica como você." Three plans in a flat comparative layout (tonal surface panels, 1px ink borders, no ghost-cards), oxblood only on the recommended plan's CTA. Short concrete FAQ (calibração, formatos, cota) in prose, no accordion theatrics.

**Rhythm:** generous varied `clamp()` vertical spacing — tight where the argument chains (2→3→4), hard full-bleed break at 5. No eyebrows, no `01/02/03` scaffolding outside the genuinely-ordered wizard.

## 6. Key States

- **Hero load:** choreographed once; `prefers-reduced-motion` collapses all entrances to opacity crossfades.
- **Nav:** current-page state on Preços via oxblood text, not underline decoration.
- **CTA hover/press:** `--oxblood` → `--oxblood-ink` (darken toward ink, never clay).
- **Focus:** visible oxblood focus ring on every interactive element; keyboard-complete.
- **Mobile:** single column; comparison stacks with "antes/depois" labeling; hero clamp tested at 320px — no overflow.
- **`/en/*` readiness:** Astro content collections; all strings externalized day 1.
- **No-JS:** every section fully readable; the island degrades to the static "voiced" end-state.

## 7. Interaction Model

Scroll is the primary interaction — the page is an argument read top to bottom. One island maximum (voice comparison toggle "assistente"/"você"); everything else CSS. Section reveals are per-section-appropriate (specimen annotations draw in sequentially; drenched section hard-cuts), never one uniform recycled entrance. CTA → Auth0 signup at `/app`. Easing: ease-out-quart/expo, no bounce.

## 8. Content Requirements

- **Headlines:** from `.claude/cmo/headlines.md` — hero #1, pricing #1. Hard bans enforced (no internal jargon: "como você raciocina", never "Reasoning Signature").
- **Demo passages:** 2 short pt-BR passages (generic vs voiced) on a founder-relevant topic — load-bearing copy. Plus 3 format miniatures (LinkedIn post, thread opener, newsletter lede).
- **Wizard step names + 15-min fact**; specimen annotation copy (concrete: "frases médias de 14 palavras", "abre com observação, não com tese").
- **Pricing:** R$49/99/199 tiers with concrete quota/format facts. CTA label: **"Criar minha voz"**.
- **Imagery roles:** no stock photography — imagery is typeset product artifacts (rendered posts, wizard step, annotated specimen) built as semantic HTML/SVG with app tokens. Deliberate, not an omission.

## 9. Recommended References

`typeset.md` (typography-led), `animate.md` (hero choreography + reveals), `layout.md` (asymmetric editorial rhythm), `brand.md`.

## 10. Resolved Decisions

- Pricing is a separate `/pricing` page (ADR 0003, linkable/indexable/growable) **plus** a one-line price anchor in the homepage's final CTA section.
- CTA is real signup (Auth0 → `/app`), not waitlist.
- pt-BR first; `/en/*` structure ready.
- Prices designed at R$49/99/199 — **sync backend pricing (R$0/69/119) before launch** (flagged in positioning notes).
