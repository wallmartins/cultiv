import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { mapStripeEvent } from "../../packages/payments/src/gateway/stripe-adapter.js";

const fixturePath = resolve(
  import.meta.dirname,
  "../fixtures/billing/stripe-checkout-completed.json"
);

describe("mapStripeEvent", () => {
  it("maps checkout.session.completed to checkout.completed", () => {
    const event = JSON.parse(readFileSync(fixturePath, "utf8")) as Stripe.Event;
    const mapped = mapStripeEvent(event);

    expect(mapped).toEqual({
      eventId: "evt_test_checkout_completed",
      gateway: "stripe",
      type: "checkout.completed",
      userId: "user_test_1",
      checkoutIntentId: "chk_test_intent",
      amount: 49,
      currency: "USD",
      externalSubscriptionId: "sub_test_subscription",
      externalCustomerId: "cus_test_customer",
      internalRef: "criador",
      productKind: "subscription",
      paymentMethodKind: "card"
    });
  });

  it("returns null when checkout session metadata is missing user id", () => {
    const event = JSON.parse(readFileSync(fixturePath, "utf8")) as Stripe.Event;
    const session = (event.data.object as Stripe.Checkout.Session);
    session.metadata = {};

    expect(mapStripeEvent(event)).toBeNull();
  });
});
