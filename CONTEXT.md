# AI Writing Engine Context

This repository builds an AI writing engine that generates high-quality text with the user's voice and style. The context below captures the terms that matter to product and migration decisions so the monorepo can stay consistent while the legacy tree is retired.

## Language

**Pipeline**:
A declared writing workflow made of ordered steps and validation points.
_Avoid_: Flow, process

**Generation Request**:
The client-visible request to generate a text, carrying briefing, voice-related inputs, quality mode, and other product parameters without exposing internal pipeline structure.
_Avoid_: Client pipeline, user-defined flow

**Content Type**:
The kind of text being generated, such as blog post, LinkedIn post, thread, or newsletter.
_Avoid_: Format, template

**Content Type Format Preset**:
Platform and structure constraints applied per **Content Type** during voice resolution, such as word targets, paragraph shape, and channel conventions.
_Avoid_: Style preset, voice preset, cognitive baseline

**Voice Profile**:
The user's durable writing voice at the surface layer: tone, cadence, vocabulary, and lexical constraints.
_Avoid_: Style preset, persona

**Reasoning Signature**:
The author's durable patterns of observation, argument construction, certainty, judgment, and conclusion — distinct from surface **Voice Profile** markers.
_Avoid_: Cognitive fingerprint, persona traits, narrative preset

**Core Reasoning Signature**:
The author-global **Reasoning Signature** derived from all active **Voice Examples**, capturing how the author thinks regardless of channel.
_Avoid_: Global persona, default voice, base tone

**Argument Development Signature**:
The author-global hybrid profile of how the author develops a text — typical argumentative moves, transition tendencies, epistemic posture while writing, and structural anti-patterns — inferred from **Voice Examples** without imposing a fixed phase template.
_Avoid_: Outline template, narrative preset, fixed story structure

**Argument Development Signature Representation**:
The persisted form of an **Argument Development Signature**: rich development prose, an inferred repertoire of move labels, soft transition tendencies, a reduced epistemic-posture enum, and structural anti-patterns for evaluation.
_Avoid_: Content outline schema, beat sheet, rigid funnel stages

**Argument Development Extraction**:
The structured LLM call inside **Voice Profile Rebuild** that infers the **Argument Development Signature** from all active **Voice Examples** in parallel with **Reasoning Extraction**, without reading the draft **Core Reasoning Signature** output.
_Avoid_: Sequential anchored extraction, outline generation, per-example development calls

**Voice Signature Divergence Check**:
The deterministic, non-LLM check after parallel **Reasoning Extraction** and **Argument Development Extraction** that decides whether **Voice Signature Reconciliation** is needed — comparing epistemic posture to **Core Reasoning Signature** enums, detecting prose collapse between layers, and flagging structural anti-patterns incompatible with Core traits.
_Avoid_: LLM conflict classifier, user-facing mismatch score, generation gate

**Voice Signature Reconciliation**:
The offline harmonization step after parallel **Reasoning Extraction** and **Argument Development Extraction** that produces one coherent author-facing profile across **Core Reasoning Signature**, **Argument Development Signature**, and **Format Expression Profile** before persistence — resolving internal contradictions without surfacing conflict states to the author or blocking generation. A reconciliation LLM call runs only when a deterministic divergence check finds conflict between the parallel drafts; otherwise the drafts are persisted as-is.
_Avoid_: User-visible conflict card, dual profile, generation gate, unconditional third extraction call

**Format Expression Profile**:
Per-**Content Type** register and expression traits — such as formality, technical density, and platform tone — derived from that format's examples and layered on top of the **Core Reasoning Signature** without changing the author's reasoning mode.
_Avoid_: Format voice preset, channel persona, per-format cognitive profile

**Derived Anti-Patterns**:
Voice-related patterns the author consistently avoids, inferred automatically from **Voice Examples** during **Core Reasoning Signature** extraction.
_Avoid_: Blocklist, banned phrases, negative style preset

**Reasoning Signature Representation**:
The hybrid persisted form of a **Reasoning Signature**: narrative prose for prompt guidance plus reduced enums for drift and critic checks.
_Avoid_: Voice attribute schema, personality model, cognitive JSON

**Step-Scoped Reasoning Injection**:
The rule that **Core Reasoning Signature**, **Argument Development Signature**, and **Format Expression Profile** enter LLM steps at different depths — full narrative on structural steps, guardrail enums and anti-patterns on refinement steps, and voice examples scoped by step as today. **Argument Development Signature** is injected in a separate `== ARGUMENT DEVELOPMENT ==` prompt block parallel to `== AUTHOR REASONING ==`.
_Avoid_: One-size prompt block, uniform voice injection, merged author block that collapses layers

**Argument Development Drift**:
Heuristic evaluation of how closely a candidate follows the reconciled **Argument Development Signature** — including epistemic posture, typical moves, and structural anti-patterns — applied in every **Quality Mode** during candidate scoring, not only when **Voice Judge** runs.
_Avoid_: Judge-only development check, format drift, surface marker drift

**Voice Judge**:
A conditional LLM evaluation pass that scores finalist candidates against the reconciled **Core Reasoning Signature**, **Argument Development Signature**, and author examples, using a separate provider from generation to reduce self-judge bias. It never replaces heuristic **Argument Development Drift** in `fast` or `balanced`.
_Avoid_: Second draft, rewrite pass, quality LLM step, sole development enforcement layer

**Voice Judge Routing Profile**:
The versioned AI policy rule that selects the judge provider and model independently from content-generation routing profiles.
_Avoid_: Shared generation profile, judge adapter hack

**Voice Profile Rebuild**:
The offline recalculation of the **Derived Voice Profile**, **Core Reasoning Signature**, **Argument Development Signature**, and **Format Expression Profile** from all active **Voice Examples**, triggered when examples are created, updated, or batch-committed — not during generation.
_Avoid_: Runtime inference, per-generation profile refresh

**Voice Reasoning Presentation**:
The hero read-only mirror on the **Voice Dashboard** that shows the reconciled **Core Reasoning Signature** first (“how I think”) and the reconciled **Argument Development Signature** second (“how I develop a text”) in readable prose and sentence-case trait chips, with per-format **Format Expression Profile** and derived anti-patterns tucked into **Voice Dashboard Detail Layer** sections—not equal-weight cards, diagnostic label styling, or internal extraction conflict states.
_Avoid_: Style settings, persona editor, cognitive profile form, uppercase mono trait labels, mismatch warnings, single merged narrative that hides development

**Reasoning Extraction**:
The structured LLM call inside **Voice Profile Rebuild** that infers the draft **Core Reasoning Signature**, per-format **Format Expression Profile**, and **Derived Anti-Patterns** from all active examples, using the primary generation provider family rather than the **Voice Judge** provider; its output is reconciled before persistence.
_Avoid_: Per-example extraction, per-format rebuild calls, runtime reasoning inference, author-visible draft state

**Derived Voice Profile**:
The persisted voice projection recalculated from the user's examples and anti-pattern inputs, used by the writing pipeline as the current source of truth for voice alignment.
_Avoid_: Cached prompt, temporary profile

**Voice Example**:
A user-provided text sample that teaches the system how the author writes and helps derive the current **Voice Profile**.
_Avoid_: Seed text, sample prompt

**Voice Example Composer**:
The shared multi-slot form used to ingest one or more **Voice Examples** at once; submitting one filled slot calls the single-create API path, while submitting two or more filled slots calls the batch commit path.
_Avoid_: Example wizard, upload form, inline onboarding fields

**Voice Confidence**:
The trust level of the current **Derived Voice Profile**, based on example count and minimum diversity.
_Avoid_: Score, certainty

**Voice Adaptation Mode**:
The intensity level used to apply the current **Derived Voice Profile** during generation, becoming more conservative when **Voice Confidence** is low.
_Avoid_: Budget mode, quality mode

