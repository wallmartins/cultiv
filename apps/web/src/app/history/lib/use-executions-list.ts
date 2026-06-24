import type { ExecutionStatusView } from "@my-ai-orchestrator/contracts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { useSdkQuery } from "~/platform/sdk/use-sdk-query";

export type HistoryPeriod = "7d" | "30d" | "90d" | "all";
export type HistoryStatusFilter = "all" | ExecutionStatusView["status"];

export type HistoryFilters = {
  readonly period: HistoryPeriod;
  readonly status: HistoryStatusFilter;
  readonly contentType: string;
};

const PAGE_SIZE = 20;

export function useExecutionsList(filters: HistoryFilters) {
  const client = useClientSdk();
  const [appendItems, setAppendItems] = useState<readonly ExecutionStatusView[]>([]);
  const [loadMoreError, setLoadMoreError] = useState(false);

  const apiFilters = useMemo(
    () => ({
      period: filters.period,
      status: filters.status,
      ...(filters.contentType !== "all" ? { contentType: filters.contentType } : {})
    }),
    [filters.period, filters.status, filters.contentType]
  );

  const { status, data, retry: retryQuery } = useSdkQuery(
    ["executions", apiFilters],
    useCallback(
      (signal) =>
        client.toPromise(
          client.executions.list({
            limit: PAGE_SIZE,
            offset: 0,
            ...apiFilters,
            signal
          })
        ),
      [client, apiFilters]
    )
  );

  useEffect(() => {
    setAppendItems([]);
    setLoadMoreError(false);
  }, [apiFilters]);

  const total = data?.total ?? 0;
  const items = useMemo(
    () => [...(data?.items ?? []), ...appendItems],
    [appendItems, data?.items]
  );
  const loadedCount = items.length;
  const hasMore = loadedCount < total;
  const effectiveStatus = loadMoreError ? "error" : status;

  const loadMore = useCallback(() => {
    if (!data || effectiveStatus === "loading" || !hasMore) {
      return;
    }

    setLoadMoreError(false);

    void client
      .toPromise(
        client.executions.list({
          limit: PAGE_SIZE,
          offset: loadedCount,
          ...apiFilters
        })
      )
      .then((page) => {
        setAppendItems((current) => [...current, ...page.items]);
      })
      .catch(() => {
        setLoadMoreError(true);
      });
  }, [apiFilters, client, data, effectiveStatus, hasMore, loadedCount]);

  const retry = useCallback(() => {
    setAppendItems([]);
    setLoadMoreError(false);
    retryQuery();
  }, [retryQuery]);

  return {
    status: effectiveStatus,
    items,
    total,
    hasMore,
    loadMore,
    retry
  };
}
