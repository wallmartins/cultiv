---
title: PRD - Client SDK as the Client Integration Surface
doc_type: prd
status: active
domain: client-integration-surface
last_updated: 2026-06-03-refined
---

# PRD: Client SDK as the Client Integration Surface

## Problem Statement

The project already has a backend **Public API Surface** for product-facing
generation, preview, voice, and history workflows, but the current
`client-sdk` still reflects an older route language centered on pipelines and
jobs. That leaves the repository in an awkward middle state: the backend is
evolving toward product capabilities, while the client layer still exposes a
lower-level integration model that does not match the intended frontend
experience.

From the product perspective, future web and mobile applications should not
need to understand backend route semantics, SSE wiring, retry behavior, or the
difference between legacy public routes and the active product surface. They
should consume one stable **Client Integration Surface** that speaks in product
capabilities such as **Generation Preview**, **Execution History**,
**Execution Watch**, **Execution Resume**, **Voice Profile**, and **Content
Type**.

From the engineering perspective, the repository needs a stable and
framework-agnostic client boundary that:

- is the only frontend-owned layer allowed to consume the backend **Public API
  Surface**
- receives authentication tokens from platform-owned identity integrations
  without owning signup, signin, redirect, or session-establishment flows
- fails fast when backend responses no longer match the expected client
  contract
- keeps transport resilience and execution observation inside the SDK instead
  of spreading them across web and mobile apps
- prevents `apps/web` and `apps/mobile` from drifting into direct backend HTTP
  integrations
- removes `/api/pipelines` and `/api/jobs` from the public product contract so
  the frontend language stays centered on **Executions**, not backend **Job**
  mechanics

Without this boundary, the system risks accumulating duplicated client logic,
framework-specific integration choices in the wrong layer, inconsistent error
handling, and a permanent split between the product-oriented backend and the
legacy SDK surface.

## Solution

Turn `packages/client-sdk` into the canonical **Client Integration Surface**
for the project.

The target behavior is:

1. The backend **Public API Surface** remains the authenticated HTTP contract
   for **End User** workflows.
2. Web and mobile applications consume that backend only through the
   `client-sdk`.
3. The `client-sdk` remains framework-agnostic and exposes domain capabilities
   instead of raw route wrappers.
4. Platform-owned identity integrations provide tokens to the SDK, while auth
   provider orchestration remains outside the SDK.
5. The SDK exposes product capabilities for preview, content types,
   executions, execution observation, execution resume, and voice flows.
6. The SDK treats `executionId` as the canonical **Execution Identity** for
   retrieval, watch, and resume.
7. The SDK exposes **Execution Watch** as a high-level capability that hides
   SSE, reconnect, retry, and polling fallback.
8. The SDK emits typed **Execution Transitions** such as started, progressed,
   completed, and failed, instead of forcing frontend apps to diff snapshots.
9. The SDK owns bounded **Execution Watch Resilience** for observation
   recovery and only surfaces typed failures once bounded recovery is exhausted.
10. The SDK provides active-session **Completion Notification** signals through
    execution observation, but does not own external delivery such as push,
    email, or WhatsApp.
11. The SDK remains stateless by default, leaving cache, persistence, and
    screen lifecycle ownership to the consuming app.
12. The SDK is treated as a versioned artifact with explicit compatibility
    discipline, even inside the monorepo.
13. Backend contract drift triggers explicit typed client failure instead of
    silent fallback behavior.
14. Legacy `/api/pipelines` and `/api/jobs` routes are removed from the public
    product client contract and cleaned up from the backend once replacement
    product capabilities are complete.

This solution keeps the frontend language aligned with the glossary and ADRs,
keeps the backend in control of product semantics, and creates a stable base
for future web and mobile work without binding that work to Next.js or any
other specific UI stack.

## User Stories

1. As an **End User**, I want the app to request text generation through
   product capabilities instead of pipeline internals, so that the product
   feels simple and intentional.
2. As an **End User**, I want the app to show a **Generation Preview**, so
   that I understand cost, allowed options, and recommendation before I
   confirm generation.
3. As an **End User**, I want to start generation from the app and receive a
   canonical execution identity back, so that the request is easy to revisit.
