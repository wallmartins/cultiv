import type { BillingPlanView, PlanCatalogView } from "@my-ai-orchestrator/contracts";
import { DEFAULT_BILLING_PLANS } from "./default-plans.js";
import { FEATURED_PLAN_TAG, GENERATIONS_DISCLAIMER, mapPlanFeaturesToBullets } from "./plan-catalog-presentation.js";
import { resolveQuotaLimit } from "./quota-presentation.js";
import type { BillingPlanDefinition, BillingPlanPeriodPriceDefinition } from "./types.js";

const ANNUAL_DISCOUNT_FACTOR = 0.8; // ADR 0006 §3 — anual = -20%, computado no backend
const CATALOG_PLAN_IDS = ["explorador", "criador", "profissional"] as const;
type CatalogPlanId = (typeof CATALOG_PLAN_IDS)[number];

export interface ListPlanCatalogOptions {
  readonly canonicalCreditCost: number;
  readonly currentPlanId?: string; // presente = variante /me/ (marca `current` mesmo quando não bate nenhum plano)
}

function isCatalogPlanId(id: string): id is CatalogPlanId {
  return (CATALOG_PLAN_IDS as readonly string[]).includes(id);
}

// internalRef = bare plan id, casando com billing_gateway_catalog.internal_ref (currency/period
// são colunas separadas ali, não parte da string). A ADR 0006 §4 descreveu um composite
// "{planId}_{period}_{currency}" que nunca foi materializado no schema/findCatalogEntry — o
// contrato segue a implementação real, não a ADR (checkout via composite sempre 404ava).
function buildMonthlyPrice(planId: string, monthlyCents: number) {
  return {
    amountCents: monthlyCents,
    per: "month" as const,
    internalRef: planId
  };
}

function buildAnnualPrice(planId: string, monthlyCents: number) {
  const annualMonthlyCents = Math.round(monthlyCents * ANNUAL_DISCOUNT_FACTOR);
  return {
    amountCents: annualMonthlyCents,
    per: "month" as const,
    annualTotalCents: annualMonthlyCents * 12,
    internalRef: planId
  };
}

function buildPlanPrices(
  planId: string,
  prices: { readonly BRL: BillingPlanPeriodPriceDefinition; readonly USD: BillingPlanPeriodPriceDefinition }
) {
  return {
    BRL: {
      monthly: buildMonthlyPrice(planId, prices.BRL.monthlyCents),
      annual: buildAnnualPrice(planId, prices.BRL.monthlyCents)
    },
    USD: {
      monthly: buildMonthlyPrice(planId, prices.USD.monthlyCents),
      annual: buildAnnualPrice(planId, prices.USD.monthlyCents)
    }
  };
}

function buildPlanView(
  plan: BillingPlanDefinition,
  canonicalCreditCost: number,
  currentPlanId: string | undefined
): BillingPlanView | undefined {
  if (!plan.prices || !isCatalogPlanId(plan.id)) {
    return undefined; // ponytail: catalog plans are always seeded with prices; guards malformed registration
  }

  const featured = plan.featured === true;
  return {
    id: plan.id,
    tier: plan.tier,
    name: plan.name,
    ...(featured ? { tag: FEATURED_PLAN_TAG } : {}),
    monthlyGenerations: resolveQuotaLimit(plan.monthlyCredits, canonicalCreditCost),
    monthlyCredits: plan.monthlyCredits,
    featured,
    features: mapPlanFeaturesToBullets(plan.features),
    prices: buildPlanPrices(plan.id, plan.prices),
    ...(currentPlanId !== undefined ? { current: plan.id === currentPlanId } : {})
  };
}

export function listPlanCatalog(options: ListPlanCatalogOptions): PlanCatalogView {
  const plans = DEFAULT_BILLING_PLANS.map((plan) =>
    buildPlanView(plan, options.canonicalCreditCost, options.currentPlanId)
  ).filter((view): view is BillingPlanView => view !== undefined);

  return {
    plans,
    generationsDisclaimer: GENERATIONS_DISCLAIMER
  };
}