**Voice Diagnostics**:
Separate audit data that explains how the **Derived Voice Profile** was formed, including confidence, diversity, and representativeness signals, without directly driving generation.
_Avoid_: Prompt metadata, generation hints

**Voice Dashboard**:
The authenticated summary screen whose primary job is to mirror how Cultiv models the author's thinking through **Voice Reasoning Presentation** when available, or through **Voice Confidence** copy when reasoning is not yet extracted; **Voice Diagnostics** live in a **Voice Dashboard Detail Layer**, with a single **Voice Next Step** as the growth-oriented call to action.
_Avoid_: Voice page, style overview, tone settings, metrics dashboard

**Voice Next Step**:
The one prioritized recommended action derived from **Voice Diagnostics** `nextActionCodes[0]`, surfaced as a growth card with contextual copy and a single primary CTA on the **Voice Dashboard**; when no action is needed, the card celebrates a mature profile and invites the author to generate content instead of hiding the block or showing a generic add-examples prompt.
_Avoid_: Next action list, todo panel, improvement checklist, duplicate example CTAs in the footer

**Voice Dashboard Detail Layer**:
A collapsible secondary section on the **Voice Dashboard**—format expressions, **Derived Anti-Patterns**, or full **Voice Diagnostics** / coverage—closed by default and openable independently so the hero **Voice Reasoning Presentation** stays readable above the fold.
_Avoid_: Tab panel, settings section, advanced mode toggle, accordion that closes other sections

**Quality Mode Presentation**:
The product-facing label and helper copy shown in the **Authenticated Workspace** for each technical quality mode, localized through **App Locale** while the **Client Integration Surface** still sends `fast`, `balanced`, and `strict` to the backend.
_Avoid_: UI mode alias, display tier, user-facing preset

**Quality Lane**:
A concurrent candidate path used to generate and evaluate one possible output variant.
_Avoid_: Branch, track

**Candidate**:
One generated text variant produced by a quality lane.
_Avoid_: Option, draft

**Sync Run**:
A direct execution path used for debug, audit, and prompt tuning.
_Avoid_: Local run, immediate mode

**Async Run**:
A job-backed execution path used for operational processing and SSE progress.
_Avoid_: Background task, queue job

**Job**:
A persisted execution instance that can be resumed, observed, and completed later.
_Avoid_: Task, request

**Credit Budget**:
The amount of billing credits reserved for a generation before execution starts, then fully captured according to the selected pricing envelope for that generation.
_Avoid_: Precharge, prepaid cost

**Billing Surface**:
The authenticated screens and SDK capabilities that expose wallet balance, plan, ledger history, and future purchase flows to the **End User**.
_Avoid_: Payments page, credits tab, account billing

**Credit Reservation**:
The provisional hold placed on a user's Credit Budget before generation begins.
_Avoid_: Charge, debit

**Credit Capture**:
The final credit settlement after a generation completes, applying the full commercial price defined by the selected pricing envelope for that generation.
_Avoid_: Checkout, final bill

**Pricing Envelope**:
The versioned commercial rule that determines the fixed credit price for one generation based on plan tier, quality mode, and content type or pipeline.
_Avoid_: Token price, step cost

**Structured Prompt**:
A prompt split into `system` (rules, voice, format constraints) and `user` (content, briefing, previous text) messages, sent to the LLM as separate roles to prevent prompt echo and preserve output purity.
_Avoid_: Monolithic prompt, single-message prompt

**Sanitized Generation Input**:
The validated and policy-approved input envelope that remains after classification, minimization, and safety filtering, and is the only user-derived payload allowed to enter generation steps.
_Avoid_: Raw prompt, unchecked input

**Input Safety Gateway**:
The first backend-controlled policy boundary that classifies, sanitizes, validates, and either approves, quarantines, or blocks user-derived input before it can affect preview, persistence, or generation.
_Avoid_: Request parser, frontend validation

**Imported Context**:
User-supplied external material brought into the product as supporting input for generation, such as pasted reference text or future controlled imports, and governed by stricter safety policy than ordinary briefing input.
_Avoid_: Generic context, arbitrary attachment

**Imported Context Field**:
The optional collapsed textarea on the **Generation Screen** where an **End User** pastes bounded plain-text reference material; web v2 supports paste only, not file upload.
_Avoid_: Attachment upload, reference file picker, context attachment

**Step Execution**:
The execution rule attached to a pipeline step that declares whether the step runs through an LLM call or local runtime logic.
_Avoid_: Implicit adapter behavior, hidden call

**Step Scope**:
The explicit subset of fields a pipeline step is allowed to read and the explicit artifacts it is allowed to write, enforced independently from the full pipeline state.
_Avoid_: Shared mutable state, full context access

**Billing Policy Version**:
The version attached to a billing plan that freezes the credit policy used by executions started under that plan.
_Avoid_: Pricing tag, runtime flag

**Text Quality**:
The set of checks and refinement passes that preserve voice while improving clarity, fidelity, and naturalness.
_Avoid_: Polishing, rewriting

**Runtime Base**:
The shared execution primitives used by orchestration, tracing, retries, and progress tracking.
_Avoid_: Core glue, execution helpers

**Generation Preview**:
The pre-execution read model that shows credit price, projected balance, recommendation, and allowed options before the user confirms generation. Does not reserve credits.
_Avoid_: Price check, cost estimate

**Routing Profile**:
The versioned AI policy rule that selects the preferred provider/model path and fallback attempts for an LLM step, resolved internally from product and pipeline rules.
_Avoid_: Fallback profile, provider switch

**Active AI Policy Pointer**:
The persisted operational pointer that marks which versioned **AI Policy** is active for new executions without requiring a deploy.
_Avoid_: Runtime toggle, live config flag

**Onboarding**:
The optional guided first-time flow that collects voice examples, tone preferences, and plan awareness. Can be skipped entirely, but skipped steps produce persistent reminders on the generation screen.
_Avoid_: Tutorial, wizard, setup tour

**Onboarding Completion**:
The persisted signal that the **End User** has finished or explicitly dismissed the first-time **Onboarding** flow, used with voice-example presence to decide the post-login landing route.
_Avoid_: Setup done flag, tutorial completed, first-run marker

**Onboarding Welcome Step**:
The final **Onboarding** step that confirms readiness to generate, surfaces current **Voice Confidence** and available credits, and routes the user to the **Generation Screen**.
_Avoid_: Plan screen, success page, getting-started finish

**Generation Screen**:
The primary authenticated screen where the user selects a content type, fills the briefing, sees the preview, and triggers generation.
_Avoid_: Editor, composer

**Briefing Form**:
The dynamic input surface on the **Generation Screen** that renders the selected **Content Type** field schema, submits structured briefing values, and pairs with contextual briefing guidance for that format.
_Avoid_: Prompt box, textarea form, generic briefing

**Execution History**:
The paginated list of past generation runs, including both successful and failed executions, with status, content type, date, and credit cost.
_Avoid_: Log, archive

**Active Execution List**:
The always-visible in-app list of in-flight **Async Runs** the **End User** has started, showing live status and opening the finished text on demand without forcing navigation away from the current screen.
_Avoid_: Job queue, pending tasks panel, generation tray

**Active Execution Drawer**:
The lateral read surface opened from the **Active Execution List** that shows an **Execution Result View** without changing the current route, with a secondary action to open the full history detail.
_Avoid_: Result modal, quick-view popup, inline expansion

**Execution Result View**:
The read-only presentation of one completed generation's output, metadata, and recovery actions such as copy and regenerate.
_Avoid_: Editor, output modal, result page

**Execution History Detail**:
The dedicated route view for one past execution, hosting the full **Execution Result View** and regeneration entry points; distinct from the quick-reading **Active Execution Drawer**.
_Avoid_: History modal, drawer-only history, inline expand

**Completion Notification**:
The client-visible signal that an **Async Run** has finished while the app session is active, allowing the user to return to the generated text without introducing a separate delivery domain.
_Avoid_: Push notification, message delivery, alert system

