import type { ExecutionStatusView } from "@my-ai-orchestrator/contracts";
import { useCallback, useEffect, useState } from "react";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";

export type HistoryPeriod = "7d" | "30d" | "90d" | "all";
export type HistoryStatusFilter = "all" | ExecutionStatusView["status"];

export type HistoryFilters = {
  readonly period: HistoryPeriod;
  readonly status: HistoryStatusFilter;
  readonly contentType: string;
};

const PAGE_SIZE = 20;

function isWithinPeriod(createdAt: string, period: HistoryPeriod): boolean {
  if (period === "all") {
    return true;
  }

  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return now - created <= days * 24 * 60 * 60 * 1000;
}

export function useExecutionsList(filters: HistoryFilters) {
  const client = useClientSdk();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [items, setItems] = useState<readonly ExecutionStatusView[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const load = useCallback(
    async (nextOffset: number, append: boolean) => {
      setStatus("loading");
      try {
        const page = await client.toPromise(
          client.executions.list({ limit: PAGE_SIZE, offset: nextOffset })
        );
        setTotal(page.total);
        setOffset(nextOffset);
        setItems((current) => (append ? [...current, ...page.items] : page.items));
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    },
    [client]
  );

  useEffect(() => {
    void load(0, false);
  }, [load]);

  const filteredItems = items.filter((item) => {
    if (!isWithinPeriod(item.createdAt, filters.period)) {
      return false;
    }

    if (filters.status !== "all" && item.status !== filters.status) {
      return false;
    }

    if (filters.contentType !== "all" && item.contentType !== filters.contentType) {
      return false;
    }

    return true;
  });

  return {
    status,
    items: filteredItems,
    total,
    hasMore: items.length < total,
    loadMore: () => void load(offset + PAGE_SIZE, true),
    retry: () => void load(0, false)
  };
}
