/**
 * @vitest-environment jsdom
 */
import { screen } from "@testing-library/react";
import type {
  BillingEntitlementView,
  BillingPlanView,
  BillingTopUpPackage,
  PlanCatalogView
} from "@my-ai-orchestrator/contracts";
import React from "react";
import { describe, expect, it } from "vitest";
import { PlansScreen, type PlanCardData } from "@my-ai-orchestrator/ui/app/plans";
import {
  checkDowngradeSurplus,
  daysRemaining,
  deriveCheckoutKind,
  findTopUpPackage,
  formatCents,
  gatewayLabel,
  mapCatalogToCards,
  parsePeriod,
  parseTrigger,
  trialBannerData
} from "~/routes/plans-view.js";
import { entitlementFixture } from "./fixtures.js";
import { renderWithRouter } from "./render-with-router.js";

const NOW = new Date("2026-07-17T12:00:00Z");

function catalogPlan(id: string, featured: boolean): BillingPlanView {
  return {
    id,
    name: id,
    featured,
    monthlyGenerations: 20,
    monthlyCredits: 30,
    features: [],
    prices: { BRL: { monthly: { amountCents: 2900, internalRef: `${id}_m` } } }
  } as unknown as BillingPlanView;
}

// "criador" é o destaque que o catálogo traz de fábrica (ADR 0006 §3).
const planCatalogFixture = {
  plans: [catalogPlan("explorador", false), catalogPlan("criador", true)]
} as PlanCatalogView;

describe("plans-view: parseTrigger (defensive URL param)", () => {
  it("keeps a known trigger, drops anything else", () => {
    expect(parseTrigger("trial_expired")).toBe("trial_expired");
    expect(parseTrigger("calibration_limit")).toBe("calibration_limit");
    expect(parseTrigger("bogus")).toBeUndefined();
    expect(parseTrigger(undefined)).toBeUndefined();
    expect(parseTrigger(42)).toBeUndefined();
  });
});

describe("plans-view: landing handoff (?plan= / ?period=)", () => {
  it("keeps a known period, drops anything else", () => {
    expect(parsePeriod("monthly")).toBe("monthly");
    expect(parsePeriod("annual")).toBe("annual");
    expect(parsePeriod("weekly")).toBeUndefined();
    expect(parsePeriod(undefined)).toBeUndefined();
  });

  it("moves the highlight to the plan the author picked on the landing", () => {
    const cards = mapCatalogToCards(planCatalogFixture, "monthly", "BRL", false, () => {}, "explorador");
    expect(cards.find((card) => card.id === "explorador")?.featured).toBe(true);
    expect(cards.find((card) => card.id === "criador")?.featured).toBe(false);
  });

  it("an unknown ?plan= leaves the catalog's own highlight alone", () => {
    const cards = mapCatalogToCards(planCatalogFixture, "monthly", "BRL", false, () => {}, "inexistente");
    expect(cards.find((card) => card.id === "criador")?.featured).toBe(true);
    expect(cards.find((card) => card.id === "explorador")?.featured).toBe(false);
  });
});

describe("plans-view: formatCents (cents → currency string, no discount recompute)", () => {
  it("BRL integer vs fractional", () => {
    expect(formatCents(2900, "BRL")).toBe("R$ 29");
    expect(formatCents(2990, "BRL")).toBe("R$ 29,90");
  });
  it("USD integer vs fractional", () => {
    expect(formatCents(1900, "USD")).toBe("$19");
    expect(formatCents(1950, "USD")).toBe("$19.50");
  });
});

describe("plans-view: deriveCheckoutKind (overlay state machine)", () => {
  const base = { intentId: undefined, isCreatingCheckout: false, checkoutStatus: undefined, checkoutStatusLoading: false };

  it("creating a session always wins → redirecting", () => {
    expect(deriveCheckoutKind({ ...base, isCreatingCheckout: true })).toBe("redirecting");
  });
  it("no intentId + no mutation → no overlay", () => {
    expect(deriveCheckoutKind(base)).toBeUndefined();
  });
  it("back from gateway, status still loading → checking", () => {
    expect(deriveCheckoutKind({ ...base, intentId: "int_1", checkoutStatusLoading: true })).toBe("checking");
  });
  it("back from gateway, server truth resolved → the status itself", () => {
    expect(
      deriveCheckoutKind({
        ...base,
        intentId: "int_1",
        checkoutStatus: { status: "success", planId: "creator" } as never
      })
    ).toBe("success");
  });
});

