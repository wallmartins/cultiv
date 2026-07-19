# Frontend-Backend Contracts Reference

> **Canonical rule:** The frontend MUST consume the backend exclusively through `@my-ai-orchestrator/client-sdk`. No direct HTTP calls. No manual fetch. The SDK handles transport, auth, retry, idempotency, SSE, and contract decoding.

## SDK Bootstrap

```ts
import { createClientSdk } from "@my-ai-orchestrator/client-sdk"

const sdk = createClientSdk({
  baseUrl: "https://api.cultiv.app",
  getToken: () => auth0.getToken(),  // async OK
})
```

**Config shape:**
```ts
{
  baseUrl: string
  getToken?: () => string | null | Promise<string | null>
  headers?: Record<string, string>
  fetcher?: typeof fetch
  retryPolicy?: { get?: { maxRetries, backoffBaseMs }, mutate?: { maxRetries, backoffBaseMs } }
  watchResilience?: { maxSseReconnectAttempts, sseBackoffBaseMs, pollingIntervalMs, maxPollingFailures, totalObservationTimeoutMs }
}
```

**Defaults:** GET 3 retries/500ms backoff, mutate 2 retries/1000ms backoff. SSE 5 reconnects, then 5s polling, 600s total timeout.

---

## SDK Surface: 7 Subclients, 20 Methods

```ts
interface ClientSdk {
  preview: PreviewClient
  executions: ExecutionsClient
  voice: VoiceClient
  voiceCalibration: VoiceCalibrationClient
  onboarding: OnboardingClient
  generationIntents: GenerationIntentsClient
  billing: BillingClient
  transport: HttpTransport
  toPromise: <A>(effect: Effect<A, ClientSdkError, never>) => Promise<A>
}
```

---

## Screen 1: Generation Screen (`/app/generate`)

### Data Dependencies (on mount)

| SDK Method | Backend Route | Returns | When |
|---|---|---|---|
| `generationIntents.list()` | `GET /me/generation-intents` | `GenerationIntentCatalogView` | On mount — populate intent selector and drive briefing form schema |
| `billing.getEntitlement()` | `GET /me/billing/entitlement` | `BillingEntitlementView` | On mount — show credit balance in header |

### User Actions

#### Select Content Type → Preview

```ts
const preview = await sdk.toPromise(
  sdk.preview.get({
    contentType: "linkedin-post",
    intent: "share-idea",
    scope: { lengthTier: "medium", channel: "professional-network" },
    briefing: { topic: "My topic", angle: "My angle" },
    language: "pt-BR",
    qualityMode: "balanced",
    includeRecommendation: true,
  })
)
```

**Request shape (`GenerationPreviewRequest`):**
```ts
{
  contentType?: string           // Content type catalog ID
  intent?: GenerationIntent      // "share-idea" | "explain-deeply" | "engage-audience" | "tell-story" | "update-subscribers" | "document-decision"
  scope?: {
    lengthTier: GenerationLengthTier  // "short" | "medium" | "long"
    channel?: GenerationChannel       // "unspecified" | "professional-network" | "blog" | "email" | "social"
  }
  briefing?: string | Record<string, unknown>  // Structured or free-text
  importedContext?: string        // Plain-text reference material (paste only)
  language?: string               // "pt-BR" | "en"
  qualityMode?: QualityMode       // "fast" | "balanced" | "strict"
  includeRecommendation?: boolean // Include AI recommendation in response
}
```

