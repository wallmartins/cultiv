import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BillingCheckoutRequest } from "@my-ai-orchestrator/contracts";
import { useRun } from "../runtime/useRun.js";
import { queryKeys } from "./query-keys.js";
import { withSdk } from "./with-sdk.js";

export function useEntitlement() {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.entitlement(),
    queryFn: () => run(withSdk((sdk) => sdk.billing.getEntitlement()))
  });
}

export function usePlans() {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.billingPlans(),
    queryFn: () => run(withSdk((sdk) => sdk.billing.getPlans()))
  });
}

export function useTopUps() {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.billingTopups(),
    queryFn: () => run(withSdk((sdk) => sdk.billing.listTopUps()))
  });
}

export function useLedger(page?: { limit?: number; offset?: number }) {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.billingLedger(page),
    queryFn: () => run(withSdk((sdk) => sdk.billing.getStatement(page)))
  });
}

export function useCheckoutStatus(intentId: string, enabled = true) {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.billingCheckoutStatus(intentId),
    queryFn: () => run(withSdk((sdk) => sdk.billing.getCheckoutStatus({ intentId }))),
    enabled: enabled && Boolean(intentId)
  });
}

// Redirects out to the gateway — invalidation happens on return (see useCheckoutStatus),
// not onSuccess here.
export function useCheckout() {
  const run = useRun();
  return useMutation({
    mutationFn: (request: BillingCheckoutRequest) => run(withSdk((sdk) => sdk.billing.createCheckout(request)))
  });
}

function invalidateAfterSubscriptionChange(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.entitlement() });
  void qc.invalidateQueries({ queryKey: ["billing"] });
}

export function useSubscriptionCancel() {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => run(withSdk((sdk) => sdk.billing.cancelSubscription())),
    onSuccess: (entitlement) => {
      qc.setQueryData(queryKeys.entitlement(), entitlement);
      invalidateAfterSubscriptionChange(qc);
    }
  });
}

// Reactivation / payment-method changes for ASAAS in-app management (BillingManagement.canReactivate
// / .canChangeMethod) have no backend endpoint yet — both flags come back hardcoded false
// (apps/backend/src/routes/billing-routes.ts). The Stripe-managed path goes through the portal.
export function useBillingPortalSession() {
  const run = useRun();
  return useMutation({
    mutationFn: () => run(withSdk((sdk) => sdk.billing.createPortalSession()))
  });
}
