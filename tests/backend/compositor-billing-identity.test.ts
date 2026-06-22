import { describe, expect, it } from "vitest";
import { createBillingRepository, createBillingService } from "@my-ai-orchestrator/payments";
import { resolveBackendBillingIdentity } from "../../apps/backend/src/execution/billing.js";
import type { BackendConfig } from "../../apps/backend/src/config/config.js";

describe("compositor billing identity", () => {
  const billing = createBillingService({ repository: createBillingRepository() });
  const config = {
    billingUserId: "billing-default-user",
    serviceName: "cultiv-api"
  } as Pick<BackendConfig, "billingUserId" | "serviceName"> as BackendConfig;

  it("falls back to billingUserId when explicit pipeline requests omit userId", () => {
    const identity = resolveBackendBillingIdentity(
      {
        pipeline: {
          name: "short-piece",
          steps: [{ name: "draft", skill: "draft" }]
        }
      },
      billing,
      config,
      "cycle-1"
    );

    expect(identity.userId).toBe("billing-default-user");
  });

  it("uses authenticated userId when explicit pipeline requests include it", () => {
    const identity = resolveBackendBillingIdentity(
      {
        userId: "auth0|founder",
        pipeline: {
          name: "short-piece",
          steps: [{ name: "draft", skill: "draft" }]
        }
      },
      billing,
      config,
      "cycle-1"
    );

    expect(identity.userId).toBe("auth0|founder");
  });
});