**Response shape (`GenerationPreviewResponse`):**
```ts
{
  pricingSnapshot: {
    quoteId: string              // Stale quote detection
    policyVersion: string
    contentType: string
    qualityMode: QualityMode
    creditPrice: number          // Credits this generation costs
    planSignature?: PlanSignature  // "short-piece" | "long-piece" | "serial-piece" | "edition-piece"
    lengthTier?: GenerationLengthTier
  }
  currentBalance: number
  projectedBalanceAfterGeneration: number
  quotaRemaining: number
  quotaLimit: number
  quotaCost: number
  canonicalCreditCost?: number
  recommendation?: {
    qualityMode: QualityMode
    reasonCodes: string[]
    explanation: string
  }
  resolvedIntent?: {
    intent: GenerationIntent
    scope: GenerationScope
    wordTargetMin: number
    wordTargetMax: number
  }
  compositor?: {
    planId: string
    planSignature: PlanSignature
    expressionProfile: string
    lengthTier: GenerationLengthTier
    wordTarget: { min: number, max: number }
  }
  options: {
    contentTypes: Array<{ id: string, label: string, allowed: boolean, blockedReason?: string }>
    qualityModes: Array<{
      id: QualityMode
      allowed: boolean
      blockedReason?: string
      creditPrice: number
      recommended?: boolean
      recommendation?: { reasonCodes: string[], explanation: string }
    }>
  }
}
```

**UI mapping:**
- `pricingSnapshot.creditPrice` → cost badge next to "Generate" button
- `projectedBalanceAfterGeneration` → projected balance after generation
- `recommendation` → highlighted quality mode suggestion
- `options.qualityModes[].blockedReason` → disabled state + tooltip on quality mode chips
- `options.contentTypes[].blockedReason` → disabled state on content type selector
- `resolvedIntent.wordTargetMin/Max` → word count guidance in briefing form

#### Confirm → Run Generation

```ts
const result = await sdk.toPromise(
  sdk.executions.create({
    contentType: "linkedin-post",
    intent: "share-idea",
    scope: { lengthTier: "medium", channel: "professional-network" },
    briefing: { topic: "My topic", angle: "My angle" },
    language: "pt-BR",
    qualityMode: "balanced",
    quoteId: preview.pricingSnapshot.quoteId,        // From preview
    previewRecommendation: preview.recommendation,    // From preview (optional)
    importedContext: "pasted reference text...",       // Optional
  })
)
```

**Request shape (`MeExecutionRequest`):**
```ts
{
  contentType?: string
  intent?: GenerationIntent
  scope?: GenerationScope
  briefing: string | Record<string, unknown>   // REQUIRED
  importedContext?: string
  context?: Record<string, unknown>
  language?: string
  qualityMode?: QualityMode
  model?: string                  // Override model selection
  quoteId?: string                // From preview — stale quote detection
  previewRecommendation?: PreviewRecommendation
  includeTrace?: boolean          // Debug: include execution trace
  idempotencyKey?: string         // AUTO-GENERATED by SDK — do not pass
}
```

**Response shape (`QueuedExecutionView`):**
```ts
{
  jobId: string                   // Execution identity
  status: "queued"
  contentType: string
  estimatedSteps: number
  createdAt: string               // ISO timestamp
  voice: {
    voiceProfileConfidence: "low" | "medium" | "high"
    voiceAdaptationMode: "conservative" | "standard"
    voiceProfileVersionUsed: number
    pendingVoiceProfileVersion?: number
    voiceProfileSnapshotId: string
    usedFallbackVoiceProfile: boolean
    fallbackReasonCode?: "rebuild_failed" | "rebuild_in_progress"
    appliedSignals: {
      styleMarkers: string[]
      rules: string[]
      antiPatterns: string[]
      reasoningApplied?: boolean
      certaintyLevel?: "low" | "moderate" | "high"
      conclusionPace?: "slow" | "moderate" | "fast"
      developmentApplied?: boolean
      epistemicPosture?: "exploratory" | "investigative" | "advocacy_mixed"
      developmentTraitsApplied?: boolean
      openingMode?: "observation" | "thesis" | "mixed"
      closingMode?: "conclusion" | "open_question" | "mixed"
      insightTiming?: "early" | "moderate" | "late"
    }
    pendingProfileRebuild: {
      status: "idle" | "in_progress" | "failed"
      reasonCode?: ReasonCode
      nextActionCodes: NextActionCode[]
    }
  }
}
```

