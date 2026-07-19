/**
 * @vitest-environment jsdom
 */
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { BillingEntitlementView, LedgerStatementRow } from "@my-ai-orchestrator/contracts";
import React from "react";
import { describe, expect, it } from "vitest";
import { makeAppRuntime, queryKeys, RuntimeProvider } from "@my-ai-orchestrator/shared";
import { BillingScreen, type BalanceCardProps, type PlanCardProps } from "@my-ai-orchestrator/ui/app/billing";
import { BillingRoute } from "~/routes/billing.js";
import { buildLedgerRows, deriveSubscriptionState, resolveCycleCredits, resolvePlanName } from "~/routes/billing-view.js";
import { entitlementFixture } from "./fixtures.js";
import { renderWithRouter } from "./render-with-router.js";

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
}

// Mirrors detail.test.tsx's renderDetail — router.tsx's real "/_shell" + "/billing" route is
// untouched here.
function renderBilling(queryClient: QueryClient) {
  const rootRoute = createRootRoute();
  const shellRoute = createRoute({ getParentRoute: () => rootRoute, id: "_shell", component: () => <Outlet /> });
  const billingRoute = createRoute({ getParentRoute: () => shellRoute, path: "/billing", component: BillingRoute });
  const routeTree = rootRoute.addChildren([shellRoute.addChildren([billingRoute])]);
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/billing"] }) });
  const runtime = makeAppRuntime({ baseUrl: "http://localhost", getToken: () => null });

  return render(
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider runtime={runtime}>
        <RouterProvider router={router} />
      </RuntimeProvider>
    </QueryClientProvider>
  );
}

const NOW = new Date("2026-07-17T12:00:00Z");

function billingProps(entitlement: BillingEntitlementView) {
  const view = deriveSubscriptionState(entitlement, NOW);
  const balance: BalanceCardProps = {
    texts: 6,
    credits: entitlement.availableCredits,
    ringFraction: Math.min(1, entitlement.quotaRemaining / entitlement.quotaLimit),
    renewLabel: view.renewLabel
  };
  const plan: PlanCardProps = {
    planName: resolvePlanName(entitlement, undefined),
    payMethod: view.payMethod,
    onSwitchPlan: () => {}
  };
  return { view, balance, plan };
}

