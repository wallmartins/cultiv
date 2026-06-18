import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  createAsaasGateway,
  createManualGateway,
  createStripeGateway
} from "@my-ai-orchestrator/payments";

const sampleChargeRequest = {
  userId: "user_1",
  subscriptionId: "sub_1",
  amount: 1000,
  currency: "USD"
} as const;

describe("payment gateway adapters", () => {
  it("createManualGateway exposes manual gateway with pending charges", async () => {
    const gateway = createManualGateway();

    expect(gateway.name).toBe("manual");

    const result = await Effect.runPromise(gateway.charge(sampleChargeRequest));

    expect(result.status).toBe("pending");
    expect(result.gateway).toBe("manual");
    expect(result.transactionId).toBe("manual_user_1_sub_1");
  });

  it("createStripeGateway exposes stripe gateway with paid charges", async () => {
    const gateway = createStripeGateway();

    expect(gateway.name).toBe("stripe");

    const result = await Effect.runPromise(gateway.charge(sampleChargeRequest));

    expect(result.status).toBe("paid");
    expect(result.gateway).toBe("stripe");
    expect(result.transactionId).toBe("stripe_user_1_sub_1");
  });

  it("createAsaasGateway exposes asaas gateway with paid charges", async () => {
    const gateway = createAsaasGateway();

    expect(gateway.name).toBe("asaas");

    const result = await Effect.runPromise(gateway.charge(sampleChargeRequest));

    expect(result.status).toBe("paid");
    expect(result.gateway).toBe("asaas");
    expect(result.transactionId).toBe("asaas_user_1_sub_1");
  });
});
