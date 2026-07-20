import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import { toGenerationPricingSnapshot } from "../../apps/backend/src/product/billing/generation-pricing-snapshot.js";

const baseConfig: BackendConfig = {
  environment: "test",
  executionMode: "sync",
  qualityMode: "balanced",
  defaultLanguage: "pt-BR",
  serviceName: "backend",
  host: "127.0.0.1",
  port: 3000,
  version: "0.1.0"
};

describe("compositor pricing", () => {
  it("prices edition-piece by planSignature and lengthTier", () => {
    const services = Effect.runSync(createBackendProductServices(baseConfig));

    const medium = Effect.runSync(
      services.aiPolicy.resolvePricingEnvelope({
        planTier: "pro",
        contentType: "edition-piece",
        qualityMode: "balanced",
        planSignature: "edition-piece",
        lengthTier: "medium"
      })
    );
    const long = Effect.runSync(
      services.aiPolicy.resolvePricingEnvelope({
        planTier: "pro",
        contentType: "edition-piece",
        qualityMode: "balanced",
        planSignature: "edition-piece",
        lengthTier: "long"
      })
    );

    // policy 2026-07-20: preço por tamanho — edition-piece medium = 2 textos, long = 3
    expect(medium.creditPrice).toBe(5);
    expect(long.creditPrice).toBe(7.5);
    expect(medium.planSignature).toBe("edition-piece");
    expect(medium.lengthTier).toBe("medium");
  });

  it("keeps legacy contentType pricing when compositor keys are absent", () => {
    const services = Effect.runSync(createBackendProductServices(baseConfig));

    const legacy = Effect.runSync(
      services.aiPolicy.resolvePricingEnvelope({
        planTier: "pro",
        contentType: "linkedin-post",
        qualityMode: "balanced"
      })
    );

    expect(legacy.creditPrice).toBe(2.5);
    expect(legacy.planSignature).toBeUndefined();
    expect(legacy.lengthTier).toBeUndefined();
  });

  it("changes quote id when compositor length tier changes", () => {
    const medium = toGenerationPricingSnapshot({
      policyVersion: "2026-06-22",
      lifecycle: "active",
      planTier: "pro",
      contentType: "edition-piece",
      qualityMode: "balanced",
      creditPrice: 3.8,
      planSignature: "edition-piece",
      lengthTier: "medium"
    });
    const long = toGenerationPricingSnapshot({
      policyVersion: "2026-06-22",
      lifecycle: "active",
      planTier: "pro",
      contentType: "edition-piece",
      qualityMode: "balanced",
      creditPrice: 4.8,
      planSignature: "edition-piece",
      lengthTier: "long"
    });

    expect(medium.quoteId).not.toBe(long.quoteId);
    expect(medium.planSignature).toBe("edition-piece");
    expect(long.lengthTier).toBe("long");
  });
});
