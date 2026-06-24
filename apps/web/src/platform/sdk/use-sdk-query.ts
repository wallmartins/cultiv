import { isClientSdkError } from "@my-ai-orchestrator/client-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SdkQueryStatus = "loading" | "ready" | "error";

export interface UseSdkQueryResult<TData> {
  readonly status: SdkQueryStatus;
  readonly data: TData | undefined;
  readonly error: unknown;
  readonly retry: () => void;
  readonly isFetching: boolean;
}

function isAbortError(error: unknown, signal: AbortSignal): boolean {
  if (signal.aborted) {
    return true;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (!isClientSdkError(error, "ClientSdkTransportError")) {
    return false;
  }

  return (error as { stage: string }).stage === "aborted";
}

export function useSdkQuery<TData>(
  queryKey: readonly unknown[],
  queryFn: (signal: AbortSignal) => Promise<TData>
): UseSdkQueryResult<TData> {
  const serializedKey = useMemo(() => JSON.stringify(queryKey), [queryKey]);
  const [status, setStatus] = useState<SdkQueryStatus>("loading");
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const dataRef = useRef(data);
  dataRef.current = data;

  const retry = useCallback(() => {
    setRetryAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setStatus("loading");
    setError(null);

    void queryFn(controller.signal)
      .then((next) => {
        if (!cancelled) {
          setData(next);
          setStatus("ready");
        }
      })
      .catch((nextError: unknown) => {
        if (!cancelled && !isAbortError(nextError, controller.signal)) {
          setError(nextError);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [serializedKey, retryAttempt, queryFn]);

  return {
    status,
    data,
    error,
    retry,
    isFetching: status === "loading" && dataRef.current !== undefined
  };
}
