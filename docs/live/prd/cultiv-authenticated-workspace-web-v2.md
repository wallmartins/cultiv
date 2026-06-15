---
title: PRD - Cultiv Authenticated Workspace (Web v2)
doc_type: prd
status: ready-for-agent
domain: authenticated-workspace
last_updated: 2026-06-12
---

# PRD: Cultiv Authenticated Workspace (Web v2)

## Problem Statement

Cultiv already has a public **Marketing Surface** that explains the product and captures **Waitlist** interest, and a production **Public API Surface** with **Client Integration Surface** (`client-sdk`) for generation, voice, preview, and execution history. **End Users** who receive early access still cannot complete the core product loop in the browser: teach their voice with **Voice Examples**, submit a structured **Generation Request**, observe **Async Run** progress without losing context, and review past output in **Execution History**.

The team needs the **Authenticated Workspace** — protected routes under `/app/*` in `apps/web` — without expanding scope into marketing redesign, self-service billing checkout, file-based **Imported Context**, or the **Operational API Surface**. The experience must feel continuous with phase 1 (**Design System**, **Brand Tone**, bilingual reach) while honoring domain boundaries: Auth0 owns sign-up and sign-in; the backend owns **Application User** provisioning; the SDK owns transport and **Execution Watch** semantics.

Without this release, Cultiv cannot validate the full writing loop with real users, cannot prove async generation UX in production, and cannot close the narrative promised on the **Product Showcase** (*teach voice → brief → generate*).

## Solution

Ship the Cultiv **Authenticated Workspace** as a bilingual web application ( **App Locale**: pt-BR and en) inside the existing TanStack Start app, composed of:

1. **Auth0** Universal Login and protected `/app/*` routes.
2. **App Shell** with three primary destinations (Generate, History, Voice), **CreditDisplay** in the header, and an **Active Execution List** for in-flight **Async Runs**.
3. **Onboarding** (two skippable steps) reusing the real **Voice Example Composer**.
4. **Generation Screen** with dynamic **Briefing Form** per **Content Type**, optional collapsed **Imported Context Field** (paste-only), **Quality Mode Presentation**, and debounced **Generation Preview**.
5. Async-first generation: after `executions.create`, the user stays free to navigate; **Execution Watch** drives list status, **Completion Notification**, and an **Active Execution Drawer** for quick reading.
6. **Execution History** list and **Execution History Detail** for durable review and regenerate.
7. **Voice Dashboard**, examples list, and shared **Voice Example Composer** (single-create or batch by slot count).
8. **Account Settings Screen** (avatar menu): read-only email, **App Locale**, **Voice Training Consent** review/revocation when API exists, logout.

All backend access goes through `@my-ai-orchestrator/client-sdk` only. **Billing Surface** routes are deferred to the release immediately after web v2; until then, credit balance is shown via cached **Generation Preview** data.

## User Stories

### Access and first run

1. As an **End User**, I want to sign in with Auth0, so that I can access my personal workspace securely.

2. As an **End User** on first login with no **Voice Examples** and incomplete onboarding, I want to land on **Onboarding**, so that I am guided before generating.

3. As an **End User** returning with examples or completed onboarding, I want to land on the **Generation Screen**, so that I can start working immediately.

4. As an **End User**, I want the authenticated app in Portuguese or English from day one, so that it matches my **Marketing Locale** expectation without `/en` route prefixes in `/app/*`.

### Onboarding and voice teaching

5. As an **End User**, I want onboarding step 1 to use the same **Voice Example Composer** as voice management, so that I learn the real ingestion flow.

6. As an **End User**, I want to add one example and submit, or add multiple slots and submit as a batch, so that ingestion matches how much material I have ready.

7. As an **End User**, I want to skip onboarding steps, so that I am not blocked from trying generation.

8. As an **End User** who skipped voice teaching, I want a reminder on the **Generation Screen**, so that I am nudged to improve **Voice Confidence** later.