**Execution Watch**:
The product-level client capability that observes one execution over time and hides transport concerns such as SSE, polling fallback, reconnect, and completion detection from web and mobile applications.
_Avoid_: EventSource wrapper, polling helper, transport stream

**Execution Transition**:
The typed client-visible state change emitted by **Execution Watch**, such as started, progressed, completed, or failed, optionally accompanied by the latest execution snapshot.
_Avoid_: Raw SSE event, snapshot diff, transport packet

**Execution Watch Resilience**:
The client-side policy inside **Execution Watch** that handles reconnect, retry, and polling fallback automatically within bounded rules before surfacing a typed observation failure to the application.
_Avoid_: UI retry loop, manual reconnect policy, ad hoc fallback

**Execution Resume**:
The explicit domain capability that lets a client reattach to an existing execution by its canonical identity after the user leaves the initial generation flow.
_Avoid_: Manual watch wiring, route-level recovery, screen-specific continuation logic

**Execution Identity**:
The canonical execution identifier used by the **Client Integration Surface** to retrieve, watch, and resume one generation across screens or sessions.
_Avoid_: Client temp id, pending request key, watch token

**Client State Boundary**:
The rule that the **Client Integration Surface** owns domain contracts, transport behavior, and observation semantics, while application state, caching, and screen lifecycle remain outside the SDK by default.
_Avoid_: Shared frontend store, built-in app state container, SDK-owned screen cache

**Framework-Agnostic Client**:
The rule that the **Client Integration Surface** remains independent from specific UI frameworks so web and mobile applications can adopt their own presentation and cache stacks without changing backend integration semantics.
_Avoid_: Next-bound SDK, React-only core, framework-coupled transport

**Client Contract Versioning**:
The discipline that treats the **Client Integration Surface** as a versioned artifact with explicit compatibility expectations, even while it evolves in the same monorepo as the backend.
_Avoid_: Internal-only package drift, implicit contract break, workspace-only coupling

**Client Contract Failure**:
The fail-fast rule that the **Client Integration Surface** must surface typed incompatibility errors when the backend response no longer matches the expected client contract, instead of masking drift with silent fallbacks.
_Avoid_: Silent compatibility mode, best-effort decode, hidden contract drift

**Client Surface Root**:
The single aggregated SDK entry point that exposes domain subclients such as preview, executions, voice, and content types under one shared configuration and authentication boundary.
_Avoid_: Unrelated SDK factories, duplicated client bootstrap, many public roots

**Flat Domain Methods**:
The rule that each domain subclient exposes its primary capabilities as shallow first-level methods instead of nested client trees.
_Avoid_: Deep method nesting, transport-shaped namespaces, capability indirection

**Named Method Inputs**:
The rule that public SDK methods receive one named input object even for simple lookups, preserving stable and extensible signatures across the **Client Integration Surface**.
_Avoid_: Positional arguments, mixed signature styles, scalar-only public methods

**Decoded Domain Outputs**:
The rule that public SDK methods return the decoded domain payload directly instead of wrapping backend contracts in a second client-only envelope.
_Avoid_: Client data wrappers, synthetic result envelopes, redundant `data/meta` shells

**Observation Handle**:
The explicit control object returned by continuous client capabilities such as **Execution Watch**, allowing the consuming application to stop observation without owning transport cleanup details directly.
_Avoid_: Fire-and-forget watch, hidden lifecycle, transport-owned teardown

**Minimal Observation Handle**:
The v1 rule that an **Observation Handle** exposes only `stop()` and does not become a local state container for current snapshot or observation status.
_Avoid_: Snapshot reader in v1, embedded watch cache, handle-owned client state

**Unified Transition Callback**:
The rule that **Execution Watch** delivers lifecycle changes through one required transition callback instead of many event-specific callbacks.
_Avoid_: Callback explosion, per-event handlers, fragmented watch semantics

**Observation Failure Boundary**:
The rule that execution failure and observation failure are distinct client concepts, so watch-level observation failure must not be modeled as an execution lifecycle transition.
_Avoid_: Mixed failure channel, fake execution failure, ambiguous watch termination

**Authenticated Actor**:
The identity asserted by the authentication layer for one backend request, carrying the stable user id and any operational roles or permissions needed for authorization and audit.
_Avoid_: Header user, session blob

**End User**:
The primary product actor who owns a personal workspace and can access only their own generation, voice, preview, and billing-related resources through the public authenticated surface.
_Avoid_: Tenant admin, operator

**Support Operator**:
An internal operational actor with limited read access for support workflows, without implicit permission to act as an **End User** or mutate sensitive platform policy.
_Avoid_: Admin, superuser

**Billing Operator**:
An internal operational actor responsible for billing reconciliation and credit-support workflows, without broad access to user-generated content by default.
_Avoid_: Finance admin, backoffice root

**Platform Admin**:
An internal operational actor allowed to perform sensitive platform actions such as AI policy activation and other explicitly authorized administrative operations.
_Avoid_: Default admin, owner

**Public API Surface**:
The authenticated backend surface exposed to the **End User** for user-owned generation, voice, preview, and history workflows.
_Avoid_: Internal API, admin API

**Client Integration Surface**:
The client-side access layer, implemented by the `client-sdk`, that standardizes how web and mobile applications consume the **Public API Surface** without owning backend protocol details directly.
_Avoid_: Public API, frontend API, backend wrapper

**Operational API Surface**:
The separate backend surface reserved for internal operational actors, including administrative, support, billing, and controlled debug or audit workflows such as **Sync Run**.
_Avoid_: Public API, user API

**Application User**:
The backend-owned user record that anchors resource ownership, billing relationships, and audit joins, while linking one product user to an external identity subject.
_Avoid_: Raw OIDC subject, auth row

**Operator**:
The backend-owned operational identity used for internal authorization and audit, separate from the **Application User** ownership model even when the same human can hold both kinds of access.
_Avoid_: Admin user, staff account

**Authorization Cache**:
The short-lived backend cache that stores recently resolved authorization state for an **Authenticated Actor** without becoming the canonical source of roles or permissions.
_Avoid_: Session authority, auth source of truth

**Audit Trail**:
The persisted record of sensitive operational and access-control events, used to reconstruct who changed what and when.
_Avoid_: Application log, debug log

**Voice Training Consent**:
The explicit user authorization that allows **Voice Example** material to be stored and used to derive or maintain the current **Derived Voice Profile**.
_Avoid_: Generic acceptance, hidden processing consent

**Policy Evidence**:
The durable decision record produced by a safety or compliance policy boundary, explaining why a given input, scope, output, or consent action was approved, sanitized, quarantined, blocked, or revoked.
_Avoid_: Debug trace, generic log line

**Safety Domain**:
The backend-owned domain area responsible for content safety, data protection, step isolation, consent governance, output release, and the policy evidence that ties those decisions together.
_Avoid_: Guardrails helper, scattered middleware

**Instruction Override Attempt**:
A detected user or imported input pattern that tries to alter system-controlled instructions, expand step scope, exfiltrate protected context, or bypass policy boundaries during generation.
_Avoid_: Prompt injection, jailbreak

**Product Showcase**:
The public marketing surface that presents the product's value, differentiation, and curated proof of output quality before a visitor can use the authenticated platform.
_Avoid_: Landing page, homepage, portfolio

**Waitlist**:
The pre-launch interest capture flow where visitors submit contact details to request early access, without authentication or product usage.
_Avoid_: Wishlist, newsletter signup, lead form

**Waitlist Submission**:
The server-side handoff that forwards a validated waitlist signup to an external email provider without creating an **Application User** or touching the product backend.
_Avoid_: Lead sync, newsletter subscription, backend signup

**Marketing Locale**:
The language variant of the **Marketing Surface** content and metadata, limited to supported public locales such as Portuguese (Brazil) and English.
_Avoid_: i18n, language, region

