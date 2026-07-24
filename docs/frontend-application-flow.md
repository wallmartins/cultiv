# Frontend Application Flow & Screens

> **Context:** This document details the user flow and screen specifications for the Cultiv authenticated workspace (`/app/*`), based on the frontend-backend contracts and ADR 0003 (stack/architecture). The **generation flow (Screen 1) follows ADR 0004** — theme-first guided. The **shell and secondary routes (navigation, history, voice, calibration, settings) follow ADR 0005** — ChatGPT-like workspace — which supersedes the earlier per-screen design and **removes the Active Execution Drawer**. **Billing, plans and the free trial follow ADR 0006** — no free plan; a 7-day / 5-generation trial is the entry tier, and generation unlocks *trial-limited* until a plan is bought.

## Architecture Overview

The Cultiv frontend is divided into three surfaces with decoupled runtimes:

| Surface | Runtime | Purpose |
|---------|---------|---------|
| Landing + public (`/`, `/en/*`, `/pricing`) | Astro (SSG/SSR) | SEO/GEO, content collections, zero JS by default |
| Authenticated workspace (`/app/*`) | Vite + React 19 + TanStack Router | Interactive application (dynamic forms, SSE, wizards, drawers) |
| Browser extension | WXT + React 19 + Manifest V3 | Sidebar/popup with generation, copies result to active page |

**Unified domain routing:** Proxy reverso (Vercel rewrites / Cloudflare) routes:
- `/*` → Astro deploy
- `/app/*` → Vite SPA deploy

## Data Layer

```
React Component
 ├─ useQuery / useMutation (TanStack)   ← cache, stale-while-revalidate
 ├─ Zustand store                       ← UI state (form, layout, filters)
 └─ hooks/use-run                       ← bridge Effect → React lifecycle
├─────────────────────────────────────────
packages/shared/services/
 └─ Effect.Service (one per SDK subclient)  ← orchestration, retry, cancellation
├─────────────────────────────────────────
packages/client-sdk                     ← HTTP, SSE, auth token, idempotency
```

**Effect-TS** manages async side effects, service composition, and automatic cancellation. **TanStack Query** manages cache, invalidation, stale-while-revalidate. **Zustand** manages synchronous UI state.

## Navigation Flow

