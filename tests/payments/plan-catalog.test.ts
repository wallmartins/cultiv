import { describe, expect, it } from "vitest";
import { listPlanCatalog } from "../../packages/payments/src/plan-catalog.js";

describe("listPlanCatalog", () => {
  it("builds the 3 paid tiers with annual = round(monthly * 0.8) and derived monthlyGenerations", () => {
    const view = listPlanCatalog({ canonicalCreditCost: 2.5 });

    expect(view.plans.map((plan) => plan.id)).toEqual(["explorador", "criador", "profissional"]);
    expect(typeof view.generationsDisclaimer).toBe("string");

    const explorador = view.plans.find((plan) => plan.id === "explorador")!;
    expect(explorador.monthlyGenerations).toBe(15);
    expect(explorador.featured).toBe(false);
    expect(explorador.prices.BRL.monthly.amountCents).toBe(4900);
    expect(explorador.prices.BRL.annual.amountCents).toBe(3920);
    expect(explorador.prices.BRL.annual.annualTotalCents).toBe(47040);
    expect(explorador.prices.USD.monthly.amountCents).toBe(900);
    expect(explorador.prices.USD.annual.amountCents).toBe(720);
    // bare plan id — casa com billing_gateway_catalog.internal_ref (findCatalogEntry usa
    // currency/billingPeriod como colunas separadas, não como parte da string). A ADR 0006 §4
    // descreveu um composite "{planId}_{period}_{currency}" que nunca foi implementado no
    // schema real — testar o composite aqui era o bug: todo checkout de assinatura 404ava.
    expect(explorador.prices.BRL.monthly.internalRef).toBe("explorador");
    expect(explorador.prices.BRL.annual.internalRef).toBe("explorador");
    expect(explorador.prices.USD.monthly.internalRef).toBe("explorador");

    const criador = view.plans.find((plan) => plan.id === "criador")!;
    expect(criador.monthlyGenerations).toBe(30);
    expect(criador.featured).toBe(true);
    expect(criador.tag).toBe("mais escolhido");
    expect(criador.prices.BRL.annual.amountCents).toBe(7920);

    const profissional = view.plans.find((plan) => plan.id === "profissional")!;
    expect(profissional.monthlyGenerations).toBe(80);
    expect(profissional.featured).toBe(false);
    expect(profissional.prices.USD.annual.amountCents).toBe(3920);
  });

  it("omits `current` when currentPlanId is not provided (public route)", () => {
    const view = listPlanCatalog({ canonicalCreditCost: 2.5 });

    expect(view.plans.every((plan) => plan.current === undefined)).toBe(true);
  });

  it("marks `current` on the matching plan when currentPlanId is provided (/me/ route)", () => {
    const view = listPlanCatalog({ canonicalCreditCost: 2.5, currentPlanId: "criador" });

    expect(view.plans.find((plan) => plan.id === "criador")!.current).toBe(true);
    expect(view.plans.find((plan) => plan.id === "explorador")!.current).toBe(false);
    expect(view.plans.find((plan) => plan.id === "profissional")!.current).toBe(false);
  });

  it("excludes the trial plan from the catalog", () => {
    const view = listPlanCatalog({ canonicalCreditCost: 2.5 });

    expect(view.plans.some((plan) => plan.id === "trial")).toBe(false);
  });
});
