---
target: apps/web/src/marketing
total_score: 28
p0_count: 2
p1_count: 5
timestamp: 2026-07-06T02-26-33Z
slug: apps-web-src-marketing
---
# Critique: Cultiv Marketing Landing Page

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Lazy-loaded sections have no loading indicator (placeholder=null). Demo loading is well-done. No scroll-progress indicator for the long page. |
| 2 | Match System / Real World | 4 | Cartography/territory metaphor is consistent. Language toggle works per locale. Pricing toggle adapts BRL/USD. |
| 3 | User Control and Freedom | 3 | Demo has reset. Anchor nav works. **No skip-to-content link** — keyboard users tab through entire sticky header. |
| 4 | Consistency and Standards | 3 | **Dual component systems**: ProblemSection/FormatsSection use `CartographySurface` with cream backgrounds and legacy tokens; other sections use direct Tailwind with paper tokens. Two mobile-nav implementations coexist. **Missing CSS utilities**: `cartography-grain`, `ui-type-mono`, `ui-type-logbook`, `border-dotted-cartography` are referenced but never defined — grain texture, dotted borders, and semantic font differentiation are absent at runtime. |
| 5 | Error Prevention | 3 | Demo has char counter with color feedback. Disabled button state works. Loading state is clear. |
| 6 | Recognition Rather Than Recall | 3 | Section navigation is clear. HowItWorks padded numbering aids recognition. Testimonial is named. Pricing labels match across locales. |
| 7 | Flexibility and Efficiency | 2 | Language toggle and dark mode for power users. **No scroll-top or back-to-top** on a very long page. No speed-skip or condensed mode. |
| 8 | Aesthetic and Minimalist Design | 3 | Typography hierarchy is strong. **Breathe section repeats 3×** with identical pattern — diminishing returns. Manifesto body is a dense text wall. HowItWorks alternating grid adds layout complexity that fights linear narrative. |
| 9 | Help Users Recognize, Diagnose, Recover from Errors | 2 | Demo's disabled button is main feedback. **No network-error handling**. **No aria-live regions** for dynamic content. **No recovery suggestion** if demo analysis fails. |
| 10 | Help and Documentation | 2 | FAQ is solid (6 questions). **No contextual tooltips**. No inline glossary for the cartography metaphor. No onboarding hints on the demo. |
| **Total** | | **28/40** | **Good** — address weak areas |

## Anti-Patterns Verdict

### LLM Assessment — Low AI-slop risk
The page largely avoids the classic tells: no gradient text, glassmorphism, side-stripe borders, border-radius ≥ 16px, repeating-linear-gradient backgrounds, decorative grid backgrounds, or hand-drawn SVGs. The hero uses a product-relevant comparison card rather than the hero-metric template. The main risk factor is the **Breathe section repeated 3×** with near-identical layout — that pattern reads as an AI scaffolding move. Overall, the page would not scream "AI made this."

### Deterministic Scan — 0 findings from detector (narrow coverage)
The bundled detector returned 0 antipattern findings. However, manual review revealed **multiple missing CSS utilities** that undermine the visual system: `cartography-grain`, `ui-type-mono`, `ui-type-logbook`, and `border-dotted-cartography` are used in components but never defined at runtime. The grain texture signature — central to the Cultiv paper identity — is entirely absent.

### Visual Overlays — Not available (injection not confirmed)
Browser inspection confirmed all layout and rendering issues described below.

## Overall Impression

A genuinely well-crafted marketing page that successfully avoids most SaaS tropes. The typographic hierarchy (Sora display at clamp sizes) creates real editorial presence. The interactive demo is the right centerpiece — immediate value without signup, charming loading micro-copy, well-considered char-counter feedback.

The page's core structural tensions:
- **Three nearly-identical Breathe sections** create a repetitive cadence that undermines their role as punctuation marks
- **A Manifesto that over-explains** with a dense text wall before giving the reader visual relief
- **An alternating HowItWorks layout** that fights its own linear narrative
- **Missing CSS utilities** that silently break the paper-grain texture, dotted borders, and semantic font differentiation

For a pre-launch marketing surface, this is well above average. The craft shows. The biggest risk is metaphor density (territory/map/rota/coordinates/compositor) potentially overwhelming first-time visitors before they understand what the product actually does.

## What's Working

**1. Typographic craft.** The Sora display headline with tight tracking and `text-wrap: balance` is genuinely strong. The three-role type system (Sora/DM Sans/Merriweather) is used with purposeful distinction across display, UI, and reading copy. The word-level GSAP reveal animation on the hero headline shows real editorial attention.

