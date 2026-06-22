import { Button, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { getContentTypeLabel } from "~/i18n/app/content-types";
import {
  useExecutionsList,
  type HistoryFilters,
  type HistoryPeriod,
  type HistoryStatusFilter
} from "~/app/history/lib/use-executions-list";
import { AppSelect } from "~/platform/ui/AppSelect";
import { AppCard } from "~/platform/ui/AppCard";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";

export function ExecutionHistoryScreen() {
  const { locale, messages } = useAppLocale();
  const [filters, setFilters] = useState<HistoryFilters>({
    period: "30d",
    status: "all",
    contentType: "all"
  });
  const { status, items, hasMore, loadMore, retry } = useExecutionsList(filters);

  const contentTypes = useMemo(
    () => [...new Set(items.map((item) => item.contentType))],
    [items]
  );

  return (
    <div className="px-[var(--spacing-gutter)] py-8 md:py-10">
      <Text as="h1" variant="h1" className="mb-3">
        {messages.history.title}
      </Text>
      <Text variant="body" className="mb-6 text-muted-foreground">
        {messages.history.subtitle}
      </Text>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <FilterSelect
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
        <FilterSelect
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
        <FilterSelect
          label={messages.history.filters.contentType}
          value={filters.contentType}
          onChange={(value) => setFilters((current) => ({ ...current, contentType: value }))}
          options={[
            ["all", messages.history.filters.contentTypeAll],
            ...contentTypes.map((id) => [id, getContentTypeLabel(locale, id, id)] as const)
          ]}
        />
      </div>

      {status === "loading" && items.length === 0 ? (
        <div className="space-y-3">
          <AppSkeleton className="h-10 w-full" />
          <AppSkeleton className="h-10 w-full" />
          <AppSkeleton className="h-10 w-full" />
        </div>
      ) : null}

      {status === "error" ? (
        <div className="space-y-3">
          <Text variant="meta" className="text-red-700">
            {messages.history.error}
          </Text>
          <Button type="button" size="compact" onClick={retry}>
            {messages.history.retry}
          </Button>
        </div>
      ) : null}

      {status === "ready" && items.length === 0 ? (
        <div className="space-y-3">
          <Text variant="meta">{messages.history.empty}</Text>
          <Link
            to="/app/generate"
            className="text-sm font-medium text-pigment-terracotta underline-offset-2 hover:underline"
          >
            {messages.history.emptyAction}
          </Link>
        </div>
      ) : null}

      {items.length > 0 ? (
        <AppCard padding="none" className="overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-subtle/70 bg-surface-elevated/70">
              <tr>
                <th className="px-4 py-3">{messages.history.columns.format}</th>
                <th className="px-4 py-3">{messages.history.columns.date}</th>
                <th className="px-4 py-3">{messages.history.columns.status}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.jobId}
                  className="workspace-card--hover border-b border-border-subtle/50 transition-colors last:border-b-0 hover:bg-surface-elevated/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/app/history/$executionId"
                      params={{ executionId: item.jobId }}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {getContentTypeLabel(locale, item.contentType, item.contentType)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString(locale === "en" ? "en-US" : "pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <HistoryStatus status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AppCard>
      ) : null}

      {hasMore ? (
        <div className="mt-4">
          <Button type="button" variant="ghost" size="compact" onClick={loadMore}>
            …
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function HistoryStatus({ status }: { readonly status: string }) {
  const dotClass =
    status === "done"
      ? "bg-pigment-terracotta"
      : status === "failed"
        ? "bg-red-700"
        : status === "running" || status === "queued"
          ? "bg-pigment-ochre"
          : "bg-muted";

  return (
    <span className="inline-flex items-center gap-2 capitalize text-muted-foreground">
      <span aria-hidden className={`size-2 rounded-full ${dotClass}`} />
      {status}
    </span>
  );
}

function FilterSelect({
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
    <label className="block">
      <Text variant="meta" className="mb-1 block">
        {label}
      </Text>
      <AppSelect
        compact
        value={value}
        onChange={onChange}
        options={options.map(([optionValue, optionLabel]) => ({
          value: optionValue,
          label: optionLabel
        }))}
      />
    </label>
  );
}
