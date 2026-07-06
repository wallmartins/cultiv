---
target: apps/web/src/marketing (landing page, second pass)
total_score: 32
p0_count: 1
p1_count: 2
timestamp: 2026-07-06T03-37-17Z
slug: apps-web-src-marketing
---
# Design Critique: Cultiv Marketing Landing Page (Second Pass)

## Report header provenance

Method: dual-agent (A: sub-agent design review · B: inline CLI detector)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No scroll progress indicator across 12 sections |
| 2 | Match System / Real World | 3 | "14 metrics" repeated across too many sections loses meaning |
| 3 | User Control and Freedom | 4 | Standard marketing page, clean Demo reset, no traps |
| 4 | Consistency and Standards | 3 | Dead visual components still present; dark mode toggle contradicts spec; HowItWorks numbers are intentionally loud |
| 5 | Error Prevention | 4 | Demo button disabled until 20 chars, color-coded counter |
| 6 | Recognition Rather Than Recall | 4 | Linear scroll — nothing to remember |
| 7 | Flexibility and Efficiency of Use | 3 | Ctrl+Enter in Demo is nice; no skip-to-section, no scroll-to-top |
| 8 | Aesthetic and Minimalist Design | 2 | 12 sections is not minimalist; 3 sections carry too little weight |
| 9 | Error Recovery | 4 | No error-generating flows on a marketing page |
| 10 | Help and Documentation | 2 | FAQ has only 6 items; no contextual explanation of cartography metaphor |
| **Total** | | **32/40** | **Good — address remaining weak areas** |

