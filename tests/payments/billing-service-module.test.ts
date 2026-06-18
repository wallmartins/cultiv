import { describe, expect, it } from "vitest";
import { createBillingService } from "../../packages/payments/src/service.js";

describe("billing service module", () => {
  it("exports createBillingService with reserveGenerationCredits", () => {
    const service = createBillingService();

    expect(typeof service.reserveGenerationCredits).toBe("function");
  });
});
