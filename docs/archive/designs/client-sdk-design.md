---
title: Client SDK Design
doc_type: design
status: active
domain: client-integration-surface
last_updated: 2026-06-03
---

# Client SDK Design

## Purpose

This document captures the complete design of the `client-sdk` as the **Client Integration Surface** for the AI Writing Engine. It is the single source of truth for SDK architecture, public API shape, transport behavior, error taxonomy, and contract alignment decisions.

## Principles

1. **Framework-Agnostic Client:** The SDK core must not depend on Next.js, React, or any UI framework.
2. **Client State Boundary:** The SDK owns domain contracts, transport behavior, and observation semantics. Application state, caching, and screen lifecycle remain outside.
3. **Flat Domain Methods:** Each subclient exposes primary capabilities at the first method level. No nested trees.
4. **Named Method Inputs:** Every public method receives one named input object, even for simple lookups.
5. **Decoded Domain Outputs:** Public methods return decoded domain payloads directly, not client-invented wrapper envelopes.
6. **Client Contract Failure:** The SDK fails fast with typed errors when backend responses drift from the expected contract.
7. **Client Contract Versioning:** The SDK is treated as a versioned artifact. Decode failures are the primary enforcement mechanism in v1.

## Client Surface Root

The SDK exposes a single aggregated entry point created via factory function:

```ts
const client = createClientSdk({
  baseUrl: "https://api.example.com",
  getToken: () => localStorage.getItem("token"),
  headers: { "x-custom-header": "value" }
});
```

### Configuration

```ts
interface ClientSdkConfig {
  readonly baseUrl: string;
  readonly getToken?: () => string | null | undefined | Promise<string | null | undefined>;
  readonly headers?: Readonly<Record<string, string>>;
  readonly fetcher?: typeof fetch;
  readonly retryPolicy?: {
    readonly get?: { readonly maxRetries: number; readonly backoffBaseMs: number };
    readonly mutate?: { readonly maxRetries: number; readonly backoffBaseMs: number };
  };
  readonly watchResilience?: {
    readonly maxSseReconnectAttempts: number;
    readonly sseBackoffBaseMs: number;
    readonly pollingIntervalMs: number;
    readonly maxPollingFailures: number;
    readonly totalObservationTimeoutMs: number;
  };
}
```

**Defaults:**
- `retryPolicy.get`: `{ maxRetries: 3, backoffBaseMs: 500 }`
- `retryPolicy.mutate`: `{ maxRetries: 2, backoffBaseMs: 1000 }`
- `watchResilience`: `{ maxSseReconnectAttempts: 5, sseBackoffBaseMs: 1000, pollingIntervalMs: 5000, maxPollingFailures: 12, totalObservationTimeoutMs: 600_000 }`

### Subclients

```ts
client.preview          // Preview subclient
client.executions       // Executions subclient
client.voice            // Voice subclient
client.contentTypes     // Content Types subclient
```

No `me` subclient. The `/me/` route prefix is an implementation detail, not a product domain.

## Dual API: Effect and Promise

### Effect (primary)

Every public method returns `Effect.Effect<T, ClientSdkError, never>`:

```ts
const result = yield* client.preview.get({ contentType: "blog" });
```

The `never` context requirement means the SDK is self-contained. Consumers do not need to provide Effect Layers or Services.

### Promise (convenience)

The root exposes a helper for non-Effect consumers:

```ts
const result = await client.toPromise(
  client.preview.get({ contentType: "blog" })
);
```

Or consumers can use `Effect.runPromise` directly if they already import Effect.

## Domain Subclients

### `preview`

| Method | Input | Output | HTTP |
|--------|-------|--------|------|
| `get` | `GenerationPreviewRequest & { signal? }` | `GenerationPreviewResponse` | POST `/api/generation-preview` |

### `executions`

| Method | Input | Output | HTTP |
|--------|-------|--------|------|
| `create` | `MeExecutionRequest & { signal? }` | `QueuedExecutionView` | POST `/me/executions/run` |
| `get` | `{ executionId: string; signal? }` | `ExecutionStatusView` | GET `/me/executions/:id` |
| `list` | `{ limit?: number; offset?: number; signal? }` | `ExecutionsPageView` | GET `/me/executions` |
| `watch` | `{ executionId: string; onTransition; onObservationFailure? }` | `ObservationHandle` | SSE `/me/executions/:id/events` |

**Notes:**
- `create` is always async. The SDK auto-generates `idempotencyKey` internally.
- `watch` returns an `ObservationHandle` exposing only `stop()`. Resume is achieved by calling `watch` again with an existing `executionId`.

### `voice`

| Method | Input | Output | HTTP |
|--------|-------|--------|------|
| `getProfile` | `{ signal? }` | `VoiceProfileScreenView` | GET `/me/voice-profile` |
| `listExamples` | `{ limit?; offset?; signal? }` | `VoiceExamplesPageView` | GET `/me/voice-profile/examples` |
| `createExample` | `VoiceExampleCreateInput & { signal? }` | `VoiceExampleListItemView` | POST `/me/voice-profile/examples` |
| `updateExample` | `{ exampleId: string } & VoiceExampleUpdateInput & { signal? }` | `VoiceExampleListItemView` | PATCH `/me/voice-profile/examples/:id` |
| `createBatch` | `{ expiresAt?: string; signal? }` | `VoiceExampleBatchView` | POST `/me/voice-profile/example-batches` |
| `addBatchItems` | `{ batchId: string } & VoiceExampleBatchItemsInput & { signal? }` | `VoiceExampleBatchView` | POST `/me/voice-profile/example-batches/:id/items` |
| `commitBatch` | `{ batchId: string; signal? }` | `VoiceExampleBatchCommitResultView` | POST `/me/voice-profile/example-batches/:id/commit` |

