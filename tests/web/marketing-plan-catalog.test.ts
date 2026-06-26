import { describe, expect, it } from "vitest";
import { DEFAULT_BILLING_PLANS } from "@my-ai-orchestrator/payments";
import { resolveQuotaLimit } from "@my-ai-orchestrator/payments";
import {
  getMarketingPlanQuotas,
  resolveMarketingAnnualSavingsPercent,
  resolveMarketingQuotaMultiplier,
} from "../../apps/web/src/marketing/content/plans/marketing-plan-catalog.js";

const CANONICAL_CREDIT_COST = 2.5;

describe("marketing plan catalog", () => {
  it("derives quotas from DEFAULT_BILLING_PLANS", () => {
    const quotas = getMarketingPlanQuotas(CANONICAL_CREDIT_COST);
    for (const plan of DEFAULT_BILLING_PLANS) {
      expect(quotas[plan.id as keyof typeof quotas]).toBe(
        resolveQuotaLimit(plan.monthlyCredits, CANONICAL_CREDIT_COST)
      );
    }
  });

  it("derives annual savings percent from manifest prices", () => {
    expect(resolveMarketingAnnualSavingsPercent("criador", "BRL")).toBe(17);
    expect(resolveMarketingAnnualSavingsPercent("pro", "USD")).toBe(17);
  });

  it("derives quota multiplier against Explorer", () => {
    expect(resolveMarketingQuotaMultiplier("criador", CANONICAL_CREDIT_COST)).toBe(3.125);
    expect(resolveMarketingQuotaMultiplier("pro", CANONICAL_CREDIT_COST)).toBe(7.5);
  });
});
