import type { ClientSdk } from "@my-ai-orchestrator/client-sdk";
import {
  getCreditBalanceInFlight,
  setCachedCreditBalance,
  setCreditBalanceInFlight
} from "./credit-balance-cache";

export function fetchCreditBalance(client: ClientSdk): Promise<number> {
  const existing = getCreditBalanceInFlight();
  if (existing) {
    return existing;
  }

  const promise = client
    .toPromise(client.billing.getEntitlement())
    .then((entitlement) => {
      setCachedCreditBalance(entitlement.availableCredits);
      setCreditBalanceInFlight(null);
      return entitlement.availableCredits;
    })
    .catch((error: unknown) => {
      setCreditBalanceInFlight(null);
      throw error;
    });

  setCreditBalanceInFlight(promise);
  return promise;
}
