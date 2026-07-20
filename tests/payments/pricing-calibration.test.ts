import { describe, expect, it } from "vitest";
import {
  buildCalibrationReport,
  deriveCreditPrice,
  estimateTheoreticalCostUsd,
  parseJobTelemetryRows
} from "../../packages/payments/src/pricing-calibration/index.js";
import fixture from "../fixtures/billing/calibration-jobs.json";

describe("pricing calibration", () => {
  it("estimates higher cost for long-form-blog strict than twitter-thread fast", () => {
    const blog = estimateTheoreticalCostUsd({
      contentType: "long-form-blog",
      qualityMode: "strict"
    });
    const tweet = estimateTheoreticalCostUsd({
      contentType: "twitter-thread",
      qualityMode: "fast"
    });
    expect(blog).toBeGreaterThan(tweet);
  });

  it("derives credit price with target margin and canonical anchor", () => {
    expect(
      deriveCreditPrice({
        costUsd: 0.15,
        targetMargin: 0.675,
        creditUsdValue: 0.03846
      })
    ).toBe(12.1);
  });

  it("parses job telemetry rows from fixture", () => {
    const rows = parseJobTelemetryRows(fixture);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toMatchObject({
      contentType: expect.any(String),
      qualityMode: expect.any(String),
      observedUsdCost: expect.any(Number)
    });
  });

  it("builds a report with canonical credit cost", () => {
    const report = buildCalibrationReport({ jobs: fixture });
    expect(report.canonicalCreditCost).toBeGreaterThan(0);
    expect(report.pricing.length).toBeGreaterThan(0);
    // trial + os 3 planos pagos (DEFAULT_PLAN_GRANTS espelha catalog-pricing.json)
    expect(report.planSimulation.length).toBe(4);
  });
});
