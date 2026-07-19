import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys, useCheckoutStatus } from "@my-ai-orchestrator/shared";
import { CheckoutOverlay } from "@my-ai-orchestrator/ui/app/plans";
import { forgetPendingCheckout, readPendingCheckout } from "./pending-checkout-storage.js";

// Quem assina antes de calibrar segue direto pro wizard sem esperar o webhook — este watcher
// carrega a confirmação junto, fora do /plans, e só reaparece se a cobrança falhar.
// Carregado sob demanda (router.tsx): só desce quando há um checkout pendente de fato.
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

export default PendingCheckoutWatcher;
