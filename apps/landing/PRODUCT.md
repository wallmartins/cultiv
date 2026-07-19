# Product

## Register

brand

## Users

**Solo creators and writers** — independent newsletter authors, ghostwriters, indie founders, and online writers who publish in their *own name*. Their reputation is their voice. They face relentless content demand and have tried generic AI, only to reject it because "it sounds nothing like me." They arrive skeptical of AI writing tools specifically because they care about words. The job to be done: produce far more published output without surrendering the voice that is their entire brand.

## Product Purpose

Cultiv is an AI writing engine that learns an author's personal voice and generates text that sounds like *them* — not a generic assistant. Tagline: **"Your authenticity, at scale."**

Two things make it different, and the landing page must lead with both:

1. **Voice is learned through a guided calibration, not scraped from uploads.** A short onboarding wizard elicits *how the author thinks and argues* — a quick opinion, something they learned and how it shifted their view, a position they'll defend, an explanation to a newcomer — and derives a durable Voice Profile (tone, cadence) plus a Reasoning Signature and Argument-Development Signature. It captures reasoning, not just surface style.
2. **Generation starts from intent, not format.** The author chooses what they want to *do* — *share an idea · explain in depth · engage your audience · tell a story · update subscribers · document a decision* — and length/channel (blog, email, social, professional-network) are secondary, optional knobs. The product asks "what are you trying to say?", never "pick a template."

The landing page is the unauthenticated marketing surface: its job is to make a voice-skeptical writer believe this one is genuinely different, then convert them into a **paid plan** through Auth0 → checkout. There is **no free tier** — but a **free trial** precedes the card, so the page must earn the trial click with demonstrated proof (the Voice Transform, the calibration, a real sample), not a free-signup shortcut. Three plans, monthly or **annual (−20%)**, priced in BRL (pt-BR) / USD (en): **Explorador/Explorer** R$49/$9, **Criador/Creator** R$99/$19 (featured), **Profissional/Professional** R$199/$39. Checkout is currency-routed: **BRL → Asaas, USD → Stripe**, entered through Auth0 (backend + Auth0 are live in production).

Success = a solo creator who distrusts AI writing reads the page, feels *understood*, and signs up because the page itself demonstrates taste and specificity that generic AI could never produce.

## Brand Personality

Three words: **distinct · crafted · unmistakably-yours.**

Premium and awwwards-caliber, not template-safe. Confident and opinionated — willing to be a little strange to be memorable. Authentic and human, never robotic. The tone respects the reader's intelligence and their craft; it speaks to someone who cares about sentences. Emotional target: **intrigue** — a visitor should ask "how was this made?" and feel this is a serious writing instrument built by people who love writing, worth the premium.

## Anti-references

- **Generic AI-SaaS.** The single biggest thing to avoid. No purple/violet gradients, no Inter-on-white "AI startup" template, no sparkle/robot/magic-wand iconography, no hero-metric template, no identical feature-card grids. If it reads as "another AI tool," it has failed at the one thing it sells: not sounding like generic AI.
- **The saturated editorial-magazine reflex.** The brand draws on the *seriousness* of the editorial/literary world, but must NOT default to the flooded editorial-typographic lane: display-serif italic headline + tiny tracked mono labels + ruled three-column separators + zero imagery. That is now its own AI tell. Borrow the register's respect for words, not its template.
- **Timid minimalism.** "Restrained to look premium" that lands as beige and forgettable. Craft here means committed and specific, not safe.

## Design Principles

1. **Practice what you preach.** The page is itself a proof of voice — its copy and craft must be so specific and human that they could not be generic-AI output. The medium is the argument.
2. **Show the voice, don't claim it.** Demonstrate the before/after (generic AI vs. the author's real voice) rather than asserting "sounds like you." Let the visitor see the difference.
   - **Corollary — lead with reasoning and intent.** The page's argument is that Cultiv learns *how you think* (via calibration) and writes from *what you want to say* (intent-first), not from templates. Don't sell it as a format/template picker; that's the thing it explicitly isn't.
3. **Earn the premium.** Awwwards-caliber craft in every detail — motion, typography, spacing, and one memorable signature moment. Distinct over safe; a POV over neutrality.
4. **Respect the writer.** Speak to someone who cares about sentences. No hype-speak, no growth-hack clichés; intelligence and restraint in the copy.
5. **Convert without begging.** CTAs are confident and clear (free signup / plan checkout via Auth0), integrated into the narrative rather than bolted-on banners.

## Accessibility & Inclusion

Target **WCAG 2.1 AA**. Body text ≥4.5:1 contrast, large text ≥3:1 — enforced even on tinted/premium backgrounds. Full `prefers-reduced-motion` alternative for every animation (the page will be motion-forward, so this is load-bearing). Keyboard-navigable CTAs and focus-visible states. Do not rely on color alone to carry meaning.
