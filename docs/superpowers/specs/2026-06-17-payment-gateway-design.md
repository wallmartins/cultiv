---
title: Payment Gateway Design — Stripe + Asaas
doc_type: design
status: approved
domain: billing
last_updated: 2026-06-17
---

# Payment Gateway Design — Stripe + Asaas

## Summary

Integrate hosted checkout and webhook-driven entitlement updates for the Cultiv billing model using a hybrid gateway strategy:

- **Asaas** for Brazilian customers paying in **BRL** (PIX + credit card)
- **Stripe** for international customers paying in **USD** (credit card)

The existing credit-based billing engine in `packages/payments` remains the source of truth for subscriptions, wallets, ledger entries, and top-ups. Payment providers are thin adapters behind `BillingGatewayAdapter`.

## Problem

Cultiv has a complete internal billing model (plans, subscriptions, credit reservation/capture, ledger, top-ups, PostgreSQL persistence) but no real payment integration. Checkout and the Billing Surface were explicitly deferred from web v2.

The product must monetize Brazilian and international users with:

- Monthly and annual **Pro** subscriptions
- Standalone **top-up** credit packs
- **BRL** and **USD** pricing
- **PIX** and credit card (no boleto at launch)
- Annual card installments when recurring billing is not applicable

## Goals

1. Activate paid plans and grant top-up credits only after confirmed payment events.
2. Minimize PCI scope via hosted checkout pages.
3. Reuse existing `packages/payments` primitives (`activateSubscription`, `startCycle`, `purchaseTopUp`, idempotency).
4. Support BRL and USD with deterministic gateway routing.
5. Maintain an auditable ledger trail for every commercial event.

## Non-Goals (Phase 1)

- NF-e (Brazilian tax invoice) automation
- Self-service Customer Portal (cancellation, payment method update)
- Boleto
- Currencies beyond BRL and USD
- Apple Pay / Google Pay (can be added later via Stripe with minimal effort)

## Context

| Area | Current state |
|------|---------------|
| `packages/payments` | Full credit billing; stub `createStripeGateway` / `createAsaasGateway` |
| PostgreSQL | `billing_subscriptions`, `billing_ledger_entries`, `billing_top_up_packages`, idempotency keys |
| Auth | Auth0 JWT; `Application User` provisioned via JIT |
| i18n | pt/en in `apps/web` |
| Plans | `free` (50 credits/mo), `pro` (2500 credits/mo) |

## Provider Decision

### Selected: Stripe + Asaas (hybrid)

| Market | Provider | Methods |
|--------|----------|---------|
| Brazil / BRL | Asaas | PIX, credit card |
| International / USD | Stripe | Credit card |

### Routing rule

```
currency === "BRL"  →  Asaas
currency === "USD"  →  Stripe
```

Users may explicitly choose currency at checkout. PIX is only offered for BRL. Default currency follows locale (`pt` → BRL, `en` → USD) with override allowed.

### Why not a single provider?

- **Stripe only:** workable for BRL + USD, but weaker Brazilian PIX/subscription UX and annual installment ergonomics compared to Asaas.
- **Asaas only:** no real USD checkout; blocks the international requirement.
- **Mercado Pago:** viable for Brazil but less aligned with SaaS B2B subscription APIs; deferred unless conversion data justifies a switch.

## Architecture

```
apps/web (/app/billing)
    ↓ POST /api/billing/checkout
apps/backend
    ├── GatewayRouter (BRL → Asaas | USD → Stripe)
    ├── BillingCheckoutService
    ├── BillingWebhookController (Stripe + Asaas)
    └── BillingService (packages/payments)
         ↓
PostgreSQL
```

### Core principles

1. **Hosted checkout only** — never collect card data in Cultiv frontend or backend.
2. **Webhooks are the source of truth** — browser redirect success is informational only.
3. **Gateway adapters are thin** — business logic stays in `packages/payments`.
4. **Product catalog is mirrored** — each plan/package has external IDs per gateway and currency.

## Commercial Catalog

| Product | Type | Billing periods | Gateway |
|---------|------|-----------------|---------|
| Free | Subscription | — | No charge (existing JIT bootstrap) |
| Pro | Subscription | Monthly recurring, Annual (card installments) | Asaas (BRL) / Stripe (USD) |
| Top-up packs | One-time | Ad hoc | Same routing by currency |

### `billing_gateway_catalog` (new table)

Maps internal catalog entries to provider objects:

| Column | Description |
|--------|-------------|
| `id` | Primary key |
| `product_kind` | `subscription` \| `topup` |
| `internal_ref` | `plan_id` or `package_id` |
| `currency` | `BRL` \| `USD` |
| `gateway` | `stripe` \| `asaas` |
| `billing_period` | `monthly` \| `annual` \| `one_time` |
| `external_product_id` | Provider product/plan ID |
| `external_price_id` | Provider price ID (Stripe) or equivalent |
| `active` | Boolean |
| `created_at` | Timestamp |

Price changes create new catalog rows; retired rows remain for audit (aligned with billing policy versioning).

## Data Model (new tables)

