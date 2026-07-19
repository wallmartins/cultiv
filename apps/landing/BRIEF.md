# Design Brief — Cultiv Landing Page

> Status: **Confirmed** · Register: **brand** · Surface: `apps/landing` (single page)
> Reads alongside [`PRODUCT.md`](./PRODUCT.md) (strategy) and [`DESIGN.md`](./DESIGN.md) (visual system).
> This brief is task-scoped; the visual direction lives in DESIGN.md and is inherited, not restated.

## 1. Feature Summary

The unauthenticated marketing surface for **Cultiv** — *"Your authenticity, at scale."* It must convince a voice-skeptical **solo creator** that Cultiv is genuinely *not* generic AI, then convert them to a **paid plan via a free trial** through Auth0 → checkout. The entire argument rests on two product truths the page leads with:

1. **Voice is learned through a guided calibration** — how you *think and argue*, not scraped uploads.
2. **Generation starts from intent**, not templates — "what are you trying to say?", never "pick a format."

## 2. Primary User Action

Start the free trial — the single Accent CTA **"Start free trial" / "Comece o teste grátis"** — routing through Auth0 (`returnTo` = the calibration onboarding), then currency-routed checkout. Secondary action: *see it work* (the Voice Transform / a real sample) — proof before the click.

## 3. Design Direction

Inherited wholesale from DESIGN.md — **no per-surface override**.

- **Color strategy:** Restrained monochrome architecture + one committed signal. Graphite neutrals (chroma 0), acid chartreuse on ≤10% of any screen. Dual-mode (light + dark), co-equal.
- **Scene sentence:** *"A solo writer, late, deciding whether one more AI tool is worth trusting — the page is a quiet graphite studio where a single line of their own voice suddenly lights up."*
- **Anchor references:** Linear (precision, restrained dark craft) · Vercel / Geist (monochrome confidence). Anti-reference: any violet-gradient AI-SaaS template. Editorial *seriousness* borrowed; editorial-magazine *template* refused.
- **Visual-probe step:** skipped (harness has no native image generation).

## 4. Scope

| Axis | Decision |
|---|---|
| **Framework** | **Astro** — near-zero JS, island-hydrate only the Voice Transform + toggles. Deploys to Vercel. |
| **Fidelity** | **Production-ready, polish-till-ships.** |
| **Breadth** | Whole single-page surface. |
| **Interactivity** | Shipped-quality. |
| **Languages** | **Bilingual pt-BR + en**, language toggle (single page, persisted). pt-BR primary. Currency follows locale (R$ / $). |
| **Fonts** | Single committed grotesque. Target **PP Neue Montreal**; shippable self-hosted stand-in **Switzer**. Support mono for the "before" text (Geist Mono). |

## 5. Layout Strategy

Long, deliberately-paced single scroll; one dominant idea per fold; asymmetric where it earns emphasis.