**2. Interactive demo with zero friction.** The freeform text analyzer (type → analyze → see 6 metrics) provides immediate value without signup. The wave-loader animation, rotating loading messages, and six-metric result cards are the strongest engagement mechanic on the page. The char-counter with color feedback (grey → amber → terracotta) is well-considered.

**3. Coherent visual identity.** The cartography/territory metaphor holds across sections without over-extension. The color palette (paper/terracotta/amber/earth) is warm and distinctive. The 8px radius and flat-card conventions give genuine physicality.

## Priority Issues

### P0 — Merriweather font never loaded
**What**: The serif reading font (Merriweather, aliased as `font-reading` and `font-autoridade`) is absent from the font loading strategy. The HTML loads Inter, Playfair Display, Caveat, and JetBrains Mono — but not Merriweather. All `.text-reading` content (Demo previews, testimonial body, generated text previews) silently falls back to Georgia or the platform default serif. The HeroSection preview text and Manifesto body render in the wrong typeface. **This is the single highest-visibility quality issue on the page.**
**Fix**: Add Merriweather to the critical font loading path. Alternatively, if DM Sans is the intended reading font for the marketing surface (vs. Merriweather for workspace), update the CSS utilities to match.

### P0 — Breathe section repeats 3× with identical layout
**What**: Three Breathe sections with the same centered/large-autoridade-text/terracotta-divider pattern. The third instance ("Sua voz, preservada.") arrives after the testimonial, and the user has already seen this exact pattern twice. The visual rhythm loses impact and reads as filler.
**Fix**: Differentiate the three breathes — use data-visualization texture for the stats breathe, a quieter treatment for the symbol breathe, and preserve the full treatment for the tagline breathe. Or remove one and fold its copy into an adjacent section.

### P1 — Manifesto section is a dense text wall
**What**: Three paragraphs of reading copy (~15 lines mobile) with no subheadings, pull-quotes, or scanning anchors. The argument (generic AI bad → Cultiv different → 14 metrics) is compelling, but the reader faces a serif paragraph block with only the before/after cards as visual relief at the bottom.
**Fix**: Add pull-quotes, break into sub-sections, or use the before/after card pair as the primary narrative device with shorter supporting text. The body could be 40% shorter and still convey the message.

### P1 — Missing CSS utilities: grain texture, dotted borders, semantic fonts
**What**: Four CSS utilities referenced across components are never defined:
- `cartography-grain` (grain overlay ::after pseudo) — the paper texture signature is absent
- `border-dotted-cartography` (dotted borders in ProblemSection/FormatsSection)
- `ui-type-mono` and `ui-type-logbook` (semantic font differentiation in ComparisonFrame)
Additionally, the `use-paper-parallax` animation runs GSAP on `--cartography-grain-x/y` custom properties that are never consumed by any CSS rule — dead animation.
**Fix**: Define the missing utilities as `@utility` rules matching the DESIGN.md specifications. Wire the parallax to `background-position` or remove it.

### P1 — HowItWorks alternating layout fights linear narrative
**What**: Steps alternate left-number/right-text with right-number/left-text (isReverse check) — forcing the reader to re-establish the scanning start point on every row. This layout complexity adds zero comprehension value for a 4-step list.
**Fix**: Use consistent left-column-number / right-column-text for all four steps. If visual variety is needed, vary the step card styling, not the reading direction.

### P1 — No skip-to-content or back-to-top on a very long page
**What**: ~13 sections over 3-4 viewports. Keyboard users must tab through the entire sticky header before reaching content. No way to return to top from the bottom (Pricing/FAQ/CTA area) without manual scrolling.
**Fix**: Add visually-hidden skip-to-content link as the first focusable element. Add a floating back-to-top button on the last sections.