### `contentTypes`

| Method | Input | Output | HTTP |
|--------|-------|--------|------|
| `list` | `{ signal? }` | `ContentTypeCatalogView` | GET `/me/content-types` |

## Execution Transitions

`Execution Watch` emits typed transitions via a single required callback:

```ts
type ExecutionTransition =
  | { type: "started"; executionId: string; snapshot?: ExecutionStatusView; progress: JobProgress; occurredAt: string }
  | { type: "progressed"; executionId: string; snapshot?: ExecutionStatusView; progress: JobProgress; occurredAt: string }
  | { type: "completed"; executionId: string; snapshot?: ExecutionStatusView; result: JobResult; occurredAt: string }
  | { type: "failed"; executionId: string; snapshot?: ExecutionStatusView; error: JobError; occurredAt: string };
```

Mapping from backend SSE events:
- SSE `type: "progress"` with `percent === 0` → `started`
- SSE `type: "progress"` with `percent > 0` → `progressed`
- SSE `type: "done"` → `completed`
- SSE `type: "error"` → `failed`

The `snapshot` is optional because the backend SSE does not currently include it. If absent, consumers can call `executions.get({ executionId })` for the full state.

## Observation Handle

```ts
interface ObservationHandle {
  readonly stop: () => void;
}
```

v1 exposes only `stop()`. No embedded state, no snapshot reader, no event-specific callbacks.

## Observation Failure Boundary

Watch-level failures (transport, reconnect exhaustion, polling fallback exhaustion) are distinct from execution lifecycle failures.

```ts
type ObservationFailure = {
  readonly reason: "reconnect_exhausted" | "poll_fallback_exhausted" | "timeout";
  readonly message: string;
};
```

Delivered via the optional `onObservationFailure` callback in `watch()` input. Never mixed into `ExecutionTransition`.

## Error Taxonomy

All SDK errors extend `Data.TaggedError` for pattern matching:

```ts
type ClientSdkError =
  | ClientSdkTransportError
  | ClientSdkHttpStatusError
  | ClientSdkResponseDecodeError
  | ClientSdkInvalidRequestError
  | ClientSdkContractFailure
  | ClientSdkObservationFailure;
```

- `ClientSdkTransportError` — Network, DNS, timeout, body read failure.
- `ClientSdkHttpStatusError` — Non-2xx HTTP response with status, code, category, retryable flag.
- `ClientSdkResponseDecodeError` — Body received but schema decode failed.
- `ClientSdkInvalidRequestError` — Input validation failed before the request was sent.
- `ClientSdkContractFailure` — Backend response does not match the expected contract. Fail-fast.
- `ClientSdkObservationFailure` — Watch-level observation failure after bounded recovery.

A helper is exported for non-Effect consumers:

```ts
function isClientSdkError(error: unknown, tag: string): boolean;
```

## Retry and Resilience

### HTTP Request Retry

| Method | Retryable codes | Max retries | Backoff base |
|--------|-----------------|-------------|--------------|
| GET | 429, 500, 502, 503, 504 | 3 | 500ms |
| POST/PUT/PATCH | 429, 503, 504 | 2 | 1000ms |

Mutating requests include an auto-generated `idempotencyKey` for safe deduplication.

### Execution Watch Resilience

1. Open SSE connection to `/me/executions/:id/events`.
2. On disconnect, retry SSE with exponential backoff (base 1s, max 5 attempts).
3. After SSE exhaustion, fall back to polling `GET /me/executions/:id` every 5 seconds.
4. After 12 polling failures or 10 minutes total, surface `ClientSdkObservationFailure`.

## Idempotency

The SDK auto-generates `idempotencyKey` for every mutating request. The key is:
- A UUID generated at call time.
- Reused across retries of the same original call.
- Never exposed to the consumer.
- Included in `POST`, `PUT`, and `PATCH` request bodies where the contract supports it.

This allows the backend to deduplicate safely without requiring the consumer to understand idempotency concepts.

## Abort and Cancellation

Every request method accepts `signal?: AbortSignal` in its input object. When the signal aborts:
- In-flight `fetch` requests are aborted via the native `AbortController`.
- The Effect fails with a `ClientSdkTransportError`.
- `Execution Watch` stops its SSE/polling loop.

## Billing

Out of scope for v1. Credit balance appears in `preview.get()` (`currentBalance`, `projectedBalanceAfterGeneration`). Debited credits appear in `executions.get()` telemetry. A future `billing` subclient may expose wallet and ledger history.

## Legacy Exclusion

The following routes are **not** part of the product client contract and do not appear in the SDK:

- `POST /api/pipelines`
- `GET /api/jobs/:jobId`
- `GET /api/jobs/:jobId/events`

The SDK uses only product-facing routes under `/me/*` and `/api/generation-preview`.

## Governance

Frontend applications (`apps/web`, `apps/mobile`) must not call backend routes directly. Enforcement:

1. **Lint rules:** Prohibit imports of HTTP clients (`fetch`, `axios`, `ky`) in frontend app code. Allow only `@my-ai-orchestrator/client-sdk`.
2. **Architectural tests:** Verify that frontend packages do not depend on backend route constants or URL patterns.

## Related Documents

- `CONTEXT.md`
- `docs/archive/adr/0026-typescript-native-client-sdk-as-primary-consumer.md`
- `docs/archive/adr/0028-client-sdk-as-client-integration-surface.md`
- `docs/archive/prd/client-sdk-client-integration-surface.md`
- `docs/archive/plans/client-sdk-and-backend-cleanup-plan.md`