> **Shell per ADR 0005.** ChatGPT-like: a persistent left **rail = generation history** (primary navigation) + a **center** that doubles as new-generation and generation-detail + a collapsible **voice companion** on the right. There is **no separate `/history` route** — clicking a history item loads the detail in the center. Prototype: `.scratch/rotas-secundarias-app/prototype/shell-prototype.html`.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Auth Flow (onboarding-first)             │
│  Landing → Login/Signup (Auth0) → Calibration Wizard (full-     │
│  screen, ADR 0001) → review confirms profile → welcome bridge   │
│  (voice companion open) → optional skippable tour → /app        │
│                                                                 │
│  Escape "Calibrate later": → locked workspace (demo content     │
│  marked "example" + persistent "Calibrate my voice" CTA;        │
│  generation stays locked until the wizard is completed)         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    App Shell (three columns)                    │
│  Rail (left)   ← ＋New generation · History (primary nav) ·     │
│                  "Your voice" chip · avatar menu                │
│  Center        ← new generation (ADR 0004) OR generation detail │
│                  loaded from history (same surface)             │
│  Voice widget  ← collapsible companion (voice↔text compare)     │
│                                                                 │
│  Avatar menu → /app/voice · plans & billing · /app/settings ·   │
│                sign out                                          │
│  Wizard       → /app/onboarding (full-screen 1st run; lighter   │
│                 in-workspace on re-entry)                        │
└─────────────────────────────────────────────────────────────────┘
```

## Screen Specifications

### Screen 1: Generation Screen (`/app/generate`) — theme-first guided flow

> **Flow per ADR 0004.** The user arrives with a **theme in free text** (like ChatGPT); the setup (intent, size, channel, content type) is inferred behind the scenes, and a short conversational session extracts what gives the text body and originality. This supersedes the previous intent-first design (content type selector + dynamic `inputSchema` form).

**Purpose:** Primary screen. The user types a theme, answers a short guided session, and triggers generation. Intent/content type are never surfaced.

**Data Dependencies (on mount):**

| SDK Method | Backend Route | Returns | When |
|---|---|---|---|
| `billing.getEntitlement()` | `GET /me/billing/entitlement` | `BillingEntitlementView` | On mount — show credit balance in header |

> The intent/content-type catalog no longer drives this screen. `generationIntents.list()` / the content-type `inputSchema` are not used to build the primary form (see "Content Type Catalog Structure" note below).

**Interaction model (validated via prototype):** a **conversational thread** — the theme is the first message, the guided questions arrive one at a time as they're answered/skipped, with "Generate now" always at hand. Picked over a composer-with-side-rail and a one-question-per-screen stepper (prototype `.scratch/fluxo-geracao-tema-first/prototype/flow-prototype.html`, variant A "Conversa").

**Layout:** Single centered column, ChatGPT-like. A prominent **theme field** first; the conversational questions and the (optional) channel selector appear below it; a sticky cost/preview strip sits at the bottom near "Generate".

**Flow steps:**

**Step 1 — Theme → prefill inference.** The user types the theme and submits. One call runs the inference:
```typescript
const prefill = await sdk.toPromise(
  sdk.generationPrefill.infer({
    theme: "Aprender novas tecnologias com IA acelera, mas há a falácia de só delegar o trabalho cognitivo…",
    language: "pt-BR",
  })
)
// → { prefill: { intent, scope: { lengthTier }, briefing: { topic }, language },
//     intentAmbiguity: { ambiguous, alternative? } | null,
//     detectedPlatform?: "linkedin",
//     questionPlan: [{ id, angle, prompt }, …] }
```
Target latency ~2–3s (12s hard timeout); on failure a graceful fallback (`share-idea` + default size) is used and the flow proceeds. The prefill result lives in **Zustand** — the server stays stateless.

**Step 2 — Guided conversational session.** The client walks `questionPlan` **one question at a time** (skippable). Answers accumulate in Zustand.
- If `intentAmbiguity.ambiguous`, its natural-language question (built from `intent` + `alternative`) is the **first** step, with a one-line impact note.
- Backbone angles: **thesis**, **concrete experience**, **counter-argument/tension**, **motivation** — plus 0–2 LLM-generated extras. A persuasive nudge ("the more you tell, the denser and more original the text") sits near **Generate now**, which is **always available**.

**Step 3 — Channel (optional).** A light, skippable platform selector ("Where will you publish?"). Rich platforms (LinkedIn, X, Instagram, Medium, Substack, blog, newsletter…) map to the 4 `GenerationChannel` buckets client-side; `detectedPlatform` pre-selects it when the theme named one.

**Step 4 — Assemble briefing → preview → run.** On "Generate", the client assembles the `briefing` record from the answers (theme → `topic`, thesis → `goal`, experience/counter/motivation/extras → `keyPoints[]`; skipped answers are **omitted**, never blank), optionally calls `preview` for pricing, then submits:
```typescript
const result = await sdk.toPromise(
  sdk.executions.create({
    intent: prefill.prefill.intent,               // inferred, never shown as "intent"
    scope: { lengthTier, channel },               // channel from the platform bucket (optional)
    briefing: { topic, goal, keyPoints },         // built from the session answers (ADR 0004 §5)
    language: "pt-BR",
    qualityMode: "balanced",
    quoteId: preview?.pricingSnapshot.quoteId,
    previewRecommendation: preview?.recommendation,
  })
)
```
> No `contentType` is sent: with `intent` + `scope` present, the backend derives it and ignores any client `contentType`.

**Preview (optional, for pricing/confirmation):** same `sdk.preview.get(...)` as before, driven by the inferred `intent`/`scope`. UI mapping unchanged: `pricingSnapshot.creditPrice` → cost badge; `projectedBalanceAfterGeneration` → projected balance; `recommendation` → quality-mode suggestion; `resolvedIntent.wordTargetMin/Max` → word-count guidance.

**Adjust (optional):** a discreet "Ajustar" affordance exposes **size + channel** only (content type is derived; the angle/intent is only ever changed via the ambiguity question or by regenerating).

**After Creation:**
1. Store `jobId` as `ExecutionIdentity`
2. Start `sdk.executions.watch({ executionId: jobId, onTransition })` to observe progress
3. Add job to Active Execution List

---

### Screen 2: Generation History (the rail + center detail) — ADR 0005

> **The history IS the rail** (primary navigation), not a separate `/history` route. The list lives in the left rail; **clicking an item loads its detail in the center** (the same surface as new generation). Prototype: `.scratch/rotas-secundarias-app/prototype/history-prototype.html`.

**Purpose:** Browse and re-read past generations; watch in-flight ones live.

**Data Dependencies:**

| SDK Method | Backend Route | Returns |
|---|---|---|
| `executions.list(query)` | `GET /me/executions` | `ExecutionsPageView` |
| `executions.get({ executionId })` | `GET /me/executions/:executionId` | `ExecutionStatusView` |
| `executions.submitReaction({ executionId, reaction })` | `POST /me/executions/:executionId/reaction` | `ExecutionReactionView` ⚠️ **contract does not exist yet — to specify** |

**Rail list (grouped by time: Today / Yesterday / 7 days / This month):**
- Item label = **theme** (`briefingTopic`) — **never the intent** (invisible per ADR 0004) and never the format.
- Status dot (`queued`/`running`/`done`/`failed`) + relative time (`createdAt`).
- **Format seal = `[size][· channel?]`** — `lengthTier` always resolves (has a default from intent) → size always shows; `channel` is the only explicit optional input (ADR 0004) → shown only if chosen; with neither, **"free text"**. The item's identity is always the theme.
- **In-flight generations appear live in the rail** (progress bar); multiple can run in parallel (ADR 0005 §6). Completed-but-unopened items carry an **unread marker** that survives reload.

**Filters (exposed):** search by theme · `period` (`7d`/`30d`/`90d`/`all`) · `status` · format. **No "intent" filter** (coherence with ADR 0004). ⚠️ **Free-text theme search is not in `ExecutionsListQuery` yet — to specify.** The contract's `intent` field stays an internal signal, not a UI filter.

```typescript
sdk.executions.list({
  limit?: number                     // default 20
  offset?: number
  period?: "7d" | "30d" | "90d" | "all"
  status?: "all" | "queued" | "running" | "done" | "failed"
  lengthTier?: GenerationLengthTier
  // contentType/intent exist in the contract but are NOT surfaced as UI filters
  // (see "to specify": free-text theme search)
})
```

**Center detail (loaded on rail click):**
- Generated text (`JobResult.content`) is the hero (editorial serif, ≤720px column).
- **"Voice alignment" strip — collapsible, starts closed.** Expands to the `voice.appliedSignals` readout: traits applied · rules honored · anti-patterns avoided → links to the voice companion (Screen 3).
- **Reaction** 👍/👎 (+ short reason) → `executions.submitReaction`.
- Metadata: format, channel, when, voice version used, and a **fallback seal when `usedFallbackVoiceProfile`**.
- `failed` → reason + "credits not charged" + retry. `running` → "writing with your voice…" state (progress mirrors the rail item).

---

### Screen 3: Voice Profile (`/app/voice`) — two surfaces, no jargon — ADR 0005

> Reads `VoiceProfileScreenView` **translated into human language** — never the internal signature names. The full route and the **collapsible companion** (right widget in the shell) read the same data; the companion is a **strict read-only subset** of the route. Prototype: `.scratch/rotas-secundarias-app/prototype/voice-profile-prototype.html`.

**Purpose:** Show the author how Cultiv models their thinking, let them sharpen it, and manage voice-training consent. Reinforce that the voice read here is the same one that writes.

**Data Dependencies (on mount):**

| SDK Method | Backend Route | Returns |
|---|---|---|
| `voice.getProfile()` | `GET /me/voice-profile` | `VoiceProfileScreenView` |
| `voice.getConsentStatus()` | `GET /me/voice-training-consent` | `VoiceTrainingConsentStatusView` |
| `voiceCalibration.getEntitlement()` | `GET /me/voice-calibration/entitlement` | `VoiceCalibrationEntitlementView` |

**Layout & UI mapping (no internal jargon surfaced):**
- **Two prose blocks are the hero:** `reasoning.core.narrativeProse` → **"How I think"**; `reasoning.development.developmentProse` → **"How I develop a text"**. The signature enums (certainty, judgment frequency, conclusion pace, reader relationship, authority source, epistemic posture, opening/closing mode, move labels) render as **plain-language chips** — never "Core Reasoning Signature" etc.
- **Confidence ring:** `profile.confidence` → ring in the **graphite + acid-chartreuse** system (ADR 0005 §1 — *not* the old ochre-to-terracotta gradient, which was doc-rot).
- **Trait review (central interaction):** the 7 `TRAIT_KEYS` (`reasoning.traitProfile`) render as a list with **Confirm / Not quite** per trait → `voice.recordTraitConfirmation({ traitKey, response })` (`confirmed`/`disputed`/skip); status badge **Inferred → Confirmed → Disputed** + confidence. This is the gesture that sharpens the voice.
- **Material base:** `materialBase` → the 4 calibration prompts (read-only; new examples only via recalibration, ADR 0001) + coverage by format + **next step** (`diagnostics.nextActionCodes` translated).
- **Coherence callout:** "this is the voice that writes for you."

**Consent lives here (UI SSOT):** grant/revoke via `voice.grantConsent()` / `voice.revokeConsent()`, with a `--danger` state warning that revoking **deletes the profile and disables generation**. Settings (Screen 5) only mirrors the state and deep-links here.

**Companion (right widget):** confidence + the two prose blocks + traits, **read-only**, with "See full profile →" routing to `/app/voice`. Actions (trait review, consent, recalibrate) and detail (material base, coverage) live only on the route.

**Recalibrate:** reopens the lighter in-workspace wizard (Screen 4 / ADR 0005 §3).

---

### Screen 4: Voice Calibration Session (onboarding-first) — ADR 0001 + ADR 0005 §3

**Purpose:** Sole entry point for voice profile creation in v1 (ADR 0001), and the **backbone of the entry flow** (ADR 0005): the app is revealed once a voice exists.

**Entry-flow framing (ADR 0005 §3):**
- **Wizard-first, full-screen** right after signup; the app is not shown until a voice exists.
- **Consent captured in two moments:** a **light notice at Step 1** ("we'll use your texts to build your voice profile") + the **formal authorization at the review step**. Refusing = no analysis = no profile = no product (hard gate).
- **Review step absorbs the rebuild:** the Voice Profile Rebuild is fast (seconds); the review step waits it out and presents the derived profile (confidence, "how you think", traits) inline. **Confirm = persist the profile + unlock generation (trial-limited)** — the "voice building" window collapses into this step and is never a shell state. **Free trial (ADR 0006):** the clock started at signup; generation unlocks but is capped at **8 generations / 7 days** (whichever first), then a paywall. Voice quality is *full* during the trial — the limit is only volume.
- **After confirm:** a **welcome bridge** ("your voice is ready") with the **voice companion already open** + an **optional, skippable tour**, then into "arrive and write" (ADR 0004).
- **Escape "Calibrate later":** enters a **locked workspace** (demo content marked "example" + persistent "Calibrate my voice" CTA; generation stays locked). Re-entering the wizard from here uses a **lighter, in-workspace chrome** (same 5 steps).
- **Recalibrate / account reset** always return here.

**Flow (7 screens):**

| Screen | Step ID | Type | Content |
|--------|---------|------|---------|
| 1 | `context_setup` | **Form** | Domain (required), audience (required), self-declared strengths (optional textarea) |
| 2 | `micro_opinion` | **Write** | "Qual é a sua opinião sobre {theme}?" — 60-100 words |
| 3 | `reasoning_reflection` | **Write** | "Conte sobre algo que você aprendeu recentemente..." — 150-250 words |
| 4 | `argument_development` | **Write** | "Defenda uma posição sobre algo que importa para você." — 250-400 words |
| 5 | `format_adaptation` | **Write** | "Explique algo que você sabe bem para alguém que não conhece." — 180-300 words |
| 6 | `review_confirm` | **Review** | Review all texts, confirm. Shows confidence level and profile summary. |
| 7 | `success` / `error` | **Result** | Confirmation of success, or error with retry button. |

**Context Setup (Step 1):**
- `domain` (required): "Qual é a sua temática principal?" — ex: tecnologia, negócios, saúde
- `audience` (required): "Para qual público você costuma escrever?" — ex: desenvolvedores, gestores, leigos
- `selfDeclaredStrength` (optional): "O que você considera seus pontos fortes como escritor?" — textarea livre
- Submitted via `POST /me/voice-calibration/sessions/:sessionId/context`

**Writing Steps (2-5):** Each produces a `VoiceExample` with provenance `calibrated`. Steps 4 and 5 trigger Voice Profile Rebuild.

**Review Step (6):** Absorbs the rebuild (seconds), shows confidence + profile summary (how you think / traits) **and the formal voice-training consent authorization**. **Confirm = persist the profile + unlock generation** — calls `POST /me/voice-calibration/sessions/:sessionId/complete`. Then lands on the welcome bridge (companion open) + optional tour (ADR 0005 §3).

**Entitlements (ADR 0006 — no free plan; voice quality is full in the trial):**

| Plan | Max Sessions | Charges Quota | Max Confidence |
|------|-------------|---------------|----------------|
| Trial (`trialing`) | 1 | counts vs 5-gen trial pool | **high** (voice is full — the hook) |
| Explorador | — | — | high |
| Criador | — | — | high |
| Profissional | — | — | high |

> ⚠️ **To specify:** exact recalibration-session limits per paid tier (the old free=1 / paid=10 cap predates the trial + canonical catalog; set alongside `default-plans.ts`). The medium-confidence ceiling on the entry tier is **removed** (ADR 0006 §2).

---

### Screen 5: Settings (`/app/settings`) — ADR 0005 §7

**Purpose:** A lean settings route (reached from the avatar menu). Most of what once lived here now has its own route; settings holds what's left + the seams.

**Data Dependencies:**

| SDK Method | Backend Route | Returns |
|---|---|---|
| `voice.getConsentStatus()` | `GET /me/voice-training-consent` | `VoiceTrainingConsentStatusView` |
| `billing.getEntitlement()` | `GET /me/billing/entitlement` | `BillingEntitlementView` |

**Sections:**
1. **Account:** read-only identity (name/email, from Auth0) · sign out · **Delete account** (destructive).
2. **Preferences:** interface language (pt-BR / en — settings owns this) · **generation-completion notifications** (toggle + browser permission, ADR 0005 §6). **Theme (light/dark) is NOT a setting** — it lives only in the topbar toggle.
3. **Privacy & data:** voice-training consent → **deep-links to `/app/voice`** (UI SSOT is Screen 3), mirroring the current state here · **Export** and **Reset** (LGPD).
4. **Plan:** minimal summary (plan + balance) → **deep-links to billing** (Billing ADR). Settings does not host plan management.

**Destructive ladder (distinct actions, growing scope — each clearly explained):**
1. **Revoke consent** (on `/app/voice`) — deletes the voice profile only; history and account remain.
2. **Reset account** (settings) — deletes voice profile + calibration examples + generation history, **keeps the account/login** → returns to fresh-created state, dropping back into onboarding (Screen 4).
3. **Delete account** (settings) — terminal: removes everything + the login.

**Export my data** — non-destructive (LGPD portability): a single download of voice profile + examples + history + account data.

> ⚠️ **Contracts to specify (do not exist yet):** export-data, reset-account, delete-account endpoints.

---

### Screen 6: Active Execution Drawer — **REMOVED (ADR 0005 §6)**

The Active Execution Drawer is **discarded**. In the ChatGPT-like shell, in-flight generations live in the **rail** (live item + progress bar) and are read in the **center** (Screen 2), so a floating drawer is redundant. Progress-tracking without it:

- **Parallel executions:** multiple generations run concurrently (BullMQ worker `concurrency ?? 2`; excess is `queued`). Each shows as a live rail item, each observed by its own per-job SSE stream.
- **Completion awareness when the user is away = B+C:** an ambient **toast** at completion (clickable, on any route) **+** a persistent **unread marker** on the rail item (survives reload, clears on open).
- **Outside the tab:** **Web Notifications API** in v1 (cheap, client-side). **Web Push** (delivery with the tab closed — service worker + VAPID + backend subscriptions) is deferred.

---

### Screen 7: Plans & Upgrade (`/app/plans`) — ADR 0006

> The **purchase door** (distinct from Screen 8, which manages what you already have). Prototype: `.scratch/rotas-secundarias-app/prototype/plans-prototype.html`.

**Purpose:** Present the canonical plan catalog, drive upgrade, enter checkout. Reached from the avatar menu, the billing route, or any contextual upgrade trigger.

**Data Dependencies:**

| SDK Method | Backend Route | Returns |
|---|---|---|
| `billing.getPlans()` | `GET /billing/plans` (public) · `GET /me/billing/plans` (marks current) | plan catalog ⚠️ **to specify** |
| `billing.getEntitlement()` | `GET /me/billing/entitlement` | `BillingEntitlementView` |
| `billing.createCheckout(input)` | `POST /me/billing/checkout` | `BillingCheckoutResponse` |

**Canonical catalog (ADR 0006 §3) — backend is SSOT:**

| Plan | Price BRL / USD | Generations/mo |
|---|---|---|
| Trial | free · 7 days | 5 total |
| Explorador | R$49 / $9 | 15 |
| Criador ⭐ | R$99 / $19 | 30 |
| Profissional | R$249 / $49 | 80 |

**Layout:** trial banner (days/generations left) · 3 tier cards (Criador featured) · monthly/annual toggle (−20%) · BRL/USD toggle · discreet top-up link.

**Checkout (redirect):** `createCheckout({ productKind, internalRef, currency, billingPeriod, paymentMethod })` → redirect to hosted checkout (BRL→ASAAS card+pix / USD→Stripe card); `internalRef` = `{planId}_{period}_{currency}`. **Return = re-fetch `entitlement`** → success / pending / failure ("not charged").

**Contextual upgrade triggers → paywall (preserves context):** `trial_expired` (5 gens or day 7), `usage_restricted`, `low_balance`, `calibration_limit`.

---

### Screen 8: Billing Management (`/app/billing`) — ADR 0006

> **Manage** what you have (distinct from Screen 7). Buying/switching plans jumps to Screen 7. Settings (Screen 5) deep-links here. Prototype: `.scratch/rotas-secundarias-app/prototype/billing-prototype.html`.

**Data Dependencies:**

| SDK Method | Backend Route | Returns |
|---|---|---|
| `billing.getEntitlement()` | `GET /me/billing/entitlement` | `BillingEntitlementView` |
| `billing.getLedger()` | ledger route ⚠️ **to specify** | `BillingLedgerEntry[]` |
| subscription mgmt (cancel/reactivate/payment method) | ⚠️ **to specify — no route nor payments op today** | — |

**Sections:**
- **Balance (hero, no jargon):** "~N texts" (`quotaRemaining` = credits ÷ `canonicalCreditCost`) + available credits + renewal date.
- **Credit statement (curated, not the raw ledger):** collapses the accounting churn `reserve → capture → release` into a single **"Generation"**; shows only author-facing moves (monthly credits, rollover, top-up, generation, refund, expiry).
- **Plan + payment method:** change plan (→ Screen 7) · cancel / reactivate.

**Four states (ADR 0006 §5):** trialing · active · past_due (dunning: "settle up, credits stay for now") · **canceled-but-in-cycle** (access until period end, then lapses to paywall; reactivable).

---

## Execution Watch Flow

> **Parallel by design (ADR 0005 §6).** Several generations can be in flight at once — the client keeps **one watch handle per job**, each rendering into its own live rail item. On a `completed`/`failed` transition, fire the completion signal (ambient toast + persistent unread marker; Web Notifications API if the tab is backgrounded) even when the user is on another route. No shared drawer.

```typescript
const handle = sdk.executions.watch({
  executionId: jobId,
  onTransition: (transition) => {
    switch (transition.type) {
      case "started":     // progress at 0%
      case "progressed":  // progress updated
      case "completed":   // transition.result.content has the text
      case "failed":      // transition.error.message has the error
    }
  },
  onObservationFailure: (failure) => {
    // failure.reason: "reconnect_exhausted" | "poll_fallback_exhausted" | "timeout"
  },
})