### `billing_gateway_customers`

| Column | Description |
|--------|-------------|
| `user_id` | Application User ID |
| `gateway` | `stripe` \| `asaas` |
| `external_customer_id` | Provider customer ID |
| `created_at` | Timestamp |

Unique on (`user_id`, `gateway`).

### `billing_gateway_subscriptions`

| Column | Description |
|--------|-------------|
| `subscription_id` | Internal billing subscription ID |
| `gateway` | `stripe` \| `asaas` |
| `external_subscription_id` | Provider subscription ID |
| `status` | `active` \| `cancelled` \| `past_due` \| `suspended` |
| `currency` | `BRL` \| `USD` |
| `updated_at` | Timestamp |

### `billing_checkout_intents`

| Column | Description |
|--------|-------------|
| `id` | Intent ID |
| `user_id` | Application User ID |
| `product_kind` | `subscription` \| `topup` |
| `internal_ref` | Plan or package ID |
| `currency` | `BRL` \| `USD` |
| `gateway` | Resolved gateway |
| `status` | `pending` \| `completed` \| `expired` \| `failed` |
| `external_session_id` | Checkout session / payment link ID |
| `created_at` | Timestamp |
| `completed_at` | Nullable timestamp |

### `billing_gateway_events`

| Column | Description |
|--------|-------------|
| `event_id` | Provider event ID (unique) |
| `gateway` | `stripe` \| `asaas` |
| `event_type` | Provider event type string |
| `processed_at` | Timestamp |
| `payload_hash` | Optional hash for debugging |

Unique on `event_id` for webhook deduplication.

## Gateway Adapter Interface

Extend `BillingGatewayAdapter` in `packages/payments`:

```typescript
interface BillingGatewayAdapter {
  readonly name: BillingGatewayName;
  createCheckoutSession(
    request: CheckoutSessionRequest
  ): Effect.Effect<CheckoutSessionResult, BillingGatewayError>;
  parseWebhook(
    payload: unknown,
    signature: string
  ): Effect.Effect<GatewayWebhookEvent, BillingGatewayError>;
  charge(
    request: BillingGatewayChargeRequest
  ): Effect.Effect<BillingGatewayChargeResult, BillingGatewayError>;
}
```

Existing stub implementations (`createStripeGateway`, `createAsaasGateway`) become real adapters. `createManualGateway` remains for dev/tests.

### `CheckoutSessionRequest`

| Field | Description |
|-------|-------------|
| `userId` | Application User ID |
| `email` | Customer email (from Auth0) |
| `productKind` | `subscription` \| `topup` |
| `internalRef` | Plan or package ID |
| `currency` | `BRL` \| `USD` |
| `billingPeriod` | `monthly` \| `annual` \| `one_time` |
| `successUrl` | Redirect after payment |
| `cancelUrl` | Redirect on cancel |
| `metadata` | Includes `application_user_id`, `checkout_intent_id` |

### `GatewayWebhookEvent` (normalized)

| Field | Description |
|-------|-------------|
| `eventId` | Provider event ID |
| `type` | Normalized event type |
| `userId` | From metadata |
| `checkoutIntentId` | From metadata |
| `amount` | Paid amount |
| `currency` | `BRL` \| `USD` |
| `externalSubscriptionId` | If subscription event |
| `externalCustomerId` | Provider customer ID |
| `raw` | Original payload (stored in logs only, not ledger) |

### Normalized webhook event types

| Type | Action |
|------|--------|
| `checkout.completed` | Activate subscription or grant top-up |
| `subscription.renewed` | `startCycle` for new billing period |
| `subscription.cancelled` | Set subscription `status: cancelled` |
| `payment.failed` | Log; no entitlement change |
| `chargeback` | Set subscription `status: suspended` |

## Data Flows

### Pro subscription (monthly / annual)

1. User selects Pro, currency, and period in `/app/billing`.
2. Frontend calls `POST /api/billing/checkout` with JWT.
3. Backend resolves gateway via `GatewayRouter`, creates `billing_checkout_intent` (pending).
4. Backend calls provider to create hosted checkout session; returns `{ url, intentId }`.
5. User completes payment on provider page.
6. Provider sends webhook to backend.
7. Backend verifies signature, deduplicates by `event_id`.
8. On success:
   - `activateSubscription(userId, planId: "pro")`
   - `startCycle` with idempotency key `gateway:{gateway}:event:{eventId}`
   - Persist `billing_gateway_customer` and `billing_gateway_subscription`
   - Mark checkout intent `completed`

### Top-up (one-time)

Same flow through step 7, then calls `purchaseTopUp` instead of `activateSubscription`. Ledger entry type: `grant_topup`.

### Monthly renewal

| Provider | Trigger | Action |
|----------|---------|--------|
| Stripe | `invoice.paid` | `startCycle` with idempotency `gateway:stripe:invoice:{id}` |
| Asaas | `PAYMENT_RECEIVED` on subscription charge | Same pattern |

### Cancellation

Provider webhook → set internal subscription `status: cancelled`. User retains credits until end of paid cycle. No retroactive credit removal.

