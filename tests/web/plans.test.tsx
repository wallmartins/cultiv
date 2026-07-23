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
import { DEFAULT_LOCALE, makeFormatters, messagesFor } from "@my-ai-orchestrator/ui/app/i18n";
import { PlansScreen, type PlanCardData } from "@my-ai-orchestrator/ui/app/plans";
import {
  checkDowngradeSurplus,
  daysRemaining,
  deriveCheckoutKind,
  findTopUpPackage,
  gatewayLabel,
  mapCatalogToCards,
  mapPlanToCard,
  parsePeriod,
  parseTrigger,
  trialBannerData
} from "~/routes/plans-view.js";
import { entitlementFixture } from "./fixtures.js";
import { renderWithRouter } from "./render-with-router.js";

// Components render outside I18nProvider in this file (falls back to pt-BR, per CONVENTIONS.md);
// pure view functions take the dictionary as a parameter, so tests construct the same pt-BR
// instance to keep both sides consistent.
const t = messagesFor(DEFAULT_LOCALE);
const format = makeFormatters(DEFAULT_LOCALE);

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
    const cards = mapCatalogToCards(t, format, planCatalogFixture, "monthly", "BRL", false, () => {}, "explorador");
    expect(cards.find((card) => card.id === "explorador")?.featured).toBe(true);
    expect(cards.find((card) => card.id === "criador")?.featured).toBe(false);
  });

  it("an unknown ?plan= leaves the catalog's own highlight alone", () => {
    const cards = mapCatalogToCards(t, format, planCatalogFixture, "monthly", "BRL", false, () => {}, "inexistente");
    expect(cards.find((card) => card.id === "criador")?.featured).toBe(true);
    expect(cards.find((card) => card.id === "explorador")?.featured).toBe(false);
  });
});

describe("plans-view: mapPlanToCard currency (cents → format.currency units, no discount recompute)", () => {
  it("BRL: divides cents to units before formatting, never a hand-rolled comma swap", () => {
    const card = mapPlanToCard(t, format, catalogPlan("criador", true), "monthly", "BRL", false, () => {});
    expect(card.priceLabel).toBe(format.currency(29, "BRL"));
  });

  it("USD: same conversion, different currency/symbol", () => {
    const planUsd = {
      ...catalogPlan("criador", true),
      prices: { USD: { monthly: { amountCents: 1950, internalRef: "criador_m" } } }
    } as unknown as BillingPlanView;
    const card = mapPlanToCard(t, format, planUsd, "monthly", "USD", false, () => {});
    expect(card.priceLabel).toBe(format.currency(19.5, "USD"));
  });

  it("annual billNote converts annualTotalCents to units too", () => {
    const planAnnual = {
      ...catalogPlan("criador", true),
      prices: {
        BRL: {
          monthly: { amountCents: 2900, internalRef: "criador_m" },
          annual: { amountCents: 2320, annualTotalCents: 27_840, internalRef: "criador_a" }
        }
      }
    } as unknown as BillingPlanView;
    const card = mapPlanToCard(t, format, planAnnual, "annual", "BRL", false, () => {});
    expect(card.billNote).toBe(t.plans.billNote.annualTotal(format.currency(278.4, "BRL")));
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
    expect(gatewayLabel(t, "stripe")).toBe("Stripe");
    expect(gatewayLabel(t, "asaas")).toBe("ASAAS");
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
