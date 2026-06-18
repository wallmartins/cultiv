import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAsaasBillingType, mapAsaasWebhookEvent } from "../../packages/payments/src/gateway/asaas-adapter.js";

const fixturePath = resolve(
  import.meta.dirname,
  "../fixtures/billing/asaas-payment-received.json"
);

describe("mapAsaasWebhookEvent", () => {
  it("resolves PIX billing type when payment method is pix", () => {
    expect(resolveAsaasBillingType("pix")).toBe("PIX");
    expect(resolveAsaasBillingType("card")).toBe("CREDIT_CARD");
    expect(resolveAsaasBillingType(undefined)).toBe("CREDIT_CARD");
  });

  it("maps PAYMENT_RECEIVED to checkout.completed for checkout intent reference", () => {
    const payload = JSON.parse(readFileSync(fixturePath, "utf8"));
    const mapped = mapAsaasWebhookEvent(payload, {
      userId: "user_test_1",
      internalRef: "pro",
      productKind: "subscription"
    });

    expect(mapped).toEqual({
      eventId: "evt_asaas_payment_received",
      gateway: "asaas",
      type: "checkout.completed",
      userId: "user_test_1",
      checkoutIntentId: "chk_test_intent",
      amount: 79.9,
      currency: "BRL",
      externalSubscriptionId: "sub_asaas_test",
      externalCustomerId: "cus_asaas_test",
      internalRef: "pro",
      productKind: "subscription"
    });
  });

  it("maps PAYMENT_RECEIVED to subscription.renewed without checkout intent prefix", () => {
    const payload = JSON.parse(readFileSync(fixturePath, "utf8"));
    payload.payment.externalReference = "renewal_cycle_2";

    const mapped = mapAsaasWebhookEvent(payload, { userId: "user_test_1" });

    expect(mapped?.type).toBe("subscription.renewed");
  });
});