**After creation:**
1. Store `jobId` as `ExecutionIdentity`
2. Start `sdk.executions.watch({ executionId: jobId, onTransition })` to observe progress
3. Add job to `Active Execution List`

#### Watch Execution Progress

```ts
const handle = sdk.executions.watch({
  executionId: jobId,
  onTransition: (transition) => {
    switch (transition.type) {
      case "started":     // progress at 0%
      case "progressed":  // progress updated
      case "completed":   // transition.result.content has the text; transition.result.executionVoiceAlignment has the voice readout
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
```ts
| { type: "started",    executionId, snapshot?, progress: { currentStep, stepIndex, totalSteps, percent }, occurredAt }
| { type: "progressed", executionId, snapshot?, progress: { currentStep, stepIndex, totalSteps, percent }, occurredAt }
| { type: "completed",  executionId, snapshot?, result: { content: string, executionVoiceAlignment: ExecutionVoiceAlignmentView, metadata: Record<string, unknown> }, occurredAt }
| { type: "failed",     executionId, snapshot?, error: { message: string, step: string | null }, occurredAt }
```

### `ExecutionVoiceAlignmentView`

The user-facing per-execution readout of how closely the generated text follows the author's **Derived Voice Profile**.

```ts
interface ExecutionVoiceAlignmentView {
  score: number                                    // 0-100
  scoringMethod: "heuristic" | "heuristic-and-judge"
  summaryReadout: string                           // 1-2 sentence explanation
  dimensions: {
    reasoning: ExecutionVoiceAlignmentDimensionView
    development: ExecutionVoiceAlignmentDimensionView
    formatExpression: ExecutionVoiceAlignmentDimensionView
    antiPatterns: ExecutionVoiceAlignmentDimensionView
  }
}

interface ExecutionVoiceAlignmentDimensionView {
  score: number                                    // 0-100
  status: "aligned" | "mostly-aligned" | "divergent"
  observations: string[]                           // Derived from drift notes / judge rationale
}
```

**Rules:**
- `executionVoiceAlignment` is only present when `status === "done"`.
- `score` is derived from drift heuristics and blended with the **Voice Judge** score when available.
- `scoringMethod` is normally `"heuristic-and-judge"` because the judge now runs in every **Quality Mode**. It falls back to `"heuristic"` only when the judge fails (provider unavailable, parse error, timeout).
- `summaryReadout` is generated from the dimension observations without an extra LLM call.
- The dimensions map to `Core Reasoning Signature`, `Argument Development Signature`, `Format Expression Profile`, and `Derived Anti-Patterns`.

### `ExecutionReactionView` and submission

Lightweight thumbs-up/down signal persisted for product metrics; does **not** trigger a **Voice Profile Rebuild**.

```ts
// POST /me/executions/:executionId/reaction
// SDK: sdk.executions.submitReaction({ executionId, reaction })
{
  reaction: "positive" | "negative"
}

// Response: ExecutionReactionView
{
  executionId: string
  reaction: "positive" | "negative"
  recordedAt: string
}
```

---

## Screen 2: Execution History (`/app/history`)

### Data Dependencies

| SDK Method | Backend Route | Returns |
|---|---|---|
| `executions.list(query)` | `GET /me/executions` | `ExecutionsPageView` |
| `executions.get({ executionId })` | `GET /me/executions/:executionId` | `ExecutionStatusView` |
| `executions.submitReaction({ executionId, reaction })` | `POST /me/executions/:executionId/reaction` | `ExecutionReactionView` |

### Query Parameters

```ts
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

### Response Shape (`ExecutionsPageView`)

```ts
{
  items: ExecutionStatusView[]
  total: number
  limit: number
  offset: number
}
```