describe("billing-view derive (pure)", () => {
  it("trialing — renewLabel + banner copy come from trialEndsAt/quotaRemaining", () => {
    const entitlement: BillingEntitlementView = {
      ...entitlementFixture,
      status: "trialing",
      trialEndsAt: new Date(NOW.getTime() + 4 * 86_400_000).toISOString(),
      quotaRemaining: 3,
      paymentMethod: null
    };
    const view = deriveSubscriptionState(entitlement, NOW);
    expect(view.renewLabel).toBe("teste · termina em 4 dias");
    expect(view.payMethod).toBe("sem método de pagamento ainda");
    expect(view.banner).toMatchObject({
      tone: "accent",
      title: "Você está no teste grátis",
      message: "3 gerações restantes · qualidade cheia, o limite é só volume",
      actionLabel: "Ver planos →"
    });
    expect(resolvePlanName(entitlement, undefined)).toBe("Teste grátis");
  });

  it("active — no banner, renewLabel from renewsAt, payMethod from real pix field", () => {
    const entitlement: BillingEntitlementView = {
      ...entitlementFixture,
      status: "active",
      renewsAt: "2026-08-01T00:00:00Z",
      paymentMethod: { kind: "pix", gateway: "asaas" }
    };
    const view = deriveSubscriptionState(entitlement, NOW);
    expect(view.renewLabel).toBe("renova em 01/08");
    expect(view.payMethod).toBe("pix · ASAAS");
    expect(view.banner).toBeUndefined();
  });

  it("past_due — danger banner, Regularizar copy, credits still valid (renewLabel unchanged)", () => {
    const entitlement: BillingEntitlementView = {
      ...entitlementFixture,
      status: "past_due",
      renewsAt: "2026-08-01T00:00:00Z",
      paymentMethod: { kind: "card", brandLast4: "4242", gateway: "stripe" }
    };
    const view = deriveSubscriptionState(entitlement, NOW);
    expect(view.renewLabel).toBe("renova em 01/08");
    expect(view.payMethod).toBe("cartão final 4242 · Stripe");
    expect(view.banner).toMatchObject({ tone: "danger", title: "Pagamento pendente", actionLabel: "Regularizar →" });
  });

  it("canceled — accessUntil renewLabel, neutral banner, Reativar copy", () => {
    const entitlement: BillingEntitlementView = {
      ...entitlementFixture,
      status: "canceled",
      accessUntil: "2026-07-30T00:00:00Z"
    };
    const view = deriveSubscriptionState(entitlement, NOW);
    expect(view.renewLabel).toBe("acesso até 30/07 · sem renovação");
    expect(view.banner).toMatchObject({ tone: "neutral", title: "Assinatura cancelada", actionLabel: "Reativar →" });
  });

  it("buildLedgerRows collapses categories to curated labels/tones without re-deriving from raw entries", () => {
    const rows: LedgerStatementRow[] = [
      { id: "1", category: "generation", creditsDelta: -2, occurredAt: NOW.toISOString(), topic: "A falácia de delegar" },
      { id: "2", category: "monthly_credits", creditsDelta: 30, occurredAt: "2026-07-01T00:00:00Z", planName: "Criador" },
      { id: "3", category: "refund", creditsDelta: 1, occurredAt: "2026-06-24T00:00:00Z", note: "geração falhou — créditos devolvidos" },
      { id: "4", category: "expiration", creditsDelta: -5, occurredAt: "2026-06-20T00:00:00Z" }
    ];
    const built = buildLedgerRows(rows, NOW);
    expect(built).toEqual([
      { id: "1", amount: "-2", tone: "debit", label: "Geração", sub: '"A falácia de delegar"', date: "hoje" },
      { id: "2", amount: "+30", tone: "credit", label: "Créditos do mês (Criador)", sub: undefined, date: "01/07" },
      {
        id: "3",
        amount: "+1",
        tone: "credit",
        label: "Estorno",
        sub: "geração falhou — créditos devolvidos",
        date: "24/06"
      },
      { id: "4", amount: "-5", tone: "expire", label: "Expiração", sub: undefined, date: "20/06" }
    ]);
  });
});