4. As an **End User**, I want to leave the generation screen and return later,
   so that long-running **Async Runs** do not trap me in one screen.
5. As an **End User**, I want the app to resume tracking my execution after I
   navigate away and back, so that I do not lose the generation flow.
6. As an **End User**, I want to see progress updates while a generation is
   still running, so that the product feels alive rather than stalled.
7. As an **End User**, I want a **Completion Notification** while the app is
   active, so that I know the text is ready without manually refreshing.
8. As an **End User**, I want to open the generated result from the execution
   once it is done, so that the async flow leads back to usable content.
9. As an **End User**, I want failed executions to surface clearly in the app,
   so that I know the generation did not finish.
10. As an **End User**, I want my **Execution History** to list current and
    past runs, so that I can revisit previous work.
11. As an **End User**, I want **Execution History** to hide backend queue
    mechanics, so that I interact with generation results instead of system
    implementation details.
12. As an **End User**, I want **Content Types** to come from one canonical
    client capability, so that the app reflects what the backend actually
    allows.
13. As an **End User**, I want the app to retrieve my **Voice Profile**
    through the same client surface as other product flows, so that the
    experience feels consistent.
14. As an **End User**, I want to list, create, and update **Voice Examples**
    without frontend-specific HTTP wiring, so that voice onboarding is reliable.
15. As an **End User**, I want voice batch flows to work through the same
    client layer, so that bulk example submission behaves consistently.
16. As an **End User**, I want authentication failures to appear clearly, so
    that I know when I need to re-establish my session.
17. As an **End User**, I want malformed or incompatible responses to fail
    clearly, so that the app does not behave unpredictably.
18. As an **End User**, I want the app to behave consistently across web and
    mobile, so that product semantics do not drift by platform.
19. As a product designer, I want the frontend language to match product
    concepts like **Generation Preview** and **Execution History**, so that UX
    and backend semantics stay aligned.
20. As a product designer, I want async generation to support a “request now,
    revisit later” experience, so that long-running generations feel natural.
21. As a product manager, I want the SDK to be the only approved client access
    path, so that product behavior stays consistent across clients.
22. As a product manager, I want the SDK to expose product capabilities rather
    than route names, so that backend evolution does not leak into UI planning.
23. As a product manager, I want the SDK to remain framework-agnostic, so that
    the team can adopt TanStack-based web stacks without redesigning backend
    integration.
24. As a product manager, I want web and mobile to share the same domain
    semantics, so that future product work does not fork by platform.
25. As a product manager, I want the SDK not to own external push or email
    delivery in v1, so that generation can ship without blocking on a separate
    notification domain.
26. As a platform engineer, I want the backend **Public API Surface** to stay
    the source of truth, so that the SDK remains a client boundary rather than
    a second backend.
27. As a platform engineer, I want the SDK to consume tokens from platform
    identity integrations, so that Auth0 orchestration remains outside the SDK.
28. As a platform engineer, I want the SDK not to own signup, signin, redirect,
    or session-establishment flows, so that identity provider concerns stay in
    the right boundary.
29. As a platform engineer, I want the SDK to expose typed transport and decode
    errors, so that failures are diagnosable and predictable.
30. As a platform engineer, I want contract incompatibilities to fail fast, so
    that backend drift is discovered immediately.
31. As a platform engineer, I want transport resilience and polling fallback to
    stay inside the SDK, so that web and mobile do not each reinvent them.
32. As a platform engineer, I want `executionId` to be the only canonical
    execution identity, so that resume and observation semantics stay simple.
33. As a platform engineer, I want `idempotencyKey` to remain separate from
    **Execution Identity**, so that deduplication does not pollute retrieval
    semantics.
34. As a platform engineer, I want **Execution Watch** to be high-level, so
    that apps do not depend on EventSource or backend event packet details.
35. As a platform engineer, I want **Execution Watch** to emit typed
    **Execution Transitions**, so that frontend apps can react to meaningful
    lifecycle changes directly.
36. As a platform engineer, I want observation failure to surface only after
    bounded recovery is exhausted, so that transient transport issues do not
    immediately leak into the UI.
37. As a platform engineer, I want the SDK to stay stateless by default, so
    that app-owned caching and lifecycle logic remain decoupled from transport.