9. As an **End User**, I want onboarding step 2 to confirm **Voice Confidence** and available credits before I generate, so that I understand readiness.

10. As an **End User**, I want to grant **Voice Training Consent** before my first example is stored, so that voice ingestion is explicit.

### Generation

11. As an **End User**, I want to pick any catalog **Content Type** and see unavailable formats disabled with a reason, so that I understand plan limits without hidden formats.

12. As an **End User**, I want a **Briefing Form** that changes fields per **Content Type**, so that I provide the right structure for blog, LinkedIn, thread, and other formats.

13. As an **End User**, I want contextual briefing guidance (tips, example, common mistakes), so that I can write a better brief without leaving the screen.

14. As an **End User**, I want to optionally paste external reference text in a collapsed field, so that I can ground generation in notes or articles without file upload.

15. As an **End User**, I want to choose among three quality modes with product-friendly labels (Direto/Light, Equilibrado/Balanced, Afinado/Polished), so that I understand refinement level without backend jargon.

16. As an **End User**, I want an automatic **Generation Preview** showing credit price and projected balance, so that I know the cost before confirming.

17. As an **End User**, I want to start generation and continue using the app, so that I am not forced to stare at a progress screen.

18. As an **End User**, I want in-flight generations listed with live status, so that I can track multiple **Async Runs**.

19. As an **End User**, I want a **Completion Notification** when a generation finishes while I am elsewhere, so that I know my text is ready.

20. As an **End User**, I want to open a finished generation in a drawer for quick reading, or open the full history detail, so that I can choose depth vs speed.

21. As an **End User**, I want safety and validation errors explained clearly when preview or generation is blocked, so that I can fix briefing or reference material.

### History

22. As an **End User**, I want a paginated **Execution History**, so that I can find past generations.

23. As an **End User**, I want to filter history by period, status, and **Content Type**, so that I can narrow results.

24. As an **End User**, I want a detail page per execution with copy and regenerate actions, so that I can reuse successful work.

### Voice management

25. As an **End User**, I want a **Voice Dashboard** showing **Voice Confidence**, diagnostics, and format coverage, so that I understand how well the system knows my voice.

26. As an **End User**, I want to list, create, and edit **Voice Examples**, so that I can improve my **Derived Voice Profile** over time.

### Settings

27. As an **End User**, I want to change **App Locale** in settings, so that UI copy updates without re-authenticating.

28. As an **End User**, I want to review and revoke **Voice Training Consent** when supported, so that I control stored voice material.

29. As an **End User**, I want to sign out from settings, so that I can end my session on shared devices.

### Engineering and governance

30. As a **frontend engineer**, I want all product API access through `client-sdk`, so that governance rules remain satisfied.

31. As a **frontend engineer**, I want Effect layers at service boundaries (Runtime Model B), so that SDK orchestration is typed and testable.

32. As a **frontend engineer**, I want TanStack Query for server state, so that cache and mutations stay predictable.

33. As a **frontend engineer**, I want screen-level specs and typed i18n namespaces, so that implementation slices are unambiguous.

34. As a **product owner**, I want the **Marketing Surface** unchanged in this release, so that launch risk stays isolated to the authenticated loop.

## Implementation Decisions

### Scope boundaries

| In v2 | Deferred (post-v2 or later) |
|-------|-----------------------------|
| `/app/*` **Authenticated Workspace** | **Billing Surface** (`/app/billing`, wallet SDK, ledger) |
| Auth0 + `client-sdk` | File upload for **Imported Context** |
| Async-first **End User** generation | **Sync Run** as default user path |
| **Active Execution List** + drawer + toast | Push/email/WhatsApp delivery |
| Paste-only **Imported Context** (≤8k chars) | Marketing Surface redesign |
| Credit balance via **Generation Preview** cache | Self-service payments |
| Settings: locale, consent placeholder | Full consent revocation API (wire when ready) |
| `/app/generate/$executionId` for ops/debug sync | **Operational API Surface** in web |

