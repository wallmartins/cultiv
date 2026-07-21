import { Effect } from "effect";
import type {
  ContentTypeCatalogItemView,
  GenerationPreviewResponse,
  QualityMode
} from "@my-ai-orchestrator/contracts";
import type { BackendConfig } from "../../config/config.js";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { BillingPlanTier, BillingServiceContract } from "@my-ai-orchestrator/payments";
import {
  resolveQuotaCost,
  resolveQuotaLimit,
  resolveQuotaRemaining
} from "@my-ai-orchestrator/payments";
import { isQualityModeAllowed, resolveQualityModeBlockedReason } from "../billing/commercial-access.js";
import { resolveStoredUserEntitlement, resolveStoredUserPlanId } from "../billing/resolve-user-billing.js";
import type { BackendAIPolicyServiceContract } from "../ai-policy/ai-policy-types.js";
import type {
  BackendApprovedGenerationPreviewRequest,
  BackendGenerationPreviewRequest,
  BackendGenerationPreviewService
} from "./generation-preview-types.js";
import { toGenerationPricingSnapshot } from "../billing/generation-pricing-snapshot.js";
import { resolveCompositorPricingArgs } from "../billing/compositor-pricing-args.js";
import { recommendGenerationPreviewQualityMode } from "./generation-preview-recommendation.js";
import { resolveGenerationTarget } from "./resolve-generation-target.js";
import { isGenerationStepPlannerEnabled } from "./is-step-planner-enabled.js";
import type { BackendPublicInputSafetyGatewayService } from "../../safety/public-input-safety-types.js";
import type { FeatureFlagServiceContract } from "@my-ai-orchestrator/feature-flags";

const QUALITY_MODES: readonly QualityMode[] = ["fast", "balanced", "strict"];

export function createBackendGenerationPreviewService(options: {
  readonly config: BackendConfig;
  readonly database: DatabaseClient;
  readonly billing: BillingServiceContract;
  readonly aiPolicy: BackendAIPolicyServiceContract;
  readonly inputSafety: BackendPublicInputSafetyGatewayService;
  readonly featureFlags: FeatureFlagServiceContract;
}): BackendGenerationPreviewService {
  return {
    preview(args) {
      return Effect.gen(function* () {
        const sanitizedArgs: BackendApprovedGenerationPreviewRequest = yield* options.inputSafety.authorizePreviewInput(args);
        const voiceProfile = yield* options.database.voiceProfiles.getByUser(sanitizedArgs.userId);

        const entitlement = resolveStoredUserEntitlement(options.billing, sanitizedArgs.userId) ?? null;
        const currentBalance = entitlement?.wallet.availableCredits ?? 0;
        const primaryLanguage = sanitizedArgs.language ?? voiceProfile?.primaryLanguage ?? options.config.defaultLanguage;
        const planTier = (entitlement?.tier ?? "free") as BillingPlanTier;
        const stepPlannerEnabled = isGenerationStepPlannerEnabled(options.featureFlags, options.config);
        const resolvedTarget = yield* resolveGenerationTarget({
          rhetoricalMode: sanitizedArgs.rhetoricalMode,
          scope: sanitizedArgs.scope,
          stepPlannerEnabled,
          briefing: sanitizedArgs.briefing,
          qualityMode: sanitizedArgs.qualityMode
        });
        const compositorPricing = resolveCompositorPricingArgs(resolvedTarget);
        const pricingContentType = compositorPricing.planSignature;
        const selectedContentType = buildCompositorContentTypeView(resolvedTarget, primaryLanguage);
        const qualityModePricing = yield* Effect.all(
          QUALITY_MODES.map((mode) =>
            options.aiPolicy.resolvePricingEnvelope({
              planTier,
              contentType: pricingContentType,
              qualityMode: mode,
              attachedPolicyVersion: options.config.aiPolicyAttachedVersion,
              planSignature: compositorPricing.planSignature,
              lengthTier: compositorPricing.lengthTier
            })
          )
        );

        const qualityModes = qualityModePricing.map((pricing) => {
          const creditPrice = pricing.creditPrice;
          const allowed = isQualityModeAllowed({
            entitlement,
            qualityMode: pricing.qualityMode,
            creditPrice,
            currentBalance
          });
          const blockedReason = allowed
            ? undefined
            : resolvePreviewQualityModeBlockedReason({
                entitlement,
                qualityMode: pricing.qualityMode,
                creditPrice,
                currentBalance
              });

          return {
            id: pricing.qualityMode,
            allowed,
            creditPrice,
            ...(blockedReason ? { blockedReason } : {})
          };
        });
        // ADR 0009 — não há picker: a recomendação é a decisão, não uma sugestão. Ela vem
        // antes da seleção porque é o candidato preferencial; `qualityModes` já carrega o
        // teto do plano (allowed), então um modo fora do plano nunca é escolhido.
        const includeRecommendation = sanitizedArgs.includeRecommendation !== false;
        const recommendation = includeRecommendation
          ? recommendGenerationPreviewQualityMode({
              contentType: selectedContentType,
              briefing: sanitizedArgs.briefing,
              hasVoiceProfile: voiceProfile !== null,
              qualityModes
            })
          : null;
        const selectedQualityMode = selectQualityMode(
          sanitizedArgs.qualityMode,
          qualityModes,
          options.config.qualityMode,
          recommendation?.qualityMode
        );
        const pricingSnapshot = yield* options.aiPolicy.resolvePricingEnvelope({
          planTier,
          contentType: pricingContentType,
          qualityMode: selectedQualityMode,
          attachedPolicyVersion: options.config.aiPolicyAttachedVersion,
          planSignature: compositorPricing?.planSignature,
          lengthTier: compositorPricing?.lengthTier
        });
        const commercialPricingSnapshot = toGenerationPricingSnapshot(pricingSnapshot);
        const canonicalCreditCost = options.aiPolicy.getCanonicalCreditCost();
        const planId = resolveStoredUserPlanId(options.billing, sanitizedArgs.userId);
        const plan = options.billing.listPlans().find((candidate) => candidate.id === planId);
        const monthlyCredits = plan?.monthlyCredits ?? 0;

        return {
          pricingSnapshot: commercialPricingSnapshot,
          currentBalance,
          projectedBalanceAfterGeneration: roundCredits(currentBalance - pricingSnapshot.creditPrice),
          quotaRemaining: resolveQuotaRemaining(currentBalance, canonicalCreditCost),
          quotaLimit: resolveQuotaLimit(monthlyCredits, canonicalCreditCost),
          quotaCost: resolveQuotaCost(pricingSnapshot.creditPrice, canonicalCreditCost),
          canonicalCreditCost,
          recommendation: recommendation
            ? {
                qualityMode: recommendation.qualityMode,
                reasonCodes: [...recommendation.reasonCodes],
                explanation: recommendation.explanation
              }
            : undefined,
          compositor: {
            planId: resolvedTarget.compositor.plan.planId,
            planSignature: resolvedTarget.compositor.plan.planSignature,
            expressionProfile: resolvedTarget.compositor.plan.parameters.expressionProfile,
            lengthTier: resolvedTarget.compositor.plan.parameters.lengthTier,
            wordTarget: resolvedTarget.compositor.plan.parameters.wordTarget
          },
          options: {
            qualityModes: qualityModes.map((mode) => ({
              ...mode,
              ...(recommendation && recommendation.qualityMode === mode.id
                ? {
                    recommended: true,
                    recommendation: {
                      reasonCodes: [...recommendation.reasonCodes],
                      explanation: recommendation.explanation
                    }
                  }
                : {})
            }))
          }
        } satisfies GenerationPreviewResponse;
      });
    }
  };
}