38. As a platform engineer, I want app teams to remain free to use TanStack
    Query or other state layers on top of the SDK, so that backend integration
    does not force one client architecture.
39. As a platform engineer, I want the SDK public API to be organized by
    domains such as preview, executions, content types, and voice, so that the
    interface is deep and stable.
40. As a platform engineer, I want the backend and SDK to follow explicit
    client contract versioning discipline, so that monorepo co-location does
    not justify breaking changes.
41. As a backend engineer, I want legacy `/api/pipelines` and `/api/jobs` to
    be excluded from the product client contract, so that the frontend language
    does not preserve obsolete boundaries.
42. As a backend engineer, I want those legacy routes removed once the SDK and
    product surface are complete, so that the repository no longer supports two
    competing public models.
43. As a backend engineer, I want backend docs to describe the product-facing
    routes as canonical, so that future work starts from the correct boundary.
44. As a backend engineer, I want execution event contracts to be explicit, so
    that the client does not infer watch semantics from backend internals.
45. As a backend engineer, I want the SDK to reuse shared contracts rather than
    redefining payloads ad hoc, so that drift remains visible in one place.
46. As a backend engineer, I want direct backend calls from `apps/web` and
    `apps/mobile` to fail governance checks, so that the client boundary is
    enforceable.
47. As a QA engineer, I want contract tests for every product client capability,
    so that request and response shapes stay trustworthy.
48. As a QA engineer, I want tests to validate external behavior rather than
    implementation details, so that refactors do not cause false regressions.
49. As a QA engineer, I want execution watch tests to cover completion, failure,
    reconnect, and polling fallback, so that async observation is reliable.
50. As a QA engineer, I want governance tests to catch frontend bypass of the
    SDK, so that architecture drift is blocked before merge.
51. As a future web app maintainer, I want to build with TanStack-based tools
    without rewriting backend integration semantics, so that framework choice
    stays flexible.
52. As a future mobile app maintainer, I want to consume the same SDK surface
    as web, so that cross-platform product behavior stays aligned.
53. As a future SDK maintainer, I want the core to remain UI-framework neutral,
    so that optional adapters can be added later without contaminating the
    domain boundary.
54. As a future SDK maintainer, I want the SDK to remain a deep module with a
    small public surface and rich internal behavior, so that it is easy to test
    and hard to misuse.

## Implementation Decisions

- The `client-sdk` becomes the project's **Client Integration Surface** and is
  the only frontend-owned layer allowed to know backend transport details.
- The backend **Public API Surface** remains the authenticated HTTP boundary
  for **End User** workflows.
- Web and mobile applications must not call the backend directly; they consume
  backend workflows only through the SDK.
- The SDK public API is organized around product capabilities, not raw route
  wrappers.
- The core SDK modules will center on `preview`, `contentTypes`, `executions`,
  `voice`, transport, and typed errors.
- The SDK exposes a dual API: Effect primary (`Effect.Effect`) with a root
  `toPromise` helper for non-Effect consumers.
- The SDK remains framework-agnostic and must not depend on Next.js,
  React-specific adapters, or any single UI framework.
- The SDK remains stateless by default; app-owned cache, persistence, and
  screen lifecycle remain outside the core SDK.
- Platform identity integrations provide tokens to the SDK; the SDK does not
  own signup, signin, redirect, or session-establishment flows.
- The SDK continues to inject bearer tokens into backend requests through a
  transport abstraction.
- `executionId` is the canonical **Execution Identity** for retrieval, watch,
  and resume.
- `idempotencyKey` is auto-generated by the SDK for every mutating request;
  consumers do not pass or manage it directly. It is not a substitute for
  canonical execution identity.
- **Execution Watch** is exposed as a product capability rather than a raw
  transport API.
- **Execution Watch** emits typed **Execution Transitions** such as started,
  progressed, completed, and failed, optionally with the latest execution
  snapshot.
- **Execution Watch Resilience** stays inside the SDK and handles reconnect,
  retry, and polling fallback within bounded rules: max 5 SSE reconnect
  attempts, fallback to polling every 5 seconds, max 12 polling failures,
  total observation timeout of 10 minutes.
