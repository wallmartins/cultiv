import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys, useCheckoutStatus } from "@my-ai-orchestrator/shared";
import { CheckoutOverlay } from "@my-ai-orchestrator/ui/app/plans";

const STORAGE_KEY = "cultiv:pending-checkout";

// Mesma política best-effort do calibrate-view: private-mode Safari e o jsdom dos testes podem
// lançar no acesso. Perder o handle só custa o aviso de falha, nunca a cobrança em si.
export function rememberPendingCheckout(intentId: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, intentId);
  } catch {
    // ignore
  }
}

export function forgetPendingCheckout(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function readPendingCheckout(): string | undefined {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

// Quem assina antes de calibrar segue direto pro wizard sem esperar o webhook — este watcher
// carrega a confirmação junto, fora do /plans, e só reaparece se a cobrança falhar.
export function PendingCheckoutWatcher() {
  const [intentId, setIntentId] = useState(readPendingCheckout);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const status = useCheckoutStatus(intentId ?? "");
  const resolved = status.data?.status;

  useEffect(() => {
    if (resolved !== "success") return;
    forgetPendingCheckout();
    setIntentId(undefined);
    void queryClient.invalidateQueries({ queryKey: queryKeys.entitlement() });
    void queryClient.invalidateQueries({ queryKey: ["billing"] });
  }, [resolved, queryClient]);

  if (resolved !== "failed" || dismissed) return null;

  function close() {
    forgetPendingCheckout();
    setDismissed(true);
    setIntentId(undefined);
  }

  return (
    <CheckoutOverlay
      phase={{
        kind: "failed",
        onRetry: () => {
          close();
          void navigate({ to: "/plans" });
        },
        onDismiss: close
      }}
    />
  );
}
