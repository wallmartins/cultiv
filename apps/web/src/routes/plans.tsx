import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouteContext, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { BillingPlanView } from "@my-ai-orchestrator/contracts";
import { creditsAsTexts, queryKeys, useCheckout, useCheckoutStatus, useEntitlement, usePlans, useTopUps } from "@my-ai-orchestrator/shared";
import { CheckoutOverlay, PlansScreen, type CheckoutPhase, type CheckoutProductKind } from "@my-ai-orchestrator/ui/app/plans";
import { DowngradeSurplus } from "@my-ai-orchestrator/ui/app/states";
import { resolvePlanName } from "./billing-view.js";
import { rememberPendingCheckout } from "./pending-checkout-storage.js";
import {
  checkDowngradeSurplus,
  deriveCheckoutKind,
  findTopUpPackage,
  gatewayLabel,
  mapCatalogToCards,
  parsePeriod,
  parseTrigger,
  trialBannerData,
  type DowngradeSurplusCheck
} from "./plans-view.js";

interface PendingCheckout {
  readonly product: CheckoutProductKind;
  readonly itemLabel: string;
}

interface DowngradeConfirm {
  readonly plan: BillingPlanView;
  readonly check: DowngradeSurplusCheck;
}

// S7 — container for /app/plans (catalog · contextual paywall · checkout redirect + return).
// packages/ui/app/plans stays props-in; this is the only file that touches hooks/router/search.
export function PlansRoute() {
  const navigate = useNavigate();
  const search = useRouterState({ select: (state) => state.location.search as Record<string, string | undefined> });
  const queryClient = useQueryClient();

  // `?plan=`/`?period=` são o handoff dos cards da landing — o período entra já aplicado e o
  // plano escolhido chega destacado, pronto pra assinar num clique.
  const [period, setPeriod] = useState<"monthly" | "annual">(() => parsePeriod(search.period) ?? "monthly");
  const [currency, setCurrency] = useState<"BRL" | "USD">("BRL");
  const [pending, setPending] = useState<PendingCheckout | undefined>();
  const [downgradeConfirm, setDowngradeConfirm] = useState<DowngradeConfirm | undefined>();

  const entitlement = useEntitlement();
  const plansQuery = usePlans();
  const topUps = useTopUps();
  const checkout = useCheckout();

  const intentId = search.intentId;
  const checkoutStatusQuery = useCheckoutStatus(intentId ?? "");

  // Voltou do gateway sem ter calibrado: o wizard é o próximo passo do produto, e a confirmação
  // da cobrança viaja junto (PendingCheckoutWatcher) em vez de segurar o autor nesta tela.
  const { appMode } = useRouteContext({ from: "/_shell" });
  useEffect(() => {
    if (!intentId || appMode !== "calibrate") return;
    rememberPendingCheckout(intentId);
    void navigate({ to: "/calibrate" });
  }, [intentId, appMode, navigate]);

  const invalidatedOnReturn = useRef(false);
  useEffect(() => {
    if (checkoutStatusQuery.data && !invalidatedOnReturn.current) {
      invalidatedOnReturn.current = true;
      void queryClient.invalidateQueries({ queryKey: queryKeys.entitlement() });
      void queryClient.invalidateQueries({ queryKey: ["billing"] });
    }
  }, [checkoutStatusQuery.data, queryClient]);

  function startCheckout(input: {
    productKind: "subscription" | "topup";
    internalRef: string;
    billingPeriod: "monthly" | "annual" | "one_time";
    itemLabel: string;
  }) {
    setPending({ product: input.productKind, itemLabel: input.itemLabel });
    checkout.mutate(
      { productKind: input.productKind, internalRef: input.internalRef, currency, billingPeriod: input.billingPeriod },
      {
        onSuccess: (response) => window.location.assign(response.url),
        onError: () => setPending(undefined)
      }
    );
  }

  function checkoutForPlan(plan: BillingPlanView) {
    startCheckout({
      productKind: "subscription",
      internalRef: plan.prices[currency][period].internalRef,
      billingPeriod: period,
      itemLabel: plan.name
    });
  }

  // 2e — a downgrade whose target cap sits below the current balance surfaces the surplus
  // confirm dialog first; anything else (upgrade, same cap, no current plan on file) checks out
  // straight away, same as before.
  function selectPlan(plan: BillingPlanView) {
    const currentPlan = plansQuery.data?.plans.find((candidate) => candidate.current);
    const check = entitlement.data ? checkDowngradeSurplus(plan, currentPlan, entitlement.data.availableCredits) : undefined;
    if (check) {
      setDowngradeConfirm({ plan, check });
      return;
    }
    checkoutForPlan(plan);
  }

  function confirmDowngrade() {
    if (!downgradeConfirm) return;
    const { plan } = downgradeConfirm;
    setDowngradeConfirm(undefined);
    checkoutForPlan(plan);
  }

  function selectTopUp() {
    const pkg = findTopUpPackage(topUps.data?.packages, currency);
    if (!pkg) return;
    startCheckout({
      productKind: "topup",
      internalRef: pkg.id,
      billingPeriod: "one_time",
      itemLabel: pkg.description ?? `pacote de ${pkg.credits} créditos`
    });
  }

  function returnToCatalog() {
    void navigate({ to: "/plans" });
  }

  const kind = deriveCheckoutKind({
    intentId,
    isCreatingCheckout: checkout.isPending,
    checkoutStatus: checkoutStatusQuery.data,
    checkoutStatusLoading: checkoutStatusQuery.isPending
  });

  const returnedPlan = plansQuery.data?.plans.find((plan) => plan.id === checkoutStatusQuery.data?.planId);
  const returnedProduct: CheckoutProductKind = checkoutStatusQuery.data?.planId ? "subscription" : "topup";
  const returnedItemLabel = returnedProduct === "subscription" ? (returnedPlan?.name ?? "seu plano") : "pacote de créditos";

  const checkoutPhase: CheckoutPhase | undefined =
    kind === "redirecting"
      ? {
          kind: "redirecting",
          label: "indo pro pagamento seguro…",
          meta: pending
            ? pending.product === "subscription"
              ? `plano ${pending.itemLabel}`
              : pending.itemLabel
            : checkout.data
              ? `${gatewayLabel(checkout.data.gateway)}`
              : undefined
        }
      : kind === "checking"
        ? { kind: "redirecting", label: "confirmando pagamento…" }
        : kind === "success"
          ? { kind: "success", product: returnedProduct, itemLabel: returnedItemLabel, onDone: () => navigate({ to: "/generate" }) }
          : kind === "pending"
            ? { kind: "pending", product: returnedProduct, onDone: returnToCatalog }
            : kind === "failed"
              ? {
                  kind: "failed",
                  onRetry: returnedPlan ? () => selectPlan(returnedPlan) : undefined,
                  onDismiss: returnToCatalog
                }
              : undefined;

  const trigger = parseTrigger(search.trigger);
  const trialBanner = entitlement.data ? trialBannerData(entitlement.data, new Date()) : undefined;
  const checkoutInFlight = checkout.isPending;

  const plansState = plansQuery.isPending ? "loading" : plansQuery.isError ? "error" : "ready";
  const plans = plansQuery.data
    ? mapCatalogToCards(plansQuery.data, period, currency, checkoutInFlight, selectPlan, search.plan)
    : [];

  return (
    <>
      <PlansScreen
        paywall={
          trigger
            ? {
                trigger,
                creditsAsTexts: entitlement.data
                  ? creditsAsTexts(entitlement.data.availableCredits, entitlement.data.canonicalCreditCost)
                  : undefined
              }
            : undefined
        }
        trialBanner={trialBanner}
        period={period}
        currency={currency}
        onPeriodChange={setPeriod}
        onCurrencyChange={setCurrency}
        plansState={plansState}
        plans={plans}
        onRetryPlans={() => void plansQuery.refetch()}
        disclaimer={plansQuery.data?.generationsDisclaimer ?? ""}
        topUp={{ onClick: selectTopUp, disabled: checkoutInFlight || !findTopUpPackage(topUps.data?.packages, currency) }}
      />
      <CheckoutOverlay phase={checkoutPhase} />
      {downgradeConfirm && entitlement.data ? (
        <div className="checkout-overlay">
          <DowngradeSurplus
            balance={entitlement.data.availableCredits}
            keptCredits={downgradeConfirm.check.keptCredits}
            surplusCredits={downgradeConfirm.check.surplusCredits}
            fromPlan={resolvePlanName(entitlement.data, plansQuery.data?.plans)}
            toPlan={downgradeConfirm.plan.name}
            onConfirm={confirmDowngrade}
            onKeep={() => setDowngradeConfirm(undefined)}
          />
        </div>
      ) : null}
    </>
  );
}
