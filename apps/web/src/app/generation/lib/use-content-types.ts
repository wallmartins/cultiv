import { useCallback } from "react";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { useSdkQuery } from "~/platform/sdk/use-sdk-query";

export type ContentTypesStatus = "loading" | "ready" | "error";

export function useContentTypes() {
  const client = useClientSdk();

  const { status, data, error, retry } = useSdkQuery(
    ["contentTypes"],
    useCallback((signal) => client.toPromise(client.contentTypes.list({ signal })), [client])
  );

  return { status, catalog: data ?? null, error, retry };
}
