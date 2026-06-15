---
title: PRD - Cultiv Marketing Surface (Phase 1)
doc_type: prd
status: ready-for-agent
domain: marketing-surface
last_updated: 2026-06-09
---

# PRD: Cultiv Marketing Surface (Phase 1)

## Problem Statement

Cultiv is an AI writing engine that generates text with the user's **Voice Profile**, but the product has no public web presence yet. Potential users cannot discover what Cultiv does, see proof of output quality, or signal interest before the authenticated platform exists.

The team needs to validate demand quickly without building the full product — no **Application User** accounts, no **Generation Request** flow, no **Client Integration Surface** integration, and no dependency on the **Public API Surface**. At the same time, the first public experience must establish a premium editorial identity (**Brand Tone**: organic personal growth), support bilingual reach (**Marketing Locale**: Portuguese Brazil and English), and lay a **Design System** foundation that the authenticated app can reuse later.

Without this **Marketing Surface**, the project cannot measure pre-launch interest, communicate differentiation (voice-aligned output vs generic AI text), or ship a cohesive visual language before phase 2.

## Solution

Launch the Cultiv **Marketing Surface** as a bilingual, single-scroll **Product Showcase** with an integrated **Waitlist**.

Visitors experience:

1. An editorial landing page (light theme, premium typography, discrete motion) presenting Cultiv's value proposition.
2. Three curated **Showcase Samples** — one per **Content Type** (blog post, LinkedIn post, thread) — each contrasting generic AI output with voice-aligned output for the same briefing.
3. Supporting sections explaining method, FAQ, and legal information.
4. A **Waitlist** form that captures early-access interest via a **Waitlist Submission** forwarded to Loops (outside the product backend).

The experience ships on TanStack Start, deploys to Vercel, and composes a shared **Design System** package. It deliberately excludes authentication, generation, preview, billing, and **client-sdk** usage.

## User Stories

1. As a **prospective End User** visiting in Portuguese, I want to read the **Product Showcase** at the default locale, so that I understand Cultiv in my language without choosing a language first.

2. As a **prospective End User** visiting in English, I want to switch to the English **Marketing Locale** via a clear toggle, so that I can share and bookmark an English URL.

3. As a **prospective End User**, I want the locale toggle to navigate to the equivalent page in the other language, so that I do not lose context when switching languages.

4. As a **prospective End User**, I want to scroll through one continuous editorial page, so that I absorb the narrative without clicking through multiple marketing routes.

5. As a **prospective End User**, I want a strong hero section explaining Cultiv's promise, so that I immediately understand this is about personal writing voice, not generic AI content.

6. As a **prospective End User**, I want to see curated proof that Cultiv produces better text than generic AI, so that I trust the product before it launches.

7. As a **prospective End User**, I want each **Showcase Sample** to show the same briefing with two outputs side by side (generic vs voice-aligned), so that the differentiation is obvious without running a demo.

8. As a **prospective End User**, I want **Showcase Samples** covering blog, LinkedIn, and thread formats, so that I see Cultiv works across meaningfully different **Content Types**.

9. As a **prospective End User**, I want to understand how Cultiv works in a few clear steps (teach voice → pick format → generate), so that I know what to expect when the product opens.

10. As a **prospective End User**, I want an FAQ answering product, pricing expectations, privacy, and waitlist questions, so that common objections are addressed before I sign up.

11. As a **prospective End User**, I want to join the **Waitlist** with my email, so that I can request early access when Cultiv launches.

12. As a **prospective End User**, I want to optionally provide my name on the **Waitlist**, so that communications feel personal.

13. As a **prospective End User**, I want to explicitly consent to data processing before submitting the **Waitlist**, so that I understand how my contact information will be used.

14. As a **prospective End User**, I want clear success and error feedback after submitting the **Waitlist**, so that I know whether my signup worked.

15. As a **prospective End User**, I want links to privacy and terms pages in my **Marketing Locale**, so that I can review legal information before consenting.

16. As a **prospective End User** who prefers reduced motion, I want animations disabled when my system requests it, so that the page remains comfortable and accessible.

17. As a **prospective End User** on mobile, I want the showcase and waitlist form to remain readable and usable, so that I can sign up from any device.

18. As a **prospective End User** sharing the site, I want correct Open Graph and `hreflang` metadata per locale, so that previews and search results show the right language.

19. As a **product owner**, I want waitlist signups delivered to Loops with locale tagging, so that I can segment pre-launch communication by **Marketing Locale**.

20. As a **product owner**, I want the marketing site deployed on Vercel with server-only secrets, so that Loops credentials are never exposed to the browser.

21. As a **product owner**, I want Lighthouse performance and accessibility scores of at least 90, so that the first impression matches the premium positioning.

