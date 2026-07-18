import type {
  BillingEntitlementView,
  ExecutionsPageView,
  ExecutionStatusView,
  OnboardingStatusView,
  VoiceProfileScreenView,
  VoiceTrainingConsentStatusView
} from "@my-ai-orchestrator/contracts";
import type { AppAuth } from "~/router.js";

export const onboardingCompleted: OnboardingStatusView = { completed: true };
export const consentGranted: VoiceTrainingConsentStatusView = { granted: true };
export const consentNotGranted: VoiceTrainingConsentStatusView = { granted: false };

// Clean diagnostics (no blocking reasonCodes) — deriveAppMode reads only .diagnostics off this.
export const voiceProfileFixture: VoiceProfileScreenView = {
  profile: {
    userId: "test-user",
    snapshotId: "snapshot-1",
    version: 3,
    confidence: "high",
    adaptationMode: "standard",
    primaryLanguage: "pt-BR",
    tone: "direto",
    cadence: "curta",
    lexicon: [],
    constraints: [],
    styleMarkers: [],
    rules: [],
    antiPatterns: []
  },
  diagnostics: {
    updating: false,
    activeVersion: 3,
    reasonCodes: [],
    nextActionCodes: [],
    bestCoveredContentTypes: [],
    underrepresentedContentTypes: [],
    pendingRebuild: { status: "idle", nextActionCodes: [] }
  },
  materialBase: {
    totalExamples: 10,
    activeExamples: 10,
    excludedExamples: 0,
    pinnedExamples: 0,
    byClassification: {},
    byContentType: {},
    byLanguage: {}
  }
};

export const noVoiceProfileFixture: VoiceProfileScreenView = {
  ...voiceProfileFixture,
  profile: { ...voiceProfileFixture.profile, version: 0 }
};

export const entitlementFixture: BillingEntitlementView = {
  planId: "creator",
  tier: "creator",
  availableCredits: 12,
  monthlyCreditsRemaining: 12,
  canonicalCreditCost: 2,
  quotaRemaining: 12,
  quotaLimit: 20,
  currency: "BRL",
  status: "active",
  canGenerate: true,
  canRefine: true,
  gate: "ok",
  paymentMethod: null,
  management: {
    canManageViaPortal: false,
    canCancel: true,
    canReactivate: false,
    canChangeMethod: false,
    canRegularize: false,
    regularizeUrl: null
  }
};

export const emptyExecutionsPage: ExecutionsPageView = { items: [], total: 0, limit: 20, offset: 0 };

export function executionFixture(overrides: Partial<ExecutionStatusView> = {}): ExecutionStatusView {
  return {
    jobId: "exec-1",
    status: "done",
    contentType: "linkedin-post",
    progress: null,
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    briefingTopic: "A falácia de delegar o pensamento à IA",
    lengthTier: "long",
    channel: "professional-network",
    ...overrides
  };
}

export function executionsPageWith(items: readonly ExecutionStatusView[]): ExecutionsPageView {
  return { items, total: items.length, limit: 20, offset: 0 };
}

export const mockAuth: AppAuth = {
  isLoading: false,
  isAuthenticated: true,
  user: { name: "Rita Costa", email: "rita@example.com" },
  getAccessTokenSilently: async () => "test-token",
  loginWithRedirect: async () => {},
  logout: async () => {}
};
