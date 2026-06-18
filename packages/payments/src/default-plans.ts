import type { BillingPlanDefinition } from "./types.js";

export const DEFAULT_BILLING_PLANS: readonly BillingPlanDefinition[] = [
  {
    id: "free",
    tier: "free",
    name: "Free",
    monthlyCredits: 50,
    features: [
      { key: "execution.sync_mode", enabled: true },
      { key: "content.language.refinement", enabled: false }
    ],
    allowedModels: ["llama3.1", "gpt-4o-mini"]
  },
  {
    id: "pro",
    tier: "pro",
    name: "Pro",
    monthlyCredits: 2500,
    dailyCredits: 300,
    features: [
      { key: "execution.sync_mode", enabled: true },
      { key: "content.language.refinement", enabled: true },
      { key: "rollout.beta.access", enabled: true }
    ],
    allowedModels: ["gpt-4o-mini", "gpt-4.1", "claude-3-5-sonnet"]
  }
];
