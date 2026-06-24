import type { ExecutionStatusView } from "@my-ai-orchestrator/contracts";
import { useCallback, useMemo } from "react";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { useSdkQuery } from "~/platform/sdk/use-sdk-query";

export type HistoryPeriod = "7d" | "30d" | "90d" | "all";
export type HistoryStatusFilter = "all" | ExecutionStatusView["status"];

export type HistoryFilters = {
  readonly period: HistoryPeriod;
  readonly status: HistoryStatusFilter;
  readonly intent: string;
  readonly lengthTier: string;
};

export const HISTORY_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type HistoryPageSize = (typeof HISTORY_PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_HISTORY_PAGE_SIZE: HistoryPageSize = 10;

export type HistoryListParams = {
  readonly filters: HistoryFilters;
  readonly page: number;
  readonly pageSize: HistoryPageSize;
};

export function resolveHistoryPageCount(total: number, pageSize: number): number {
  return total === 0 ? 1 : Math.ceil(total / pageSize);
}

export function resolveHistoryPageRange(
  page: number,
  pageSize: number,
  total: number
): { readonly start: number; readonly end: number; readonly pageCount: number; readonly page: number } {
  const pageCount = resolveHistoryPageCount(total, pageSize);
  const clampedPage = Math.min(Math.max(1, page), pageCount);

  if (total === 0) {
    return { start: 0, end: 0, pageCount, page: clampedPage };
  }

  const start = (clampedPage - 1) * pageSize + 1;
  const end = Math.min(clampedPage * pageSize, total);
  return { start, end, pageCount, page: clampedPage };
}

export function useExecutionsList({ filters, page, pageSize }: HistoryListParams) {
  const client = useClientSdk();
  const offset = (page - 1) * pageSize;

  const apiFilters = useMemo(
    () => ({
      period: filters.period,
      status: filters.status,
      ...(filters.intent !== "all" ? { intent: filters.intent } : {}),
      ...(filters.lengthTier !== "all" ? { lengthTier: filters.lengthTier } : {})
    }),
    [filters.period, filters.status, filters.intent, filters.lengthTier]
  );

  const { status, data, retry } = useSdkQuery(
    ["executions", apiFilters, page, pageSize],
    useCallback(
      (signal) =>
        client.toPromise(
          client.executions.list({
            limit: pageSize,
            offset,
            ...apiFilters,
            signal
          })
        ),
      [apiFilters, client, offset, pageSize]
    )
  );

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const range = resolveHistoryPageRange(page, pageSize, total);

  return {
    status,
    items,
    total,
    page: range.page,
    pageCount: range.pageCount,
    rangeStart: range.start,
    rangeEnd: range.end,
    hasPreviousPage: range.page > 1,
    hasNextPage: range.page < range.pageCount,
    retry
  };
}