**`ExecutionStatusView` (each item):**
```ts
{
  jobId: string
  status: "queued" | "running" | "done" | "failed"
  contentType: string
  progress: { currentStep: string, stepIndex: number, totalSteps: number, percent: number } | null
  result: { content: string, executionVoiceAlignment: ExecutionVoiceAlignmentView, metadata: Record<string, unknown> } | null
  error: { message: string, step: string | null } | null
  createdAt: string
  completedAt: string | null
  voice?: { /* ExecutionVoiceMetadataView — same as in QueuedExecutionView */ }
  generationIntent?: GenerationIntent
  briefingTopic?: string
  lengthTier?: GenerationLengthTier
  channel?: GenerationChannel
}
```

**UI mapping:**
- `items` → paginated list
- `status` → status badge (queued/running/done/failed)
- `contentType` → format label
- `progress.percent` → progress bar for running jobs
- `result.content` → text preview (truncated)
- `createdAt` → relative time ("2 hours ago")
- `generationIntent` → intent chip
- Click item → navigate to `/app/history/$jobId` (Execution History Detail)

### Get Single Execution

```ts
const execution = await sdk.toPromise(
  sdk.executions.get({ executionId: "job-uuid" })
)
```

Returns `ExecutionStatusView` — same shape as list items.

---

## Screen 3: Voice Dashboard (`/app/voice`)

### Data Dependencies (on mount)

| SDK Method | Backend Route | Returns |
|---|---|---|
| `voice.getProfile()` | `GET /me/voice-profile` | `VoiceProfileScreenView` |
| `voice.getConsentStatus()` | `GET /me/voice-training-consent` | `VoiceTrainingConsentStatusView` |
| `voiceCalibration.getEntitlement()` | `GET /me/voice-calibration/entitlement` | `VoiceCalibrationEntitlementView` |

### Response Shape (`VoiceProfileScreenView`)

```ts
{
  profile: {
    userId: string
    snapshotId: string
    version: number
    confidence: "low" | "medium" | "high"
    adaptationMode: "conservative" | "standard"
    primaryLanguage: string
    tone: string                  // Free-text tone description
    cadence: string               // Free-text cadence description
    description?: string
    lexicon: string[]             // Characteristic vocabulary
    constraints: string[]         // Writing constraints
    styleMarkers: string[]        // Observable style patterns
    rules: string[]               // Writing rules
    antiPatterns: string[]        // Patterns to avoid
  }
  diagnostics: {
    updating: boolean             // Profile rebuild in progress
    activeVersion: number
    pendingVersion?: number
    summary?: string              // Human-readable diagnostics summary
    reasonCodes: ReasonCode[]     // Why confidence is at current level
    nextActionCodes: NextActionCode[]  // What to do next
    bestCoveredContentTypes: Array<{
      contentType: string
      coverage: "low" | "medium" | "high"
      reasonCodes: ReasonCode[]
    }>
    underrepresentedContentTypes: Array<{
      contentType: string
      coverage: "low" | "medium" | "high"
      reasonCodes: ReasonCode[]
    }>
    pendingRebuild: {
      status: "idle" | "in_progress" | "failed"
      reasonCode?: ReasonCode
      nextActionCodes: NextActionCode[]
    }
    traitConfirmations?: Record<string, {
      response: "confirmed" | "rejected" | "skipped"
      recordedAt: string
    }>
  }
  materialBase: {
    totalExamples: number
    activeExamples: number
    excludedExamples: number
    pinnedExamples: number
    byClassification: Record<string, number>
    byContentType: Record<string, number>
    byLanguage: Record<string, number>
  }
  reasoning?: {
    core: {
      narrativeProse: string      // "How I think" — full prose
      certaintyLevel: "low" | "moderate" | "high"
      judgmentFrequency: "low" | "moderate" | "high"
      conclusionPace: "slow" | "moderate" | "fast"
      readerRelationship: "peer" | "mentor" | "observer" | "collaborator" | "guide"
      authoritySource: "personal_observation" | "lived_experience" | "data" | "reference" | "practice"
      derivedAntiPatterns: string[]
    }
    reasoningVersion?: number
    development?: {
      developmentProse: string    // "How I develop a text" — full prose
      moveLabels: string[]        // Inferred argumentative moves
      transitionTendencies: Array<{
        from: string
        to: string
        frequency: "rare" | "occasional" | "common" | "dominant"
      }>
      epistemicPosture: "exploratory" | "investigative" | "advocacy_mixed"
      structuralAntiPatterns: string[]
      traitProfile?: {
        traits: {
          openingMode?: "observation" | "thesis" | "mixed"
          perspectiveShiftDensity?: "low" | "moderate" | "high"
          usesCounterexamples?: "rare" | "occasional" | "common" | "dominant"
          selfQuestioning?: "low" | "moderate" | "high"
          insightTiming?: "early" | "moderate" | "late"
          usesAnalogies?: "rare" | "occasional" | "common" | "dominant"
          closingMode?: "conclusion" | "open_question" | "mixed"
        }
        records: Record<string, {
          value?: unknown
          confidence: "low" | "medium" | "high"
          status: "inferred" | "confirmed" | "disputed" | "unknown"
          evidenceExampleIds: string[]
        }>
      }
    }
    developmentImmature?: boolean  // true when < 3 examples
  }
  quantitativeSignals?: {
    aggregate: {
      typeTokenRatio: number
      avgWordLength: number
      hapaxRatio: number
      avgSentenceLength: number
      sentenceLengthVariance: number
      avgDependencyDepth: number
      paragraphCount: number
      avgParagraphLength: number
      punctuationDensity: number
      formalityScore: number
      emotionalityScore: number
      certaintyMarkerCount: number
      hedgingMarkerCount: number
      transitionMarkerCount: number
    }
    consistencyScore: number
    topicIndependenceScore: number
    crossLengthConsistency: number
    extractionQuality: {
      reasoningExtracted: boolean
      developmentExtracted: boolean
      reconciliationNeeded: boolean
    }
  }
}
```