// Later: handle.stop()
```

**`ExecutionTransition` union:**
```typescript
| { type: "started",    executionId, snapshot?, progress: { currentStep, stepIndex, totalSteps, percent }, occurredAt }
| { type: "progressed", executionId, snapshot?, progress: { currentStep, stepIndex, totalSteps, percent }, occurredAt }
| { type: "completed",  executionId, snapshot?, result: { content: string, executionVoiceAlignment: ExecutionVoiceAlignmentView, metadata: Record<string, unknown> }, occurredAt }
| { type: "failed",     executionId, snapshot?, error: { message: string, step: string | null }, occurredAt }
```

---

## Error Handling

All SDK methods return `Effect<T, ClientSdkError, never>`. Use `sdk.toPromise()` to convert to Promise.

**`ClientSdkError` union:**

| Error | When | UI Action |
|---|---|---|
| `ClientSdkTransportError` | Network failure, token missing, abort | Show "Connection error" + retry |
| `ClientSdkHttpStatusError` | Backend returns 4xx/5xx | Map `code` to user message |
| `ClientSdkResponseDecodeError` | Response doesn't match contract | Show "Unexpected response" |
| `ClientSdkContractFailure` | Backend contract drifted from SDK | Show "Update required" |
| `ClientSdkInvalidRequestError` | Input validation failed before HTTP | Show validation error |
| `ClientSdkObservationFailure` | SSE/polling exhausted | Show "Lost connection" + manual refresh |

**Key `ApiErrorCode` values for UI messages:**

| Code | Meaning | UI |
|---|---|---|
| `authentication_missing_token` | No auth token | Redirect to login |
| `authentication_expired_token` | Token expired | Refresh token, retry |
| `authorization_not_owner` | Accessing other user's resource | 403 page |
| `voice_training_consent_required` | Need consent before generation | Show consent prompt |
| `quote_stale` | Preview quote expired | Re-run preview |
| `usage_restricted` | Plan limit reached | Show upgrade CTA |
| `rate_limited` | Too many requests | Show "Try again in X seconds" |
| `safety_input_blocked` | Input failed safety check | Show "Content not allowed" |
| `resource_not_found` | Execution/example not found | Show 404 |

---

## Content Type Catalog Structure

> **Superseded for the primary flow (ADR 0004).** The theme-first flow does not use `inputSchema` to build a dynamic form, nor a content-type selector — content type is **derived** from the inferred `intent × lengthTier` server-side. The structure below is retained for reference / internal use (and any surface still on the legacy intent-first flow); it no longer drives Screen 1.

Each `ContentTypeCatalogItemView` provides everything the (legacy) Briefing Form needed:

```typescript
{
  id: string                      // "linkedin-post", "long-form-blog", etc.
  label: string                   // "LinkedIn Post", "Blog Post", etc.
  available: boolean              // false = disabled in selector
  deprecated?: boolean
  reasonCode?: ReasonCode         // Why unavailable
  defaultLanguage: string
  supportedLanguages: string[]
  steps: string[]                 // Pipeline step names
  inputSchema: Array<{            // Drives Briefing Form fields
    key: string                   // "topic", "angle", "tone", etc.
    label: string                 // "Tópico", "Ângulo", etc.
    type: "string" | "text" | "number" | "boolean" | "enum" | "object" | "array"
    required: boolean
    highImpact: boolean           // High-impact field = prominently styled
    helpText?: string
    options?: string[]            // For enum type
  }>
  briefingGuidance: {
    objective: string             // What good briefing looks like
    tips: string[]                // Writing tips
    exampleBriefing: string       // Example to copy
    commonMistakes: string[]      // What to avoid
  }
  briefingGuidanceByLanguage?: Record<string, BriefingGuidanceView>
}
```

**UI Mapping:**
- `inputSchema` → dynamic form generation (each field → input component based on `type`)
- `highImpact` → visually prominent fields
- `briefingGuidance` → collapsible help panel below form
- `supportedLanguages` → language selector options

---

## SSE Wire Format

Backend sends SSE events on `GET /me/executions/:id/events`:

```
event: progress
data: {"type":"progress","payload":{"currentStep":"draft","stepIndex":2,"totalSteps":5,"percent":40},"occurredAt":"2025-01-15T10:30:00Z"}

