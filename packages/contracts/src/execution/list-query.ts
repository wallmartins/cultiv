import { Schema } from "effect";
import { createSchemaDecoder } from "../shared.js";
import { GenerationIntentSchema, GenerationLengthTierSchema, type GenerationIntent, type GenerationLengthTier } from "../generation-intent.js";
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
  contentType: Schema.optional(Schema.String),
  intent: Schema.optional(GenerationIntentSchema),
  lengthTier: Schema.optional(GenerationLengthTierSchema)
});
export type ExecutionsListQuery = typeof ExecutionsListQuerySchema.Type;

export type ExecutionsListFilters = {
  readonly period: ExecutionsListPeriod;
  readonly status: ExecutionsListStatusFilter;
  readonly contentType?: string;
  readonly intent?: GenerationIntent;
  readonly lengthTier?: GenerationLengthTier;
};

export const decodeExecutionsListQuery = createSchemaDecoder("ExecutionsListQuery", ExecutionsListQuerySchema);

export function normalizeExecutionsListFilters(query: Partial<ExecutionsListQuery>): ExecutionsListFilters {
  const contentType = query.contentType?.trim();
  const intent = query.intent;
  const lengthTier = query.lengthTier;

  return {
    period: query.period ?? "all",
    status: query.status ?? "all",
    ...(contentType && contentType !== "all" ? { contentType } : {}),
    ...(intent ? { intent } : {}),
    ...(lengthTier ? { lengthTier } : {})
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
  readonly generationIntent?: string;
  readonly lengthTier?: string;
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

  if (filters.contentType && item.contentType !== filters.contentType) {
    return false;
  }

  if (filters.intent && item.generationIntent !== filters.intent) {
    return false;
  }

  if (filters.lengthTier && item.lengthTier !== filters.lengthTier) {
    return false;
  }

  return true;
}