**UI mapping for Voice Dashboard:**
- `profile.confidence` → growth ring (ochre-to-terracotta gradient)
- `reasoning.core.narrativeProse` → "How I think" hero section
- `reasoning.development.developmentProse` → "How I develop a text" hero section
- `reasoning.development.traitProfile` → Development Traits strip with confidence chips
- `diagnostics.nextActionCodes[0]` → Voice Next Step card
- `materialBase` → coverage stats in detail layer
- `quantitativeSignals` → quantitative signals in detail layer

### Confirm Voice Trait

```ts
await sdk.toPromise(
  sdk.voice.recordTraitConfirmation({
    traitKey: "openingMode",       // One of 7 TraitKey values
    response: "confirmed",         // "confirmed" | "rejected" | "skipped"
  })
)
```

**`TraitKey` values:** `"openingMode"`, `"perspectiveShiftDensity"`, `"usesCounterexamples"`, `"selfQuestioning"`, `"insightTiming"`, `"usesAnalogies"`, `"closingMode"`

---

## Screen 4: Voice Example Composer (Removed in v1)

The standalone voice-example composer and its `POST /me/voice-profile/examples` routes were removed per ADR 0001. Voice examples are now created only through the **Voice Calibration Session** (`voiceCalibration.*`). There is no `voice.create()`, `voice.update()`, or `voice.listExamples()` in the SDK.

---

## Screen 5: Voice Calibration Session (`/app/onboarding/calibration` or `/app/voice/calibration`)

### Start Session

```ts
const session = await sdk.toPromise(
  sdk.voiceCalibration.startSession()
)
```

**Response (`VoiceCalibrationSessionView`):**
```ts
{
  sessionId: string
  userId: string
  status: "in_progress" | "completed" | "abandoned"
  context?: { domain?: string, audience?: string, selfDeclaredStrength?: string }
  currentStepId: string
  steps: Array<{
    stepId: string
    theme?: string
    prompt: string
    text?: string                 // User's submitted text
    wordCount?: number
    skipped?: boolean
    submittedAt?: string
  }>
  completedStepCount: number
  createdAt: string
  updatedAt: string
}
```

