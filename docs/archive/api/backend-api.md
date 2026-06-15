---
title: Backend API Reference
doc_type: api
status: active
domain: backend-api
last_updated: 2026-06-09
---

# Backend API Reference

The active public backend contract is product-oriented:

- preview generation cost and allowed options first
- execute generation as a product request
- keep pipeline and step structure out of the main public flow

Explicit pipeline requests still exist, but only as legacy compatibility or
internal debug surfaces. They are not the primary public generation path.

## Overview

Base URL: `/api`

Health endpoints:

- `/health`
- `/api/health`

## Authentication

Authentication is not yet required in the current backend surface.
Requests must include `Content-Type: application/json`.

## Client Integration Surface

Frontend applications (`apps/web`, `apps/mobile`) must consume the backend only
through `packages/client-sdk`. The SDK exposes product capabilities
(`preview`, `executions`, `voice`, `contentTypes`) and hides route semantics.

Platform identity integrations own signup, signin, redirect, and session
establishment. The SDK receives bearer tokens through `getToken` and does not
own auth-provider orchestration.

## Public product surface

The active public product surface for **End User** clients is:

- `POST /api/generation-preview` for pricing, recommendation, allowed options,
  and projected balance impact
- `POST /me/executions/run` for generation execution using content type,
  briefing, quality mode, and optional `quoteId`
- `GET /me/content-types`
- `GET /me/executions`
- `GET /me/executions/:executionId`
- `GET /me/executions/:executionId/events`
- `GET /me/voice-profile` and related voice example/batch routes

The public client should not choose pipelines or arbitrary steps.

Legacy `/api/pipelines` and `/api/jobs` routes are **removed** from the
product-facing backend surface. Use execution capabilities instead.

## Endpoints

### `POST /api/generation-preview`

Active product-facing preview endpoint.

Purpose:

- resolve allowed content types and quality modes for the current user
- return the fixed commercial price for the selected combination
- return projected balance impact
- return the backend-owned recommendation
- return a deterministic `quoteId`

Operational rules:

- informative only
- does not reserve credits
- uses the same canonical pricing logic that execution uses later

Expected response shape:

```ts
{
  pricingSnapshot: {
    quoteId: string;
    policyVersion: string;
    contentType: string;
    qualityMode: "fast" | "balanced" | "strict";
    creditPrice: number;
  };
  currentBalance: number;
  projectedBalanceAfterGeneration: number;
  options: {
    contentTypes: Array<{
      id: string;
      allowed: boolean;
      blockedReason?: string;
    }>;
    qualityModes: Array<{
      id: "fast" | "balanced" | "strict";
      allowed: boolean;
      blockedReason?: string;
      creditPrice?: number;
      recommended?: boolean;
      recommendation?: {
        reasonCodes: string[];
        explanation: string;
      };
    }>;
  };
}
```

### `POST /me/executions/run`

Canonical public execution route.

Purpose:

- execute a generation request using product-owned content type semantics
- optionally validate the commercial snapshot through `quoteId`
- preserve preview recommendation context in telemetry and trace when provided

Request body (`MeExecutionRequest`):

```ts
{
  contentType: string;
  briefing: string | Record<string, unknown>;
  context?: Record<string, unknown>;
  language?: string;
  qualityMode?: "fast" | "balanced" | "strict";
  model?: string;
  quoteId?: string;
  previewRecommendation?: {
    qualityMode: "fast" | "balanced" | "strict";
    reasonCodes: string[];
    explanation: string;
  };
  includeTrace?: boolean;
  idempotencyKey?: string;
}
```

Sync success response (`SyncExecutionView`):

