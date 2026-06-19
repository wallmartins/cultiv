import { describe, expect, it } from "vitest";
import { parseJobTelemetryRow } from "../../packages/payments/src/pricing-calibration/telemetry-ingest.js";

describe("compositor telemetry ingest", () => {
  it("prefers planSignature over legacy contentType when tagging rows", () => {
    const row = parseJobTelemetryRow({
      id: "job-compositor-1",
      status: "done",
      contentType: "linkedin-post",
      result: {
        metadata: {
          qualityMode: "balanced",
          telemetry: {
            cost: {
              inputTokensTotal: 1200,
              outputTokensTotal: 800,
              estimatedUsdCost: 0.12,
              debitedCredits: 4
            },
            pricing: {
              contentType: "linkedin-post",
              planSignature: "edition-piece",
              lengthTier: "medium",
              plannedCreditPrice: 4,
              observedDebitedCredits: 4,
              observedUsdCost: 0.12
            },
            compositor: {
              planId: "plan-abc"
            }
          }
        }
      }
    });

    expect(row).toMatchObject({
      jobId: "job-compositor-1",
      contentType: "edition-piece",
      qualityMode: "balanced",
      debitedCredits: 4
    });
  });
});