### Calibration Flow (per step)

1. **Get step prompt:**
```ts
const prompt = await sdk.toPromise(
  sdk.voiceCalibration.getStepPrompt({ sessionId, stepId })
)
// Returns: { stepId, prompt, theme, targetWords?, maxWords?, minWords? }
```

2. **Submit step (user writes text):**
```ts
const updatedSession = await sdk.toPromise(
  sdk.voiceCalibration.submitStep({
    sessionId,
    stepId,
    text: "User's written text for this calibration step",
  })
)
```

3. **Or skip step:**
```ts
const updatedSession = await sdk.toPromise(
  sdk.voiceCalibration.skipStep({ sessionId, stepId })
)
```

4. **Set context (optional, before or during steps):**
```ts
await sdk.toPromise(
  sdk.voiceCalibration.setContext({
    sessionId,
    domain: "technology",
    audience: "developers",
    selfDeclaredStrength: "explaining complex topics simply",
  })
)
```

5. **Complete review (after all steps):**
```ts
const finalSession = await sdk.toPromise(
  sdk.voiceCalibration.completeReview({
    sessionId,
    confirmedSections: ["step-1", "step-2", "step-3"],  // Optional
  })
)
```

### Entitlement Check

```ts
const entitlement = await sdk.toPromise(
  sdk.voiceCalibration.getEntitlement()
)
```

**Response (`VoiceCalibrationEntitlementView`):**
```ts
{
  planTier: "free" | "criador" | "pro"
  maxWizards: number             // Max calibration sessions
  completedWizards: number
  remainingWizards: number
  chargesQuota: boolean          // Whether this session debits generation quota
  maxConfidenceFromCalibration: "low" | "medium" | "high"
}
```

---

## Screen 6: Account Settings (`/app/settings`)

### Data Dependencies

| SDK Method | Backend Route | Returns |
|---|---|---|
| `voice.getConsentStatus()` | `GET /me/voice-training-consent` | `VoiceTrainingConsentStatusView` |
| `billing.getEntitlement()` | `GET /me/billing/entitlement` | `BillingEntitlementView` |

**Consent status:**
```ts
{ granted: boolean, grantedAt?: string, revokedAt?: string }
```

**Billing entitlement:**
```ts
{
  planId: string
  tier: string
  status: string
  availableCredits: number
  monthlyCreditsRemaining: number
  canonicalCreditCost: number
  quotaRemaining: number
  quotaLimit: number
  currency?: "BRL" | "USD"
}
```

### Grant/Revoke Voice Consent

```ts
// Grant
await sdk.toPromise(sdk.voice.grantConsent())

// Revoke
await sdk.toPromise(sdk.voice.revokeConsent())
```

Both methods send `POST /me/voice-training-consent` with `action: "grant" | "revoke"` and return `VoiceTrainingConsentStatusView`.

---

## Screen 7: Onboarding (`/app/onboarding`)

### Flow

1. **Voice Calibration Session** — Sole entry point for voice profile creation (ADR 0001).
   - Uses `voiceCalibration.*` methods (see Screen 5)

2. **Onboarding Welcome Step** — Shows readiness:
   - `voice.getProfile()` → confidence level
   - `billing.getEntitlement()` → available credits
   - Route to `/app/generate`

---

## Screen 8: Active Execution Drawer (sidebar overlay)

### Data Flow

1. User triggers generation → `sdk.executions.create()` → get `jobId`
2. Start watching → `sdk.executions.watch({ executionId: jobId, onTransition })`
3. On `completed` transition → show result in drawer
4. For in-flight jobs → `sdk.executions.get({ executionId })` to refresh status

### Drawer Content

From `ExecutionTransition` or `ExecutionStatusView`:
- `progress.currentStep` + `progress.percent` → step name + progress bar
- `result.content` → generated text (in LogbookProse)
- `result.executionVoiceAlignment` → voice alignment score + expandable readout
  - `score` + `summaryReadout` always visible
  - dimension details revealed on expand
