---
title: PRD - Cultiv Product Showcase Restructure (Phase 1.2)
doc_type: prd
status: ready-for-agent
domain: marketing-surface
last_updated: 2026-06-11
---

# PRD: Cultiv Product Showcase Restructure (Phase 1.2)

## Problem Statement

The shipped **Product Showcase** validates Cultiv's **Marketing Surface**, but its narrative and layout no longer match what pre-launch visitors need. The current page leads with brand identity and a long horizontal **Showcase Sample** gallery, lists six **Content Types** as a catalog, and mixes product explanation with method steps in a single about section. Copy emphasizes scale and authenticity in the abstract rather than the concrete outcome: text that sounds like the author.

Prospective **End Users** who already use generic AI tools do not immediately see their real tension — generic output erasing personal voice, and fragile ChatGPT voice prompts that do not persist across formats and sessions. The page is text-heavy in the wrong places (full sample outputs) and light where it should build interest (problem, differentiated proof, expected product journey). SEO and structured metadata still reflect the retired "authenticity at scale" positioning instead of the new value-forward headline.

The team needs to restructure the **Product Showcase** into a clearer problem → solution → proof → use cases → product flow story, with Chromia-inspired scroll hierarchy but Cultiv's organic editorial material — without promising a launch roadmap, inventing social proof metrics, or expanding scope into the authenticated product.

## Solution

Restructure the bilingual **Product Showcase** as a single-scroll **Marketing Surface** page with a new editorial narrative:

1. **Marketing Hero** — outcome-led headline (*Textos que soam como você.*), fixed subheadline, primary **Waitlist** CTA and secondary link to the problem section; botanical motion retained; category chip and rotating slogan removed.
2. **Problem section** — two **Problem Perspectives** (generic AI tone; fragile manual voice prompts) with alternating typographic visual scenes, not stock imagery.
3. **Solution Breath** — calm centered section with handwritten brand note, **Cultiv** name, fixed subtitle, and four interactive **Solution Keywords** (Voice, Memory, Format, Scale).
4. **Differentiators** — four scroll-pinned **Differentiator Chapters** on desktop (hierarchical duration): full treatment for a LinkedIn **Showcase Teaser**; lighter chapters for teach-voice, guided briefing, and **Generation Preview** confidence; static stacked reveal on mobile.
5. **Marketing Use Cases** — three persona cards in an editorial triptych with format badges (founder/LinkedIn, creator/thread, blog author).
6. **Marketing Product Flow** — five **Flow Steps** titled *From voice to text* (locale equivalent), replacing a launch roadmap; includes **Voice Confidence** in one line only.
7. **Marketing Social Proof** — positioning statement without fabricated user counts or unauthorized testimonials.
8. **Waitlist** — unchanged functional contract; FAQ accordion moved below waitlist and removed from primary navigation.

Portuguese and English ship in the same delivery with structural parity. SEO title follows `Cultiv — {headline}`. One new **Design System** primitive (`ButtonLink`) supports anchor CTAs; all marketing-specific sections and scroll logic remain in the web app.

## User Stories

1. As a **prospective End User** landing on the **Product Showcase**, I want to understand within seconds that Cultiv delivers text that sounds like me, so that I know this is not another generic AI writing tool.

2. As a **prospective End User**, I want a clear primary action to join the **Waitlist** from the hero and header, so that I can express interest without scrolling the entire page.

3. As a **prospective End User**, I want a secondary action to learn why Cultiv exists, so that I can read the problem section before signing up.

4. As a **prospective End User**, I want the hero to avoid repeating the brand name as the main headline, so that the page communicates value before identity.

5. As a **prospective End User**, I want the problem section to name two distinct pains I recognize (generic AI tone; re-explaining my voice every session), so that I feel understood before seeing the product answer.

6. As a **prospective End User**, I want each problem explained with a short title and body, supported by a visual metaphor I can scan quickly, so that I understand the pain without reading long paragraphs.

7. As a **prospective End User** on mobile, I want the problem visual above the text, so that the metaphor registers before the copy.

8. As a **prospective End User**, I want a calm "breath" section after the problem that centers Cultiv and summarizes the answer in a few words, so that the page rhythm feels intentional rather than sales-dense.

