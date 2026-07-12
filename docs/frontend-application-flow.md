# Frontend Application Flow & Screens

> **Context:** This document details the user flow and screen specifications for the Cultiv authenticated workspace (`/app/*`), based on the frontend-backend contracts and ADR 0003 (stack/architecture). The **generation flow (Screen 1) follows ADR 0004** — theme-first guided — which supersedes the earlier intent-first design.

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

```
┌─────────────────────────────────────────────────────────────────┐
│                        Auth Flow                                │
│  Landing Page → Login/Signup (Auth0) → /app/generate            │
│                                                                 │
│  First-time users:                                              │
│  /app/generate → /app/onboarding (calibration wizard) →         │
│  /app/generate                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    App Shell Navigation                          │
│  /app/generate      ← Generation Screen (primary)              │
│  /app/history       ← Execution History                        │
│  /app/voice         ← Voice Dashboard                          │
│  /app/settings      ← Account Settings (avatar menu)           │
│  /app/onboarding    ← Voice Calibration Session                │
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

### Screen 2: Execution History (`/app/history`)

**Purpose:** Paginated list of past generation runs with status, content type, date, and credit cost.

**Data Dependencies:**

| SDK Method | Backend Route | Returns |
|---|---|---|
| `executions.list(query)` | `GET /me/executions` | `ExecutionsPageView` |
| `executions.get({ executionId })` | `GET /me/executions/:executionId` | `ExecutionStatusView` |
| `executions.submitReaction({ executionId, reaction })` | `POST /me/executions/:executionId/reaction` | `ExecutionReactionView` |

**Query Parameters:**
```typescript
sdk.executions.list({
  limit?: number                  // Page size (default: 20)
  offset?: number                 // Pagination offset
  period?: "7d" | "30d" | "90d" | "all"
  status?: "all" | "queued" | "running" | "done" | "failed"
  contentType?: string            // Filter by content type ID
  intent?: GenerationIntent       // Filter by intent
  lengthTier?: GenerationLengthTier  // Filter by length tier
})
```

**Response Shape (`ExecutionsPageView`):**
```typescript
{
  items: ExecutionStatusView[]
  total: number
  limit: number
  offset: number
}
```

**UI Mapping:**
- `items` → paginated list
- `status` → status badge (queued/running/done/failed)
- `contentType` → format label
- `progress.percent` → progress bar for running jobs
- `result.content` → text preview (truncated)
- `createdAt` → relative time ("2 hours ago")
- `generationIntent` → intent chip
- Click item → navigate to `/app/history/$jobId` (Execution History Detail)

---

### Screen 3: Voice Dashboard (`/app/voice`)

**Purpose:** Summary screen showing how Cultiv models the author's thinking, with voice profile confidence, diagnostics, and CTAs.

**Data Dependencies (on mount):**

| SDK Method | Backend Route | Returns |
|---|---|---|
| `voice.getProfile()` | `GET /me/voice-profile` | `VoiceProfileScreenView` |
| `voice.getConsentStatus()` | `GET /me/voice-training-consent` | `VoiceTrainingConsentStatusView` |
| `voiceCalibration.getEntitlement()` | `GET /me/voice-calibration/entitlement` | `VoiceCalibrationEntitlementView` |

**Layout:**
- **Hero Section (Voice Reasoning Presentation):**
  - "How I think" — Core Reasoning Signature prose
  - "How I develop a text" — Argument Development Signature prose
  - Development Traits strip with confidence chips
- **Growth Ring:** Circular visualization filling ochre-to-terracotta gradient by confidence level
- **Voice Next Step Card:** Prioritized recommended action from diagnostics
- **Detail Layer:** Collapsible section for format expressions, derived anti-patterns, diagnostics

**UI Mapping:**
- `profile.confidence` → growth ring (ochre-to-terracotta gradient)
- `reasoning.core.narrativeProse` → "How I think" hero section
- `reasoning.development.developmentProse` → "How I develop a text" hero section
- `reasoning.development.traitProfile` → Development Traits strip with confidence chips
- `diagnostics.nextActionCodes[0]` → Voice Next Step card
- `materialBase` → coverage stats in detail layer
- `quantitativeSignals` → quantitative signals in detail layer

**Actions:**
- Confirm Voice Trait: `sdk.voice.recordTraitConfirmation({ traitKey, response })`
- Grant/Revoke Consent: `sdk.voice.grantConsent()` / `sdk.voice.revokeConsent()`

---

### Screen 4: Voice Calibration Session (`/app/onboarding/calibration` or `/app/voice/calibration`)

**Purpose:** Guided alternative to importing a writing portfolio; sole entry point for voice profile creation in v1 (ADR 0001).

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

**Review Step (6):** Shows confidence level, profile summary. User confirms. Calls `POST /me/voice-calibration/sessions/:sessionId/complete`.

**Entitlements:**

| Plan | Max Sessions | Charges Quota | Max Confidence |
|------|-------------|---------------|----------------|
| free | 1 | yes | medium |
| criador | 10 | no | high |
| pro | 10 | no | high |

---

### Screen 5: Account Settings (`/app/settings`)

**Purpose:** Manage App Locale, view read-only identity details, review Voice Training Consent, and sign out.

**Data Dependencies:**

| SDK Method | Backend Route | Returns |
|---|---|---|
| `voice.getConsentStatus()` | `GET /me/voice-training-consent` | `VoiceTrainingConsentStatusView` |
| `billing.getEntitlement()` | `GET /me/billing/entitlement` | `BillingEntitlementView` |

**Components:**
1. **Identity Details:** Read-only user information
2. **App Locale Preference:** Language setting (pt-BR / en)
3. **Voice Training Consent:** Review and revoke consent
4. **Logout Button**

---

### Screen 6: Active Execution Drawer (Sidebar Overlay)

**Purpose:** Quick-reading surface for in-flight and recent executions without leaving current screen.

**Data Flow:**
1. User triggers generation → `sdk.executions.create()` → get `jobId`
2. Start watching → `sdk.executions.watch({ executionId: jobId, onTransition })`
3. On `completed` transition → show result in drawer
4. For in-flight jobs → `sdk.executions.get({ executionId })` to refresh status

**Drawer Content:**
- **Desktop:** ~520px right slide-over
- **Mobile:** Full-screen sheet

**From `ExecutionTransition` or `ExecutionStatusView`:**
- `progress.currentStep` + `progress.percent` → step name + progress bar
- `result.content` → generated text (in LogbookProse)
- `result.executionVoiceAlignment` → voice alignment score + expandable readout
  - `score` + `summaryReadout` always visible
  - dimension details revealed on expand
- `voice.appliedSignals` → voice metadata chips
- Thumbs up/down → `sdk.executions.submitReaction({ executionId, reaction })`
- Error state from `error.message`

---

## Execution Watch Flow

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
- [ ] SSE watch → progress bar + completion
- [ ] Active execution drawer
- [ ] Eval set (~15–20 themes) tuning the inference prompt + ambiguity threshold

### Phase 2: Execution History
- [ ] Paginated list with filters
- [ ] Status badges + progress bars
- [ ] Detail view with full result

### Phase 3: Voice Dashboard
- [ ] Profile view (confidence ring, reasoning prose)
- [ ] Development traits strip
- [ ] Voice examples list
- [ ] Voice Next Step card
- [ ] Detail layer (diagnostics, coverage)

### Phase 4: Voice Onboarding (Calibration Only)
- [ ] Step 0: Context setup (domain, audience, strengths)
- [ ] Steps 1-4: Writing prompts (one screen per step)
- [ ] Step 5: Review + confirm
- [ ] Step 6: Success/error screen
- [ ] Onboarding completion → backend endpoint + SDK
- [ ] Remove old voice example import code (ADR 0001)

### Phase 5: Settings & Billing
- [ ] Account settings (locale, consent, identity)
- [ ] Billing entitlement display
- [ ] Checkout redirect flow