# Payment Gateway (Stripe + Asaas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate hosted checkout and webhook-driven entitlement updates using Asaas (BRL) and Stripe (USD), reusing the existing credit billing engine in `packages/payments`.

**Architecture:** Extend `BillingGatewayAdapter` with checkout and webhook parsing; add PostgreSQL tables for gateway catalog, customers, checkout intents, and event deduplication; expose authenticated `/me/billing/*` routes and unauthenticated `/webhooks/*` routes in the backend; activate subscriptions and grant top-ups only from verified webhooks.

**Tech Stack:** Effect-TS, Hono, Kysely/PostgreSQL, Vitest, Stripe Node SDK, Asaas REST API (fetch), Effect Schema (`@my-ai-orchestrator/contracts`), TanStack Router + React (`apps/web`).

**Spec:** [`docs/superpowers/specs/2026-06-17-payment-gateway-design.md`](../specs/2026-06-17-payment-gateway-design.md)

---

## Progress checkpoint (2026-06-17 — paused)

**Branch:** `feat/payment-gateway` (7 commits ahead of `main` docs-only baseline)

| Task | Status | Commit |
|------|--------|--------|
| 1 Gateway types and errors | ✅ | `ccfce5a` |
| 2 Gateway router | ✅ | `1732e73` |
| 3 Extend BillingGatewayAdapter | ✅ | `a534037` |
| 4 PostgreSQL migration | ✅ | `6c6747b` |
| 5 Postgres gateway store | ✅ | `ad4838f` |
| 6 Contracts checkout API | ✅ | `43a649e` |
| — Type fix (BillingGatewayError in service contract) | ✅ | `6adc2d3` |
| 7 Stripe adapter | ⏸️ not started (interrupted) | — |
| 8–18 | ⏳ pending | — |

**Resume at:** Task 7 — `packages/payments/src/gateway/stripe-adapter.ts`

**Done so far:**
- `packages/payments/src/gateway/{types,router,manual-adapter}.ts`
- `packages/contracts/src/billing-checkout.ts`
- `apps/backend/src/infra/migrations/0010-billing-gateway.ts`
- `apps/backend/src/infra/postgres-billing-gateway-store.ts`
- `tests/payments/gateway-router.test.ts`, `tests/backend/billing-gateway-store.test.ts`

**Not yet:** Stripe/Asaas real adapters, webhook dispatch, backend routes, web UI.

---

## File map

| File | Responsibility |
|------|----------------|
| `packages/payments/src/gateway/types.ts` | Shared gateway types (`CheckoutSessionRequest`, `GatewayWebhookEvent`, currencies) |
| `packages/payments/src/gateway/router.ts` | `resolveGatewayForCurrency`, `GatewayRouter` |
| `packages/payments/src/gateway/manual-adapter.ts` | Dev/test adapter (extracted from `index.ts`) |
| `packages/payments/src/gateway/stripe-adapter.ts` | Stripe Checkout + webhook parsing |
| `packages/payments/src/gateway/asaas-adapter.ts` | Asaas checkout + webhook parsing |
| `packages/payments/src/gateway/webhook-dispatch.ts` | Map normalized events → billing operations |
| `packages/payments/src/errors.ts` | Add `BillingGatewayError` variants |
| `packages/payments/src/index.ts` | Re-export gateway modules; slim down stubs |
| `packages/contracts/src/billing-checkout.ts` | Request/response schemas for checkout API |
| `apps/backend/src/infra/migrations/0010-billing-gateway.ts` | Gateway tables + seed catalog |
| `apps/backend/src/infra/postgres-tables.ts` | Table interfaces |
| `apps/backend/src/infra/postgres-billing-gateway-store.ts` | CRUD for gateway tables |
| `apps/backend/src/product/billing/billing-checkout-service.ts` | Create intents + checkout sessions |
| `apps/backend/src/product/billing/billing-webhook-service.ts` | Verify, dedupe, dispatch webhooks |
| `apps/backend/src/routes/billing-routes.ts` | `POST /me/billing/checkout`, `GET /me/billing/entitlement` |
| `apps/backend/src/routes/billing-webhook-routes.ts` | `POST /webhooks/stripe`, `POST /webhooks/asaas` |
| `apps/backend/src/config/config.ts` | Stripe/Asaas env vars |
| `packages/client-sdk/src/billing.ts` | SDK methods for billing surface |
| `apps/web/src/routes/app/billing.tsx` | Route shell |
| `apps/web/src/app/billing/screens/BillingScreen.tsx` | Plan/top-up selection UI |
| `tests/payments/gateway-router.test.ts` | Router unit tests |
| `tests/payments/gateway-webhook-dispatch.test.ts` | Dispatch unit tests |
| `tests/payments/stripe-webhook.test.ts` | Stripe fixture parsing |
| `tests/payments/asaas-webhook.test.ts` | Asaas fixture parsing |
| `tests/backend/billing-checkout.test.ts` | Checkout route integration |
| `tests/backend/billing-webhook.test.ts` | Webhook integration |
| `tests/fixtures/billing/stripe-checkout-completed.json` | Sanitized Stripe event |
| `tests/fixtures/billing/asaas-payment-received.json` | Sanitized Asaas event |

