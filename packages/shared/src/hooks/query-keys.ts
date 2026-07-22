import type { GenerationPreviewRequest } from "@my-ai-orchestrator/contracts";
import type { ExecutionsListInput } from "@my-ai-orchestrator/client-sdk";

export type ExecutionsListFilters = Omit<ExecutionsListInput, "signal">;

// Central key builders so every hook (and future TanStack Router loaders) agree on shape.
export const queryKeys = {
  executionsList: (filters: ExecutionsListFilters) => ["executions", "list", filters] as const,
  execution: (id: string) => ["execution", id] as const,
  preview: (input: GenerationPreviewRequest) => ["preview", input] as const,
  voiceProfile: () => ["voice", "profile"] as const,
  voiceConsent: () => ["voice", "consent"] as const,
  calibrationSession: (sessionId: string) => ["voice", "calibration", sessionId] as const,
  calibrationEntitlement: () => ["voice", "calibration", "entitlement"] as const,
  onboarding: () => ["onboarding"] as const,
  practiceProfile: () => ["practice-profile"] as const,
  entitlement: () => ["entitlement"] as const,
  billingPlans: () => ["billing", "plans"] as const,
  billingTopups: () => ["billing", "topups"] as const,
  billingLedger: (page?: { limit?: number; offset?: number }) => ["billing", "ledger", page ?? {}] as const,
  billingCheckoutStatus: (intentId: string) => ["billing", "checkout-status", intentId] as const,
  accountExportJob: (jobId: string) => ["account", "export", jobId] as const
} as const;