event: done
data: {"type":"done","payload":{"content":"Generated text...","metadata":{}},"occurredAt":"2025-01-15T10:31:00Z"}

event: error
data: {"type":"error","payload":{"message":"Step failed","step":"draft"},"occurredAt":"2025-01-15T10:31:00Z"}
```

The `client-sdk` parses this automatically and maps to `ExecutionTransition` objects.

---

## Implementation Checklist

### Phase 1: Core Generation Flow (theme-first, ADR 0004)
- [ ] SDK bootstrap with Auth0 token provider
- [ ] Backend: `POST /me/generation-prefill` endpoint + inference service (`gemini-3.1-flash-lite`, per ADR 0004 §3)
- [ ] client-sdk: `generationPrefill.infer({ theme, language })` subclient
- [ ] Theme input → prefill call → Zustand session state
- [ ] Conversational deepening session (one question at a time, skippable, "Generate now" always available)
- [ ] Ambiguity question (natural language) when `intentAmbiguity.ambiguous`
- [ ] Optional platform selector → platform→bucket map → `scope.channel`
- [ ] Assemble briefing from answers (theme→topic, thesis→goal, rest→keyPoints; omit skipped)
- [ ] Generation preview (optional) → cost/recommendation display
- [ ] Execution creation (intent+scope, no contentType) → queue status
- [ ] SSE watch (per-job) → live rail item + center "writing…" state (no drawer)
- [ ] Completion signal: ambient toast + persistent unread marker + Web Notifications API
- [ ] Eval set (~15–20 themes) tuning the inference prompt + ambiguity threshold

### Phase 2: Generation History (rail + center) — ADR 0005
- [ ] App shell: rail (history = primary nav) + center + collapsible voice companion; `data-surface="workspace"` token layer (retire issue-39 moss/golden/Playfair)
- [ ] Rail list grouped by time; item = theme + status dot + progressive format seal (`[size][· channel?]` → "free text")
- [ ] Filters: search-by-theme · period · status · format (NO intent filter)
- [ ] Center detail: hero text + collapsible "voice alignment" (starts closed) + reaction + fallback seal
- [ ] Live in-flight items in rail (parallel) + unread markers
- [ ] ⚠️ Contracts to specify: free-text theme search; `submitReaction`/`ExecutionReactionView`

### Phase 3: Voice Profile (`/app/voice`) — ADR 0005
- [ ] Two prose blocks ("How I think" / "How I develop"), no jargon; enums → plain chips
- [ ] Confidence ring in graphite + acid-chartreuse (not ochre gradient)
- [ ] Trait review (7 keys, Confirm/Not-quite → recordTraitConfirmation, Inferred→Confirmed→Disputed)
- [ ] Consent grant/revoke here (UI SSOT, `--danger`); material base + coverage + next step
- [ ] Companion widget = read-only subset → "See full profile →"

### Phase 4: Voice Onboarding (Calibration Only) — onboarding-first, ADR 0005 §3
- [ ] Wizard-first full-screen after signup; "Calibrate later" → locked workspace (demo "example" + CTA)
- [ ] Consent: light notice (Step 1) + formal authorization (review)
- [ ] Review absorbs rebuild; confirm = persist + unlock generation
- [ ] Welcome bridge (companion open) + optional skippable tour → generation
- [ ] Steps 0–6 (context, 4 prompts, review, success); lighter in-workspace chrome on re-entry
- [ ] Remove old voice example import code (ADR 0001)

### Phase 5: Settings — ADR 0005 §7
- [ ] Account (read-only identity, sign out, delete account)
- [ ] Preferences (locale, completion notifications; theme stays in topbar)
- [ ] Privacy & data (consent deep-link to /voice; export + reset)
- [ ] Plan summary → deep-link to billing
- [ ] Destructive ladder: revoke consent < reset account (→ onboarding) < delete account
- [ ] ⚠️ Contracts to specify: export-data, reset-account, delete-account

### Phase 6: Billing, Plans & Trial — ADR 0006
- [ ] Free trial: signup start, 5 gens / 7 days (whichever first), full voice quality; `canGenerate` allows `trialing`
- [ ] Trial expiry → paywall; post-expiry preserve + purge (90 days never-converted / 12 months churned)
- [ ] Canonical catalog in `default-plans.ts` (no free; + trial; Explorador/Criador/Profissional; recalibrated credits + prices + models)
- [ ] Screen 7 Plans & Upgrade: catalog + monthly/annual + BRL/USD + checkout redirect + return states
- [ ] Screen 8 Billing Management: balance ("~N texts") + curated statement + plan/payment mgmt + 4 states
- [ ] Contextual paywall triggers (trial_expired / usage_restricted / low_balance / calibration_limit)
- [ ] ⚠️ Contracts/ops to build: `GET /billing/plans`, ledger route, subscription mgmt (cancel/switch/reactivate/payment method), top-up listing
- [ ] Landing reads catalog from backend at build (constellation.ts + JSON-LD generated; SEO stays static)