### P2 — Dual design grammar (ProblemSection + FormatsSection vs. rest of page)
**What**: ProblemSection and FormatsSection use `CartographySurface` with cream backgrounds (`bg-off-white` → #F8F5F0 override), `CoordinateLabel` components, `text-deep-blue` headings, and `border-dotted-cartography`. The other 10 sections use direct Tailwind with paper backgrounds, `text-ink` headings, and `border-ghost`. Two sections look visually different — different surface color, different heading color, different border style — for no intentional reason.
**Fix**: Align all sections to the same visual grammar. These are the only remaining sections using the legacy CartographySurface component from the older refactor pass.

### P2 — backdrop-blur in header violates design system
**What**: The SiteHeader uses `backdrop-blur-[14px]` on the sticky header. The DESIGN.md explicitly bans decorative blur: "Don't use glass blur, glassmorphism or backdrop-filter decorativo."
**Fix**: Replace the backdrop-blur with a solid paper background at 100% opacity. If translucency is needed for the scroll effect, use a `<div>` that becomes opaque on scroll rather than a continuous backdrop blur.

### P3 — Hero heading uses inline fontWeight: 800 override
**What**: Line 20 of HeroSection: `style={{ fontWeight: 800 } as React.CSSProperties}` overrides the `.text-display` class which defines `font-weight: 700`. This inline style will survive any utility refactoring silently.
**Fix**: Either update `.text-display` to 800 if that's the intention, or add a `.text-display-bold` utility.

## Persona Red Flags

### Jordan (Confused First-Timer)
- **Metaphor density**: "Território" / "mapa" / "rota" / "coordenadas" / "compositor" / "bússola" — the cartography cluster requires translation. Jordan needs to understand the product in under 5 seconds, and the metaphor may not land immediately.
- **Three CTA variants**: Hero says "Criar meu perfil de voz", nav says "Criar perfil", mobile nav says "Começar grátis" — different phrasings for the same action creates uncertainty.
- **Manifesto wall**: Starts strong ("A era dos textos genéricos acabou.") but drops into a dense paragraph before Jordan has confirmed what the product actually does.

### Riley (Edge-Case Tester)
- **Demo textarea, no maxLength**: Riley could paste 50K characters, freezing the UI via synchronous `analyzeVoice()` iteration.
- **FAQ accordion 20rem cap**: If an FAQ answer exceeds 20rem on large screens, content will be clipped with no indication.
- **Dark mode FOUC**: localStorage toggle may flash wrong theme on hard reload if JS hydrates slowly.
- **Lazy load flash**: ViewportBelowFoldSections rootMargin 320px — Riley on a slow connection sees an empty placeholder flash before sections mount.

### Casey (Distracted Mobile User)
- **No sticky CTA**: Casey must scroll through the entire page to reach the bottom CTA.
- **Demo friction**: Requires typing 20+ characters on mobile — high drop-off risk for a distracted user.
- **Long mobile scroll**: ~13 sections on a single-column layout; Casey loses context between sections.
- **Pricing comparison lost**: Three plan cards stacked vertically on mobile — Casey loses the side-by-side advantage.

## Minor Observations

- `SiteHeader` uses ☰/✕ Unicode characters for hamburger; there's a separate `SiteMobileNav` with an animated three-line hamburger — two mobile navs in parallel.
- The rotating hero stamp (`-rotate-6`, absolute, `-bottom-2 translate-y-full`) could overflow on narrow viewports.
- ComparisonSection h2: "Cultiv vs. o resto." — confident but slightly aggressive vs. the warm tone elsewhere.
- Demo loading messages ("Mapeando seu ritmo de escrita…") are genuinely charming — best micro-copy on the page.
- HowItWorks anchor is `#como-funciona` regardless of locale — English page at `/en` also has `#como-funciona`.
- Footer uses `Link` (TanStack Router) for legal routes but `a` tags for product links.
- `--spacing-section-sm` is referenced in ProblemSection/FormatsSection but may not be defined in the theme.
- The `segmented-control button.active` class is not namespaced — fragile against CSS cascade.
- `grain-overlay` class exists but is never applied to the MarketingLayout wrapper.

## Questions to Consider

1. **Which product flow is real?** The HowItWorks says "3 perguntas + 5 textos", the unused route section says "5 steps: Entre, Ensine sua voz…", and the demo says "write any paragraph, get 6 metrics." When a user signs up and finds a different onboarding flow than the marketing page described, does that break trust?

2. **14 metrics — credible or rounded-up?** The page leans on "14 métricas" heavily (hero stamp, metrics section, comparison table, manifesto). What happens when a user registers and the real dashboard shows a different number of meaningful dimensions?

3. **Font strategy ambiguity.** Merriweather is the designated serif reading font but never loaded. Is the marketing surface intentionally using DM Sans across all text, or was Merriweather forgotten in the font-loading refactor? This needs a decision before shipping — the current state silently falls back to Georgia.

4. **Is the alternating HowItWorks layout intentional or "let's make it interesting"?** The isReverse alternation adds real scanning friction. If it's a deliberate design choice, it needs defending. If it's layout-for-its-own-sake, the fix is straightforward.

5. **Are the ProblemSection and FormatsSection staying or going?** They use a completely different component system from the rest of the page. If they're remaining, they need to be refactored into the current grammar. If they're deprecated, remove them.
