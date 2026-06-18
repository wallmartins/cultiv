import type { BillingCreditPolicy, QualityMode } from "@my-ai-orchestrator/contracts";
import { roundCredits } from "./billing-utils.js";

export const DEFAULT_BILLING_CREDIT_POLICY: BillingCreditPolicy = {
  baseCredits: {
    fast: 1,
    balanced: 2.5,
    strict: 10
  },
  retrySurcharge: {
    fast: 0,
    balanced: 0.75,
    strict: 1.5
  },
  rounding: "ceil_1_decimal",
  rolloverPercent: 0.25,
  rolloverCap: 100
};

export function calculateDebitForMode(
  mode: QualityMode,
  retryCount = 0,
  creditPolicy: BillingCreditPolicy = DEFAULT_BILLING_CREDIT_POLICY
): number {
  const base = creditPolicy.baseCredits[mode];
  const surcharge = creditPolicy.retrySurcharge[mode];
  return roundCredits(base + retryCount * surcharge, creditPolicy.rounding);
}

export function calculateRolloverCredits(
  remainingCredits: number,
  creditPolicy: BillingCreditPolicy = DEFAULT_BILLING_CREDIT_POLICY
): number {
  return roundCredits(
    Math.min(remainingCredits * creditPolicy.rolloverPercent, creditPolicy.rolloverCap),
    creditPolicy.rounding
  );
}