// Ordem de precedência: pedido explícito (só chega por API, a UI não tem picker) > modo
// inferido pelo briefing > default de config > primeiro permitido. Todo candidato passa
// pelo filtro `allowed`, que é onde o teto do plano entra.
function selectQualityMode(
  requestedQualityMode: QualityMode | undefined,
  qualityModes: ReadonlyArray<{
    readonly id: QualityMode;
    readonly allowed: boolean;
  }>,
  defaultQualityMode: QualityMode,
  recommendedQualityMode?: QualityMode
): QualityMode {
  for (const candidate of [requestedQualityMode, recommendedQualityMode, defaultQualityMode]) {
    if (!candidate) continue;
    const match = qualityModes.find((mode) => mode.id === candidate);
    if (match?.allowed) {
      return match.id;
    }
  }

  return (
    qualityModes.find((mode) => mode.allowed)?.id ??
    qualityModes[0]?.id ??
    defaultQualityMode
  );
}

function roundCredits(value: number): number {
  return Math.ceil(value * 10) / 10;
}

function resolvePreviewQualityModeBlockedReason(
  args: Parameters<typeof resolveQualityModeBlockedReason>[0]
): string {
  return resolveQualityModeBlockedReason(args) ?? "plan_restriction";
}

function buildCompositorContentTypeView(
  resolvedTarget: import("./resolve-generation-target.js").ResolvedGenerationTarget,
  primaryLanguage: string
): ContentTypeCatalogItemView {
  const plan = resolvedTarget.compositor.plan;

  return {
    id: resolvedTarget.contentTypeId,
    label: plan.planSignature,
    available: true,
    defaultLanguage: primaryLanguage,
    supportedLanguages: [primaryLanguage],
    steps: plan.steps.map((step) => step.name),
    inputSchema: [],
    briefingGuidance: {
      objective: "Compositor-planned generation.",
      tips: [],
      exampleBriefing: "",
      commonMistakes: []
    }
  };
}