describe("BillingScreen render (S8)", () => {
  it("trialing state renders the accent banner and balance/plan cards", async () => {
    const entitlement: BillingEntitlementView = {
      ...entitlementFixture,
      status: "trialing",
      trialEndsAt: new Date(NOW.getTime() + 4 * 86_400_000).toISOString(),
      quotaRemaining: 3,
      paymentMethod: null
    };
    const { view, balance, plan } = billingProps(entitlement);

    await renderWithRouter(
      <BillingScreen loading={false} banner={{ ...view.banner!, onAction: () => {} }} balance={balance} plan={plan} ledgerRows={[]} />
    );

    expect(screen.getByText("Você está no teste grátis")).toBeInTheDocument();
    expect(screen.getByText("teste · termina em 4 dias")).toBeInTheDocument();
    expect(screen.getByText("nada por aqui ainda")).toBeInTheDocument();
  });

  it("active state renders no banner", async () => {
    const entitlement: BillingEntitlementView = { ...entitlementFixture, status: "active" };
    const { balance, plan } = billingProps(entitlement);

    await renderWithRouter(<BillingScreen loading={false} balance={balance} plan={plan} ledgerRows={[]} />);

    expect(screen.queryByText(/teste grátis/)).not.toBeInTheDocument();
    expect(screen.queryByText("Pagamento pendente")).not.toBeInTheDocument();
  });

  it("past_due state renders the danger banner with Regularizar action", async () => {
    const entitlement: BillingEntitlementView = { ...entitlementFixture, status: "past_due", renewsAt: "2026-08-01T00:00:00Z" };
    const { view, balance, plan } = billingProps(entitlement);

    await renderWithRouter(
      <BillingScreen loading={false} banner={{ ...view.banner!, onAction: () => {} }} balance={balance} plan={plan} ledgerRows={[]} />
    );

    expect(screen.getByText("Pagamento pendente")).toBeInTheDocument();
    expect(screen.getByText("Regularizar →")).toBeInTheDocument();
  });

  it("canceled state renders the neutral banner with Reativar action", async () => {
    const entitlement: BillingEntitlementView = { ...entitlementFixture, status: "canceled", accessUntil: "2026-07-30T00:00:00Z" };
    const { view, balance, plan } = billingProps(entitlement);

    await renderWithRouter(
      <BillingScreen loading={false} banner={{ ...view.banner!, onAction: () => {} }} balance={balance} plan={plan} ledgerRows={[]} />
    );

    expect(screen.getByText("Assinatura cancelada")).toBeInTheDocument();
    expect(screen.getByText("Reativar →")).toBeInTheDocument();
  });

  it("empty ledger renders the discreet empty state, not an invented row", async () => {
    const { balance, plan } = billingProps({ ...entitlementFixture, status: "active" });

    await renderWithRouter(<BillingScreen loading={false} balance={balance} plan={plan} ledgerRows={[]} />);

    expect(screen.getByText("nada por aqui ainda")).toBeInTheDocument();
  });

  it("populated ledger renders curated rows", async () => {
    const { balance, plan } = billingProps({ ...entitlementFixture, status: "active" });
    const rows = buildLedgerRows(
      [{ id: "1", category: "generation", creditsDelta: -2, occurredAt: NOW.toISOString(), topic: "A falácia de delegar" }],
      NOW
    );

    await renderWithRouter(<BillingScreen loading={false} balance={balance} plan={plan} ledgerRows={rows} />);

    expect(screen.getByText("Geração")).toBeInTheDocument();
    expect(screen.getByText('"A falácia de delegar"')).toBeInTheDocument();
    expect(screen.getByText("-2")).toBeInTheDocument();
  });

  it("loading state shows an in-flow placeholder instead of the cards", async () => {
    await renderWithRouter(<BillingScreen loading={true} ledgerRows={[]} ledgerLoading={true} />);

    expect(screen.getByText("carregando…")).toBeInTheDocument();
    expect(screen.getByText("carregando extrato…")).toBeInTheDocument();
  });

  it("resolveCycleCredits prefers the catalog plan's real grant, falls back to the entitlement field", () => {
    const plan = { ...entitlementFixture, planId: "creator" };
    const catalog = [{ id: "creator", monthlyCredits: 30 } as never];
    expect(resolveCycleCredits(plan, catalog)).toBe(30);
    expect(resolveCycleCredits({ ...plan, monthlyCreditsRemaining: 12 }, undefined)).toBe(12);
  });
});

describe("BillingRoute (1d) — gate.past_due gets the paywall card instead of the banner strip", () => {
  it("renders PaymentPendingZeroCredits, not the regular BillingScreen, when gate is past_due", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.entitlement(), {
      ...entitlementFixture,
      status: "past_due",
      gate: "past_due",
      availableCredits: 0,
      monthlyCreditsRemaining: 30
    });
    queryClient.setQueryData(queryKeys.billingPlans(), { plans: [], generationsDisclaimer: "" });

    renderBilling(queryClient);

    expect(await screen.findByText("Seus créditos acabaram — e a renovação não passou.")).toBeInTheDocument();
    expect(screen.getByText(/os 30 créditos do ciclo/)).toBeInTheDocument();
    expect(screen.queryByText("Pagamento pendente")).not.toBeInTheDocument();
  });

  it("gate ok with active status renders the regular screen, no paywall card", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(queryKeys.entitlement(), { ...entitlementFixture, status: "active" });
    queryClient.setQueryData(queryKeys.billingPlans(), { plans: [], generationsDisclaimer: "" });
    queryClient.setQueryData(queryKeys.billingLedger({}), { items: [] });

    renderBilling(queryClient);

    expect(await screen.findByText("nada por aqui ainda")).toBeInTheDocument();
    expect(screen.queryByText("Seus créditos acabaram — e a renovação não passou.")).not.toBeInTheDocument();
  });
});
