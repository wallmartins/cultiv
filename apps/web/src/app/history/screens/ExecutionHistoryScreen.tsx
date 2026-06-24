import { Button, cn, CompassMark, LogbookProse, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import {
  GENERATION_INTENT_IDS,
  GENERATION_LENGTH_TIER_IDS,
  getIntentLabel,
  getLengthTierLabel
} from "~/i18n/app/generation-intents";
import {
  getExecutionFormatLabel,
  getExecutionSubtitle,
  getExecutionTitle
} from "~/app/history/lib/execution-presentation";
import {
  useExecutionsList,
  type HistoryFilters,
  type HistoryPeriod,
  type HistoryStatusFilter
} from "~/app/history/lib/use-executions-list";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";
import type { AppMessages } from "~/i18n/app/types";

function statusFilterLabel(
  status: string,
  filters: AppMessages["history"]["filters"]
): string {
  switch (status) {
    case "done":
      return filters.statusDone;
    case "failed":
      return filters.statusFailed;
    case "running":
      return filters.statusRunning;
    case "queued":
      return filters.statusQueued;
    default:
      return status;
  }
}

function StatusDot({ status }: { readonly status: string }) {
  const dotClass =
    status === "done"
      ? "bg-moss"
      : status === "running" || status === "queued"
        ? "bg-ochre"
        : status === "failed"
          ? "bg-terracotta"
          : "bg-ink-ghost";

  return (
    <span
      className={cn("mt-1.5 size-2 shrink-0 rounded-full", dotClass)}
      aria-hidden
    />
  );
}

function FilterToggleGroup({
  label,
  value,
  onChange,
  options
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly (readonly [string, string])[];
}) {
  return (
    <div className="shrink-0">
      <Text variant="meta" className="mb-2 block font-inter text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </Text>
      <div className="flex flex-wrap gap-2">
        {options.map(([optionValue, optionLabel]) => {
          const active = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3 py-1.5 font-inter text-sm transition-colors duration-[250ms] motion-reduce:transition-none",
                active
                  ? "border-terracotta/40 bg-terracotta/10 font-medium text-terracotta"
                  : "border-dotted-cartography bg-off-white text-ink-muted hover:border-terracotta/25 hover:text-ink"
              )}
              onClick={() => onChange(optionValue)}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ExecutionHistoryScreen() {
  const { locale, messages } = useAppLocale();
  const [filters, setFilters] = useState<HistoryFilters>({
    period: "30d",
    status: "all",
    intent: "all",
    lengthTier: "all"
  });
  const { status, items, hasMore, loadMore, retry } = useExecutionsList(filters);

  const visibleIntents = useMemo(() => {
    const fromItems = new Set(
      items.map((item) => item.generationIntent).filter((intent): intent is string => Boolean(intent))
    );
    const ids = fromItems.size > 0 ? [...fromItems] : [...GENERATION_INTENT_IDS];
    return ids.sort((left, right) =>
      getIntentLabel(locale, left, left).localeCompare(getIntentLabel(locale, right, right), locale === "pt" ? "pt-BR" : "en")
    );
  }, [items, locale]);

  return (
    <div className="px-[var(--spacing-gutter)] py-8 md:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Text as="h1" variant="h1" className="mb-2 font-playfair text-ink">
            {messages.history.title}
          </Text>
          <Text variant="body" className="text-ink-muted">
            {messages.history.subtitle}
          </Text>
        </div>
        <Link to="/app/generate">
          <Button type="button">{messages.history.emptyAction}</Button>
        </Link>
      </div>

      <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <FilterToggleGroup
          label={messages.history.filters.period}
          value={filters.period}
          onChange={(value) => setFilters((current) => ({ ...current, period: value as HistoryPeriod }))}
          options={[
            ["7d", messages.history.filters.period7d],
            ["30d", messages.history.filters.period30d],
            ["90d", messages.history.filters.period90d],
            ["all", messages.history.filters.periodAll]
          ]}
        />
        <FilterToggleGroup
          label={messages.history.filters.status}
          value={filters.status}
          onChange={(value) =>
            setFilters((current) => ({ ...current, status: value as HistoryStatusFilter }))
          }
          options={[
            ["all", messages.history.filters.statusAll],
            ["done", messages.history.filters.statusDone],
            ["failed", messages.history.filters.statusFailed],
            ["running", messages.history.filters.statusRunning],
            ["queued", messages.history.filters.statusQueued]
          ]}
        />
        <FilterToggleGroup
          label={messages.history.filters.intent}
          value={filters.intent}
          onChange={(value) => setFilters((current) => ({ ...current, intent: value }))}
          options={[
            ["all", messages.history.filters.intentAll],
            ...visibleIntents.map((id) => [id, getIntentLabel(locale, id, id)] as const)
          ]}
        />
        <FilterToggleGroup
          label={messages.history.filters.lengthTier}
          value={filters.lengthTier}
          onChange={(value) => setFilters((current) => ({ ...current, lengthTier: value }))}
          options={[
            ["all", messages.history.filters.lengthTierAll],
            ...GENERATION_LENGTH_TIER_IDS.map(
              (id) => [id, getLengthTierLabel(locale, id, id)] as const
            )
          ]}
        />
      </div>

      {status === "loading" && items.length === 0 ? (
        <div className="space-y-3">
          <AppSkeleton className="h-24 w-full" />
          <AppSkeleton className="h-24 w-full" />
          <AppSkeleton className="h-24 w-full" />
        </div>
      ) : null}

      {status === "error" ? (
        <LogbookProse className="space-y-3 p-5">
          <Text variant="meta" className="text-terracotta">
            {messages.history.error}
          </Text>
          <Button type="button" size="compact" onClick={retry}>
            {messages.history.retry}
          </Button>
        </LogbookProse>
      ) : null}

      {status === "ready" && items.length === 0 ? (
        <LogbookProse className="space-y-5 p-8 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-dotted-cartography bg-cream">
            <CompassMark size={36} variant="symbol" color="ochre" />
          </div>
          <Text variant="body" className="text-ink-muted">
            {messages.history.empty}
          </Text>
          <Link to="/app/generate">
            <Button type="button" variant="ghost">
              {messages.history.emptyAction}
            </Button>
          </Link>
        </LogbookProse>
      ) : null}

      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item) => {
            const subtitle = getExecutionSubtitle(item, locale);
            const formatLabel = getExecutionFormatLabel(item, locale);

            return (
              <li key={item.jobId}>
                <Link
                  to="/app/history/$executionId"
                  params={{ executionId: item.jobId }}
                  className="block rounded-[5px] border border-dotted-cartography bg-off-white p-4 shadow-cartography transition-colors duration-[250ms] hover:border-terracotta/30 motion-reduce:transition-none"
                >
                  <div className="flex items-start gap-3">
                    <StatusDot status={item.status} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Text as="span" variant="body" className="font-medium text-ink">
                          {getExecutionTitle(item, locale)}
                        </Text>
                        <Text variant="meta" className="shrink-0 text-ink-muted">
                          {new Date(item.createdAt).toLocaleString(locale === "en" ? "en-US" : "pt-BR")}
                        </Text>
                      </div>
                      {subtitle ? (
                        <Text variant="meta" className="mt-1 text-ink-muted">
                          {subtitle}
                        </Text>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {formatLabel ? (
                          <Text variant="meta" className="text-ink-muted">
                            {messages.history.columns.format}: {formatLabel}
                          </Text>
                        ) : null}
                        <Text variant="meta" className="text-ink-muted">
                          {messages.history.columns.status}: {statusFilterLabel(item.status, messages.history.filters)}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}

      {hasMore ? (
        <div className="mt-6 text-center">
          <Button type="button" variant="ghost" size="compact" onClick={loadMore}>
            …
          </Button>
        </div>
      ) : null}
    </div>
  );
}
