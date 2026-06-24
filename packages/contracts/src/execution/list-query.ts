import { Schema } from "effect";
import { createSchemaDecoder } from "../shared.js";
import { JobStatusSchema } from "./job.js";

export const ExecutionsListPeriodSchema = Schema.Literal("7d", "30d", "90d", "all");
export type ExecutionsListPeriod = typeof ExecutionsListPeriodSchema.Type;

export const ExecutionsListStatusFilterSchema = Schema.Union(Schema.Literal("all"), JobStatusSchema);
export type ExecutionsListStatusFilter = typeof ExecutionsListStatusFilterSchema.Type;

export const ExecutionsListQuerySchema = Schema.Struct({
  limit: Schema.optional(Schema.Number),
  offset: Schema.optional(Schema.Number),
  period: Schema.optional(ExecutionsListPeriodSchema),
  status: Schema.optional(ExecutionsListStatusFilterSchema),
  contentType: Schema.optional(Schema.String)
});
export type ExecutionsListQuery = typeof ExecutionsListQuerySchema.Type;

export type ExecutionsListFilters = {
  readonly period: ExecutionsListPeriod;
  readonly status: ExecutionsListStatusFilter;
  readonly contentType?: string;
};

export const decodeExecutionsListQuery = createSchemaDecoder("ExecutionsListQuery", ExecutionsListQuerySchema);

export function normalizeExecutionsListFilters(query: Partial<ExecutionsListQuery>): ExecutionsListFilters {
  const contentType = query.contentType?.trim();

  return {
    period: query.period ?? "all",
    status: query.status ?? "all",
    ...(contentType && contentType !== "all" ? { contentType } : {})
  };
}

export function resolveExecutionsPeriodCutoff(
  period: ExecutionsListPeriod,
  nowMs = Date.now()
): string | undefined {
  if (period === "all") {
    return undefined;
  }

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return new Date(nowMs - days * 24 * 60 * 60 * 1000).toISOString();
}

export function matchesExecutionsListFilters(
  item: { readonly createdAt: string; readonly status: string; readonly contentType: string },
  filters: ExecutionsListFilters
): boolean {
  const cutoff = resolveExecutionsPeriodCutoff(filters.period);
  if (cutoff && item.createdAt < cutoff) {
    return false;
  }

  if (filters.status !== "all" && item.status !== filters.status) {
    return false;
  }

  if (filters.contentType && item.contentType !== filters.contentType) {
    return false;
  }

  return true;
}
