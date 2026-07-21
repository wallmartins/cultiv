import { Schema } from "effect";
import { createSchemaDecoder } from "../shared.js";
import { GenerationLengthTierSchema, type GenerationLengthTier } from "../generation-intent.js";
import { JobStatusSchema } from "./job.js";

export const ExecutionsListPeriodSchema = Schema.Literal("7d", "30d", "90d", "all");
export type ExecutionsListPeriod = typeof ExecutionsListPeriodSchema.Type;

export const ExecutionsListStatusFilterSchema = Schema.Union(Schema.Literal("all"), JobStatusSchema);
export type ExecutionsListStatusFilter = typeof ExecutionsListStatusFilterSchema.Type;

// F0-5 dropped the dormant `intent`/`contentType` facets. The history facet by rhetorical `modo`
// (dominant RhetoricalMode) that replaces `intent` awaits its producer (F2) + the intent-machinery
// removal (F1-1); `period`/`status`/`lengthTier`/`q` stay the live facets.
export const ExecutionsListQuerySchema = Schema.Struct({
  limit: Schema.optional(Schema.Number),
  offset: Schema.optional(Schema.Number),
  period: Schema.optional(ExecutionsListPeriodSchema),
  status: Schema.optional(ExecutionsListStatusFilterSchema),
  lengthTier: Schema.optional(GenerationLengthTierSchema),
  q: Schema.optional(Schema.String)
});
export type ExecutionsListQuery = typeof ExecutionsListQuerySchema.Type;

export type ExecutionsListFilters = {
  readonly period: ExecutionsListPeriod;
  readonly status: ExecutionsListStatusFilter;
  readonly lengthTier?: GenerationLengthTier;
  readonly q?: string;
};

export const decodeExecutionsListQuery = createSchemaDecoder("ExecutionsListQuery", ExecutionsListQuerySchema);

export function normalizeExecutionsListFilters(query: Partial<ExecutionsListQuery>): ExecutionsListFilters {
  const lengthTier = query.lengthTier;
  const q = query.q?.trim();

  return {
    period: query.period ?? "all",
    status: query.status ?? "all",
    ...(lengthTier ? { lengthTier } : {}),
    ...(q ? { q } : {})
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

export type ExecutionsListFilterItem = {
  readonly createdAt: string;
  readonly status: string;
  readonly contentType: string;
  readonly lengthTier?: string;
  readonly briefingTopic?: string;
};

export function matchesExecutionsListFilters(
  item: ExecutionsListFilterItem,
  filters: ExecutionsListFilters
): boolean {
  const cutoff = resolveExecutionsPeriodCutoff(filters.period);
  if (cutoff && item.createdAt < cutoff) {
    return false;
  }

  if (filters.status !== "all" && item.status !== filters.status) {
    return false;
  }

  if (filters.lengthTier && item.lengthTier !== filters.lengthTier) {
    return false;
  }

  if (filters.q && !(item.briefingTopic ?? "").toLowerCase().includes(filters.q.toLowerCase())) {
    return false;
  }

  return true;
}
