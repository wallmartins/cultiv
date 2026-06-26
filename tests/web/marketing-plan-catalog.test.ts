import { describe, expect, it } from "vitest";
import { DEFAULT_BILLING_PLANS } from "@my-ai-orchestrator/payments";
import { resolveQuotaLimit } from "@my-ai-orchestrator/payments";
import { getMarketingPlanQuotas } from "../../apps/web/src/marketing/content/plans/marketing-plan-catalog.js";

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
});