describe("plans-view: trialBannerData (trial pool rides quota fields)", () => {
  it("trialing → used/remaining/total/days from quota + trialEndsAt", () => {
    const entitlement: BillingEntitlementView = {
      ...entitlementFixture,
      status: "trialing",
      quotaLimit: 5,
      quotaRemaining: 3,
      trialEndsAt: new Date(NOW.getTime() + 4 * 86_400_000).toISOString()
    };
    expect(trialBannerData(entitlement, NOW)).toEqual({ used: 2, remaining: 3, totalGenerations: 5, daysRemaining: 4 });
  });
  it("non-trialing → undefined (no banner)", () => {
    expect(trialBannerData({ ...entitlementFixture, status: "active" }, NOW)).toBeUndefined();
  });
});

describe("plans-view: misc pure helpers", () => {
  it("daysRemaining ceils to whole days, floors at 0", () => {
    expect(daysRemaining(new Date(NOW.getTime() + 3.2 * 86_400_000).toISOString(), NOW)).toBe(4);
    expect(daysRemaining(new Date(NOW.getTime() - 86_400_000).toISOString(), NOW)).toBe(0);
  });
  it("gatewayLabel maps gateway ids to display names", () => {
    expect(gatewayLabel("stripe")).toBe("Stripe");
    expect(gatewayLabel("asaas")).toBe("ASAAS");
  });
});

describe("plans-view: checkDowngradeSurplus (2e — monthlyCredits proxy for the real rolloverCap)", () => {
  const creator = { id: "criador", monthlyCredits: 30 } as BillingPlanView;
  const explorador = { id: "explorador", monthlyCredits: 15 } as BillingPlanView;

  it("balance above the target's cap on an actual downgrade → kept/surplus split", () => {
    expect(checkDowngradeSurplus(explorador, creator, 38)).toEqual({ keptCredits: 15, surplusCredits: 23 });
  });

  it("balance at or below the target's cap → no dialog needed", () => {
    expect(checkDowngradeSurplus(explorador, creator, 15)).toBeUndefined();
  });

  it("an upgrade (target cap >= current cap) never triggers the dialog", () => {
    expect(checkDowngradeSurplus(creator, explorador, 38)).toBeUndefined();
  });

  it("no current plan on file (e.g. trial) → nothing to compare against", () => {
    expect(checkDowngradeSurplus(explorador, undefined, 38)).toBeUndefined();
  });
});

describe("plans-view: findTopUpPackage (2 — currency must match, no cross-currency fallback)", () => {
  const brl: BillingTopUpPackage = { id: "topup_brl", credits: 12, priceCents: 1900, currency: "BRL" };
  const usd: BillingTopUpPackage = { id: "topup_usd", credits: 12, priceCents: 500, currency: "USD" };

  it("finds the package matching the selected currency", () => {
    expect(findTopUpPackage([brl, usd], "BRL")).toBe(brl);
    expect(findTopUpPackage([brl, usd], "USD")).toBe(usd);
  });

  it("no package for the selected currency → undefined (never a mismatched fallback)", () => {
    expect(findTopUpPackage([brl], "USD")).toBeUndefined();
  });

  it("no catalog loaded yet → undefined", () => {
    expect(findTopUpPackage(undefined, "BRL")).toBeUndefined();
  });
});

describe("PlansScreen render (smoke — breakdown-12 §12 asked for one)", () => {
  it("renders the catalog heading, a plan card, and the top-up link without crashing", async () => {
    const plan: PlanCardData = {
      id: "criador",
      name: "Criador",
      featured: true,
      current: false,
      priceLabel: "R$ 29",
      billNote: "",
      generations: 30,
      features: ["voz calibrada", "geração ilimitada de temas"],
      ctaLabel: "Assinar Criador →",
      ctaDisabled: false,
      onSelect: () => {}
    };

    await renderWithRouter(
      <PlansScreen
        period="monthly"
        currency="BRL"
        onPeriodChange={() => {}}
        onCurrencyChange={() => {}}
        plansState="ready"
        plans={[plan]}
        disclaimer="gerações são uma aproximação"
        topUp={{ onClick: () => {}, disabled: false }}
      />
    );

    expect(screen.getByText(/Escolha o ritmo da sua/)).toBeInTheDocument();
    expect(screen.getByText("Assinar Criador →")).toBeInTheDocument();
    expect(screen.getByText("precisa de poucos créditos? compra avulsa →")).toBeInTheDocument();
  });
});