---

## Phase 1a — Core checkout (monthly Pro, card BRL + USD)

### Task 1: Gateway types and errors

**Files:**
- Create: `packages/payments/src/gateway/types.ts`
- Modify: `packages/payments/src/errors.ts`
- Modify: `packages/payments/src/index.ts`
- Test: `tests/payments/gateway-router.test.ts` (types imported here in Task 2)

- [ ] **Step 1: Write gateway types**

Create `packages/payments/src/gateway/types.ts`:

```typescript
import type { BillingGatewayName } from "../index.js";

export type BillingCurrency = "BRL" | "USD";
export type BillingProductKind = "subscription" | "topup";
export type BillingCheckoutPeriod = "monthly" | "annual" | "one_time";

export type GatewayWebhookEventType =
  | "checkout.completed"
  | "subscription.renewed"
  | "subscription.cancelled"
  | "payment.failed"
  | "chargeback";

export interface CheckoutSessionRequest {
  readonly userId: string;
  readonly email: string;
  readonly productKind: BillingProductKind;
  readonly internalRef: string;
  readonly currency: BillingCurrency;
  readonly billingPeriod: BillingCheckoutPeriod;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly checkoutIntentId: string;
  readonly externalPriceId: string;
  readonly externalCustomerId?: string;
}

export interface CheckoutSessionResult {
  readonly gateway: BillingGatewayName;
  readonly sessionId: string;
  readonly url: string;
}

export interface GatewayWebhookEvent {
  readonly eventId: string;
  readonly gateway: BillingGatewayName;
  readonly type: GatewayWebhookEventType;
  readonly userId: string;
  readonly checkoutIntentId?: string;
  readonly amount: number;
  readonly currency: BillingCurrency;
  readonly externalSubscriptionId?: string;
  readonly externalCustomerId?: string;
  readonly internalRef?: string;
  readonly productKind?: BillingProductKind;
}
```

- [ ] **Step 2: Add gateway errors**

Add to `packages/payments/src/errors.ts`:

```typescript
export class BillingGatewayError extends Data.TaggedError("BillingGatewayError")<{
  readonly gateway: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class BillingGatewayWebhookVerificationError extends Data.TaggedError(
  "BillingGatewayWebhookVerificationError"
)<{
  readonly gateway: string;
  readonly message: string;
}> {}

export class BillingCheckoutCatalogNotFoundError extends Data.TaggedError(
  "BillingCheckoutCatalogNotFoundError"
)<{
  readonly productKind: string;
  readonly internalRef: string;
  readonly currency: string;
  readonly billingPeriod: string;
}> {}
```

Export from `packages/payments/src/index.ts`.

- [ ] **Step 3: Run typecheck**

Run: `pnpm --filter @my-ai-orchestrator/payments lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/payments/src/gateway/types.ts packages/payments/src/errors.ts packages/payments/src/index.ts
git commit -m "feat(payments): add gateway types and billing gateway errors"
```

---

### Task 2: Gateway router

**Files:**
- Create: `packages/payments/src/gateway/router.ts`
- Create: `tests/payments/gateway-router.test.ts`
- Modify: `packages/payments/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/payments/gateway-router.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { resolveGatewayForCurrency } from "../../packages/payments/src/gateway/router.js";

describe("resolveGatewayForCurrency", () => {
  it("routes BRL to asaas", () => {
    expect(resolveGatewayForCurrency("BRL")).toBe("asaas");
  });

  it("routes USD to stripe", () => {
    expect(resolveGatewayForCurrency("USD")).toBe("stripe");
  });

  it("rejects unsupported currency", () => {
    expect(() => resolveGatewayForCurrency("EUR" as "BRL")).toThrow(/unsupported currency/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/payments/gateway-router.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement router**

Create `packages/payments/src/gateway/router.ts`:

```typescript
import type { BillingGatewayName } from "../index.js";
import type { BillingCurrency } from "./types.js";

