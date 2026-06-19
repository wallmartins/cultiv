import { Effect } from "effect";
import type {
  ContentTypeCatalogItemView,
  GenerationPreviewResponse,
  QualityMode
} from "@my-ai-orchestrator/contracts";
import type { BackendConfig } from "../../config/config.js";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { BillingPlanTier, BillingServiceContract } from "@my-ai-orchestrator/payments";
import { isQualityModeAllowed, resolveQualityModeBlockedReason } from "../billing/commercial-access.js";
import { resolveStoredUserEntitlement } from "../billing/resolve-user-billing.js";
import { buildContentTypeCatalogView } from "../catalog/content-type-catalog.js";
import { resolveCatalogContentTypeDefinitions } from "../catalog/resolve-catalog-content-types.js";
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
import { isGenerationCompositorEnabled } from "./is-compositor-enabled.js";
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
        const orchestrationCatalog = options.aiPolicy.getActiveOrchestrationCatalog();
        const contentTypes = buildContentTypeCatalogView(
          resolveCatalogContentTypeDefinitions(orchestrationCatalog),
          {
            userLanguage: primaryLanguage,
            subscriptionActive: entitlement?.status === "active"
          }
        );
        const planTier = (entitlement?.tier ?? "free") as BillingPlanTier;
        const compositorEnabled = isGenerationCompositorEnabled(options.featureFlags, options.config);
        const resolvedTarget = yield* resolveGenerationTarget({
          intent: sanitizedArgs.intent,
          scope: sanitizedArgs.scope,
          contentType: sanitizedArgs.contentType,
          compositorEnabled,
          qualityMode: sanitizedArgs.qualityMode
        });
        const compositorPricing = resolveCompositorPricingArgs(resolvedTarget);
        const pricingContentType = compositorPricing?.planSignature ?? resolvedTarget.contentTypeId;
        const selectedContentType = resolvedTarget.compositor
          ? buildCompositorContentTypeView(resolvedTarget, primaryLanguage)
          : selectContentType(resolvedTarget.contentTypeId, contentTypes);
        const qualityModePricing = yield* Effect.all(
          QUALITY_MODES.map((mode) =>
            options.aiPolicy.resolvePricingEnvelope({
              planTier,
              contentType: pricingContentType,
              qualityMode: mode,
              attachedPolicyVersion: options.config.aiPolicyAttachedVersion,
              planSignature: compositorPricing?.planSignature,
              lengthTier: compositorPricing?.lengthTier
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
        const selectedQualityMode = selectQualityMode(sanitizedArgs.qualityMode, qualityModes);
        const includeRecommendation = sanitizedArgs.includeRecommendation !== false;
        const recommendation = includeRecommendation
          ? recommendGenerationPreviewQualityMode({
              contentType: selectedContentType,
              briefing: sanitizedArgs.briefing,
              hasVoiceProfile: voiceProfile !== null,
              qualityModes
            })
          : null;
        const pricingSnapshot = yield* options.aiPolicy.resolvePricingEnvelope({
          planTier,
          contentType: pricingContentType,
          qualityMode: selectedQualityMode,
          attachedPolicyVersion: options.config.aiPolicyAttachedVersion,
          planSignature: compositorPricing?.planSignature,
          lengthTier: compositorPricing?.lengthTier
        });
        const commercialPricingSnapshot = toGenerationPricingSnapshot(pricingSnapshot);

        return {
          pricingSnapshot: commercialPricingSnapshot,
          currentBalance,
          projectedBalanceAfterGeneration: roundCredits(currentBalance - pricingSnapshot.creditPrice),
          recommendation: recommendation
            ? {
                qualityMode: recommendation.qualityMode,
                reasonCodes: [...recommendation.reasonCodes],
                explanation: recommendation.explanation
              }
            : undefined,
          ...(resolvedTarget.resolvedIntent
            ? {
                resolvedIntent: {
                  intent: resolvedTarget.resolvedIntent.intent,
                  scope: resolvedTarget.resolvedIntent.scope,
                  wordTargetMin: resolvedTarget.resolvedIntent.wordTarget.min,
                  wordTargetMax: resolvedTarget.resolvedIntent.wordTarget.max
                }
              }
            : {}),
          ...(resolvedTarget.compositor
            ? {
                compositor: {
                  planId: resolvedTarget.compositor.plan.planId,
                  planSignature: resolvedTarget.compositor.plan.planSignature,
                  expressionProfile: resolvedTarget.compositor.plan.parameters.expressionProfile,
                  lengthTier: resolvedTarget.compositor.plan.parameters.lengthTier,
                  wordTarget: resolvedTarget.compositor.plan.parameters.wordTarget
                }
              }
            : {}),
          options: {
            contentTypes: contentTypes.map((contentType) => ({
              id: contentType.id,
              label: contentType.label,
              allowed: contentType.available,
              ...(contentType.reasonCode
                ? {
                    blockedReason: !entitlement ? "plan_restriction" : contentType.reasonCode
                  }
                : {})
            })),
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

function selectContentType(
  requestedContentType: string | undefined,
  contentTypes: ReadonlyArray<ContentTypeCatalogItemView>
): ContentTypeCatalogItemView {
  return (
    (requestedContentType ? contentTypes.find((contentType) => contentType.id === requestedContentType) : undefined) ??
    contentTypes.find((contentType) => contentType.available) ??
    contentTypes[0] ?? {
      id: "unknown",
      label: "Unknown",
      available: false,
      defaultLanguage: "pt-BR",
      supportedLanguages: ["pt-BR"],
      steps: [],
      inputSchema: [],
      briefingGuidance: {
        objective: "No content type available.",
        tips: [],
        exampleBriefing: "",
        commonMistakes: []
      }
    }
  );
}

function selectQualityMode(
  requestedQualityMode: QualityMode | undefined,
  qualityModes: ReadonlyArray<{
    readonly id: QualityMode;
    readonly allowed: boolean;
  }>
): QualityMode {
  if (requestedQualityMode) {
    const requested = qualityModes.find((mode) => mode.id === requestedQualityMode);
    if (requested?.allowed) {
      return requested.id;
    }
  }

  return (
    qualityModes.find((mode) => mode.allowed)?.id ??
    qualityModes[0]?.id ??
    "balanced"
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
  const plan = resolvedTarget.compositor!.plan;

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