**App Locale**:
The language variant of the **Authenticated Workspace** UI copy and default form values, resolved from user preference and browser detection without duplicating `/app/*` routes under a locale prefix.
_Avoid_: i18n, language setting, UI language

**Marketing Surface**:
The unauthenticated web experience composed of editorial pages such as the **Product Showcase** and **Waitlist**, separate from the authenticated product workspace.
_Avoid_: Public app, marketing site, brochure site

**Authenticated Workspace**:
The protected web experience where an **End User** teaches voice, runs generations, reviews **Execution History**, and manages account settings — delivered under `/app/*` and separate from the **Marketing Surface**.
_Avoid_: App, dashboard, portal, logged-in area

**App Shell Navigation**:
The primary authenticated navigation set exposed in sidebar and bottom nav: generation, execution history, and voice management, with account settings reached from the avatar menu rather than a primary nav item.
_Avoid_: Main menu, tab bar items, sidebar links

**Account Settings Screen**:
The authenticated screen reached from the avatar menu where the **End User** manages **App Locale**, views read-only identity details, reviews **Voice Training Consent**, and signs out.
_Avoid_: Profile page, preferences hub, user panel

**Showcase Sample**:
A curated marketing artifact for one **Content Type** that pairs a generic AI output with a voice-aligned output to demonstrate the product's differentiation.
_Avoid_: Demo, case study, portfolio item

**Design System**:
The shared visual language — tokens, primitives, and reusable patterns — consumed by web and future client applications without embedding marketing-specific sections.
_Avoid_: UI kit, component library, style guide

**Workspace Visual Refresh**:
The planned premium, fluid, contemporary visual evolution scoped exclusively to the **Authenticated Workspace**, independent of the **Marketing Surface** editorial language, while preserving **Brand Tone** (organic warmth, personal growth — not cold corporate SaaS).
_Avoid_: Rebrand, marketing redesign, global theme swap

**Workspace Typography**:
The typographic rule for the **Authenticated Workspace**: sans-serif only (`font-body` scale) for titles, labels, and body copy; **Playfair Display** and **Caveat** remain exclusive to the **Marketing Surface**.
_Avoid_: Editorial serif in app, handwritten in app chrome

**Workspace Surface Language**:
The visual treatment for **Authenticated Workspace** surfaces: soft glass layers (backdrop blur, warm diffuse shadows, subtle borders), restrained **organic-glow** page atmosphere, and medium corner radius on cards and chrome — not flat opaque panels or editorial hard-edge frames.
_Avoid_: Flat SaaS panels, heavy editorial borders, marketing-style scene mats

**Generation Screen Layout**:
The responsive layout rule for the **Generation Screen**: on desktop, a split view with the **Briefing Form** on the wider column and a sticky **Generation Preview** panel on the narrower column; on mobile, a single centered column with preview stacked below the form.
_Avoid_: Multi-step wizard, preview-only modal, desktop single-column scroll-to-confirm

**Workspace Navigation Chrome**:
The presentation pattern for **App Shell Navigation** in the **Workspace Visual Refresh**: a floating glass dock on desktop that expands on hover or focus to reveal labels, plus a labeled bottom bar on mobile — not a fixed full-height sidebar.
_Avoid_: Fixed sidebar, permanent wide nav column, marketing-style header nav

**Voice Confidence Presentation**:
The visual rule for **Voice Confidence** on the **Voice Dashboard**: a circular growth ring that fills along a moss-to-golden gradient by confidence level, paired with the textual label — not a plain text card or generic progress bar alone.
_Avoid_: SaaS progress bar only, decorative botanical illustration, numeric score without context

**Workspace Motion Language**:
The animation rule for the **Authenticated Workspace**: contained fluid motion — short route fades with slight slide, 60–80ms mount staggers on forms and lists, soft drawer springs (~320ms), subtle card hover lift — without bounce, elastic, parallax, or marketing-style scroll chapters; honor `prefers-reduced-motion` by collapsing to opacity-only transitions.
_Avoid_: Static UI, cinematic scroll storytelling, bouncy microinteractions

**Workspace Accent Palette**:
The color accent rule for the **Authenticated Workspace**: moss for interactive states (active nav, focus rings, links) and golden for growth, progress, and warm emphasis (including **Voice Confidence** fill); no third chromatic accent such as violet in workspace chrome.
_Avoid_: Violet AI accent in app, rainbow status colors, decorative color fills

**Brand Tone**:
The emotional positioning of the **Marketing Surface**: personal, organic growth rather than corporate tech or aggressive conversion.
_Avoid_: Brand voice, marketing angle, vibe

**Marketing Problem Angle**:
The primary visitor tension on the **Product Showcase**: publishing at scale with generic AI erases the author's personal voice, and manual ChatGPT voice prompts are fragile substitutes.
_Avoid_: Pain point, user problem, ICP struggle

**Problem Perspective**:
One facet of the **Marketing Problem Angle**, expressed as a single editorial card with a punchy title and a short body (2–3 sentences) on the **Product Showcase**.
_Avoid_: Pain card, issue tile, bullet

**Solution Breath**:
The post-problem **Product Showcase** section that centers the **Cultiv** name in open space and surrounds it with short **Solution Keywords** in balloon-like visuals — calm pacing with minimal copy, not a dense feature grid.
_Avoid_: Hero repeat, feature list, benefits section

**Solution Keyword**:
A single visitor-facing word in the **Solution Breath** that names one way Cultiv resolves the **Marketing Problem Angle** (e.g. voice, memory, format).
_Avoid_: Feature tag, chip label, buzzword

**Showcase Teaser**:
A single compact **Showcase Sample** comparison (generic vs. voice-aligned) embedded in the differentiators area of the **Product Showcase**, with short previews and full detail available in a modal — not a multi-sample horizontal scroll section.
_Avoid_: Demo carousel, samples gallery, proof strip

**Differentiator Chapter**:
One scroll-pinned moment in the differentiators sequence of the **Product Showcase** where a card scales into focus, reveals a visual scene plus short copy, then recedes as the visitor continues — not a static grid tile.
_Avoid_: Feature slide, scroll section, zoom card

**Marketing Use Case**:
A visitor-facing application card on the **Product Showcase** that pairs a persona or situation with an implied **Content Type** badge — not a full **Content Type** catalog row.
_Avoid_: User persona tile, ICP card, format listing

**Marketing Product Flow**:
The end-to-end visitor-facing sequence on the **Product Showcase** that explains how an **End User** moves from platform access to a voice-aligned generation, without launch dates or future feature promises.
_Avoid_: Roadmap, timeline, how-it-works wizard

**Flow Step**:
One stage in the **Marketing Product Flow**, expressed with visitor language and optional links to domain concepts such as **Voice Example**, **Derived Voice Profile**, or **Generation Preview**.
_Avoid_: Pipeline step, onboarding screen, tutorial slide

**Marketing Social Proof**:
A pre-launch positioning block on the **Product Showcase** that states shared intent or audience fit without fabricated metrics, testimonials, or community counts.
_Avoid_: Social proof, traction section, user count

**Marketing Hero**:
The above-the-fold block of the **Product Showcase** led by a value-forward headline and fixed subheadline, with primary waitlist and secondary editorial CTAs; the public brand name appears in the logo, not as the main headline.
_Avoid_: Landing hero, above-the-fold, splash

**Marketing Surface Rhythm**:
The light-and-dark alternation rule on the **Product Showcase**: warm paper carries the editorial narrative, elevated paper accents lighter differentiator chapters, the showcase palette marks the proof chapter, and invert marks the **Waitlist** — not strong dark alternation on every section.
_Avoid_: Theme switching, section dark mode, zebra layout

**Problem Perspective Visual**:
A marketing-only typographic or editorial SVG scene paired with a **Problem Perspective** on desktop in an alternating two-column layout; it illustrates the pain without stock photography or generic AI imagery.
_Avoid_: Problem illustration, pain image, hero graphic