### Annual installments

- **Asaas:** create annual charge with `installmentCount`; activate plan on first installment confirmation.
- **Stripe:** configure installment options on annual Checkout Session; activate on first successful payment.

## API Surface (backend)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/billing/checkout` | JWT | Create checkout session |
| `POST /api/webhooks/stripe` | Signature | Stripe webhook ingestion |
| `POST /api/webhooks/asaas` | Signature/token | Asaas webhook ingestion |
| `GET /api/billing/entitlement` | JWT | Existing or new read model for `/app/billing` |

Checkout request body:

```json
{
  "productKind": "subscription",
  "internalRef": "pro",
  "currency": "BRL",
  "billingPeriod": "monthly"
}
```

`userId` is never accepted from the client body; it is derived from the JWT.

## Security

| Layer | Requirement |
|-------|-------------|
| Secrets | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ASAAS_API_KEY` in backend env only |
| PCI | Hosted checkout only (SAQ A scope) |
| Webhooks | Mandatory signature verification; reject unsigned/invalid requests with 400 |
| Idempotency | `billing_gateway_events.event_id` unique + ledger `idempotency_key` per grant |
| Authorization | All checkout routes require Auth0 JWT |
| Metadata | `application_user_id` on every checkout session for webhook correlation |
| Rate limiting | Apply to checkout and webhook endpoints |
| Audit | Every grant/refund writes ledger entry with `metadata.gateway` and `metadata.transaction_id` |
| Environments | Separate sandbox/production keys per provider |

### Prohibited

- Activating entitlements on browser redirect alone
- Trusting payment status from frontend
- Storing PAN, CVV, or raw card data

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Webhook arrives before browser redirect | Expected; entitlement updates via webhook |
| Webhook delivery failure | Provider retries; idempotency prevents double-grant |
| Webhook lost entirely | Reconciliation job polls provider by `checkout_intent_id` (phase 1b+) |
| User switches currency mid-subscription | Block with clear error; require cancellation before currency change |
| Duplicate webhook | No-op via `billing_gateway_events` dedup |
| Payment failed | No entitlement change; optional user notification |
| Chargeback | `status: suspended`; block new generations |

## Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `StripeGatewayAdapter` | `packages/payments` | Stripe Checkout, Customer, webhook parsing |
| `AsaasGatewayAdapter` | `packages/payments` | Asaas charges, subscriptions, webhook parsing |
| `GatewayRouter` | `packages/payments` | Select adapter by currency |
| `BillingCheckoutService` | `apps/backend` | Intent creation, session orchestration |
| `BillingWebhookController` | `apps/backend` | Signature verify, event dispatch |
| `BillingSurface` UI | `apps/web` | Plan selection, checkout redirect, entitlement display |

## Testing

| Level | Coverage |
|-------|----------|
| Unit | `GatewayRouter`, webhook parsing, idempotency, normalized event mapping |
| Integration | Full flow with mock adapters + PostgreSQL billing store |
| Contract | Fixture payloads from Stripe and Asaas (sanitized) |
| E2E (staging) | Sandbox: Pro monthly BRL (PIX), USD (card), top-up pack |

## Delivery Phases

### Phase 1a — Core checkout

- Real Stripe and Asaas adapters
- Webhook ingestion with signature verification
- Pro monthly subscription (card) for BRL and USD
- `billing_gateway_*` tables and migrations

### Phase 1b — PIX and top-up

- Asaas PIX for BRL subscriptions and top-ups
- Top-up one-time checkout flow
- Basic `/app/billing` UI (plan + top-up selection)

### Phase 1c — Annual billing

- Annual Pro plan with card installments (Asaas + Stripe)
- Checkout UX for monthly vs annual selection

### Phase 2 — Operations

- Customer Portal (Stripe; manual/Asaas link for BRL)
- Reconciliation job for missed webhooks
- NF-e integration (separate spec)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Prod/staging | Stripe API secret |
| `STRIPE_WEBHOOK_SECRET` | Prod/staging | Webhook signing secret |
| `ASAAS_API_KEY` | Prod/staging | Asaas API key |
| `ASAAS_WEBHOOK_TOKEN` | Prod/staging | Asaas webhook auth token |
| `BILLING_CHECKOUT_SUCCESS_URL` | Yes | Post-payment redirect |
| `BILLING_CHECKOUT_CANCEL_URL` | Yes | Cancel redirect |

## Open Questions (resolved)

| Question | Decision |
|----------|----------|
| Provider for Brazil | Asaas |
| Provider for international | Stripe |
| Boleto | Not in scope |
| Monetization model | Subscription + top-up |
| Legal entity | Brazilian CNPJ |
| Currencies | BRL + USD |
| Billing periods | Monthly + annual + top-up |

## References

- `packages/payments` — billing engine and `BillingGatewayAdapter` stubs
- `docs/archive/policies/billing-model-policy.md` — credit and versioning policy
- `docs/adr/0002-plan-tier-quality-modes-and-default-free-subscription.md` — plan tiers
- `docs/live/prd/plan-tier-quality-modes.md` — commercial gating model
