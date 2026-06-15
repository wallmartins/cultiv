import type { ContentTypeCatalogView } from "@my-ai-orchestrator/contracts";
import { useCallback, useEffect, useState } from "react";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";

export type ContentTypesStatus = "loading" | "ready" | "error";

export function useContentTypes() {
  const client = useClientSdk();
  const [status, setStatus] = useState<ContentTypesStatus>("loading");
  const [catalog, setCatalog] = useState<ContentTypeCatalogView | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);

    void client
      .toPromise(client.contentTypes.list())
      .then((next) => {
        if (!cancelled) {
          setCatalog(next);
          setStatus("ready");
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
  }, [client, attempt]);

  return { status, catalog, error, retry };
}