22. As a **frontend engineer**, I want a shared **Design System** package with semantic tokens and reusable primitives, so that phase 2 app screens inherit the same visual language.

23. As a **frontend engineer**, I want dark theme tokens prepared but not productized, so that a future app theme does not require a token refactor.

24. As a **frontend engineer**, I want Effect-TS at service boundaries for the **Waitlist Submission** flow, so that validation and provider errors are typed and consistent with the monorepo.

25. As a **frontend engineer**, I want the web app to avoid any direct HTTP integration with the **Public API Surface**, so that frontend governance rules remain satisfied.

26. As a **frontend engineer**, I want curated showcase content stored as typed data separate from UI components, so that copy updates do not require section refactors.

27. As a **frontend engineer**, I want typed i18n message catalogs for pt and en, so that UI strings are consistent and refactor-safe.

28. As a **frontend engineer**, I want a motion system with Lenis smooth scroll and GSAP scroll reveals, so that the experience feels premium without exaggerated animation.

29. As a **domain expert**, I want **Showcase Sample** copy manually curated per locale, so that quality is controlled and not auto-translated.

30. As a **domain expert**, I want marketing copy to use user-facing terms (e.g. "Formato" for **Content Type** in Portuguese), so that visitors understand the product without internal glossary jargon.

## Implementation Decisions

### Major modules

The implementation is organized around deep modules with narrow, stable interfaces:

| Module | Responsibility | Depth |
|--------|----------------|-------|
| **Design System** | Semantic tokens (color, typography, spacing, motion), Tailwind preset, primitives (Button, Text, Container, Input, Grid), patterns (SectionHeader, ComparisonCard, Label, Accordion) | Deep — reused by phase 2 |
| **Waitlist Service** | Validates **Waitlist Submission** input, orchestrates provider call, maps failures to typed errors | Deep — testable in isolation |
| **Loops Adapter** | Translates a validated submission into Loops contact creation; swappable provider boundary | Deep — mockable at HTTP edge |
| **Showcase Content Catalog** | Typed **Showcase Sample** records per **Marketing Locale** | Deep — content-only changes |
| **Message Catalog (i18n)** | Typed UI strings for pt and en | Deep — compile-time key safety |
| **Motion System** | Lenis provider, GSAP defaults, scroll-reveal and stagger hooks, reduced-motion guard | Medium — hooks over raw GSAP in sections |
| **SEO Meta Resolver** | Per-route title, description, canonical, hreflang, Open Graph for each **Marketing Locale** | Medium |
| **Marketing Page Composer** | Composes sections (Hero, Proof, Showcase, Method, FAQ, Waitlist, Footer) into the **Product Showcase** scroll page | Shallow — orchestration only |
| **Legal Page Renderer** | Static legal content for privacy and terms in both locales | Shallow |

### Framework and runtime

- **TanStack Start** hosts the web application: SSR/SSG for SEO, file-based routes, server API route for waitlist.
- **Tailwind CSS** consumes the **Design System** preset; no inline CSS.
- **Effect-TS** is used at the **Client Runtime Model** boundary (phase 1): waitlist service and API route only. React components remain idiomatic.
- Deploy target is **Vercel**; marketing runtime is separate from the product backend.

### Routing and locales

- Portuguese (Brazil) is the default **Marketing Locale** at `/`.
- English is served under `/en` with parallel routes for showcase and legal pages.
- Legal pages exist for privacy and terms in both locales.
- Waitlist API route is locale-agnostic; locale is sent in the submission body for Loops segmentation.

### Product Showcase structure

Single scroll page with anchored sections:

1. Hero — value proposition, Cultiv identity, scroll cue
2. Proof (optional) — curated trust metrics without false user-count claims
3. Showcase — exactly three **Showcase Samples** (blog post, LinkedIn post, thread)
4. Method — three steps aligned with future **Onboarding** narrative
5. FAQ — accordion, 4–6 entries
6. Waitlist — CTA + form
7. Footer — legal links, locale toggle, contact

### Showcase Sample shape

Each sample is a curated marketing artifact, not live generation:

```typescript
type ShowcaseSample = {
  readonly id: string
  readonly contentTypeLabel: string
  readonly index: string
  readonly briefing: string
  readonly genericOutput: string
  readonly voiceOutput: string
}
```

### Waitlist contract

**Waitlist Submission** stays outside the **Public API Surface**:

```typescript
type WaitlistInput = {
  readonly email: string
  readonly name?: string
  readonly locale: "pt" | "en"
  readonly consentAt: string
}

type WaitlistSuccess = { readonly ok: true }

type WaitlistError =
  | { readonly code: "validation_error"; readonly field: string }
  | { readonly code: "provider_error" }
  | { readonly code: "rate_limited" }
```

Flow: form → server API route → Waitlist Service (Effect) → Loops Adapter → Loops API. Server-only env vars: `LOOPS_API_KEY`, `LOOPS_MAILING_LIST_ID` (if required).