### Major modules

| Module | Responsibility |
|--------|----------------|
| **App Shell** | Header, sidebar/bottom nav, **CreditDisplay**, **Active Execution List**, avatar menu |
| **Auth boundary** | Auth0 provider, route guard, callback, smart post-login redirect |
| **SDK runtime** | `createClientSdk`, Effect layers, `getToken` from Auth0 |
| **Generation module** | Content types, dynamic briefing, preview debounce, quality modes, create execution |
| **Execution observation** | Watch handles, list store, drawer, **Completion Notification** |
| **History module** | List, filters, detail, regenerate navigation state |
| **Voice module** | Dashboard, examples list, **Voice Example Composer**, consent modal |
| **Onboarding module** | Two-step flow, skip flags, **ReminderBanner** |
| **Settings module** | Locale persistence, identity read-only, logout |
| **Message catalog (app i18n)** | `app.*` namespaces pt/en + field-label overlays |
| **Error mapper** | `ApiErrorCode` → user-facing copy |

### Architecture

```
React UI (apps/web/routes/app/*)
  → TanStack Query
  → lib/services/ (Effect)
  → client-sdk (preview, executions, voice, contentTypes)
  → Public API Surface
```

Auth0 owns sign-up/sign-in; SDK is authenticated consumer only ([ADR 0021](../../archive/adr/0021-auth0-owns-signup-and-signin-backend-owns-domain-onboarding.md), [ADR 0028](../../archive/adr/0028-client-sdk-as-client-integration-surface.md)).

### Routing

See [`web-v2-platform-structure.md`](../plan/web-v2-platform-structure.md). No `/app/billing` in v2. Settings only via avatar menu.

### Generation UX (async-first)

- `executions.create` → enqueue **Async Run** → add to **Active Execution List** → user remains on current route.
- `executions.watch` per in-flight id; `ObservationHandle.stop()` on unmount.
- Terminal states: drawer (quick) + `/app/history/$executionId` (full).
- **Sync Run** result route `/app/generate/$executionId` reserved for operational validation, not default **End User** flow.

### Quality Mode Presentation

| API value | pt-BR | en |
|-----------|-------|-----|
| `fast` | Direto | Light |
| `balanced` | Equilibrado | Balanced |
| `strict` | Afinado | Polished |

Shared helper copy: all modes preserve the user's voice; difference is refinement level.

### Voice Example Composer

- Shared across onboarding step 1, `/app/voice/examples/new`, and edit (single slot).
- 1 filled slot on submit → `voice.createExample`.
- 2+ filled slots → `createBatch` → `addBatchItems` → `commitBatch`.
- **Voice Training Consent** modal before first persist.

### Onboarding

- Step 1: **Voice Example Composer** (skippable → voice **ReminderBanner**).
- Step 2: **Onboarding Welcome Step** — confidence, credits, CTA to **Generation Screen**.
- No separate global tone-preferences step (tone derived from examples).
- **Onboarding Completion**: local persistence v2; backend flag when available.

### Credits in header

- `useCreditBalance()` from minimal `preview.get` cached under `['creditBalance']`.
- Invalidated after `executions.create` and on app focus.
- Replaced by `client.billing.getWallet()` when **Billing Surface** ships.

### Screen specifications

Detailed wireframes, states, validation, and i18n keys: [`web-v2-screen-specs.md`](../plan/web-v2-screen-specs.md).

### Milestones (delivery order)

1. **M1** — Auth + SDK foundation
2. **M2** — App shell + **Active Execution List** shell + **CreditDisplay**
3. **M3** — **Generation Screen** (briefing, preview, quality modes, async create)
4. **M4** — Execution UX (watch, drawer, notifications, history + detail)
5. **M5** — Voice (dashboard, composer, examples)
6. **M6** — Onboarding + settings
7. **M7** — i18n completeness, tests, governance, responsive QA

