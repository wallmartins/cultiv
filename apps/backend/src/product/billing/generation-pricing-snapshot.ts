import { createHash } from "node:crypto";
import { Effect } from "effect";
import type { GenerationPricingSnapshot, PipelineRequest } from "@my-ai-orchestrator/contracts";
import { normalizePipelineRequest } from "@my-ai-orchestrator/orchestrator";
import type { BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { BackendConfig } from "../../config/config.js";
import { BackendGenerationQuoteMismatchError } from "../../http/errors.js";
import type {
  BackendAIPolicyServiceContract,
  BillingPlanTier,
  ResolvedPricingEnvelope
} from "../ai-policy/ai-policy-types.js";
import { resolveCompositorPricingKeys } from "../ai-policy/ai-policy-resolution.js";
import { resolveStoredUserPlanTier } from "./resolve-user-billing.js";

// O quote protege o preço mostrado ao usuário, então o seed carrega só o que move preço.
// qualityMode ficou de fora a partir da policy 2026-07-20: o preço passou a ser por tamanho
// e o modo é decidido pelo sistema (ADR 0009), não pelo cliente — mantê-lo no hash fazia o
// quote recusar requisições que seriam cobradas exatamente igual.
interface GenerationQuoteSeed {
  readonly policyVersion: string;
  readonly planTier: BillingPlanTier;
  readonly contentType: string;
  readonly creditPrice: number;
  readonly planSignature?: string;
  readonly lengthTier?: string;
}

export function toGenerationPricingSnapshot(pricingEnvelope: ResolvedPricingEnvelope): GenerationPricingSnapshot {
  return {
    quoteId: createGenerationQuoteId({
      policyVersion: pricingEnvelope.policyVersion,
      planTier: pricingEnvelope.planTier,
      contentType: pricingEnvelope.contentType,
      creditPrice: pricingEnvelope.creditPrice,
      planSignature: pricingEnvelope.planSignature,
      lengthTier: pricingEnvelope.lengthTier
    }),
    policyVersion: pricingEnvelope.policyVersion,
    contentType: pricingEnvelope.contentType,
    qualityMode: pricingEnvelope.qualityMode,
    creditPrice: pricingEnvelope.creditPrice,
    ...(pricingEnvelope.planSignature ? { planSignature: pricingEnvelope.planSignature } : {}),
    ...(pricingEnvelope.lengthTier ? { lengthTier: pricingEnvelope.lengthTier } : {})
  };
}

export function resolveExecutionPricingSnapshot(args: {
  readonly userId: string;
  readonly request: PipelineRequest;
  readonly config: BackendConfig;
  readonly billing: BillingServiceContract;
  readonly aiPolicy: BackendAIPolicyServiceContract;
}) {
  const normalized = normalizePipelineRequest(args.request, {
    catalog: args.aiPolicy.getActiveOrchestrationCatalog(),
    executionMode: args.config.executionMode,
    qualityMode: args.config.qualityMode,
    defaultLanguage: args.config.defaultLanguage
  });
  const planTier = resolveStoredUserPlanTier(args.billing, args.userId);
  const compositorPricing = resolveCompositorPricingKeys(args.request);

  return Effect.map(
    args.aiPolicy.resolvePricingEnvelope({
      planTier,
      contentType: normalized.contentTypeId,
      qualityMode: normalized.qualityMode,
      attachedPolicyVersion: args.config.aiPolicyAttachedVersion,
      planSignature: compositorPricing.planSignature,
      lengthTier: compositorPricing.lengthTier
    }),
    toGenerationPricingSnapshot
  );
}

export function assertQuoteConsistency(args: {
  readonly providedQuoteId: string;
  readonly pricingSnapshot: GenerationPricingSnapshot;
}) {
  if (args.providedQuoteId === args.pricingSnapshot.quoteId) {
    return Effect.void;
  }

  return Effect.fail(
    new BackendGenerationQuoteMismatchError({
      providedQuoteId: args.providedQuoteId,
      expectedQuoteId: args.pricingSnapshot.quoteId,
      policyVersion: args.pricingSnapshot.policyVersion,
      contentType: args.pricingSnapshot.contentType,
      qualityMode: args.pricingSnapshot.qualityMode,
      creditPrice: args.pricingSnapshot.creditPrice,
      message: "The preview quote is stale or mismatched. Refresh preview before confirming generation again."
    })
  );
}

function createGenerationQuoteId(seed: GenerationQuoteSeed): string {
  const canonical = JSON.stringify([
    seed.policyVersion,
    seed.planTier,
    seed.contentType,
    seed.creditPrice,
    seed.planSignature ?? null,
    seed.lengthTier ?? null
  ]);

  return `quote_${createHash("sha256").update(canonical).digest("hex")}`;
}