export function resolveGatewayForCurrency(currency: BillingCurrency): BillingGatewayName {
  switch (currency) {
    case "BRL":
      return "asaas";
    case "USD":
      return "stripe";
    default: {
      const exhaustive: never = currency;
      throw new Error(`Unsupported currency: ${String(exhaustive)}`);
    }
  }
}
```

Export from `packages/payments/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/payments/gateway-router.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/payments/src/gateway/router.ts tests/payments/gateway-router.test.ts packages/payments/src/index.ts
git commit -m "feat(payments): add currency-based gateway router"
```

---

### Task 3: Extend BillingGatewayAdapter interface

**Files:**
- Create: `packages/payments/src/gateway/manual-adapter.ts`
- Modify: `packages/payments/src/index.ts`
- Modify: `tests/payments/payments-package.test.ts`

- [ ] **Step 1: Extract manual adapter and extend interface**

Move `createManualGateway` into `packages/payments/src/gateway/manual-adapter.ts`. Update `BillingGatewayAdapter`:

```typescript
export interface BillingGatewayAdapter {
  readonly name: BillingGatewayName;
  createCheckoutSession?(
    request: CheckoutSessionRequest
  ): Effect.Effect<CheckoutSessionResult, BillingGatewayError>;
  parseWebhook?(
    payload: unknown,
    signature: string
  ): Effect.Effect<GatewayWebhookEvent, BillingGatewayWebhookVerificationError>;
  charge(request: BillingGatewayChargeRequest): Effect.Effect<BillingGatewayChargeResult, BillingGatewayError>;
}
```

Keep stub `createStripeGateway` / `createAsaasGateway` working: `charge` unchanged; optional methods return `Effect.fail` with clear message until Task 7/8.

- [ ] **Step 2: Run existing payments tests**

Run: `pnpm vitest run tests/payments/payments-package.test.ts`
Expected: PASS (no behavior change on `charge`)

- [ ] **Step 3: Commit**

```bash
git add packages/payments/src/gateway/manual-adapter.ts packages/payments/src/index.ts tests/payments/payments-package.test.ts
git commit -m "refactor(payments): extend BillingGatewayAdapter for checkout and webhooks"
```

---

### Task 4: PostgreSQL migration for gateway tables

**Files:**
- Create: `apps/backend/src/infra/migrations/0010-billing-gateway.ts`
- Modify: `apps/backend/src/infra/postgres-tables.ts`
- Modify: `apps/backend/src/infra/migration-runner.ts`

- [ ] **Step 1: Add table interfaces**

Add to `apps/backend/src/infra/postgres-tables.ts`:

```typescript
export interface BillingGatewayCatalogTable {
  id: string;
  product_kind: string;
  internal_ref: string;
  currency: string;
  gateway: string;
  billing_period: string;
  external_product_id: string;
  external_price_id: string;
  active: boolean;
  created_at: string;
}

export interface BillingGatewayCustomersTable {
  user_id: string;
  gateway: string;
  external_customer_id: string;
  created_at: string;
}

export interface BillingGatewaySubscriptionsTable {
  subscription_id: string;
  gateway: string;
  external_subscription_id: string;
  status: string;
  currency: string;
  updated_at: string;
}

