import { describe, expect, it, vi } from "vitest";
import { Effect, Option } from "effect";
import { createDatabase } from "@my-ai-orchestrator/database";
import {
  activateSubscription,
  BillingGatewayError,
  createBillingRepository,
  createBillingService,
  DEFAULT_BILLING_PLANS,
  type BillingGatewayAdapter
} from "@my-ai-orchestrator/payments";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import { registerBackendBillingPlans } from "../src/product/billing/billing-bootstrap.js";
import { createBackendAccountService, isValidAccountDeleteConfirmation } from "../src/product/account/account-service.js";
import type { PostgresBillingGatewayStore } from "../src/infra/postgres-billing-gateway-store.js";

function stubGatewayStore(overrides?: Partial<PostgresBillingGatewayStore>): PostgresBillingGatewayStore {
  return {
    findCatalogEntry: () => Effect.succeed(Option.none()),
    createCheckoutIntent: () => Effect.die("not used"),
    completeCheckoutIntent: () => Effect.die("not used"),
    getCheckoutIntent: () => Effect.succeed(Option.none()),
    attachSessionToIntent: () => Effect.die("not used"),
    upsertGatewayCustomer: () => Effect.die("not used"),
    getGatewayCustomer: () => Effect.succeed(Option.none()),
    upsertGatewaySubscription: () => Effect.die("not used"),
    getGatewaySubscription: () => Effect.succeed(Option.none()),
    recordGatewayEvent: () => Effect.die("not used"),
    hasProcessedGatewayEvent: () => Effect.succeed(false),
    ...overrides
  } as unknown as PostgresBillingGatewayStore;
}

describe("isValidAccountDeleteConfirmation", () => {
  it("accepts the exact pt-BR or en phrase only", () => {
    expect(isValidAccountDeleteConfirmation("EXCLUIR")).toBe(true);
    expect(isValidAccountDeleteConfirmation("DELETE")).toBe(true);
    expect(isValidAccountDeleteConfirmation("delete")).toBe(false);
    expect(isValidAccountDeleteConfirmation("excluir")).toBe(false);
    expect(isValidAccountDeleteConfirmation("")).toBe(false);
    expect(isValidAccountDeleteConfirmation(undefined)).toBe(false);
  });
});

// contract-08 §5 — runnable checks that don't require Postgres: everything up to (and not
// including) runAccountDeleteTransaction, which needs a real db.transaction() and is exercised
// only under pnpm test:postgres.
describe("BackendAccountService.delete — orchestration safety", () => {
  it("rejects a confirmation mismatch with zero mutation, never running pre-purge", async () => {
    const users = createBackendApplicationUserMemoryRepository();
    Effect.runSync(users.create({ id: "user-1", externalSubject: "auth0|user-1", status: "active" }));
    const billing = createBillingService({ repository: createBillingRepository() });
    const service = createBackendAccountService({
      users,
      database: createDatabase(),
      gatewayCancel: { billing, gatewayStore: stubGatewayStore() },
      now: () => new Date()
    });
    const prePurge = vi.fn(() => Effect.succeed(undefined));

    const result = await Effect.runPromise(
      Effect.either(service.delete("user-1", { confirmation: "nope" }, prePurge))
    );

    expect(result._tag).toBe("Left");
    expect(prePurge).not.toHaveBeenCalled();
    const stillActive = Effect.runSync(users.findById("user-1"));
    expect(stillActive?.status).toBe("active");
  });

  it("is idempotent — a second delete on an already-tombstoned account is a no-op, never running pre-purge", async () => {
    const users = createBackendApplicationUserMemoryRepository();
    const created = Effect.runSync(
      users.create({ id: "user-1", externalSubject: "auth0|user-1", status: "active" })
    );
    Effect.runSync(users.tombstone(created.id, new Date()));
    const billing = createBillingService({ repository: createBillingRepository() });
    const service = createBackendAccountService({
      users,
      database: createDatabase(),
      gatewayCancel: { billing, gatewayStore: stubGatewayStore() },
      now: () => new Date()
    });
    const prePurge = vi.fn(() => Effect.succeed(undefined));

    const result = await Effect.runPromise(service.delete("user-1", { confirmation: "DELETE" }, prePurge));
    expect(result).toEqual({ status: "deleted" });
    expect(prePurge).not.toHaveBeenCalled();
  });

  it("aborts the whole delete when the gateway cancel fails — nothing purged, pre-purge never runs either", async () => {
    const users = createBackendApplicationUserMemoryRepository();
    Effect.runSync(users.create({ id: "user-1", externalSubject: "auth0|user-1", status: "active" }));

    const billing = createBillingService({ repository: createBillingRepository() });
    Effect.runSync(registerBackendBillingPlans(billing));
    const planId = DEFAULT_BILLING_PLANS[0].id;
    Effect.runSync(activateSubscription(billing, { userId: "user-1", planId, now: () => new Date(), status: "active" }));

    const failingStripeAdapter: BillingGatewayAdapter = {
      name: "stripe",
      charge: () => Effect.die("not used"),
      cancelSubscription: () =>
        Effect.fail(new BillingGatewayError({ gateway: "stripe", message: "stripe is down" }))
    };

    const gatewayStore = stubGatewayStore({
      getGatewaySubscription: () =>
        Effect.succeed(
          Option.some({
            subscriptionId: `user-1:${planId}:subscription`,
            gateway: "stripe",
            externalSubscriptionId: "sub_123",
            status: "active",
            currency: "USD",
            updatedAt: new Date().toISOString()
          })
        )
    });

    const service = createBackendAccountService({
      users,
      database: createDatabase(),
      gatewayCancel: { billing, gatewayStore, stripeAdapter: failingStripeAdapter },
      now: () => new Date()
    });
    const prePurge = vi.fn(() => Effect.succeed(undefined));

    const result = await Effect.runPromise(
      Effect.either(service.delete("user-1", { confirmation: "DELETE" }, prePurge))
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(BillingGatewayError);
    }

    // this is the fix under test: a failed gateway cancel must not have destroyed in-flight work
    // or session state — pre-purge is gated behind the SAME success the transaction is.
    expect(prePurge).not.toHaveBeenCalled();
    const stillActive = Effect.runSync(users.findById("user-1"));
    expect(stillActive?.status).toBe("active");
  });

  it("runs pre-purge only after a successful gateway cancel, before attempting the purge transaction", async () => {
    const users = createBackendApplicationUserMemoryRepository();
    Effect.runSync(users.create({ id: "user-1", externalSubject: "auth0|user-1", status: "active" }));
    // no subscription at all — cancelActiveGatewaySubscriptionIfAny is a no-op success.
    const billing = createBillingService({ repository: createBillingRepository() });
    const service = createBackendAccountService({
      users,
      database: createDatabase(), // in-memory — the transaction itself will fail ("requires PostgreSQL")
      gatewayCancel: { billing, gatewayStore: stubGatewayStore() },
      now: () => new Date()
    });
    const prePurge = vi.fn(() => Effect.succeed(undefined));

    const result = await Effect.runPromise(
      Effect.either(service.delete("user-1", { confirmation: "DELETE" }, prePurge))
    );

    // pre-purge DID run (gateway cancel succeeded as a no-op); the transaction then fails because
    // this test uses an in-memory database, which is the expected/only failure mode here.
    expect(prePurge).toHaveBeenCalledOnce();
    expect(result._tag).toBe("Left");
  });
});