9. As a **prospective End User**, I want to explore four solution keywords interactively, so that I can learn how Cultiv addresses voice, persistence, formats, and scale at my own pace.

10. As a **prospective End User** who prefers keyboard or touch, I want keyword micro-copy revealed on hover or tap, so that the section stays minimal but still informative.

11. As a **prospective End User**, I want to see one strong proof moment comparing generic AI output with voice-aligned output, so that differentiation is visible without scrolling through three full samples.

12. As a **prospective End User**, I want the proof comparison to use a scannable format (LinkedIn recommended), so that the contrast is obvious on first glance.

13. As a **prospective End User**, I want to open the full **Showcase Sample** in a modal when I choose, so that depth is available without bloating the main scroll.

14. As a **prospective End User**, I want scroll storytelling on desktop that focuses each differentiator chapter in turn, so that the experience feels premium without reading a feature grid.

15. As a **prospective End User** on mobile, I want differentiator chapters stacked without aggressive scroll pinning, so that the page remains usable on small screens.

16. As a **prospective End User** who prefers reduced motion, I want pinned scale animations disabled, so that the page remains comfortable and accessible.

17. As a **prospective End User**, I want three use-case cards showing who Cultiv is for (founder, creator, author), so that I can map myself to the product without reading a six-format catalog.

18. As a **prospective End User**, I want a note that additional **Content Types** exist at launch, so that I am not misled into thinking only three formats exist.

19. As a **prospective End User**, I want to understand the end-to-end product journey I will experience after access (enter → teach **Voice Examples** → **Derived Voice Profile** → briefing and **Generation Preview** → generate), so that expectations are clear without a dated roadmap.

20. As a **prospective End User**, I want the product flow explained in one line per step, so that I am not overwhelmed before the product exists.

21. As a **prospective End User**, I want a short positioning statement before the **Waitlist**, so that I feel part of an intended audience even when there are no public user metrics yet.

22. As a **prospective End User**, I want FAQ entries after the **Waitlist** form, so that objections about pricing, privacy, and formats are answered after I have seen the full story.

23. As a **prospective End User**, I want the primary navigation simplified to problem, differentiators, use cases, and waitlist, so that I am not distracted by legacy section names.

24. As a **prospective End User** visiting in Portuguese, I want the restructured page at `/` with updated copy and metadata, so that search and sharing reflect the new positioning.

25. As a **prospective End User** visiting in English, I want the same structure at `/en` with equivalent copy, so that bilingual reach remains intact.

26. As a **prospective End User** sharing the site, I want Open Graph title and description aligned with the new headline, so that link previews match the on-page promise.

27. As a **prospective End User** using assistive technology, I want interactive keyword balloons and modal proof content to be keyboard-operable with visible focus, so that the premium layout does not harm accessibility.

28. As a **product owner**, I want the page to avoid fabricated traction numbers or launch date commitments, so that pre-launch marketing stays honest.

29. As a **product owner**, I want the old about, formats grid, and horizontal three-sample showcase removed from the home scroll, so that analytics and user attention focus on the new narrative.

30. As a **frontend engineer**, I want marketing copy organized in expanded typed **Marketing Locale** catalogs, so that pt/en parity is enforced at compile time.

31. As a **frontend engineer**, I want scroll-chapter behavior isolated in a dedicated animation hook, so that GSAP pin logic is testable and sections stay shallow orchestrators.

32. As a **frontend engineer**, I want typographic problem scenes and chapter scenes isolated as presentational components, so that copy and layout can change without touching scroll math.

33. As a **frontend engineer**, I want only `ButtonLink` added to the shared **Design System**, so that phase 2 apps can reuse anchor CTAs without importing marketing sections.

34. As a **frontend engineer**, I want `prefers-reduced-motion` to disable Lenis-driven pin and draw animations in new sections, so that accessibility rules remain consistent with phase 1.

35. As a **frontend engineer**, I want curated showcase teaser content separated from section components, so that shortening LinkedIn outputs does not require UI refactors.

36. As a **frontend engineer**, I want geo (`llms.txt`, JSON-LD) updated to describe the new **Product Showcase** structure, so that AI crawlers and SEO stay accurate.

37. As a **domain expert**, I want visitor-facing language to prefer outcomes (voice, preview, formats) over internal terms (**Pipeline**, **Job**, **Derived Voice Profile** in hero copy), so that the **Marketing Surface** stays approachable.