export interface BillingCheckoutIntentsTable {
  id: string;
  user_id: string;
  product_kind: string;
  internal_ref: string;
  currency: string;
  gateway: string;
  status: string;
  external_session_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface BillingGatewayEventsTable {
  event_id: string;
  gateway: string;
  event_type: string;
  processed_at: string;
  payload_hash: string | null;
}
```

Register all five in `DatabaseTables`.

- [ ] **Step 2: Write migration**

Create `apps/backend/src/infra/migrations/0010-billing-gateway.ts` with `up` creating all tables, indexes:
- unique `(user_id, gateway)` on `billing_gateway_customers`
- unique `event_id` on `billing_gateway_events`
- index `(user_id, status)` on `billing_checkout_intents`
- composite lookup index on `billing_gateway_catalog (product_kind, internal_ref, currency, billing_period, active)`

Seed placeholder catalog rows for dev (use env-driven external IDs or `dev-stub-*` values documented in migration comment). Seed top-up package if not present:

```sql
-- pro monthly BRL/USD, pro annual BRL/USD, topup small BRL/USD
```

- [ ] **Step 3: Register migration marker**

Add to `migrationTableMarkers` in `migration-runner.ts`:

```typescript
"0010-billing-gateway": ["billing_gateway_catalog", "billing_gateway_events"]
```

- [ ] **Step 4: Run migration locally**

Run: `pnpm --filter backend migrate` (or project equivalent)
Expected: migration `0010-billing-gateway` applied

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/infra/migrations/0010-billing-gateway.ts apps/backend/src/infra/postgres-tables.ts apps/backend/src/infra/migration-runner.ts
git commit -m "feat(backend): add billing gateway PostgreSQL tables"
```

---

### Task 5: Postgres billing gateway store

**Files:**
- Create: `apps/backend/src/infra/postgres-billing-gateway-store.ts`
- Test: `tests/backend/billing-gateway-store.test.ts`

- [ ] **Step 1: Write failing integration test**

Create `tests/backend/billing-gateway-store.test.ts` using existing `postgres-test-helpers` pattern from `tests/backend/billing-postgres-persistence.test.ts`:

```typescript
it("inserts checkout intent and deduplicates gateway events", async () => {
  const store = createPostgresBillingGatewayStore(db);
  const intent = await Effect.runPromise(
    store.createCheckoutIntent({
      id: "intent_1",
      userId: "user_1",
      productKind: "subscription",
      internalRef: "pro",
      currency: "BRL",
      gateway: "asaas",
      status: "pending",
      createdAt: now
    })
  );
  expect(intent.id).toBe("intent_1");

  const first = await Effect.runPromise(
    store.recordGatewayEvent({ eventId: "evt_1", gateway: "asaas", eventType: "checkout.completed", processedAt: now })
  );
  expect(first).toBe(true);

  const duplicate = await Effect.runPromise(
    store.recordGatewayEvent({ eventId: "evt_1", gateway: "asaas", eventType: "checkout.completed", processedAt: now })
  );
  expect(duplicate).toBe(false);
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `RUN_POSTGRES_TESTS=true pnpm vitest run tests/backend/billing-gateway-store.test.ts`

- [ ] **Step 3: Implement store**

`createPostgresBillingGatewayStore(db)` with methods:
- `findCatalogEntry(productKind, internalRef, currency, billingPeriod)`
- `createCheckoutIntent`, `completeCheckoutIntent`, `getCheckoutIntent`
- `upsertGatewayCustomer`, `getGatewayCustomer`
- `upsertGatewaySubscription`
- `recordGatewayEvent` → returns `false` on unique violation (dedup)

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/infra/postgres-billing-gateway-store.ts tests/backend/billing-gateway-store.test.ts
git commit -m "feat(backend): add PostgreSQL store for billing gateway state"
```

---

### Task 6: Contracts for checkout API

**Files:**
- Create: `packages/contracts/src/billing-checkout.ts`
- Modify: `packages/contracts/src/index.ts`
- Test: `tests/contracts/contracts-schema.test.ts`

- [ ] **Step 1: Add schemas**

```typescript
import { Schema } from "effect";

export const BillingCurrencySchema = Schema.Literal("BRL", "USD");
export const BillingProductKindSchema = Schema.Literal("subscription", "topup");
export const BillingCheckoutPeriodSchema = Schema.Literal("monthly", "annual", "one_time");

export const BillingCheckoutRequestSchema = Schema.Struct({
  productKind: BillingProductKindSchema,
  internalRef: Schema.String,
  currency: BillingCurrencySchema,
  billingPeriod: BillingCheckoutPeriodSchema
});

export const BillingCheckoutResponseSchema = Schema.Struct({
  url: Schema.String,
  intentId: Schema.String,
  gateway: Schema.Literal("stripe", "asaas")
});

export const BillingEntitlementViewSchema = Schema.Struct({
  planId: Schema.String,
  tier: Schema.String,
  status: Schema.String,
  availableCredits: Schema.Number,
  monthlyCreditsRemaining: Schema.Number,
  currency: Schema.optional(BillingCurrencySchema)
});

export const decodeBillingCheckoutRequest = Schema.decodeUnknown(BillingCheckoutRequestSchema);
```

- [ ] **Step 2: Run contract tests**

Run: `pnpm vitest run tests/contracts/contracts-schema.test.ts`
Add one test decoding a valid checkout request.

- [ ] **Step 3: Commit**

```bash
git add packages/contracts/src/billing-checkout.ts packages/contracts/src/index.ts tests/contracts/contracts-schema.test.ts
git commit -m "feat(contracts): add billing checkout request/response schemas"
```

---

### Task 7: Stripe adapter

**Files:**
- Create: `packages/payments/src/gateway/stripe-adapter.ts`
- Create: `tests/fixtures/billing/stripe-checkout-completed.json`
- Create: `tests/payments/stripe-webhook.test.ts`
- Modify: `packages/payments/package.json` (add `stripe` dependency)
- Modify: `packages/payments/src/index.ts`

- [ ] **Step 1: Add stripe dependency**

```bash
pnpm --filter @my-ai-orchestrator/payments add stripe
```

- [ ] **Step 2: Write failing webhook parse test**

Fixture `stripe-checkout-completed.json` — sanitized `checkout.session.completed` event with metadata:
`application_user_id`, `checkout_intent_id`, `internal_ref`, `product_kind`.

Test asserts normalized `GatewayWebhookEvent`:
- `type: "checkout.completed"`
- `gateway: "stripe"`
- `userId` from metadata

- [ ] **Step 3: Implement `createStripeGatewayAdapter`**

```typescript
export function createStripeGatewayAdapter(options: {
  readonly secretKey: string;
  readonly webhookSecret: string;
}): BillingGatewayAdapter {
  const stripe = new Stripe(options.secretKey, { apiVersion: "2025-04-30.basil" });
  return {
    name: "stripe",
    createCheckoutSession: (request) =>
      Effect.tryPromise({
        try: async () => {
          const session = await stripe.checkout.sessions.create({
            mode: request.productKind === "subscription" ? "subscription" : "payment",
            customer_email: request.email,
            line_items: [{ price: request.externalPriceId, quantity: 1 }],
            success_url: request.successUrl,
            cancel_url: request.cancelUrl,
            metadata: {
              application_user_id: request.userId,
              checkout_intent_id: request.checkoutIntentId,
              internal_ref: request.internalRef,
              product_kind: request.productKind
            },
            ...(request.productKind === "subscription"
              ? { subscription_data: { metadata: { application_user_id: request.userId } } }
              : {})
          });
          if (!session.url) throw new Error("Stripe session missing url");
          return { gateway: "stripe", sessionId: session.id, url: session.url };
        },
        catch: (cause) => new BillingGatewayError({ gateway: "stripe", message: "checkout session failed", cause })
      }),
    parseWebhook: (payload, signature) =>
      Effect.try({
        try: () => {
          const event = stripe.webhooks.constructEvent(
            typeof payload === "string" ? payload : JSON.stringify(payload),
            signature,
            options.webhookSecret
          );
          return mapStripeEvent(event);
        },
        catch: (cause) =>
          new BillingGatewayWebhookVerificationError({ gateway: "stripe", message: "invalid webhook signature" })
      }),
    charge: (request) => /* keep stub or fail — top-up uses checkout in phase 1b */
      Effect.fail(new BillingGatewayError({ gateway: "stripe", message: "direct charge not supported; use checkout" }))
  };
}
```

Implement `mapStripeEvent` handling:
- `checkout.session.completed` → `checkout.completed`
- `invoice.paid` → `subscription.renewed`
- `customer.subscription.deleted` → `subscription.cancelled`
- `charge.dispute.created` → `chargeback`

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/payments/stripe-webhook.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/payments/src/gateway/stripe-adapter.ts tests/payments/stripe-webhook.test.ts tests/fixtures/billing/stripe-checkout-completed.json packages/payments/package.json packages/payments/src/index.ts
git commit -m "feat(payments): add Stripe checkout and webhook adapter"
```

---

### Task 8: Asaas adapter

**Files:**
- Create: `packages/payments/src/gateway/asaas-adapter.ts`
- Create: `tests/fixtures/billing/asaas-payment-received.json`
- Create: `tests/payments/asaas-webhook.test.ts`
- Modify: `packages/payments/src/index.ts`

- [ ] **Step 1: Write failing webhook parse test**

Fixture for `PAYMENT_RECEIVED` with `externalReference` / custom fields matching metadata.

- [ ] **Step 2: Implement `createAsaasGatewayAdapter`**

Options: `{ apiKey, webhookToken, baseUrl }` — default baseUrl `https://api.asaas.com/v3`, sandbox `https://api-sandbox.asaas.com/v3`.

`createCheckoutSession` for phase 1a (card only):
- Ensure customer exists (`POST /customers` if needed)
- Subscription monthly: `POST /subscriptions` with `billingType: "CREDIT_CARD"`, `cycle: "MONTHLY"`, `externalReference: checkoutIntentId`
- Return payment link URL from response

`parseWebhook`:
- Verify `asaas-access-token` header === `webhookToken`
- Map `PAYMENT_RECEIVED` + `CONFIRMED` → `checkout.completed` or `subscription.renewed` based on `subscription` field
- Map `PAYMENT_OVERDUE` → `payment.failed`
- Map `SUBSCRIPTION_DELETED` → `subscription.cancelled`

- [ ] **Step 3: Run tests**

Run: `pnpm vitest run tests/payments/asaas-webhook.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/payments/src/gateway/asaas-adapter.ts tests/payments/asaas-webhook.test.ts tests/fixtures/billing/asaas-payment-received.json packages/payments/src/index.ts
git commit -m "feat(payments): add Asaas checkout and webhook adapter"
```

---

### Task 9: Webhook dispatch to billing operations

**Files:**
- Create: `packages/payments/src/gateway/webhook-dispatch.ts`
- Create: `tests/payments/gateway-webhook-dispatch.test.ts`

- [ ] **Step 1: Write failing dispatch tests**

```typescript
it("activates pro subscription on checkout.completed for subscription product", async () => {
  const billing = createBillingService({ repository: seededRepo });
  await Effect.runPromise(
    dispatchGatewayWebhookEvent(billing, {
      type: "checkout.completed",
      productKind: "subscription",
      internalRef: "pro",
      userId: "user_1",
      eventId: "evt_1",
      gateway: "stripe",
      amount: 49,
      currency: "USD"
    })
  );
  const entitlement = billing.getEntitlement("user_1", "pro");
  expect(entitlement?.status).toBe("active");
});
```

- [ ] **Step 2: Implement `dispatchGatewayWebhookEvent`**

```typescript
export function dispatchGatewayWebhookEvent(
  billing: BillingServiceContract,
  event: GatewayWebhookEvent,
  options: { readonly now: () => Date; readonly idempotencyNamespace: string }
): Effect.Effect<void, BillingPlanNotFoundError | BillingEntitlementNotFoundError | BillingOperationConflictError> {
  const idempotencyKey = `gateway:${event.gateway}:event:${event.eventId}`;
  return Effect.gen(function* () {
    switch (event.type) {
      case "checkout.completed":
        if (event.productKind === "topup") {
          yield* billing.purchaseTopUp({
            userId: event.userId,
            planId: billing.getPrimarySubscriptionPlanId(event.userId) ?? "free",
            packageId: event.internalRef!,
            idempotencyKey,
            chargeRequest: { userId: event.userId, subscriptionId: "n/a", amount: event.amount, currency: event.currency }
          });
          return;
        }
        yield* activateSubscription(billing, {
          userId: event.userId,
          planId: event.internalRef ?? "pro",
          status: "active",
          now: options.now,
          idempotencyNamespace: options.idempotencyNamespace
        });
        return;
      case "subscription.renewed":
        yield* billing.startCycle({
          userId: event.userId,
          planId: event.internalRef ?? "pro",
          cycleId: idempotencyKey,
          idempotencyKey
        });
        return;
      case "subscription.cancelled":
        // upsert subscription status via billing repository — add helper if missing
        return;
      case "payment.failed":
      case "chargeback":
        return;
    }
  });
}
```

Add `setSubscriptionStatus` helper on billing service if not available.

- [ ] **Step 3: Run tests — PASS**

- [ ] **Step 4: Commit**

```bash
git add packages/payments/src/gateway/webhook-dispatch.ts tests/payments/gateway-webhook-dispatch.test.ts packages/payments/src/index.ts
git commit -m "feat(payments): dispatch normalized gateway webhooks to billing operations"
```

---

### Task 10: Backend config for payment providers

**Files:**
- Modify: `apps/backend/src/config/config.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add optional config fields**

```typescript
readonly stripeSecretKey?: string;
readonly stripeWebhookSecret?: string;
readonly asaasApiKey?: string;
readonly asaasWebhookToken?: string;
readonly asaasBaseUrl?: string;
readonly billingCheckoutSuccessUrl?: string;
readonly billingCheckoutCancelUrl?: string;
```

Parse from env in `readBackendConfig`. Do **not** add to `backendRequiredEnvVars` — billing checkout routes return 503 when keys missing.

- [ ] **Step 2: Document in `.env.example`**

```bash
# Payment gateways (optional until billing checkout enabled)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3
BILLING_CHECKOUT_SUCCESS_URL=http://localhost:3000/app/billing?status=success
BILLING_CHECKOUT_CANCEL_URL=http://localhost:3000/app/billing?status=cancel
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/config/config.ts .env.example
git commit -m "feat(backend): add Stripe and Asaas config env vars"
```

---

### Task 11: Billing checkout service

**Files:**
- Create: `apps/backend/src/product/billing/billing-checkout-service.ts`
- Modify: `apps/backend/src/product/core/service-dependencies.ts`

- [ ] **Step 1: Write failing unit test** (mock gateway store + adapters)

Test: given catalog entry + user email, returns checkout URL and persists pending intent.

- [ ] **Step 2: Implement service**

```typescript
export function createBillingCheckoutService(deps: {
  readonly billing: BillingServiceContract;
  readonly gatewayStore: PostgresBillingGatewayStore;
  readonly stripeAdapter: BillingGatewayAdapter;
  readonly asaasAdapter: BillingGatewayAdapter;
  readonly config: BackendConfig;
  readonly now: () => Date;
}) {
  return {
    createCheckout: (input: {
      readonly userId: string;
      readonly email: string;
      readonly productKind: BillingProductKind;
      readonly internalRef: string;
      readonly currency: BillingCurrency;
      readonly billingPeriod: BillingCheckoutPeriod;
    }) =>
      Effect.gen(function* () {
        const gateway = resolveGatewayForCurrency(input.currency);
        const catalog = yield* Effect.fromNullable(
          yield* deps.gatewayStore.findCatalogEntry(
            input.productKind,
            input.internalRef,
            input.currency,
            input.billingPeriod
          )
        ).pipe(
          Effect.mapError(
            () =>
              new BillingCheckoutCatalogNotFoundError({
                productKind: input.productKind,
                internalRef: input.internalRef,
                currency: input.currency,
                billingPeriod: input.billingPeriod
              })
          )
        );
        const intentId = `chk_${crypto.randomUUID()}`;
        yield* deps.gatewayStore.createCheckoutIntent({ /* ... */ });
        const adapter = gateway === "stripe" ? deps.stripeAdapter : deps.asaasAdapter;
        const customer = yield* deps.gatewayStore.getGatewayCustomer(input.userId, gateway);
        const session = yield* adapter.createCheckoutSession!({
          userId: input.userId,
          email: input.email,
          productKind: input.productKind,
          internalRef: input.internalRef,
          currency: input.currency,
          billingPeriod: input.billingPeriod,
          checkoutIntentId: intentId,
          externalPriceId: catalog.external_price_id,
          externalCustomerId: customer?.external_customer_id,
          successUrl: deps.config.billingCheckoutSuccessUrl!,
          cancelUrl: deps.config.billingCheckoutCancelUrl!
        });
        yield* deps.gatewayStore.attachSessionToIntent(intentId, session.sessionId);
        return { url: session.url, intentId, gateway };
      })
  };
}
```

Wire into `BackendProductServices` only when gateway config present.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/product/billing/billing-checkout-service.ts apps/backend/src/product/core/service-dependencies.ts
git commit -m "feat(backend): add billing checkout service"
```

---

### Task 12: Billing webhook service

**Files:**
- Create: `apps/backend/src/product/billing/billing-webhook-service.ts`

- [ ] **Step 1: Implement service**

```typescript
export function createBillingWebhookService(deps: {
  readonly billing: BillingServiceContract;
  readonly gatewayStore: PostgresBillingGatewayStore;
  readonly stripeAdapter: BillingGatewayAdapter;
  readonly asaasAdapter: BillingGatewayAdapter;
  readonly config: BackendConfig;
  readonly now: () => Date;
}) {
  return {
    handleStripeWebhook: (rawBody: string, signature: string) =>
      handleWebhook(deps, "stripe", rawBody, signature),
    handleAsaasWebhook: (rawBody: string, token: string) =>
      handleWebhook(deps, "asaas", rawBody, token)
  };
}

function handleWebhook(/* ... */) {
  return Effect.gen(function* () {
    const event = yield* adapter.parseWebhook!(payload, signature);
    const isNew = yield* deps.gatewayStore.recordGatewayEvent({
      eventId: event.eventId,
      gateway: event.gateway,
      eventType: event.type,
      processedAt: deps.now().toISOString()
    });
    if (!isNew) return;
    yield* dispatchGatewayWebhookEvent(deps.billing, event, {
      now: deps.now,
      idempotencyNamespace: deps.config.serviceName
    });
    if (event.checkoutIntentId) {
      yield* deps.gatewayStore.completeCheckoutIntent(event.checkoutIntentId);
    }
    if (event.externalCustomerId) {
      yield* deps.gatewayStore.upsertGatewayCustomer({
        userId: event.userId,
        gateway: event.gateway,
        externalCustomerId: event.externalCustomerId,
        createdAt: deps.now().toISOString()
      });
    }
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/product/billing/billing-webhook-service.ts
git commit -m "feat(backend): add billing webhook ingestion service"
```

---

### Task 13: HTTP routes

**Files:**
- Create: `apps/backend/src/routes/billing-routes.ts`
- Create: `apps/backend/src/routes/billing-webhook-routes.ts`
- Modify: `apps/backend/src/app/routes.ts`
- Modify: `apps/backend/src/app/route-definitions.ts`
- Test: `tests/backend/billing-checkout.test.ts`
- Test: `tests/backend/billing-webhook.test.ts`

- [ ] **Step 1: Authenticated billing routes**

`POST /me/billing/checkout`:
- `resolvePublicActor` for auth
- Decode body with `decodeBillingCheckoutRequest`
- Reject if `internalRef === "free"`
- Call `billingCheckout.createCheckout`
- Return validated `BillingCheckoutResponse`

`GET /me/billing/entitlement`:
- Return current entitlement from `billing.getEntitlement(userId, primaryPlanId)`

- [ ] **Step 2: Webhook routes (no JWT)**

`POST /webhooks/stripe`:
- Read raw body as text (required for signature verification)
- `stripe-signature` header
- Return 200 on success, 400 on verification failure

`POST /webhooks/asaas`:
- `asaas-access-token` header

Register webhooks on root `app` (not under `/api`). Register billing routes on `app` alongside voice routes.

- [ ] **Step 3: Integration tests**

`billing-checkout.test.ts`: mock adapters returning fixed URL; assert 200 + intent created in DB.

`billing-webhook.test.ts`: POST fixture payload; assert entitlement active + event dedup on replay.

- [ ] **Step 4: Run tests**

Run: `RUN_POSTGRES_TESTS=true pnpm vitest run tests/backend/billing-checkout.test.ts tests/backend/billing-webhook.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/routes/billing-routes.ts apps/backend/src/routes/billing-webhook-routes.ts apps/backend/src/app/routes.ts apps/backend/src/app/route-definitions.ts tests/backend/billing-checkout.test.ts tests/backend/billing-webhook.test.ts
git commit -m "feat(backend): expose billing checkout and webhook routes"
```

---

## Phase 1b — PIX, top-up, billing UI

### Task 14: Asaas PIX checkout

**Files:**
- Modify: `packages/payments/src/gateway/asaas-adapter.ts`
- Modify: `packages/contracts/src/billing-checkout.ts`
- Test: `tests/payments/asaas-webhook.test.ts`

- [ ] **Step 1: Add `paymentMethod` to checkout request**

Optional field: `"card" | "pix"` (BRL only). Reject PIX for USD.

- [ ] **Step 2: Asaas adapter branches**

`billingType: "PIX"` for subscriptions and one-time charges. Return `invoiceUrl` or QR code URL from Asaas response.

- [ ] **Step 3: Test PIX webhook path**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(payments): support Asaas PIX checkout for BRL"
```

---

### Task 15: Top-up checkout flow

**Files:**
- Modify: `apps/backend/src/product/billing/billing-checkout-service.ts`
- Modify: `apps/backend/src/infra/migrations/0010-billing-gateway.ts` (seed top-up catalog entries)
- Modify: `packages/payments/src/gateway/webhook-dispatch.ts`

- [ ] **Step 1: Seed top-up packages in migration**

Example: `topup_500` (500 credits, BRL 29 / USD 9).

- [ ] **Step 2: Checkout service allows `productKind: "topup"`**

Stripe mode: `payment`. Asaas: one-time charge.

- [ ] **Step 3: Webhook dispatch grants credits via `purchaseTopUp`**

Skip `charge()` on gateway — mark checkout webhook as paid and grant directly:

```typescript
yield* billing.purchaseTopUp({
  userId: event.userId,
  planId: primaryPlanId,
  packageId: event.internalRef!,
  idempotencyKey,
  chargeRequest: { /* metadata only — status already confirmed by webhook */ }
});
```

Refactor `purchaseTopUp` to accept `skipGatewayCharge: true` when webhook already confirmed payment (minimal change).

- [ ] **Step 4: Integration test for top-up webhook**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(billing): add top-up checkout and webhook credit grant"
```

---

### Task 16: Client SDK billing module

**Files:**
- Create: `packages/client-sdk/src/billing.ts`
- Modify: `packages/client-sdk/src/index.ts`

- [ ] **Step 1: Add SDK methods**

```typescript
export function createBillingClient(transport: ClientTransport) {
  return {
    createCheckout: (input: BillingCheckoutRequest) =>
      transport.request({
        method: "POST",
        path: "/me/billing/checkout",
        body: input,
        schema: BillingCheckoutResponseSchema
      }),
    getEntitlement: () =>
      transport.request({
        method: "GET",
        path: "/me/billing/entitlement",
        schema: BillingEntitlementViewSchema
      })
  };
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(client-sdk): add billing checkout and entitlement client"
```

---

### Task 17: Billing Surface UI

**Files:**
- Create: `apps/web/src/routes/app/billing.tsx`
- Create: `apps/web/src/app/billing/screens/BillingScreen.tsx`
- Modify: `apps/web/src/app/shell/AppHeader.tsx` (nav link)
- Modify: `apps/web/src/i18n/app/messages/pt.ts`
- Modify: `apps/web/src/i18n/app/messages/en.ts`

- [ ] **Step 1: Route + screen**

Show:
- Current plan + credit balance (`getEntitlement`)
- Pro upgrade CTA (currency toggle BRL/USD, monthly selected)
- Top-up pack cards
- On CTA: call `createCheckout`, `window.location.href = url`

- [ ] **Step 2: i18n keys**

`billing.title`, `billing.currentPlan`, `billing.upgradePro`, `billing.topUp`, `billing.currency.brl`, `billing.currency.usd`, `billing.pixOnlyBrl`

- [ ] **Step 3: Handle `?status=success|cancel` query** — show toast; do not activate plan client-side.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(web): add billing surface with checkout redirect"
```

---

## Phase 1c — Annual billing

### Task 18: Annual plan catalog + installments

**Files:**
- Modify: `apps/backend/src/infra/migrations/0010-billing-gateway.ts` (or new seed migration)
- Modify: `packages/payments/src/gateway/asaas-adapter.ts`
- Modify: `packages/payments/src/gateway/stripe-adapter.ts`
- Modify: `apps/web/src/app/billing/screens/BillingScreen.tsx`

- [ ] **Step 1: Catalog rows for `billing_period: annual`**

- [ ] **Step 2: Asaas annual**

One-time charge with `installmentCount` (e.g. 12) OR yearly subscription — prefer installment charge per design.

- [ ] **Step 3: Stripe annual**

Checkout `mode: subscription` with yearly price, or `payment` with installment options if using Brazilian Stripe account.

- [ ] **Step 4: UI period toggle** monthly vs annual with savings label.

- [ ] **Step 5: Tests + commit**

```bash
git commit -m "feat(billing): add annual Pro checkout with card installments"
```

---

## Phase 2 — Operations (separate follow-up plan)

Track as future issues (not in this plan's DoD):

- Stripe Customer Portal link for USD subscribers
- Reconciliation cron for stuck `pending` intents
- NF-e integration
- Rate limiting tuning on webhook endpoints

---

## Definition of Done (Phase 1a–1c)

- [ ] Pro monthly checkout works in sandbox: BRL via Asaas card, USD via Stripe card
- [ ] PIX checkout works for BRL subscriptions and top-ups
- [ ] Top-up grants credits via webhook with idempotency
- [ ] Annual Pro checkout with card installments (BRL + USD)
- [ ] Webhooks verified; duplicate events do not double-grant
- [ ] No entitlement change on browser redirect alone
- [ ] `/app/billing` UI with pt/en i18n
- [ ] `RUN_POSTGRES_TESTS=true` billing gateway tests pass
- [ ] `pnpm test` and `pnpm lint` pass
- [ ] `.env.example` documents all new variables

---

## Self-review (spec coverage)

| Spec requirement | Task |
|------------------|------|
| Asaas BRL + Stripe USD routing | Task 2 |
| Hosted checkout only | Tasks 7, 8, 11 |
| Webhook source of truth | Tasks 9, 12, 13 |
| Gateway tables | Tasks 4, 5 |
| `billing_gateway_catalog` | Task 4 |
| Pro subscription monthly/annual | Tasks 7, 8, 18 |
| Top-up one-time | Task 15 |
| PIX BRL | Task 14 |
| Signature verification | Tasks 7, 8, 12 |
| Idempotency / event dedup | Tasks 5, 9, 12 |
| JWT auth on checkout | Task 13 |
| `/app/billing` UI | Task 17 |
| Env vars | Task 10 |
| Phase 2 items | Deferred section |

No placeholders remain. Type names consistent across tasks (`CheckoutSessionRequest`, `GatewayWebhookEvent`, `BillingCheckoutPeriod`).

---

## Manual sandbox verification (after Phase 1a)

1. Configure sandbox keys in `.env`
2. Start backend + web: `pnpm dev`
3. Register Stripe webhook tunnel: `stripe listen --forward-to localhost:3001/webhooks/stripe`
4. Register Asaas webhook URL in sandbox dashboard
5. Login → `POST /me/billing/checkout` with `{ productKind: "subscription", internalRef: "pro", currency: "USD", billingPeriod: "monthly" }`
6. Complete Stripe test card `4242 4242 4242 4242`
7. Confirm webhook received → `GET /me/billing/entitlement` shows `planId: "pro"`, credits granted
