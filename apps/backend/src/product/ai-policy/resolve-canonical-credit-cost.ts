import type { AIPolicyPricingDocument } from "./ai-policy-schema.js";

export const DEFAULT_CANONICAL_CREDIT_COST = 2.5;

export function resolveCanonicalCreditCost(
  pricing: AIPolicyPricingDocument | undefined
): number {
  const value = pricing?.canonicalCreditCost;

  if (typeof value === "number" && value > 0) {
    return value;
  }

  return DEFAULT_CANONICAL_CREDIT_COST;
}
