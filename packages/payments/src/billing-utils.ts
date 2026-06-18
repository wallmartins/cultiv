import type { BillingCreditPolicy } from "@my-ai-orchestrator/contracts";
import type { BillingPlanDefinition } from "./types.js";

export function roundCredits(value: number, mode: BillingCreditPolicy["rounding"]): number {
  if (mode === "ceil_1_decimal") {
    return Math.ceil(value * 10) / 10;
  }
  return value;
}

export function hasFeature(plan: BillingPlanDefinition, key: string): boolean {
  return plan.features.some((feature) => feature.key === key && feature.enabled);
}

export function createAccountId(userId: string, planId: string): string {
  return `${userId}:${planId}`;
}

export function extractUserIdFromAccountId(accountId: string): string {
  return accountId.split(":")[0] ?? accountId;
}

export function extractPlanIdFromAccountId(accountId: string): string {
  return accountId.split(":")[1] ?? accountId;
}

export function isSameUtcDay(isoDate: string, referenceDate: Date): boolean {
  const entryDate = new Date(isoDate);
  return (
    entryDate.getUTCFullYear() === referenceDate.getUTCFullYear() &&
    entryDate.getUTCMonth() === referenceDate.getUTCMonth() &&
    entryDate.getUTCDate() === referenceDate.getUTCDate()
  );
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