1. **Nav** — minimal, transparent over hero → surface + hairline on scroll. Holds theme toggle, language toggle, persistent Accent CTA.
2. **Hero + Voice Transform** — the signature. Big grotesque statement; flat grey mono "generic AI" text **ignites** into the author's grotesque voice, one phrase flaring acid. This *is* the headline argument.
3. **How it works — calibrate → intent → generate** — the one *earned* numbered 3-step sequence (order carries meaning).
4. **The calibration explained** — the core differentiator: the guided prompts that elicit *how you think* (a quick opinion → what you learned and how it shifted your view → a position you'll defend → explain to a newcomer). Folds in the **intent-first** model (the six intents as "start from what you want to say").
5. **Pricing** — three plans inline, monthly/annual toggle.
6. **Final CTA** — restate the promise, one acid button.
7. **Footer.**

**Mechanism-as-proof:** sections 2–4 *are* the credibility. **No testimonial / logo section** (pre-launch; nothing fake).

## 6. Key States

- **Theme:** light ⇄ dark, every section verified in both (ink ≥7:1, body ≥4.5:1). `prefers-color-scheme` default + persisted toggle override.
- **Language:** pt-BR ⇄ en. Portuguese runs ~15–20% longer — headings must not overflow at any breakpoint (hard ban); test both languages × all breakpoints.
- **Voice Transform:** before (mono grey) → ignited (grotesque + acid flare) → **reduced-motion** crossfade (no morph). Must render a visible resting default even if JS/scroll never fires.
- **Nav:** at-top (transparent) vs scrolled (surface + hairline); mobile sheet via native `<dialog>` / popover.
- **Pricing:** monthly ⇄ annual toggle (annual −20%).
- **CTA:** idle → hover (signal-glow + lift) → focus-visible (acid ring) → click (→ Auth0).
- **Empty / edge:** JS-off (page fully readable, CTAs are real links), slow-network (fonts `swap`, no layout shift).

## 7. Interaction Model

Choreographed page-load reveal (staggered, each reveal fit to its content — never one uniform fade). Voice Transform ignites on scroll-into-view (IntersectionObserver) *and* has a visible resting default. Optional Lenis smooth-scroll with a reduced-motion off-switch. Toggles are instant, no reload (islands). Every CTA is a real `<a>` to the Auth0 conversion URL. All eases exponential ease-out; durations from the DESIGN.md sidecar motion tokens.

## 8. Content Requirements

- **Copy (all bilingual):** hero headline + subhead; 3-step labels/blurbs; calibration section (may quote the *real* wizard prompts, pt-BR & en); the six intent labels (real, from the generation-intent catalog); pricing tiers; final CTA; footer.
- **Imagery** — brand register needs visual weight, satisfied *without* stock photos: the typographic **Voice Transform** scene, a faithful **calibration-prompt vignette** (stylized product UI, not a screenshot dump), and a **generated-sample** artifact. These typographic/product scenes are the imagery.
- **Icons:** inline SVG only, sparse.

## 9. Commercial Model

- **No free tier.** A **free trial** (asserted 7 days — confirm) precedes the card. The page earns the trial click with proof, not a free-signup shortcut.
- **Plans** — monthly or **annual (−20%)**, priced BRL (pt-BR) / USD (en):

  | Plan | Monthly | Annual (−20%, per mo) |
  |---|---|---|
  | Explorador / Explorer | R$49 / $9 | R$39.20 / $7.20 |
  | **Criador / Creator** *(featured)* | R$99 / $19 | R$79.20 / $15.20 |
  | Profissional / Professional | R$199 / $39 | R$159.20 / $31.20 |

- **Checkout — currency-routed:** BRL → **Asaas**, USD → **Stripe**, entered through Auth0. Backend + Auth0 are **live in production**. At build, pull the actual Auth0 domain + conversion/checkout URL shapes from repo config / `packages/payments` routes (README's `buildMarketingConversionUrl` pattern); wire real links. If a specific URL isn't discoverable in config, wire the correct *shape* and flag the exact value as a one-line TODO — never guess.

## 10. Recommended References For Build

`animate.md` (Voice Transform + choreographed load) · `layout.md` (multi-section rhythm) · `typeset.md` (grotesque hierarchy) · `clarify.md` + `adapt.md` (bilingual copy, length & responsive) · `harden.md` (i18n, reduced-motion, JS-off edges).

## 11. Open Items (asserted defaults, adjustable)

1. **Trial length** — asserting **7 days**.
2. **Bilingual mechanism** — single page + persisted toggle now; localized routes (`/` + `/en`) later if desired.
3. **Checkout URLs** — wired from live config at build; exact value flagged TODO only if not discoverable.

---

## Build kickoff (on go)

1. Scaffold the Astro app in `apps/landing`, wired into the pnpm workspace and `dev:landing`.
2. Lay design tokens from DESIGN.md (dual-mode OKLCH, type scale, motion, z-index) as the base layer.
3. Build section by section, screenshot-verifying each in **both themes** and **both languages** at all breakpoints.