**Client Runtime Model**:
The phased rule for how Effect-TS is used in client applications: boundary services in early marketing surfaces, full Effect layers across UI and services once the authenticated app ships.
_Avoid_: Frontend architecture, Effect setup

**Cultiv**:
The public product name for the writing engine and its client applications.
_Avoid_: AI Writing Engine, content-lib, my-ai-orchestrator

## Relationships

- A **Pipeline** is composed of one or more ordered steps.
- A **Generation Request** does not define a **Pipeline** directly; the product resolves the internal **Pipeline** from product rules and catalog policy.
- A **Content Type** selects or constrains which **Pipeline** is used.
- A **Content Type Format Preset** may supply format constraints during voice resolution, but must not inject cognitive or narrative patterns when the author has a derived voice.
- **Core Reasoning Signature** is derived from all active **Voice Examples** during profile rebuild.
- **Argument Development Signature** is derived from the same **Voice Examples** during profile rebuild and sits between **Core Reasoning Signature** (who the author is as a thinker) and **Format Expression Profile** (how the author sounds on a channel).
- **Argument Development Signature** must be inferred from examples; Cultiv must not impose a fixed argumentative phase template on the author.
- **Reasoning Extraction** and **Argument Development Extraction** run in parallel during **Voice Profile Rebuild**; **Voice Signature Reconciliation** harmonizes their drafts before persistence only when a divergence check detects conflict, so the author sees one coherent profile.
- **Voice Signature Reconciliation** must not block generation or expose internal contradiction states to the author in Fase 1.
- **Argument Development Signature**, **Argument Development Extraction**, **Voice Signature Divergence Check**, **Voice Signature Reconciliation**, and **Argument Development Drift** ship under the same `voice.reasoningSignatureV1` feature flag as **Core Reasoning Signature** — not a separate product toggle in v1.
- **Argument Development Extraction** runs when at least two active **Voice Examples** exist; the resulting signature is treated as immature until at least three active examples are available, aligned with **Voice Confidence** signals on the **Voice Dashboard**.
- **Step-Scoped Reasoning Injection** applies **Core Reasoning Signature** and **Format Expression Profile** to every LLM step, with full narrative on structural steps (`hook`, `outline`, `structure`, `draft`, `expand`) and enum guardrails on refinement steps (`refine`, `tighten`).
- **Reasoning Extraction** uses the primary provider via a dedicated extraction routing profile; **Voice Judge** uses **Voice Judge Routing Profile** (Groq preferred) and must not share the generation provider by default.
- **Voice Judge** runs on finalist candidates when **Quality Mode** is `strict`, or in `balanced` when reasoning drift is borderline, **Argument Development Drift** is borderline, or top candidates tie; it never runs in `fast`. **Argument Development Drift** and reasoning drift heuristics run in every **Quality Mode**, including when the judge does not run.
- **Voice Profile Rebuild** runs when **Voice Examples** change, coalesces rapid updates per user, and keeps the previous profile active while rebuild is in progress.
- **Reasoning Extraction** uses one structured LLM call per rebuild; on failure, the last valid profile remains active and heuristics-only derivation is not promoted without a successful extraction.
- **Voice Reasoning Presentation** is read-only in Fase 1; authors refine inference by adding or improving **Voice Examples**, not by editing derived reasoning fields directly.
- Dynamic example retrieval remains out of Fase 1 scope until per-format example volume routinely exceeds prompt budget.
- A **Voice Example** contributes to the user's **Derived Voice Profile** and **Reasoning Signature**.
- **Reasoning Signature** is derived from **Voice Examples** during profile rebuild and consumed alongside the **Derived Voice Profile** at generation time.
- **Reasoning Signature Representation** uses narrative prose for prompt guidance and reduced enums for measurable drift checks; dynamic example retrieval is a later enhancement when per-format example volume exceeds prompt budget.
- A **Voice Example** may be consumed in raw form by explicitly authorized pipeline stages when voice fidelity requires it, but the main generation step still consumes the **Derived Voice Profile** as its voice source of truth.
- A **Derived Voice Profile** is recalculated from the user's examples and then resolved before generating **Candidates**.
- Revoking **Voice Training Consent** must stop future derivation and also remove or permanently disable stored **Voice Example** material for future voice derivation until the user provides new examples.
- Revoking **Voice Training Consent** must also invalidate the current **Derived Voice Profile** and any future reuse of voice-derived artifacts, leaving only minimal compliance evidence in the **Audit Trail**.
- **Voice Profile** is resolved exactly once per generation, in the backend, using the full database context (examples, diagnostics, content-type presets). Downstream packages such as **Text Quality** receive the resolved profile and consume it passively; they do not re-infer or override any field.
- **antiPatternsExplicit** and **userLabels** are derived from the user's saved examples. When a user has not provided explicit anti-patterns, the system falls back to the Content Type preset anti-patterns, ensuring consistent quality enforcement even without manual configuration.
- **Voice Confidence** and **Voice Diagnostics** describe the quality of the current **Derived Voice Profile**.
- **Voice Adaptation Mode** becomes more conservative when **Voice Confidence** is lower, but does not change budget, lane count, or execution pricing behavior.
- A **Quality Lane** produces one **Candidate**.
- **Text Quality** compares and refines **Candidates** before selecting the best output.
- A **Sync Run** and an **Async Run** execute the same product logic through different orchestration paths.
- A **Job** records the lifecycle of an **Async Run**.
- The **Runtime Base** is shared by **Sync Run**, **Async Run**, and **Text Quality** orchestration.
- A **Pricing Envelope** fixes the commercial price of a generation by plan tier, quality mode, and content type or pipeline, regardless of early exit inside the runtime.
- **Step Execution** is defined per pipeline step and determines whether that step consumes LLM capacity or only local runtime logic.
- A **Structured Prompt** splits rules and constraints into the `system` message and content into the `user` message. This prevents the LLM from echoing headers, labels, or instructions in the output.
- An **Input Safety Gateway** must act at the first backend entry point for user-derived content and never trusts raw frontend payloads.
- **Imported Context** should launch with a restricted baseline and evolve to richer formats only through explicit policy expansion.
- Web v2 exposes **Imported Context** through a collapsed optional **Imported Context Field** on the **Generation Screen**; launch support is bounded plain-text paste only, with no file-upload path.
- The **Account Settings Screen** includes read-only identity details, **App Locale** preference, **Voice Training Consent** review and revocation, and logout.
- `/app/voice` is a **Voice Dashboard** in web v2, not a redirect-only wrapper; it surfaces profile confidence, diagnostics, **Voice Reasoning Presentation**, and CTAs into example management.
- The **Generation Screen** content-type selector lists every catalog **Content Type** and disables unavailable options with plan or policy reasons instead of hiding them.
- A **Sanitized Generation Input** is the only user-derived payload that may cross into generation after policy checks.
- A **Step Scope** constrains each step to a minimal read/write contract instead of exposing the full pipeline state.
- When a step produces a **Structured Prompt** but no adapter executes it (e.g., test or local mode), the orchestrator extracts the `user` portion for the pipeline state so subsequent steps receive clean text.
- A **Generation Preview** is resolved before the user confirms generation and does not reserve credits.
- A **Routing Profile** is resolved per LLM **Step Execution**, using internal product and pipeline rules that may depend on **Content Type** and **Quality Mode**.
- The **Active AI Policy Pointer** selects which versioned **AI Policy** new executions and previews use.
- An **Onboarding** step collects **Voice Examples** and tone preferences; skipped steps produce reminders on the **Generation Screen**.
- The first **Onboarding** step reuses the same **Voice Example Composer** as `/app/voice/examples/new`, so first-time users learn the real ingestion flow instead of a simplified inline variant.
- Web v2 **Onboarding** has exactly two steps: **Voice Example Composer**, then an **Onboarding Welcome Step**; there is no separate global tone-preferences step because tone is derived from **Voice Examples**.
- The **Voice Example Composer** starts with one example slot and can add more slots on demand; one submitted slot uses single-create ingestion, while multiple submitted slots use batch ingestion through the **Client Integration Surface**.
- Editing an existing **Voice Example** reuses the same composer shape constrained to one slot and the update API path.
- After authentication, the **Authenticated Workspace** uses a smart first-entry redirect: users with no **Voice Examples** and incomplete **Onboarding Completion** land on `/app/onboarding`; all other users land on `/app/generate`.
- **Onboarding Completion** is backend-owned when available, with client persistence only as a temporary fallback until the backend exposes it.
- The **Generation Screen** is where the user selects a **Content Type**, fills the briefing, sees the **Generation Preview**, and triggers a **Generation Request**.
- The **Briefing Form** is driven by the selected **Content Type** catalog schema and guidance; web v2 does not use one shared free-text briefing field for every format.
- Web v2 exposes all three quality modes in the **Generation Screen** selector; blocked modes remain visible with plan reasons from **Generation Preview**.
- **Quality Mode Presentation** maps technical modes to product copy: `fast` → less refinement, `balanced` → middle refinement, `strict` → highest refinement; all modes preserve the user's voice.
- The v1 **Quality Mode Presentation** labels are: pt-BR `Direto` / `Equilibrado` / `Afinado`; en `Light` / `Balanced` / `Polished`, each with short helper copy about refinement level rather than exposing backend enum names in the UI.
- Web v2 **Credit Budget** in the **AppHeader** is sourced from cached **Generation Preview** balance data, refreshed on app entry and invalidated after generation mutations, because the **Billing Surface** is deferred.
- **Execution History** lists past **Sync Runs** and **Async Runs** with status, **Content Type**, date, and credit cost.
- The default **End User** generation path is **Async Run**; **Sync Run** remains an operational or validation path and is not the primary product flow in the **Authenticated Workspace**.
- After an **Async Run** is requested from the **Generation Screen**, the user stays in the **Authenticated Workspace** and may continue navigating or start additional generations.
- The **Active Execution List** tracks in-flight **Async Runs** for the current user; when one completes, a **Completion Notification** signals readiness and the same list item becomes openable into an **Execution Result View**.
- On desktop, the **Active Execution List** lives in the app sidebar below primary navigation; on mobile it opens from a header icon with an in-flight count badge.
- Selecting a completed item opens the **Active Execution Drawer**; a secondary action inside the drawer links to the full **Execution History** detail route.
- **Execution History** list items open the **Execution History Detail** route directly; the **Active Execution Drawer** remains the quick-reading path for in-flight and recent work from the sidebar.
- Web v2 ships without a **Billing Surface** route; **Credit Budget** visibility comes only from the **AppHeader** and **Generation Preview** on the **Generation Screen**.
- Full **Billing Surface** delivery — wallet endpoint, SDK domain, `/app/billing`, and ledger history — is planned immediately after web v2, not inside the v2 scope.
- Web v2 **App Shell Navigation** exposes exactly three primary destinations — **Generation Screen**, **Execution History**, and voice management — plus **Settings** from the avatar menu; billing routes are absent in v2.
- Web v2 ships the **Authenticated Workspace** bilingually through **App Locale** preference (pt-BR and en) from day one; app routes do not use a `/en` prefix like the **Marketing Surface**.
- **Execution History** remains the durable archive of all runs; the **Active Execution List** focuses on queued and running work plus recently completed items until the user dismisses or archives them.
- Web and mobile applications must consume asynchronous generation through **Execution History** and execution status capabilities, not through backend **Job** mechanics directly.
- A **Completion Notification** is derived from execution status observation during an active app session and does not imply a persisted or external delivery channel.
- **Execution Watch** observes one execution as a product capability and hides raw transport behavior from frontend applications.
- **Execution Watch** emits **Execution Transitions** so frontend applications can react to meaningful lifecycle changes without diffing transport snapshots themselves.
- **Execution Watch Resilience** belongs to the **Client Integration Surface**, which should retry and fallback automatically before surfacing a typed observation failure.
- **Execution Resume** allows web and mobile applications to reattach to an existing execution after navigation changes or screen exits without rebuilding the async flow manually.
- **Execution Identity** is the canonical key for retrieval, observation, and resume, while request idempotency remains a separate concern.
- The **Client State Boundary** keeps application caching, persistence, and screen lifecycle outside the **Client Integration Surface** unless an explicit optional adapter is introduced later.
- A **Framework-Agnostic Client** keeps the **Client Integration Surface** portable across web and mobile stacks such as TanStack-based applications without making backend consumption depend on one UI framework.
- **Client Contract Versioning** means backend and SDK changes must preserve or intentionally version the client-facing contract instead of relying on same-repo coordination alone.
- **Client Contract Failure** is fail-fast: transport resilience may fallback, but contract incompatibility must surface explicitly as a typed client error.
- The **Client Surface Root** is a single aggregated entry point that groups domain subclients under one configuration and authentication boundary.
- **Flat Domain Methods** keep capabilities such as run, list, get, watch, and resume at the first level of each domain subclient.
- **Named Method Inputs** keep public SDK signatures consistent and extensible across all domain capabilities.
- **Decoded Domain Outputs** keep SDK return values aligned with backend contracts unless a capability semantically requires a different shape, such as an observation handle.
- An **Observation Handle** is required for long-lived observation capabilities so frontend applications can stop observation explicitly without managing transport teardown themselves.
- A **Minimal Observation Handle** keeps v1 observation control limited to explicit stop behavior and avoids turning the SDK into a local execution state container.
- A **Unified Transition Callback** keeps execution observation centered on one stream of **Execution Transitions** instead of splitting watch semantics across multiple callbacks.
- The **Observation Failure Boundary** keeps watch-level observation failure separate from execution lifecycle failure so clients do not confuse backend execution outcome with observation loss.
- Every authenticated request resolves one **Authenticated Actor** before authorization is evaluated.
- An **End User** owns their personal generation and voice resources.
- **Support Operator**, **Billing Operator**, and **Platform Admin** are internal operational actors with intentionally different authorization scopes and audit expectations.
- The **Public API Surface** serves **End User** workflows only.
- The **Client Integration Surface** consumes the **Public API Surface** and is the only frontend-owned layer allowed to know backend transport details.
- Web and mobile applications must consume the backend only through the **Client Integration Surface** and must not own direct HTTP integrations to the **Public API Surface**.
- The **Client Integration Surface** is an authenticated consumer of the **Public API Surface** and receives tokens from a platform-owned identity integration instead of owning signup, signin, or redirect flows itself.
- Web and mobile applications should consume the **Client Integration Surface** through product capabilities such as **Generation Preview**, **Execution History**, **Voice Profile**, and **Content Type**, instead of owning backend route semantics directly.
- A **Job** remains a backend execution mechanism for **Async Run** orchestration and must not become a frontend-owned API concept.
- Persisted or external delivery such as push, email, or WhatsApp is outside the v1 **Client Integration Surface** and belongs to a future separate capability if adopted.
- The **Operational API Surface** is separate from the **Public API Surface** and serves internal operational workflows only.
- **Sync Run** belongs to the **Operational API Surface**, not to the **Public API Surface**.
- An **Application User** links the product's owned data to one authenticated external identity while remaining part of the backend domain model.
- An **Operator** is an operational identity, not a user-owned resource identity.
- An **Authorization Cache** may accelerate repeated authorization checks, but canonical role and permission decisions still come from backend-controlled records.
- An **Audit Trail** records sensitive identity, authorization, billing, policy, and access events separately from ordinary logs.
- **Policy Evidence** should be specialized by decision boundary (input, scope, output, consent) instead of collapsing every policy decision into one opaque record shape.
- The **Safety Domain** owns policy decisions that cut across generation, persistence, consent, and release boundaries instead of scattering security-critical rules across unrelated modules.
- An **Instruction Override Attempt** is a security-domain event, not just a parser detail, and should be auditable, measurable, and policy-driven.
- The **Marketing Surface** is the v1 web scope before the authenticated platform ships; it contains the **Product Showcase** and **Waitlist** only.
- Web v2 delivery scope is the **Authenticated Workspace** only; the **Marketing Surface** stays stable and is not part of the v2 structural planning pass except for auth entry points such as waitlist-to-signup CTAs.
- The **Authenticated Workspace** is served from the same `apps/web` TanStack Start application as the **Marketing Surface**, but route groups, layouts, and SDK integration are isolated under `/app/*`.
- The **Product Showcase** presents **Showcase Samples** as curated proof of output quality; it does not expose generation, preview, or billing capabilities.
- Each **Showcase Sample** belongs to exactly one **Content Type** and contrasts a generic output with a voice-aligned output for the same briefing.
- The v1 **Product Showcase** presents exactly three **Showcase Samples**: blog post, LinkedIn post, and thread.
- The v1 **Marketing Surface** ships in a light visual theme only; dark theme tokens may be prepared in the **Design System** without being productized yet.
- The **Waitlist** captures early-access interest without creating an **Application User** or starting **Onboarding**.
- A **Waitlist Submission** is handled outside the **Public API Surface** through a marketing API route and an external email provider.
- v1 **Waitlist Submissions** are forwarded to Loops for contact capture and pre-launch communication.
- The v1 **Marketing Surface** deploys to Vercel as a separate runtime from the product backend.
- Sign-up and sign-in for the authenticated app are owned by Auth0; the backend validates Auth0 JWTs and provisions **Application User** records just-in-time.
- The v1 **Marketing Surface** ships bilingually; each public marketing route resolves one **Marketing Locale** at a time.
- Portuguese (Brazil) is the default **Marketing Locale** at `/`; English is served under `/en` with equivalent routes and `hreflang` metadata.
- The v1 **Product Showcase** ships as one editorial scroll page with anchored sections; legal pages are the only additional public routes in the **Marketing Surface**.
- The **Design System** lives in `packages/ui` and is shared across client applications; marketing sections and app screens compose it locally in each app.
- The **Workspace Visual Refresh** applies only under `/app/*`; the **Marketing Surface** keeps its current editorial showcase language and is not part of that pass.
- The **Authenticated Workspace** may override or extend shared tokens locally (for example radius, shadows, app typography) without changing the **Marketing Surface** presentation.
- **Workspace Typography** uses sans-serif only; display serif and handwritten fonts from the **Marketing Surface** must not appear in **Authenticated Workspace** UI chrome or screen titles.
- **Workspace Surface Language** applies soft glass, warm shadows, medium radius, and subtle organic glow; form fields use solid readable backgrounds rather than glass-on-glass stacking.
- The **Generation Screen** uses a desktop split layout with sticky **Generation Preview** and a mobile single-column stack.
- **Workspace Navigation Chrome** keeps the floating expandable dock on desktop and bottom bar on mobile; it does not switch to a fixed sidebar in the **Workspace Visual Refresh**.
- **Voice Confidence Presentation** uses a moss-to-golden growth ring on the **Voice Dashboard**, animated on load within reduced-motion constraints.
- **Workspace Motion Language** applies contained fluid motion across `/app/*` and defers to opacity-only transitions when `prefers-reduced-motion` is set.
- In the **Workspace Visual Refresh**, the **Active Execution Drawer** is a ~520px right slide-over on desktop and a full-screen sheet on mobile, optimized for reading an **Execution Result View** with relaxed typography and a fixed action toolbar.
- **Workspace Accent Palette** limits chromatic emphasis to moss and golden within `/app/*`; alternate accent directions such as violet do not apply to the workspace refresh.
- The v1 **Brand Tone** favors organic personal growth: warm typography, soft motion, and neutral palettes over cold tech or high-pressure conversion styling.
- The v1 **Product Showcase** problem section uses two **Problem Perspectives** that reinforce the **Marketing Problem Angle**: generic AI tone and fragile manual voice prompts.
- The v1 **Product Showcase** follows wireframe order: a dedicated problem block, then a separate **Solution Breath** block — not a Chromia-style problem|solution pair in one row.
- The **Solution Breath** centers **Cultiv** and expresses the answer through a small set of **Solution Keywords** in balloon visuals rather than paragraph copy.
- The **Solution Breath** uses a fixed one-line subtitle under **Cultiv** plus per-keyword micro-copy revealed on hover (desktop) or tap (mobile); keywords are not explained inline by default.
- The v1 **Solution Keywords** on the **Product Showcase** are **Voz**, **Memória**, **Formato**, and **Escala**, each naming one facet of how Cultiv resolves the **Marketing Problem Angle**.
- The v1 **Product Showcase** uses one **Showcase Teaser** (LinkedIn **Showcase Sample** recommended) as a highlight card inside the differentiators grid, not a dedicated full-width showcase section with three horizontal samples.
- The v1 differentiators area is a vertical sequence of **Differentiator Chapters** (Chromia-style scroll focus), not a symmetric 2×2 grid; each chapter pairs short copy with a designed visual scene.
- The **Showcase Teaser** chapter uses the full **Differentiator Chapter** treatment (longer pin, stronger scale, rich background); the other three differentiator chapters use a lighter variant (shorter pin, subtler zoom, simpler scenes).
- The v1 **Product Showcase** use-cases area shows three **Marketing Use Cases** (founder on LinkedIn, creator in thread, blog author) with format badges, not the full six-**Content Type** catalog grid.
- The v1 **Product Showcase** does not ship a launch **Roadmap**; it ships a **Marketing Product Flow** titled *Da voz ao texto* (or locale equivalent) with five **Flow Steps** and no delivery dates.
- The five v1 **Flow Steps** are: platform access, teaching with **Voice Examples**, **Derived Voice Profile** with **Voice Confidence** (one-line copy only), briefing plus **Generation Preview**, and voice-aligned generation.
- The **Marketing Product Flow** describes expected product behavior for waitlist visitors; it is not a delivery commitment or launch schedule.
- The v1 **Marketing Social Proof** block uses positioning copy only (no fabricated user counts or unauthorized testimonials).
- The v1 **Marketing Hero** uses a product-outcome headline and fixed subheadline instead of the brand name or rotating slogan keywords as the primary message.
- The v1 **Marketing Hero** headline is *Textos que soam como você.* (locale equivalent in English), with a fixed subheadline explaining that Cultiv learns the author's writing and generates personal — not generic — text.
- The v1 **Marketing Hero** does not ship a category chip above the headline; the fixed subheadline carries product categorization instead.
- The handwritten brand note (*Não se constrói uma voz. Cultiva-se.* and locale equivalent) lives in the **Solution Breath**, not in the **Marketing Hero**.
- The v1 **Product Showcase** FAQ accordion ships below the **Waitlist** section, not in the primary header navigation; legal pages remain linked from the footer.
- The v1 **Marketing Surface Rhythm** keeps most sections on warm paper, uses the showcase palette for the **Showcase Teaser** **Differentiator Chapter**, surface-elevated treatment for the lighter differentiator chapters, and invert only for **Waitlist**.
- Each **Problem Perspective** uses a **Problem Perspective Visual** typographic scene (`GenericOutputStack`, `FragilePromptCollage`) in an alternating desktop split; on mobile the visual stacks above the copy.
- The **Solution Breath** uses an organic constellation layout: handwritten note above **Cultiv**, fixed subtitle below, and four asymmetric **Solution Keyword** balloons with hover or tap micro-copy — not a rigid orbit or SaaS chip row.
- The v1 differentiators area uses one vertically pinned scroll stack on desktop (`useDifferentiatorChapters`) with hierarchical chapter durations; mobile degrades to static stacked chapters with section reveal only.
- The v1 **Marketing Use Case** row uses a three-column editorial triptych with format badges and no background imagery, matching the bordered catalog pattern rather than Chromia-style image cards.
- The **Marketing Product Flow** section uses a vertical **BotanicalStem** connector with five **Flow Steps** on desktop and a simplified stem variant on mobile.
- The v1 **Marketing Hero** and site header use one primary waitlist CTA (`Button`) plus one editorial text link to the problem section; the header does not use a second bordered secondary button.
- v1 marketing implementation adds `ButtonLink` to `packages/ui` for anchor CTAs; section compositions, scroll chapters, and typographic scenes remain in `apps/web`.
- The v1 **Marketing Social Proof** block uses centered editorial copy only — no framed card, metric, or dark background treatment.
- The v1 **Product Showcase** SEO title follows `Cultiv — {headline}` (locale equivalent of *Textos que soam como você.*); meta description aligns with the fixed hero subheadline and **Waitlist** call to action, not the retired scale/authenticity rotating slogan.
- The v1 **Marketing Hero** animates the headline with word-by-word reveal, subheadline and CTAs in a staggered fade-up, and keeps botanical tree draw plus falling leaves; the scroll cue is removed.
- The v1 **Product Showcase** ships **Marketing Locale** copy in Portuguese and English in the same delivery; both locales share the same section structure and messaging, not a partial English surface.
- The v1 **Marketing Surface** ships with core motion only: smooth scroll, section reveals, staggered showcase entries, and subtle hovers; richer motion may follow after launch.
- The v1 **Client Runtime Model** uses Effect-TS at service and API boundaries while React remains idiomatic in UI; the authenticated app may later adopt full Effect layers across UI and services.