Minimal rate limiting: five submissions per IP per minute at the API route (in-memory acceptable for v1).

### Visual and motion language

- **Brand Tone**: organic personal growth — warm, editorial, not aggressive SaaS conversion.
- Light theme only in v1; dark CSS variables prepared but unused.
- Typography: Fraunces (display/headings), Plus Jakarta Sans (body/labels).
- Palette: off-white surface, charcoal foreground, warm gray muted, dark stone accent — no vibrant violet accent from legacy marketing docs.
- Motion v1: Lenis smooth scroll, section fade-up, stagger on showcase cards, subtle hover transitions. No bounce, elastic, or aggressive parallax.
- `prefers-reduced-motion: reduce` disables Lenis and GSAP animations.

### Governance

- No **Client Integration Surface** dependency in phase 1.
- No direct `fetch`, axios, or embedded **Public API Surface** route strings in the web app source.
- **Waitlist Submission** does not create an **Application User** or trigger **Onboarding**.

### Milestones (delivery order)

1. **Foundation** — Design System package + web app scaffold + dependencies
2. **Static marketing** — layout, all sections, legal pages, locale routes
3. **Content and i18n** — message catalogs, curated samples, SEO metadata
4. **Waitlist** — Effect service, Loops adapter, API route, form integration
5. **Motion** — Lenis, scroll reveals, stagger, reduced-motion guard
6. **Quality and deploy** — Lighthouse, responsive QA, Vercel production

## Testing Decisions

### What makes a good test

Tests should assert **observable behavior** at module boundaries, not implementation details:

- Given invalid email → validation error with field identifier
- Given valid input and provider success → `{ ok: true }`
- Given provider HTTP failure → `provider_error` without leaking secrets
- Given missing consent → validation failure before provider call
- Locale message lookup returns correct string for key
- Governance scan: web app source contains no forbidden direct HTTP patterns to the product backend

Avoid testing GSAP/Lenis internals, specific CSS class names, or section component render trees unless asserting accessible roles/labels.

### Modules to test

| Module | Test type | Priority |
|--------|-----------|----------|
| **Waitlist Service** | Unit — validation, error mapping, consent rules | Required |
| **Loops Adapter** | Integration — mock HTTP, success and failure paths | Required |
| **Message Catalog (i18n)** | Unit — key parity between pt and en for required namespaces | Required |
| **Showcase Content Catalog** | Unit — schema validation, exactly three samples per locale | Recommended |
| **SEO Meta Resolver** | Unit — hreflang pairs, lang attribute per locale | Recommended |
| **Motion System** | Manual / a11y check for reduced motion | Manual only |
| **Marketing Page Composer** | E2E (phase 1.1) — waitlist submit, locale toggle | Deferred |

### Prior art

- `tests/governance/frontend-client-boundary.test.ts` — forbidden HTTP patterns in frontend apps
- Backend Effect service tests — error tagging and `Effect.gen` orchestration patterns
- `packages/client-sdk` contract failure tests — typed error surface discipline (analogy for waitlist errors)

## Out of Scope

- **Auth0** sign-up, sign-in, or protected routes
- Authenticated `/app` workspace (**Generation Screen**, **Execution History**, **Voice Profile** management)
- **Client Integration Surface** (`client-sdk`) integration
- Live **Generation Request**, **Generation Preview**, or **Async Run**
- **Application User** creation via waitlist
- Dark mode UI (tokens may be prepared only)
- Interactive pricing/plans section
- Auto-translation of **Showcase Sample** copy
- Product backend deployment changes
- Mobile app (`apps/mobile`)
- Analytics, OG image assets, Playwright E2E (phase 1.1 polish)
- Hero text split reveal and image clip-path reveals (phase 1.1)
- Persistent locale preference redirect (phase 1.1)
- Vercel KV rate limiting (phase 1.1)

## Further Notes

- Parent planning docs: [phase-1-implementation-plan.md](../plan/phase-1-implementation-plan.md), [decisions.md](../plan/decisions.md)
- Domain glossary: [CONTEXT.md](../../../CONTEXT.md) — terms **Marketing Surface**, **Product Showcase**, **Showcase Sample**, **Waitlist**, **Waitlist Submission**, **Marketing Locale**, **Design System**, **Brand Tone**, **Cultiv**
- Visual reference: editorial premium studios (e.g. Glyphs Labs layout rhythm) — inspiration only, no copied content
- Copy dependencies: hero headline and Cultiv wordmark are placeholders until brand assets are finalized
- Phase 2 PRD will cover Auth0, **Client Integration Surface**, and the authenticated app; this PRD must not block on those decisions
- Open operational items before production: Loops account credentials, custom domain DNS, curated showcase copy review in both locales
