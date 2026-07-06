---
target: apps/web/src/marketing (landing page)
total_score: 21
p0_count: 2
p1_count: 3
timestamp: 2026-07-06T03-12-18Z
slug: apps-web-src-marketing
---
# Design Critique: Cultiv Marketing Landing Page

## Report header provenance

Method: dual-agent (A: task_ses_0ca9a1f20ffeZT22LipOx9ejdH · B: inline CLI detector)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Demo disabled button lacks visual disabled styling |
| 2 | Match System / Real World | 3 | Demo uses unverifiable fabricated categories ("Ritmo: Equilibrado") |
| 3 | User Control and Freedom | 2 | No skip-link, no back-to-top, Demo has no exit before analysis |
| 4 | Consistency and Standards | 2 | Dead code uses legacy tokens (deep-blue, ochre, moss, azul); pigment-ochre vs amber token drift |
| 5 | Error Prevention | 2 | Demo accepts gibberish — no validation beyond word count |
| 6 | Recognition Rather Than Recall | 3 | Three identical Breathe sections blur recall |
| 7 | Flexibility and Efficiency of Use | 1 | No keyboard shortcuts, ~40 tab stops, no skip-to-section |
| 8 | Aesthetic and Minimalist Design | 2 | Hero has 7 competing elements in first viewport |
| 9 | Error Recovery | 2 | Demo has no error state; no undo for analysis |
| 10 | Help and Documentation | 1 | No tooltips, no FAQ search, no context-sensitive help |
| **Total** | | **21/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment:** Moderate AI contamination (6/10). The page avoids the most egregious slop patterns (no gradient text, no glassmorphism, no side-stripe borders, no hero-metric template, border-radius discipline is good). What saves it: the BreatheSection typographic voice, the restrained terracotta usage, the Sora/DM Sans/Merriweather pair executed with discipline. What hurts: (1) dead code from the retired Imprint design system sits alongside live code in the same directory — `ProblemSection.tsx`, `MarketingSectionRail.tsx`, and `SectionHeader` in icons.tsx use legacy tokens like `deep-blue`, `ochre`, `moss`, `azul`, `ocre`, `font-playfair`. (2) The three identical Breathe sections feel templated. (3) The Hero has 7 competing elements.

**Deterministic scan:** Clean — no findings. The detector catches crude patterns (gradient text, glassmorphism, side-stripes) and correctly flagged none. It missed everything structural (dead code, cognitive load, section ID mismatch, token drift) because those require semantic understanding.

**Visual overlays:** Skipped — no browser automation tool available in this session.

## Overall Impression

The Cultiv landing page is a solid B-grade brand surface with A-grade potential. The design system is well-thought-out and the active sections execute it with surprising discipline for a 12-section single scroll page. The typography pair (Sora + DM Sans + Merriweather) is applied correctly. The BreatheSection with its centered statement and terracotta divider is genuinely elegant — a rare moment of stillness in a scroll-heavy medium.

The biggest single problem: **dead code and system drift**. Two components (`ProblemSection.tsx`, `MarketingSectionRail.tsx`) use a completely different design vocabulary (`deep-blue`, `ochre`, `moss`, `azul`, `font-playfair`) and sit in the live marketing directory, unreferenced. If any future developer connects the `showSectionRail` prop, the page will display broken colors and wrong fonts. The `pigment-ochre` token in live `ShowcaseLinkedInPostPreview.tsx` should be `amber`.

Second: **the Demo fabricates metrics and risks breaking trust**. The naive algorithm (word count + unique words + punctuation) generates plausible-sounding labels ("Ritmo: Equilibrado") after a simulated 1.8s loading delay. Any technically literate visitor will see through this immediately, and the trust damage cascades to every other claim on the page.

## What's Working

**1. The BreatheSection as a typographic device.** Centered Sora statement + thin terracotta divider + subtle tinted background. It creates a moment of stillness that genuinely sets Cultiv apart from typical SaaS landing pages. The warm/cream variants use color-mix with just 6-8% pigment — restrained and intentional.

**2. Color discipline in active sections.** Terracotta at ≤10% of any viewport. Primary CTAs use it. Progress bars, the stamp border, focus outlines, testimonial signature — all correct. Amber reserved for growth signals (metrics bg, pricing badge, step numbers). The "one pigment per viewport" rule is respected.

**3. The ComparisonSection table header.** `bg-earth text-cream` header with amber on the "others" column and cream on the Cultiv column — data visualization within the brand system without additional charting.

**4. The HowItWorks step numbers.** Clamped 2.75rem–4.5rem amber numerals with 0.85 line-height. High visual impact, clear sequence signaling.

## Priority Issues