## Example dialogue

> **Dev:** "Does the **Sync Run** need its own logic for voice matching?"
> **Domain expert:** "No. The **Sync Run** and **Async Run** should share the same **Runtime Base** and **Text Quality** pipeline; only the execution path differs."

> **Dev:** "If a **Quality Lane** produces two strong **Candidates**, do we keep both?"
> **Domain expert:** "No. **Text Quality** selects one output, but the other candidates stay in trace so we can audit why the chosen text won."

## Flagged ambiguities

- "style" was used to mean both a temporary prompt hint and the durable **Voice Profile**. In this repository, the durable term is **Voice Profile**.
- "voice preset" was used to mean both **Content Type Format Preset** and authorial reasoning rules. In this repository, format presets carry structure only; **Reasoning Signature** is author-derived and separate from **Content Type**.
- "job" was used to mean both a persisted execution and any background action. In this repository, **Job** means the persisted execution instance.
- "flow" was used to mean both a product pipeline and an operational path. In this repository, **Pipeline** is the product workflow and **Sync Run** / **Async Run** are the execution paths.
- "public API" was used to mean both the backend HTTP surface and the frontend SDK. In this repository, **Public API Surface** means the backend HTTP surface and **Client Integration Surface** means the `client-sdk`.
- "auth in the SDK" was used to mean both token-aware transport and full identity flow ownership. In this repository, the **Client Integration Surface** owns authenticated backend consumption, while platform identity integrations own signup, signin, redirect, and session-establishment flows.
- "SDK method" was used to mean both a domain capability and a raw route wrapper. In this repository, the **Client Integration Surface** is organized around product capabilities, while backend routes remain an implementation detail of the **Public API Surface**.
- "async status" was used to mean both user-visible execution tracking and backend queue mechanics. In this repository, frontend consumers talk about **Executions** and **Execution History**; **Job** remains backend-internal orchestration language.
- "notification" was used to mean both active-session completion feedback and external delivery. In this repository, **Completion Notification** means active-session feedback; push, email, and WhatsApp are future separate delivery capabilities.
- "result page" was used to mean both the primary async reading experience and a dedicated route for every generation. In this repository, async completion is surfaced through the **Active Execution List** plus **Execution Result View**; a dedicated `/app/generate/$executionId` route is reserved for **Sync Run** validation and operational debugging, not the default async reading path.
- "watch" was used to mean both transport-level event streaming and product-level execution observation. In this repository, **Execution Watch** means the product capability exposed by the **Client Integration Surface**.
- "execution update" was used to mean both a raw payload refresh and a meaningful lifecycle change. In this repository, **Execution Transition** means the typed lifecycle change exposed by the **Client Integration Surface**.
- "reconnect handling" was used to mean both SDK-owned observation resilience and screen-specific retry UX. In this repository, **Execution Watch Resilience** belongs to the **Client Integration Surface**; the UI only reacts once bounded observation recovery has failed.
- "resume generation" was used to mean both re-opening a screen and reattaching to an existing async execution. In this repository, **Execution Resume** means reattaching to the existing execution through the **Client Integration Surface**.
- "execution key" was used to mean both canonical execution identity and client deduplication input. In this repository, **Execution Identity** means the canonical execution id; idempotency keys remain optional request-level deduplication inputs.
- "SDK state" was used to mean both domain-aware client behavior and application-owned cache/store. In this repository, **Client State Boundary** keeps SDK semantics separate from app state ownership.
- "frontend support" was used to mean both compatibility with one chosen framework and neutrality across client stacks. In this repository, **Framework-Agnostic Client** means the SDK core must not depend on Next.js, React-specific adapters, or any single UI framework.
- "same monorepo" was used to mean both co-development convenience and permission to break client contracts freely. In this repository, **Client Contract Versioning** means same-repo development does not remove compatibility discipline.
- "fallback" was used to mean both transport recovery and contract compatibility lenience. In this repository, **Client Contract Failure** means contract drift fails fast; fallback applies only to bounded observation and transport recovery paths.
- "SDK root" was used to mean both one canonical client boundary and many independent factories. In this repository, **Client Surface Root** means one aggregated SDK entry point with domain subclients.
- "nested SDK API" was used to mean both domain grouping and deep method trees. In this repository, **Flat Domain Methods** means domain grouping is allowed, but primary capabilities stay at the first method level.
- "method arguments" was used to mean both extensible named inputs and ad hoc positional parameters. In this repository, **Named Method Inputs** means all public SDK methods accept one named input object.
- "SDK response" was used to mean both decoded backend contracts and client-invented wrapper envelopes. In this repository, **Decoded Domain Outputs** means the SDK returns decoded contract payloads directly unless the capability itself defines a richer semantic shape.
- "watch control" was used to mean both implicit callback lifetime and explicit observation ownership. In this repository, **Observation Handle** means long-lived observation returns an explicit control object.
- "watch handle" was used to mean both minimal teardown control and a local read model. In this repository, **Minimal Observation Handle** means the v1 handle exposes only `stop()`.
- "watch callbacks" was used to mean both a single domain event stream and many event-specific hooks. In this repository, **Unified Transition Callback** means `Execution Watch` uses one required callback for lifecycle transitions.
- "watch failure" was used to mean both a failed execution and a failed observation channel. In this repository, **Observation Failure Boundary** means execution failure stays in **Execution Transition** while observation failure uses its own channel.
- "wishlist" was used to mean both a saved-items list and pre-launch interest capture. In this repository, **Waitlist** means early-access signup; a saved-items list is not part of v1 web scope.
- "landing page" was used to mean both the full **Marketing Surface** and any single marketing route. In this repository, **Product Showcase** is the primary editorial page and **Marketing Surface** is the broader unauthenticated web layer.
- "showcase page" was used to mean both one scroll experience and a multi-route marketing site. In v1, the **Product Showcase** is one scroll page with anchored sections; additional marketing routes are limited to legal pages.
- "i18n" was used to mean both developer-facing glossary language and visitor-facing **Marketing Locale**. In this repository, **Marketing Locale** is the public bilingual surface; internal domain terms in `CONTEXT.md` stay in English for engineering consistency.
- "AI Writing Engine" was used to mean both the internal repository concept and the public product brand. In this repository, **Cultiv** is the public product name; "AI writing engine" remains an internal description of what the system does.
- "idempotency key" was used to mean both a client-provided deduplication token and an SDK-internal retry safety mechanism. In this repository, the **Client Integration Surface** auto-generates `idempotencyKey` for every mutating request; consumers do not pass or manage it directly.