- **Completion Notification** in v1 is an active-session client capability
  derived from execution observation, not a persisted or external delivery
  domain.
- Push, email, WhatsApp, or any other external delivery mechanism is out of
  scope for this PRD and belongs to a future separate capability.
- The SDK and backend follow **Client Contract Versioning** discipline even
  though they live in the same monorepo.
- The SDK must fail fast with typed incompatibility errors when backend
  responses drift from the expected contract.
- Shared contracts remain the typed source of truth for client-facing request,
  response, and execution event payloads.
- The backend product-facing client contract centers on preview, content types,
  executions, execution events, and voice workflows.
- Legacy `/api/pipelines` and `/api/jobs` routes are excluded from the product
  client contract, must not appear as first-class SDK capabilities, and should
  be removed from the public product surface during backend cleanup.
- Governance checks should prevent `apps/web` and `apps/mobile` from bypassing
  the SDK with direct backend HTTP calls through lint rules and architectural
  tests.
- The design should favor deep modules with small public surfaces, especially
  in transport, execution watch, typed error classification, and voice/workflow
  capability composition.
- Every public method accepts `signal?: AbortSignal` for request cancellation.
- Differentiated retry policy: GET requests retry up to 3 times on 429/5xx;
  POST/PATCH requests retry up to 2 times on 429/503/504 only (safer for
  mutating requests with auto-generated idempotency keys).

## Testing Decisions

- Good tests validate external behavior, contract semantics, lifecycle
  outcomes, and governance boundaries rather than private implementation
  details.
- The SDK transport layer should be tested for auth header injection, request
  shaping, response decoding, error classification, and fail-fast contract
  mismatch handling.
- Product capability modules should be tested for their public interfaces:
  preview, content types, executions, execution watch/resume, and voice flows.
- **Execution Watch** tests should cover typed transition emission, completion,
  failure, reconnect behavior, and polling fallback behavior.
- Contract tests should cover request and response schemas for every product
  client capability, including explicit invalid payload cases.
- Backend tests should cover the canonical public product surface and the
  removal of legacy public pipeline/job assumptions.
- Governance tests should prevent direct backend access from frontend apps and
  preserve the SDK as the only approved client boundary.
- Prior art in the current codebase includes existing contract tests, client
  SDK tests, backend surface tests, async execution tests, and monorepo
  governance tests that already enforce architectural boundaries.

## Out of Scope

- External notification delivery such as push, email, SMS, or WhatsApp.
- A persisted notification inbox or notification preference model.
- Auth0 signup, signin, redirect, MFA, or session-establishment orchestration
  inside the SDK.
- Framework-specific SDK adapters for Next.js, React, TanStack Query, Zustand,
  Expo, or any other UI stack in the core v1 surface.
- SDK-owned frontend cache stores, persistence layers, or screen-lifecycle
  containers.
- Operational or internal backend surfaces that are not part of the **End
  User** product contract.
- Reintroducing pipeline/job language as first-class client-facing concepts.

## Further Notes

- This PRD follows the glossary decisions in `CONTEXT.md`, especially
  **Client Integration Surface**, **Execution Watch**, **Execution Resume**,
  **Execution Identity**, **Framework-Agnostic Client**, **Client Contract
  Versioning**, and **Client Contract Failure**.
- This PRD follows [ADR 0026](../adr/0026-typescript-native-client-sdk-as-primary-consumer.md)
  and [ADR 0028](../adr/0028-client-sdk-as-client-integration-surface.md).
- The auth ownership direction in [ADR 0005](../adr/0005-auth-in-client-sdk.md)
  should be updated or superseded in the live documentation set so future
  readers do not assume the SDK owns signup/signin flows.
- The implementation plan paired with this PRD lives in
  [docs/archive/plans/client-sdk-and-backend-cleanup-plan.md](/home/wallacem/Projects/content-lib/docs/archive/plans/client-sdk-and-backend-cleanup-plan.md:1).
- The complete SDK design document with API shapes, transport behavior, error
  taxonomy, and contract alignment lives in
  [docs/archive/designs/client-sdk-design.md](/home/wallacem/Projects/content-lib/docs/archive/designs/client-sdk-design.md:1).