Up from **21/40** in the prior critique. The structural fixes (dead code deletion, demo honesty, dark contrast, FAQ animation, breathe dedup) landed well. The remaining gap is in **aesthetic minimalism** (#8) and **help** (#10) — both compounded by section count fatigue.

## Anti-Patterns Verdict

**LLM assessment**: This page does NOT look AI-generated. No tiny uppercase eyebrows everywhere, no numbered section markers by default, no gradient text, no glassmorphism, no hero-metric template, no side-stripe borders, no hand-drawn SVGs. The terracotta/amber intent is clear. The BreatheSection's stillness reads as deliberate. The Demo is genuinely interactive and honest — no fabricated metrics.

What hurts: section proliferation creates a "designed by committee" feel, not an AI-template feel. The page has 12 sections where 8-9 would carry the same message with more confidence.

**Deterministic scan**: Clean — no findings. The detector correctly found no crude pattern violations (gradient text, glassmorphism, side-stripes).

**Section fatigue scoring** (user's specific request):

| Section | Verdict | Weight |
|---------|---------|--------|
| Hero | Keep ✅ | Heavy |
| Manifesto | Keep ✅ | Heavy |
| Demo | Keep ✅ | Heavy (interactive, distinctive) |
| HowItWorks | Keep, reposition ✅ | Moderate |
| **MetricsShowcase** | **Remove or deeply merge ❌** | **Light** — duplicates Demo concept |
| Comparison | Keep ✅ | Moderate |
| Testimonial | Keep ✅ | Moderate |
| **Breathe** | **Merge into Pricing ❌** | **Very light** — ~15 words |
| Pricing | Keep ✅ | Heavy |
| FAQ | Keep ✅ | Moderate |
| **CtaStrip** | **Merge or remove ❌** | **Light** — repeats hero/pricing CTAs |
| Footer | Keep ✅ | Standard |

Three sections are not earning their scroll cost. Removing them would tighten the page from 12 to 9 sections — still generous but tight enough that every pixel earns its place.

The optimal section order for learning flow would be: Hero → Manifesto → **HowItWorks** (explain before do) → Demo (play) → Comparison → Testimonial → Pricing (with Breathe content + CTA merged) → FAQ → Footer.

## Overall Impression

The Cultiv landing page has improved substantially since the prior critique. The dead code cleanup, demo honesty rewrite, dark contrast fixes, and FAQ animation all raised the floor. The design system is well-executed in active sections.

The single biggest opportunity now: **edit, don't add**. The page has too many sections saying the same thing in different formats. The user's instinct to question section count is correct. Cutting 2-3 thin sections and reordering for learning flow would raise the score to the mid-30s without writing a single new component.

## What's Working

1. **The Demo section is now genuinely honest and interactive.** Real stats (word count, sentences, avg WPS, vocabulary %), keyboard shortcut (Ctrl+Enter), live character counter with color thresholds, clean reset. It demonstrates Cultiv's value without fabricating data. This is the most distinctive element on the page.

2. **Section background alternation provides good chunking.** Paper → amber-tinted → paper → earth → paper → amber-tinted → cream → earth → paper → terracotta-tinted → paper. The rhythm helps the user understand they've entered a new section. The dark sections (HowItWorks, Pricing) create effective visual breathing.

3. **Color discipline is consistent.** Terracotta = action (buttons, links, focus rings). Amber = growth (step numbers, pricing badge, metrics bg). The "one pigment per viewport" rule is respected. Dark backgrounds now use correct cream/70 instead of washed-out ink-muted.

## Priority Issues

### P0 — Dead visual components still present
**What**: `ComparisonFrame.tsx` (190 lines), `HeroComparisonFrame.tsx` (26 lines), `ToolsCompositorDemo.tsx` (252 lines) in `apps/web/src/marketing/visual/` are never imported by any active file. 468 lines of dead code survived the prior cleanup.
**Why it matters**: Rotting code misleads developers, inflates coverage reports, and can silently reconnect if someone re-enables an export.
**Fix**: Delete all three files.
**Command**: `$impeccable distill deadcode`

### P1 — Section count fatigue (3 thin sections)
**What**: 12 sections is too many. MetricsShowcaseSection duplicates the Demo's concept. BreatheSection before Pricing carries ~15 words. CtaStripSection repeats hero/pricing CTAs.
**Why it matters**: The page front-loads 4 consecutive sections saying essentially the same thing (sections 2-5: Manifesto introduces "14 metrics" → Demo shows "14 metrics" live → HowItWorks explains "14 metrics" → MetricsShowcase shows fabricated "14 metrics" example data). The user stops noticing new information by section 3.
**Fix**: Delete MetricsShowcaseSection, merge Breathe content into Pricing heading, merge CtaStrip into Pricing footer or delete. Reorder to: Hero → Manifesto → HowItWorks → Demo → Comparison → Testimonial → Pricing → FAQ → Footer.
**Command**: `$impeccable distill section-fatigue`

### P1 — Dark mode toggle shipped on marketing surface
**What**: SiteHeader.tsx implements a full dark mode toggle with localStorage persistence and CSS class toggling. The v1 marketing spec explicitly ships light-only. The dark theme token `--color-cream` resolves to #a8a59c — a muddy taupe — on some combinations.
**Why it matters**: Visitors who toggle dark mode see an untested, unpolished experience that damages the warm paper brand identity.
**Fix**: Remove the dark mode toggle button from SiteHeader.tsx on the marketing surface. Keep the `dark` CSS class definitions for future workspace use.
**Command**: `$impeccable distill marketing-darkmode`

### P2 — FAQ content contradicts pricing table
**What**: FAQ says Explorer: 5 gens/month. Pricing says Explorer: 10 gens/month. Same mismatch for Creator (FAQ: 50, Pricing: 40) and Professional (FAQ: 200, Pricing: 120).
**Why it matters**: Direct contradiction undermines trust for visitors who cross-reference.
**Fix**: Reconcile the numbers so FAQ matches Pricing (the pricing is the source of truth).
**Command**: `$impeccable fix pricing-faq-mismatch`

### P2 — HowItWorks and Demo are in suboptimal order
**What**: The page explains before the user can experience (Manifesto → Demo → HowItWorks). Adult learning research suggests: explain → experience → reinforce. HowItWorks should precede Demo.
**Why it matters**: Users who encounter the Demo without context may not understand what they're looking at. The interactive moment lands harder when preceded by a brief "here's what this is."
**Fix**: Move HowItWorksSection before DemoSection in BelowFoldSections.tsx.
**Command**: `$impeccable layout section-order`

## Persona Red Flags

### Jordan (First-Time Visitor)
- **12 sections** means Jordan reads 4-5 more sections than needed to decide. After Demo, Jordan has enough information but faces 6 more sections.
- **CTA confusion**: "Create my voice profile" appears in header, hero, pricing, CTA strip, and footer — same label, different locations. Jordan doesn't know which is the "right one."
- **"Try it free, no signup"** links to `#demo`, not a free trial. Jordan who clicks expecting a free trial is disappointed.

### Riley (Stress Tester)
- **Dead code detected**: ComparisonFrame.tsx and ToolsCompositorDemo.tsx in network tab suggest unfinished architecture.
- **Dark mode**: Toggling dark mode reveals muddy taupe text on Pricing/Footer — the warm paper brand is lost on a "shipped" feature.
- **Pricing vs FAQ mismatch**: 10 vs 5, 40 vs 50, 120 vs 200 — immediate trust break.
- **Unused i18n keys**: `territory`, `route`, `tools`, `comparison`, `hero.badge` — Riley flags data integrity.

### Casey (Mobile User)
- **12 sections = ~2 minutes of scrolling** on mobile. The demo (section 3) and pricing (section 9) are far apart.
- **Hero stamp positioning**: `rotate-6` + `translate-y-full` on the hero stamp may clip on small viewports.
- **Comparison table**: `grid-cols-[10rem_1fr_1fr]` on a 375px phone gives ~100px per column — text wraps awkwardly.

## Minor Observations

1. **HeroSection stamp**: `right-[clamp(1rem,5vw,4rem)]` + `translate-y-full` + `-rotate-6` may overlap card/viewport edge on intermediate viewports.
2. **SiteHeader logo pulse**: `animation: logo-breathe 4s ease-in-out infinite` correctly respects `prefers-reduced-motion` — well handled.
3. **Demo char counter**: Color thresholds (terracotta/amber/ink-muted) are effective but the label "mínimo de caracteres" could be clearer.
4. **Unused i18n keys**: `territory`, `route`, `tools`, `comparison`, `hero.badge` exist in locale files and types but are never rendered. ~200 lines of dead strings.
5. **"14 metrics" overused**: The number appears in Hero, Manifesto, Demo, Metrics, Comparison, and FAQ — by the 4th mention it has lost meaning.
6. **TestimonialSection**: `ml-auto mr-[clamp(1.25rem,4vw,3.75rem)]` pushes the card asymmetrically. May read as a layout bug rather than intentional offset.
7. **No scroll-to-top**: After 12 sections, no shortcut back to navigation.