Implementation task breakdown: [`phase-2-implementation-plan.md`](../plan/phase-2-implementation-plan.md).

## Acceptance Criteria

Web v2 is complete when:

- [ ] Auth0 login works; `/app/*` is protected; smart redirect to onboarding or generate works.
- [ ] `client-sdk` is the only backend integration; governance test passes.
- [ ] **Generation Screen** supports all catalog content types, dynamic briefing, imported context paste, quality modes with product labels, debounced preview, and async create without forced navigation.
- [ ] **Active Execution List** shows in-flight and recent runs; watch updates status; **Completion Notification** fires on complete.
- [ ] **Active Execution Drawer** opens finished text; link opens **Execution History Detail**.
- [ ] **Execution History** list + detail + regenerate prefills generate screen where data allows.
- [ ] **Voice Dashboard**, examples CRUD, and shared composer (single + batch) work with consent gate.
- [ ] **Onboarding** two steps skippable with voice reminder banner.
- [ ] **Account Settings**: email, **App Locale**, consent section (revoke disabled until API), logout.
- [ ] App shell: sidebar desktop, bottom nav mobile, credits in header.
- [ ] **App Locale** pt-BR and en for all app strings and error mapping.
- [ ] Effect service layers for SDK domains; integration tests with mocked transport.
- [ ] **Billing Surface** routes are **not** required for this release.

## Testing Decisions

### What makes a good test

- Assert observable behavior at module boundaries, not implementation details.
- Given invalid briefing → generate disabled; given preview success → price and balance shown.
- Given `executions.create` success → list item appears; given `completed` transition → notification enqueued.
- Given 1 composer slot → `createExample` called; given 2+ → batch path.
- Governance: no forbidden HTTP patterns in `apps/web` source.

### Modules to test

| Module | Priority |
|--------|----------|
| Preview debounce service | Required |
| Execution watch service (handle lifecycle) | Required |
| Voice composer submit routing (single vs batch) | Required |
| SDK error mapper (`ApiErrorCode`) | Required |
| App i18n key parity pt/en | Required |
| Briefing form validation per `inputSchema` | Recommended |
| Onboarding redirect rules | Recommended |
| E2E login → onboard → generate → drawer | Recommended |

### Prior art

- `tests/governance/frontend-client-boundary.test.ts`
- `packages/client-sdk` contract and watch tests
- Phase 1 waitlist Effect service tests

## Out of Scope

- **Billing Surface** pages, wallet endpoint, ledger history, top-up/checkout
- **Marketing Surface** changes beyond auth entry CTAs if needed
- File upload, HTML import, or rich **Imported Context** formats
- **Sync Run** as default **End User** path
- Mobile app (`apps/mobile`)
- Push, email, or external **Completion Notification** delivery
- Dark mode in authenticated app (optional polish; not blocking)
- **Operational API Surface** or admin tooling in web
- Backend features not exposed on **Public API Surface** today (billing wallet, consent revoke, onboarding flag) — track as post-v2 dependencies

## Further Notes

- Parent implementation plan: [phase-2-implementation-plan.md](../plan/phase-2-implementation-plan.md)
- Platform structure: [web-v2-platform-structure.md](../plan/web-v2-platform-structure.md)
- Per-screen specs: [web-v2-screen-specs.md](../plan/web-v2-screen-specs.md)
- Domain glossary: [CONTEXT.md](../../../CONTEXT.md)
- Auth ADRs: [0021](../../archive/adr/0021-auth0-owns-signup-and-signin-backend-owns-domain-onboarding.md), [0028](../../archive/adr/0028-client-sdk-as-client-integration-surface.md)
- **Post-v2 immediate follow-up:** PRD slice for **Billing Surface** (wallet SDK + `/app/billing` + header balance source migration)