```ts
{
  mode: "sync";
  contentType: string;
  pipelineName: string;
  content: string;
  adapter: string;
  model: string;
  qualityMode: "fast" | "balanced" | "strict";
  controls?: {
    qualityMode?: "fast" | "balanced" | "strict";
    targetScore?: number;
    maxIterations?: number;
    minImprovementDelta?: number;
    maxLLMCalls?: number;
  };
  telemetry?: {
    llm?: {
      executedCount: number;
      bypassedCount: number;
      llmCallsSaved: number;
      bypassRate: number;
    };
    cost?: {
      inputTokensTotal: number;
      outputTokensTotal: number;
      estimatedUsdCost: number;
      debitedCredits: number;
    };
    selection?: {
      reason: string;
      adapter: string;
      model: string;
    };
    preview?: {
      quoteId?: string;
      recommendedQualityMode?: "fast" | "balanced" | "strict";
      finalQualityMode: "fast" | "balanced" | "strict";
      divergedFromRecommendation: boolean;
      recommendationReasonCodes: string[];
    };
    pricing?: {
      quoteId?: string;
      policyVersion?: string;
      contentType?: string;
      plannedCreditPrice?: number;
      observedDebitedCredits: number;
      observedUsdCost: number;
    };
    providers?: {
      finalProvider: string;
      finalModel: string;
      attempts: Array<{
        stepName: string;
        stepIndex: number;
        provider: string;
        model: string;
        path: "preferred" | "fallback";
        status: "succeeded" | "failed";
        inputTokens?: number;
        outputTokens?: number;
        estimatedUsdCost?: number;
        debitedCredits?: number;
      }>;
    };
    billing?: {
      userId: string;
      planId: string;
      generationCycleId: string;
    };
  };
  trace?: unknown;
  voice: {
    voiceProfileConfidence: string;
    voiceAdaptationMode: string;
    voiceProfileVersionUsed: number;
    pendingVoiceProfileVersion?: number;
    voiceProfileSnapshotId: string;
    usedFallbackVoiceProfile: boolean;
    fallbackReasonCode?: string;
    appliedSignals: {
      styleMarkers: string[];
      rules: string[];
      antiPatterns: string[];
    };
    pendingProfileRebuild: {
      status: "idle" | "in_progress" | "failed";
      nextActionCodes: string[];
      reasonCode?: string;
    };
  };
  idempotencyKey?: string;
}
```

Async success response (`QueuedExecutionView`):

```ts
{
  jobId: string;
  status: "queued";
  contentType: string;
  estimatedSteps: number;
  createdAt: string;
  voice: {
    voiceProfileConfidence: string;
    voiceAdaptationMode: string;
    voiceProfileVersionUsed: number;
    pendingVoiceProfileVersion?: number;
    voiceProfileSnapshotId: string;
    usedFallbackVoiceProfile: boolean;
    fallbackReasonCode?: string;
    appliedSignals: {
      styleMarkers: string[];
      rules: string[];
      antiPatterns: string[];
    };
    pendingProfileRebuild: {
      status: "idle" | "in_progress" | "failed";
      nextActionCodes: string[];
      reasonCode?: string;
    };
  };
}
```

### `GET /me/executions`

Lists the actor's execution history.

Expected response shape:

```ts
{
  items: Array<{
    jobId: string;
    status: "queued" | "running" | "done" | "failed";
    contentType: string;
    progress: {
      currentStep: string;
      stepIndex: number;
      totalSteps: number;
      percent: number;
    } | null;
    result: {
      content: string;
      metadata: Record<string, unknown>;
    } | null;
    error: {
      message: string;
      step: string | null;
    } | null;
    createdAt: string;
    completedAt: string | null;
    voice?: Record<string, unknown>;
  }>;
  total: number;
  limit: number;
  offset: number;
}
```

### `GET /me/executions/:executionId`

Returns one execution status entry.

### `GET /me/executions/:executionId/events`

SSE stream for async execution progress and completion.

### `POST /api/run`

Legacy pipeline-oriented execution route.

This route still accepts `PipelineRequest` for compatibility with older
backend-facing callers. It is not the canonical public product surface.

