import type { GenerationPreviewRequest, GenerationPreviewResponse } from "@my-ai-orchestrator/contracts";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { setCachedCreditBalance } from "~/platform/credits/credit-balance-cache";

export type GenerationPreviewStatus = "idle" | "loading" | "ready" | "error";

export function useGenerationPreview(request: GenerationPreviewRequest | null) {
  const client = useClientSdk();
  const debouncedRequest = useDebouncedValue(request, 500);
  const [status, setStatus] = useState<GenerationPreviewStatus>("idle");
  const [preview, setPreview] = useState<GenerationPreviewResponse | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!debouncedRequest?.contentType) {
      setStatus("idle");
      setPreview(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setError(null);

    void client
      .toPromise(client.preview.get(debouncedRequest))
      .then((response) => {
        if (!cancelled) {
          setPreview(response);
          setStatus("ready");
          setCachedCreditBalance(response.currentBalance);
        }
      })
      .catch((nextError: unknown) => {
        if (!cancelled) {
          setError(nextError);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client, debouncedRequest]);

  return { status, preview, error };
}