- `voice.appliedSignals` → voice metadata chips
- Thumbs up/down → `sdk.executions.submitReaction({ executionId, reaction })`
- Error state from `error.message`

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

## Billing Checkout Flow

```ts
const checkout = await sdk.toPromise(
  sdk.billing.createCheckout({
    productKind: "subscription",   // "subscription" | "topup"
    internalRef: "plan-criador",
    currency: "BRL",
    billingPeriod: "monthly",      // "monthly" | "annual" | "one_time"
    paymentMethod: "card",         // "card" | "pix" (optional)
  })
)
// checkout.url → redirect user to Stripe/Asaas hosted checkout
// checkout.gateway → "stripe" | "asaas"
```

---

## Content Type Catalog Structure

Each `ContentTypeCatalogItemView` provides everything the Briefing Form needs:

```ts
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

**UI mapping:**
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

### Phase 1: Core Generation Flow
- [ ] SDK bootstrap with Auth0 token provider
- [ ] Content type catalog → selector component
- [ ] Generation intent catalog → intent picker (if used)
- [ ] Briefing form (dynamic from `inputSchema`)
- [ ] Generation preview → cost/recommendation display
- [ ] Execution creation → queue status
- [ ] SSE watch → progress bar + completion
- [ ] Active execution drawer

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

---

## Confirmed Behaviors (Code-Verified)

### SSE Authentication
Uses the **same JWT Bearer token** as all `/me/*` routes. The SDK uses `fetch()` (not `EventSource`) because `EventSource` doesn't support custom `Authorization` headers. Token resolved from `config.getToken()`.

### Imported Context
**Enabled in v1.** Optional `importedContext?: string` field on `MeExecutionRequest`. Passes through Input Safety Gateway with its own policy family. Truncated to 8,000 chars max. Appended to LLM prompt as `Imported context: {text}`. Can be blocked by safety policy.
### Onboarding Completion

**Backend is the source of truth.** `POST /me/onboarding/complete` persists completion in the `application_users` table (`onboarding_completed_at`). `GET /me/onboarding/status` returns `{ completed: boolean, completedAt?: string }`. The SDK exposes `sdk.onboarding.complete()` and `sdk.onboarding.getStatus()`. Called after successful `voiceCalibration.completeReview()`.

### Briefing Form Dynamic Rendering
The `inputSchema` from content type catalog is sufficient for basic dynamic forms:
- `type: "string"` → single-line input
- `type: "text"` → textarea
- `type: "enum"` → select dropdown (uses `options` array)
- `type: "array"` → no sub-schema; needs convention (comma-separated or dynamic list)
- `highImpact: true` → visually prominent field treatment
- **Missing:** `placeholder`, `maxLength`, `defaultValue` — not critical for v1

### Voice Calibration Flow (Final — 7 screens)

The onboarding wizard is the **sole entry point** for voice profile creation. Old import flow (VoiceExampleComposer, batch create) is removed per ADR 0001.

| Screen | Step ID | Type | Content |
|--------|---------|------|---------|
| 1 | `context_setup` | **Form** | Domain (required), audience (required), self-declared strengths (optional textarea) |
| 2 | `micro_opinion` | **Write** | "Qual é a sua opinião sobre {theme}?" — 60-100 words |
| 3 | `reasoning_reflection` | **Write** | "Conte sobre algo que você aprendeu recentemente..." — 150-250 words |
| 4 | `argument_development` | **Write** | "Defenda uma posição sobre algo que importa para você." — 250-400 words |
| 5 | `format_adaptation` | **Write** | "Explique algo que você sabe bem para alguém que não conhece." — 180-300 words |
| 6 | `review_confirm` | **Review** | Review all texts, confirm. Shows confidence level and profile summary. |
| 7 | `success` / `error` | **Result** | Confirmation of success, or error with retry button. |

**Context setup (Step 1):**
- `domain` (required): "Qual é a sua temática principal?" — ex: tecnologia, negócios, saúde
- `audience` (required): "Para qual público você costuma escrever?" — ex: desenvolvedores, gestores, leigos
- `selfDeclaredStrength` (optional): "O que você considera seus pontos fortes como escritor?" — textarea livre
- Submitted via `POST /me/voice-calibration/sessions/:sessionId/context` (separate call, before step 2)

**Writing steps (2-5):** Each produces a `VoiceExample` with proveniência `calibrated`. Steps 4 and 5 (`argument_development`, `format_adaptation`) trigger Voice Profile Rebuild.

**Review step (6):** Shows confidence level, profile summary. User confirms. Calls `POST /me/voice-calibration/sessions/:sessionId/complete`.

**Success/error step (7):** Frontend-only. Success shows confirmation + button to `/app/generate`. Error shows retry button that calls `completeReview()` again (idempotent).

**Retry on error:** If `completeReview()` fails, retry calls the same endpoint again (idempotent). No need to go back to previous steps.

**Entitlements:**

| Plan | Max Sessions | Charges Quota | Max Confidence |
|------|-------------|---------------|----------------|
| free | 1 | yes | medium |
| criador | 10 | no | high |
| pro | 10 | no | high |

---

## Decisions (Grilling Session)

### Decision: Onboarding Completion — Backend Implementation (Done)

**Decision:** `POST /me/onboarding/complete` and `GET /me/onboarding/status` are implemented. Backend is the source of truth.

**Implementation:**
- Migration `0015-add-onboarding-completion.ts`: adds `onboarding_completed_at` (nullable timestamp) to `application_users`
- Route: `POST /me/onboarding/complete` — marks onboarding as complete
- Route: `GET /me/onboarding/status` — returns `{ completed: boolean, completedAt?: string }`
- SDK: `sdk.onboarding.complete()`, `sdk.onboarding.getStatus()`
- Called after successful `voiceCalibration.completeReview()` in calibration wizard

### Decision: Old Voice Example Import — Removed (ADR 0001)

**Decision:** All code related to the old voice example import flow has been removed. Calibration is the sole entry point in v1.

**Scope:** Public `GET /me/content-types`, `GET /me/voice-profile/examples`, `POST /me/voice-profile/examples`, `PATCH /me/voice-profile/examples/:id`, and corresponding SDK methods were removed. Content-type catalog internals remain for backend use.
**ADR:** `docs/adr/0001-remove-voice-example-import-flow.md`

### Decision: Voice Example CRUD in SDK — Not in v1

**Decision:** No `voice.create()`, `voice.update()`, `voice.listExamples()`, or `voice.batchCreate()` in the SDK for v1. Calibration wizard is the only path for creating voice examples.

### Decision: Test Strategy — Hybrid (Fixtures + Calibration Flow)

**Decision:** Use a hybrid approach for tests:
- **Calibration-flow tests:** Exercise the real wizard (helper that creates calibrated examples)
- **Other module tests:** Use JSON fixtures with pre-built `VoiceExample` objects
- **Generation/billing tests:** Use pre-built `VoiceProfile` fixtures

This gives maximum safety: wizard tests catch real bugs, other tests are fast and isolated.

---

## Known SDK Gaps (Need Backend/SDK Work)

1. **Execution Delete/Archive** — No SDK method for archiving old executions

---

## Build & Type-Check Notes

- `pnpm build` uses **esbuild** and does **not** run TypeScript type-checking.
- To verify types for the backend package, run:
  ```bash
  pnpm --filter @my-ai-orchestrator/backend exec tsc -p tsconfig.json --noEmit
  ```
- The full test suite is run with `pnpm test`.

## App Web Status

- `apps/web` does **not** exist yet in the monorepo.
- The package `@my-ai-orchestrator/web` is referenced in the root `package.json` but is not implemented.
- Frontend work is tracked separately; the backend and SDK contracts documented here are ready for it.
