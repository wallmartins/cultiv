import type {
  GenerationIntent,
  GenerationPreviewRequest,
  GenerationPreviewResponse,
  GenerationScope
} from "@my-ai-orchestrator/contracts";
import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { setCachedCreditBalance } from "~/platform/credits/credit-balance-cache";

export type GenerationPreviewStatus = "idle" | "loading" | "ready" | "error";

const COMMERCIAL_DEBOUNCE_MS = 400;

export type CommercialPreviewRequest = {
  readonly intent?: GenerationIntent;
  readonly scope?: GenerationScope;
  readonly contentType?: string;
  readonly language: string;
  readonly qualityMode: GenerationPreviewRequest["qualityMode"];
};

function hasCommercialTarget(request: CommercialPreviewRequest): boolean {
  if (request.contentType) {
    return true;
  }

  return request.intent !== undefined && request.scope !== undefined;
}

async function fetchPreview(
  client: ReturnType<typeof useClientSdk>,
  request: GenerationPreviewRequest,
  signal?: AbortSignal
): Promise<GenerationPreviewResponse> {
  return client.toPromise(client.preview.get({ ...request, signal }));
}

export function useCommercialGenerationPreview(request: CommercialPreviewRequest | null) {
  const client = useClientSdk();
  const debouncedRequest = useDebouncedValue(request, COMMERCIAL_DEBOUNCE_MS);
  const [status, setStatus] = useState<GenerationPreviewStatus>("idle");
  const [preview, setPreview] = useState<GenerationPreviewResponse | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!debouncedRequest?.language || !hasCommercialTarget(debouncedRequest)) {
      setStatus("idle");
      setPreview(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setStatus("loading");
    setError(null);

    void fetchPreview(
      client,
      {
        intent: debouncedRequest.intent,
        scope: debouncedRequest.scope,
        contentType: debouncedRequest.contentType,
        language: debouncedRequest.language,
        qualityMode: debouncedRequest.qualityMode,
        includeRecommendation: false
      },
      controller.signal
    )
      .then((response) => {
        if (!cancelled) {
          setPreview(response);
          setStatus("ready");
          setCachedCreditBalance(response.currentBalance);
        }
      })
      .catch((nextError: unknown) => {
        if (!cancelled && !controller.signal.aborted) {
          setError(nextError);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [client, debouncedRequest]);

  return { status, preview, error, isRefreshing: status === "loading" && preview !== null };
}

export function useFullGenerationPreview(
  request: GenerationPreviewRequest | null,
  refreshKey: number
) {
  const client = useClientSdk();
  const [status, setStatus] = useState<GenerationPreviewStatus>("idle");
  const [preview, setPreview] = useState<GenerationPreviewResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const fetchedContextKeyRef = useRef<string | null>(null);
  const requestContextKey = request ? stablePreviewContextKey(request) : null;

  useEffect(() => {
    if (!request || refreshKey === 0) {
      setStatus("idle");
      setPreview(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setStatus("loading");
    setError(null);

    void fetchPreview(client, { ...request, includeRecommendation: true }, controller.signal)
      .then((response) => {
        if (!cancelled) {
          setPreview(response);
          setStatus("ready");
          fetchedContextKeyRef.current = requestContextKey;
        }
      })
      .catch((nextError: unknown) => {
        if (!cancelled && !controller.signal.aborted) {
          setError(nextError);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [client, refreshKey, request, requestContextKey]);

  const isStale =
    preview !== null &&
    requestContextKey !== null &&
    fetchedContextKeyRef.current !== null &&
    fetchedContextKeyRef.current !== requestContextKey;

  return { status, preview, error, isStale, isRefreshing: status === "loading" && preview !== null };
}

function stablePreviewContextKey(request: GenerationPreviewRequest): string {
  return JSON.stringify({
    briefing: request.briefing ?? null,
    importedContext: request.importedContext ?? null
  });
}
