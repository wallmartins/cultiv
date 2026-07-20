import catalogPricing from "./catalog-pricing.json" with { type: "json" };
import type { BillingPlanDefinition } from "./types.js";

// ADR 0006 §3 — catálogo canônico (backend SSOT). Os números vivem em catalog-pricing.json,
// fonte única compartilhada: apps/landing lê o mesmo arquivo no build (fim do drift landing↔app).
// monthlyCredits = ceil(gerações/mês × canonicalCreditCost).

interface CatalogPlan {
  readonly id: string;
  readonly name: string;
  readonly monthlyGenerations: number;
  readonly featured?: boolean;
  readonly priceCents?: { readonly BRL: number; readonly USD: number };
}

interface PlanMetadata {
  readonly tier: BillingPlanDefinition["tier"];
  readonly features: BillingPlanDefinition["features"];
  readonly allowedModels: readonly string[];
}

// tier + features (quality-mode/refino) + allowedModels são fatos de backend; ficam aqui, indexados por id.
// trial reusa a tier "pro" (acesso full, ADR 0006 §2) — id + status="trialing" marcam o trial.

// Modelos que a policy ativa realmente roteia, com o Groq llama-3.3-70b como teto. Uniforme
// entre planos de propósito: por ADR 0009 o plano gate o *refino* (quality mode), não o modelo —
// todos os tiers roteiam pelos mesmos perfis. Este campo só é consultado quando um cliente de
// API pede um `model` explícito (usage-policy.ts); o caminho do produto passa por
// `backend-${qualityMode}`, injetado em billing-bootstrap.
const ROUTED_MODELS = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "llama-3.3-70b-versatile"] as const;

const PLAN_METADATA: Record<string, PlanMetadata> = {
  trial: {
    tier: "pro",
    features: [
      { key: "execution.sync_mode", enabled: true },
      { key: "content.language.refinement", enabled: true }
    ],
    allowedModels: ROUTED_MODELS
  },
  explorador: {
    tier: "starter",
    features: [
      { key: "execution.sync_mode", enabled: true },
      { key: "content.language.refinement", enabled: false }
    ],
    allowedModels: ROUTED_MODELS
  },
  criador: {
    tier: "pro",
    features: [
      { key: "execution.sync_mode", enabled: true },
      { key: "content.language.refinement", enabled: true }
    ],
    allowedModels: ROUTED_MODELS
  },
  profissional: {
    tier: "pro",
    features: [
      { key: "execution.sync_mode", enabled: true },
      { key: "content.language.refinement", enabled: true },
      { key: "rollout.beta.access", enabled: true }
    ],
    allowedModels: ROUTED_MODELS
  }
};

const canonicalCreditCost = catalogPricing.canonicalCreditCost;

export const DEFAULT_BILLING_PLANS: readonly BillingPlanDefinition[] = (
  catalogPricing.plans as readonly CatalogPlan[]
).map((plan) => {
  const meta = PLAN_METADATA[plan.id];
  return {
    id: plan.id,
    tier: meta.tier,
    name: plan.name,
    monthlyCredits: Math.ceil(plan.monthlyGenerations * canonicalCreditCost),
    features: meta.features,
    allowedModels: meta.allowedModels,
    currency: "BRL",
    ...(plan.featured ? { featured: true } : {}),
    ...(plan.priceCents
      ? { prices: { BRL: { monthlyCents: plan.priceCents.BRL }, USD: { monthlyCents: plan.priceCents.USD } } }
      : {})
  } satisfies BillingPlanDefinition;
});