### P0 — Dead code carries wrong design language
**What:** `ProblemSection.tsx` and `MarketingSectionRail.tsx` and the `SectionHeader` component in icons.tsx use legacy Imprint tokens: `deep-blue`, `ochre`, `moss`, `azul`, `ocre`, `creme`, `texto-sec`, `font-playfair`. These files sit in the active marketing directory but are never imported. `ProblemSection.tsx` alone is 78 lines of dead code.
**Why it matters:** Design system drift propagates silently. A new developer finding these files will assume they're part of the live page and build on top of them, compounding the inconsistency. The `showSectionRail` prop is still typed in `MarketingLayoutProps` — if ever connected, it renders broken colors.
**Fix:** Delete `ProblemSection.tsx`. Delete `MarketingSectionRail.tsx` and the `showSectionRail` prop. Replace `pigment-ochre` with `amber` in the showcase preview components (or delete those too if orphaned).
**Command:** `$impeccable distill deadcode`

### P0 — Section ID mismatch makes nav rail non-functional
**What:** `MarketingSectionRail.tsx` defines `SECTION_IDS` (`territorio`, `comparacao`, `rota`, `ferramentas`, `preco`, `depoimento`, `perguntas`) that don't match any real section IDs. The live sections use `id="hero"`, `id="manifesto"`, `id="demo"`, `id="como-funciona"`, `id="precos"`. `TestimonialSection` and `FaqSection` have NO `id` at all.
**Why it matters:** This is a landmine for future work. The typed prop exists, the component exists, but neither connects.
**Fix:** Delete the rail components as dead code. If kept, add `id` to TestimonialSection and FaqSection, then realign SECTION_IDS.
**Command:** `$impeccable distill deadcode`

### P1 — Demo fabricates metrics, breaking trust
**What:** The voice analysis in `DemoSection.tsx` uses a naive algorithm (word count, unique word ratio, punctuation detection) to generate labels like "Ritmo: Equilibrado" and "Formalidade: Moderada." A simulated 1.8s loading delay reinforces the illusion. Any technical visitor will catch this immediately.
**Why it matters:** Trust is the single most valuable asset for a landing page. If a visitor catches the product in a lie, every claim on the page becomes suspect. The demo is the first interactive moment.
**Fix:** Either (a) remove the metric cards and replace with a simple "este é seu perfil" display with 1-2 honest stats (word count, readability), or (b) frame it transparently as a preview ("Sua análise completa será gerada após o cadastro"), or (c) make the demo optional and let HowItWorks come first.
**Command:** `$impeccable redesign demo-honesty`

### P1 — Hero viewport has 7 competing elements
**What:** First viewport contains: headline, subheadline, 2 CTAs, seal bar (3 text segments), preview card, 6 metric chips, floating stamp. That's 7+ elements competing for the visitor's first 3 seconds.
**Why it matters:** The core message "Textos que soam como você" gets diluted. Visitors don't know what to look at first.
**Fix:** Remove the seal bar (tagline repetition). Collapse metric chips into 1-2 at most. Simplify the preview card to just the text preview. Remove the floating stamp or integrate it into the card border.
**Command:** `$impeccable distill hero-density`