38. As a **domain expert**, I want the **Marketing Problem Angle** (voice erased at scale; fragile prompts) to thread through problem, proof, and flow sections, so that the story is coherent.

39. As a **designer**, I want warm paper surfaces to dominate with showcase and invert reserved for proof and **Waitlist** moments, so that Chromia-like hierarchy does not turn the site into a dark tech landing.

40. As a **designer**, I want botanical and paper-grain motifs to remain the visual material, so that Cultiv keeps its craft identity alongside Chromia-inspired scroll grammar.

## Implementation Decisions

### Major modules

| Module | Responsibility | Depth |
|--------|----------------|-------|
| **ButtonLink (Design System)** | Anchor element with `Button` visual variants (`primary`, `ghost`, `invert`) for hash and route CTAs | Deep — small stable API, reused beyond marketing |
| **Marketing Message Catalog** | Expanded typed `LocaleMessages` for hero, problem, solution breath, differentiators, use cases, product flow, social proof, nav, SEO/geo strings | Deep — pt/en parity enforced by types |
| **Differentiator Chapters Controller** | ScrollTrigger pin/scrub timeline: active chapter scale/opacity, background crossfade, hierarchical scroll distances; reduced-motion fallback | Deep — isolates GSAP complexity from React sections |
| **Showcase Teaser Resolver** | Selects LinkedIn **Showcase Sample**, produces truncated preview strings and modal full payload from existing theme catalog | Deep — content shaping separate from UI |
| **Typographic Scene Library** | Presentational SVG/React scenes (`GenericOutputStack`, `FragilePromptCollage`, briefing/preview scenes) | Medium — reusable visuals, no business logic |
| **Marketing Section Composer** | Composes new section order in below-fold pipeline; lazy-load boundary preserved | Shallow — orchestration only |
| **Problem Section** | Two alternating **Problem Perspective** rows + section header | Shallow |
| **Solution Breath Section** | Constellation layout, keyword balloons, handwritten note | Shallow |
| **Differentiators Section** | Hosts chapter panels; delegates motion to controller | Shallow |
| **Use Cases Section** | Three-column editorial triptych | Shallow |
| **Product Flow Section** | Five **Flow Steps** with botanical stem (full vs simplified mobile) | Shallow |
| **Social Proof Section** | Centered positioning copy | Shallow |
| **Site Header / Mobile Nav** | Updated nav items, header **Waitlist** CTA | Shallow |

### Visual and surface rhythm (**Marketing Surface Rhythm**)

- Warm `surface` for narrative sections (hero, problem, use cases, flow, social proof, FAQ).
- `surface-elevated` for **Solution Breath** and lighter differentiator chapters.
- `showcase` palette for differentiator chapter 1 (**Showcase Teaser**).
- `invert` for **Waitlist** only.
- Editorial frames, zero border-radius, paper grain — no glassmorphism or stock photography.

### Hero behavior

- Headline: word-by-word reveal animation.
- Subheadline and CTAs: staggered fade-up on mount.
- Retain botanical tree draw and falling leaves; remove scroll cue, tech chip, rotating slogan, brand-as-H1.
- Primary CTA: **Waitlist** hash. Secondary: problem section hash.

### Problem section behavior

- Desktop: alternating text/visual columns per **Problem Perspective**.
- Mobile: visual above copy.
- Visuals are typographic editorial scenes, not photos.

### Solution Breath behavior

- Handwritten note above **Cultiv** display name.
- Fixed subtitle under name.
- Four **Solution Keywords** in asymmetric layout; micro-copy on hover/tap below balloon.

### Differentiator chapters behavior

Desktop pin stack (single pinned container):

| Chapter | Approx. scrub | Treatment |
|---------|---------------|-----------|
| 1 Showcase teaser | Long | Full scale, showcase background, waveform accent |
| 2 Teach voice | Short | Subtle scale, teach scene |
| 3 Guided briefing | Short | Subtle scale, briefing mock scene |
| 4 Preview confidence | Short | Subtle scale, preview mock scene |

Mobile: static stack with section reveal only.

### Showcase content

- Home page shows one **Showcase Teaser** (LinkedIn) with short previews per column.
- Modal retains full sample detail using existing modal patterns.
- Blog and thread samples remain in content catalog; not required on main scroll (optional modal expansion later).