Current request body (`PipelineRequest`):

```ts
{
  pipelineType?: string;
  contentType?: string;
  briefing?: string | object;
  language?: string;
  qualityMode?: "fast" | "balanced" | "strict";
  adapter?: string;
  model?: string;
  inputs?: Record<string, unknown>;
  idempotencyKey?: string;
  includeTrace?: boolean;
}
```

Current success response (`SyncRunResponse`):

```ts
{
  mode: "sync";
  adapter: string;
  model: string;
  content: string;
  contentType: string;
  pipelineName: string;
  qualityMode: "fast" | "balanced" | "strict";
  controls?: {
    qualityMode?: string;
    targetScore?: number;
    maxIterations?: number;
    minImprovementDelta?: number;
    maxLLMCalls?: number;
  };
  telemetry?: {
    llm?: {
      executedCount: number;
      bypassedCount: number;
      llmCallsSaved: number;
      bypassRate: number;
    };
    cost?: {
      inputTokensTotal: number;
      outputTokensTotal: number;
      estimatedUsdCost: number;
      debitedCredits: number;
    };
    selection?: {
      reason: string;
      adapter: string;
      model: string;
    };
    billing?: {
      userId: string;
      planId: string;
      generationCycleId: string;
    };
  };
  trace?: unknown;
  idempotencyKey?: string;
}
```

Current async response (`JobCreatedResponse`):

```ts
{
  jobId: string;
  status: "queued";
  contentType: string;
  estimatedSteps: number;
  createdAt: string;
}
```

Current errors:

- `BackendRequestBodyParseError`
- `ContractDecodeError`
- `BackendUsageAuthorizationError`
- `BackendExecutionFailedError`
- `BackendGenerationQuoteMismatchError`

### `GET /health`

Basic health check.

Expected response:

```ts
{
  status: "ok" | "error";
  time: string;
  engine: {
    status: "ready" | "degraded";
    version: string;
    uptimeSec: number;
  };
}
```

### `POST /api/internal/experimental/run`

Guarded internal experimental execution route.

Rules:

- requires `x-backend-role: staff`
- blocked in production
- gated by `execution.experimental_debug` feature flag
- requires an explicit pipeline request
- uses the experimental policy catalog when available
- simulates credits by default while preserving normal provider and cost
  telemetry

This route is internal-only and must not be exposed as part of the public
product contract.

## Quote consistency

The public generation contract supports an optional `quoteId`.

Rules:

- execution recalculates the pricing snapshot
- if any commercial field diverges, execution fails explicitly
- the client must refetch preview before asking for confirmation again

The execution endpoint must not silently replace the quote on behalf of the
user. Stale quotes should fail with an explicit refresh-preview recovery path.

## Rate limits

The backend currently applies traffic limits by plan tier:

- `free`: 25 requests/day
- `starter`: 100 requests/day
- `pro`: 500 requests/day
- `enterprise`: 5000 requests/day

Beta rollout may increase these limits.

## Contracts

Contracts in `packages/contracts` are the source of truth for the typed backend
surface.

Primary public contracts:

- `GenerationPreviewRequest`
- `GenerationPreviewResponse`
- `MeExecutionRequest`
- `SyncExecutionView`
- `QueuedExecutionView`
- `ExecutionStatusView`
- `ExecutionsPageView`

Legacy and internal contracts:

- `PipelineRequest` for compatibility and internal execution paths
- explicit pipeline definitions for internal experimental/debug flows

## Telemetry

Current sync execution telemetry includes:

- total LLM calls
- input tokens
- output tokens
- estimated USD cost
- debited credits
- selection reason
- billing identity correlation
- `quoteId`
- pricing snapshot used at execution time
- recommendation emitted at preview time
- divergence between recommended and chosen quality mode

## Development

```bash
pnpm --filter backend dev
pnpm --filter backend build
pnpm --filter backend test
```