### P1 — Subheading contrast on dark background
**What:** `HowItWorksSection.tsx:16` uses `text-ink-muted` (#989593) on `bg-earth` (#1C1815). While contrast passes AA (~6.4:1), the visual appearance is washed-out gray. DESIGN.md says text on dark backgrounds should use `cream` or a muted variant of cream.
**Why it matters:** Inconsistent with the brand's dark-background rules. The subheading looks faded rather than intentional.
**Fix:** Change to `text-cream` or `color-mix(in oklch, var(--color-cream) 70%, transparent)`.
**Command:** `$impeccable fix dark-contrast`

### P2 — Three Breathe sections dilute the pattern
**What:** The BreatheSection appears at positions 2, 5, and 10 of 12 sections — 25% of the page. Same centered layout, same divider, same rhythm.
**Why it matters:** The first Breathe feels like a breath. The second feels like a pattern. The third feels like filler. The pattern loses power through repetition.
**Fix:** Keep the first Breathe (solution statement — most important). Merge the second Breathe's metrics content into the Metrics section. Remove the third Breathe or integrate its compass symbol into the CTA section.
**Command:** `$impeccable distill breathe-dedup`

### P2 — FAQ uses max-height animation
**What:** `FaqSection.tsx:26` animates `maxHeight` between 0 and 20rem. This forces layout calculation on every animation frame and the visual timing is disconnected from the CSS transition duration.
**Why it matters:** Perceived sluggishness on lower-end devices. FAQ feels less responsive than it should.
**Fix:** Use `grid-template-rows: 0fr / 1fr` transition or `calc-size()` with `interpolate-size`.
**Command:** `$impeccable polish faq-animation`

### P2 — Non-featured pricing CTAs have low discoverability
**What:** Non-featured plan CTAs use `bg-transparent text-cream border border-surface-dark`. The border matches the card border, making the button nearly invisible at rest.
**Why it matters:** Visitors interested in cheaper tiers may not see the CTA at all. Directly impacts conversion.
**Fix:** Use the `btn-outline` variant adapted for dark backgrounds, or add a subtle border tint using amber.
**Command:** `$impeccable colorize pricing-cta`

### P3 — Demo setState on unmount risk
**What:** The 1800ms `analyzeTimer` timeout in DemoSection may fire after component unmounts if the cleanup effect's dependencies haven't changed.
**Why it matters:** React warnings. Could cause issues in React 19.
**Fix:** Add unconditional cleanup ref for both timers.
**Command:** `$impeccable harden demo`

## Persona Red Flags

### Jordan (Confused First-Timer)
- **"What do I do with this analysis?"** The Demo returns 6 metric cards with no explanation of what to do next, only the same "Começar" CTA that's everywhere else.
- **Floating stamp** "COM VOZ CULTIV" is cryptic before the product concept is understood.
- **Same CTA everywhere** — header, Hero, Demo, CTA strip — all link to `/app/onboarding` with label "Começar." Jordan has no idea what onboarding involves.

### Riley (Deliberate Stress Tester)
- **Demo fabricates data.** Pasting "aaaa bbbb cccc" returns "Ritmo: Equilibrado. Vocabulário: Moderado." Immediate trust break for any technical user. This single failure cascades into distrust of the entire page.
- **Comparison table** has no verifiable claims. No benchmarks, no data sources. Just checkmarks.
- **No free trial.** Only "Começar" → onboarding with no preview of what happens.

### Casey (Distracted Mobile User)
- **Demo textarea** is 9rem minimum on a phone — eats 45% of remaining screen height. Can't see typing and controls simultaneously.
- **Mobile hero** pushes preview card below the fold (~600px down on a 390px viewport). Most mobile users scroll past it.
- **Emoji flags** for locale in mobile nav — screenreaders read emoji descriptions, not "English"/"Português."

## Minor Observations

1. **`text-body-lg` is undocumented** in DESIGN.md — only Body (1rem) and Body Small (0.8125rem) are specified. The page uses it in Hero, Manifesto, and HowItWorks.
2. **ProblemSection and MarketingSectionRail are completely orphaned** — zero imports anywhere. 78 lines + 130 lines of dead code in the active marketing directory.
3. **HeroSection `_locale` prefix** on line 11 suggests the locale prop is unused in the component.
4. **MetricsShowcase footnote** does fragile text replacement (`replace` on `footnote` to find `footnoteStrong1`/`footnoteStrong2`). If the strong text appears multiple times, the wrong instance gets replaced.
5. **ComparisonSection has no `id` attribute** though the SiteHeader nav points to `#comparacao` — the anchor won't work.
6. **The `wave-loader`** inline `<span />` elements may render as zero-height boxes if the CSS height isn't set before the animation starts.
7. **`bg-[color-mix(in_oklch,var(--color-terracotta)_40%,transparent)]`** in MetricsSection for the progress bar — consistent with tonal layering approach.

## Questions to Consider

1. **What if the Demo showed a before/after comparison of the same text — raw vs voice-aligned — instead of fabricated metrics?** The current demo asks for text and returns analytics the visitor can't verify. A side-by-side comparison would demonstrate value directly, without the trust-damaging analytics gimmick.

2. **What if the page had exactly one CTA per context instead of three identical "Começar" buttons?** The same CTA everywhere tells the visitor "we don't know what you need." Hero could offer "Ver como funciona" → scroll to HowItWorks. Demo could offer "Gerar com sua voz" → leads to the real product. Pricing could offer "Começar grátis" → a distinct path.

3. **What if there were two Breathe sections instead of three?** The third Breathe (with compass symbol) is the weakest. Removing it would tighten the page from 12 to 11 sections, reducing the pattern fatigue problem.

## Run Notes
- **Target slug:** apps-web-src-marketing
- **Ignore list:** none (.impeccable/critique/ignore.md does not exist)
- **Assessment independence:** A (design review sub-agent), B (detector CLI scan) — parallel with fork_context
- **CLI detector:** Ran on apps/web/src/marketing (all files). Clean — no findings
- **Browser visibility:** Not available — no browser automation tool in this session
- **Overlay injection:** Skipped
- **Live server:** Not started
- **Temp-file cleanup:** Pending (after snapshot write)