### Navigation

Primary anchors: problem, differentiators, use cases, waitlist. FAQ not in header.

### SEO and geo

- Title pattern: `Cultiv — Textos que soam como você` / `Cultiv — Text that sounds like you`.
- Meta description aligns with hero subheadline and **Waitlist** intent.
- Update `geo` strings, `llms.txt` builders, JSON-LD graph, OG alt text; revise OG image text if embedded.

### i18n schema (conceptual)

Replace retired hero/about/formats/method keys with namespaces: `hero`, `problem`, `solutionBreath`, `differentiators`, `useCases`, `productFlow`, `socialProof`, updated `header.nav`, retained `waitlist`, `faq`, `seo`, `geo`.

### Governance (unchanged)

- No **Public API Surface** or **Client Integration Surface** usage.
- **Waitlist Submission** contract unchanged.
- No **Application User** creation from marketing forms.

### Delivery slices

1. Foundation — `ButtonLink`, i18n types/copy pt+en, nav, SEO/geo strings.
2. Hero + section shell reorder.
3. Static sections — problem, breath, use cases, flow, social proof, FAQ move.
4. Differentiator chapters + teaser + modal + shortened LinkedIn content.
5. Cleanup, reduced motion QA, Lighthouse, remove legacy sections.

## Testing Decisions

### What makes a good test

Tests assert **observable behavior** at module boundaries: given locale → expected strings exist for all new keys; given sample id → teaser truncates to configured limits; given reduced-motion preference → chapter hook returns static mode; given invalid nav keys → type errors at compile time. Avoid asserting GSAP timeline internals or exact pixel positions.

### Modules to test

| Module | Priority | Behavior to assert |
|--------|----------|------------------|
| **Marketing Message Catalog** | High | pt/en key parity; required new namespaces present; SEO title matches headline decision |
| **Showcase Teaser Resolver** | High | LinkedIn preview length within limits; modal payload retains full content |
| **Differentiator Chapters Controller** | Medium | Reduced-motion path skips pin setup (unit test via exported guard or wrapper) |
| **Geo / SEO resolvers** | Medium | Home head metadata uses new title/description per locale |
| **Governance boundary** | High | No new direct backend HTTP patterns in web app (existing test) |

### Prior art

- `tests/web/i18n-catalog.test.ts` — locale parity patterns.
- `tests/web/showcase-catalog.test.ts`, `tests/web/format-thread.test.ts` — showcase content shaping.
- `tests/web/geo.test.ts` — SEO/JSON-LD/llms builders.
- `tests/governance/frontend-client-boundary.test.ts` — frontend boundary scan.

### Modules not requiring automated tests in this PRD

- Presentational typographic scenes (visual regression optional later).
- Section composer JSX (covered by manual QA and Lighthouse a11y).
- GSAP scroll choreography beyond reduced-motion guard (manual/desktop QA).

## Out of Scope

- Authenticated **Generation Screen**, **Onboarding**, Auth0, **Client Integration Surface**.
- Launch **Roadmap** with dates or feature commitments.
- Fabricated user counts, testimonials, or community metrics.
- Stock photography, 3D renders, or dark-mode productization.
- Additional home-scroll teasers for blog and thread (modal-only or later phase acceptable).
- New **Content Type** catalog grid on the home page.
- Horizontal three-sample showcase carousel.
- ADR document (decisions captured in domain context and implementation plan).
- Fraunces/Plus Jakarta font migration (current Playfair/Inter/Caveat stack remains unless separately scheduled).

## Further Notes

- Domain terms and relationships: `CONTEXT.md` (*Marketing Problem Angle*, *Solution Breath*, *Differentiator Chapter*, *Showcase Teaser*, *Marketing Product Flow*, *Marketing Social Proof*).
- Detailed implementation checklist: `docs/live/plan/product-showcase-restructure-implementation-plan.md`.
- Visual inspiration: Chromia scroll hierarchy and alternating problem layouts; material language stays Cultiv organic/editorial.
- Phase 1 PRD remains valid for **Waitlist**, legal pages, bilingual routes, and **Design System** foundation; this PRD supersedes phase 1 **Product Showcase** section structure and hero/showcase narrative only.
