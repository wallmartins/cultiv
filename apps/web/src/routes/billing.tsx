import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  creditsAsTexts,
  useBillingPortalSession,
  useEntitlement,
  useLedger,
  usePlans,
  useSubscriptionCancel
} from "@my-ai-orchestrator/shared";
import { useFormat, useMessages } from "@my-ai-orchestrator/ui/app/i18n";
import { BillingScreen, type PlanCardAction } from "@my-ai-orchestrator/ui/app/billing";
import { PaymentPendingZeroCredits } from "@my-ai-orchestrator/ui/app/states";
import {
  buildLedgerRows,
  deriveSubscriptionState,
  resolveCycleCredits,
  resolvePlanName,
  type SubscriptionState
} from "./billing-view.js";

export function BillingRoute() {
  const t = useMessages();
  const format = useFormat();
  const navigate = useNavigate();
  const entitlement = useEntitlement();
  const ledger = useLedger();
  const plans = usePlans();
  const cancelSubscription = useSubscriptionCancel();
  const portalSession = useBillingPortalSession();

  const now = useMemo(() => new Date(), [entitlement.data]);
  const data = entitlement.data;
  const view = data ? deriveSubscriptionState(t, format, data, now) : undefined;

  const goPlans = () => void navigate({ to: "/plans" });

  const openPortal = () => {
    portalSession.mutate(undefined, {
      onSuccess: (session) => {
        window.location.href = session.url;
      }
    });
  };

  // "Regularizar" prefers the server-issued regularizeUrl (real field on BillingManagement); falls
  // back to the portal, then to /plans — never a made-up endpoint.
  const regularize = () => {
    if (data?.management.regularizeUrl) {
      window.location.href = data.management.regularizeUrl;
      return;
    }
    if (data?.management.canManageViaPortal) {
      openPortal();
      return;
    }
    goPlans();
  };

  // No useSubscriptionReactivate hook exists — management.canReactivate/canChangeMethod come back
  // hardcoded false server-side (packages/shared/src/hooks/billing.ts). "Reativar"/"cancelada" fall
  // back to the real, wired /plans re-subscribe path instead of a dead button.
  function bannerActionFor(state: SubscriptionState): () => void {
    if (state === "past_due") return regularize;
    if (state === "canceled" && data?.management.canManageViaPortal) return openPortal;
    return goPlans;
  }

  // 1d — dunning-with-zero-credits (gate.past_due already means exactly that server-side) gets
  // the full paywall card instead of the regular banner strip.
  if (data && data.gate === "past_due") {
    return (
      <PaymentPendingZeroCredits
        planName={resolvePlanName(t, data, plans.data?.plans)}
        cycleCredits={resolveCycleCredits(data, plans.data?.plans)}
        onRegularize={regularize}
      />
    );
  }

  const banner = view?.banner ? { ...view.banner, onAction: bannerActionFor(view.state) } : undefined;

  const secondaryAction: PlanCardAction | undefined = data
    ? data.management.canManageViaPortal
      ? { label: t.billing.manageSubscription, onClick: openPortal, pending: portalSession.isPending }
      : data.management.canCancel
        ? {
            label: t.billing.cancelSubscription,
            onClick: () => cancelSubscription.mutate(),
            tone: "danger",
            pending: cancelSubscription.isPending
          }
        : undefined
    : undefined;

  return (
    <BillingScreen
      loading={entitlement.isLoading}
      banner={banner}
      balance={
        data && view
          ? {
              texts: creditsAsTexts(data.availableCredits, data.canonicalCreditCost),
              credits: data.availableCredits,
              ringFraction: data.quotaLimit > 0 ? Math.min(1, data.quotaRemaining / data.quotaLimit) : 0,
              renewLabel: view.renewLabel
            }
          : undefined
      }
      plan={
        data && view
          ? {
              planName: resolvePlanName(t, data, plans.data?.plans),
              payMethod: view.payMethod,
              onSwitchPlan: goPlans,
              secondaryAction
            }
          : undefined
      }
      ledgerRows={ledger.data ? buildLedgerRows(t, format, ledger.data.items, now) : []}
      ledgerLoading={ledger.isLoading}
    />
  );
}
