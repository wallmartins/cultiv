import type { ClientSdk } from "@my-ai-orchestrator/client-sdk";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import {
  getCachedCreditBalance,
  getCreditBalanceInFlight,
  invalidateCreditBalanceCache,
  setCachedCreditBalance,
  setCreditBalanceInFlight,
  subscribeCreditBalance
} from "./credit-balance-cache";

export type CreditBalanceStatus = "loading" | "ready" | "error";

export interface CreditBalanceState {
  readonly status: CreditBalanceStatus;
  readonly balance: number | null;
  readonly retry: () => void;
}

function fetchCreditBalance(client: ClientSdk): Promise<number> {
  const existing = getCreditBalanceInFlight();
  if (existing) {
    return existing;
  }

  const promise = client
    .toPromise(client.preview.get({ includeRecommendation: false }))
    .then((preview) => {
      setCachedCreditBalance(preview.currentBalance);
      setCreditBalanceInFlight(null);
      return preview.currentBalance;
    })
    .catch((error: unknown) => {
      setCreditBalanceInFlight(null);
      throw error;
    });

  setCreditBalanceInFlight(promise);
  return promise;
}

export function useCreditBalance(): CreditBalanceState {
  const client = useClientSdk();
  const cachedBalance = useSyncExternalStore(subscribeCreditBalance, getCachedCreditBalance, () => null);
  const [status, setStatus] = useState<CreditBalanceStatus>(() =>
    cachedBalance === null ? "loading" : "ready"
  );
  const [retryToken, setRetryToken] = useState(0);

  const retry = useCallback(() => {
    invalidateCreditBalanceCache();
    setStatus("loading");
    setRetryToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (cachedBalance !== null) {
      setStatus("ready");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    void fetchCreditBalance(client)
      .then(() => {
        if (!cancelled) {
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client, cachedBalance, retryToken]);

  return {
    status,
    balance: cachedBalance,
    retry
  };
}
