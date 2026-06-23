import { Button, cn, Text } from "@my-ai-orchestrator/ui";
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

function StatusBadge({ status }: { readonly status: string }) {
  const configs: Record<string, { bg: string; border: string; text: string; dot: string; icon: React.ReactNode; label: string }> = {
    done: {
      bg: "bg-musgo/10",
      border: "border-musgo/30",
      text: "text-musgo",
      dot: "bg-musgo",
      icon: (
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
          <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" clipRule="evenodd" />
        </svg>
      ),
      label: "Concluída"
    },
    running: {
      bg: "bg-azul/8",
      border: "border-azul/25",
      text: "text-azul",
      dot: "bg-azul",
      icon: (
        <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3 animate-spin">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      label: "Em andamento"
    },
    queued: {
      bg: "bg-ocre/12",
      border: "border-ocre/30",
      text: "text-ocre",
      dot: "bg-ocre",
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 4.5V8l2.5 1.5" />
        </svg>
      ),
      label: "Na fila"
    },
    failed: {
      bg: "bg-terracota/8",
      border: "border-terracota/25",
      text: "text-terracota",
      dot: "bg-terracota",
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
          <path d="M8 4v4M8 10.5v.5" />
        </svg>
      ),
      label: "Falha"
    }
  };

  const config = configs[status] ?? {
    bg: "bg-borda/10",
    border: "border-borda/20",
    text: "text-borda",
    dot: "bg-borda",
    icon: null,
    label: status
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-inter text-xs font-medium", config.bg, config.border, config.text)}>
      {config.icon}
      {config.label}
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
      <Text variant="meta" className="mb-1 block font-inter text-xs font-semibold uppercase tracking-wider text-texto-sec">
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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Text as="h1" variant="h1" className="mb-2 font-playfair text-azul">
            {messages.history.title}
          </Text>
          <Text variant="body" className="text-ink-muted">
            {messages.history.subtitle}
          </Text>
        </div>
        <Link
          to="/app/generate"
          className="rebrand-hover inline-flex items-center justify-center gap-2 rounded-sm bg-terracota px-5 py-2.5 font-inter text-sm font-semibold text-white shadow-[3px_3px_0px_rgba(0,0,0,0.12)] transition-all duration-300 hover:bg-terracota/90"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {messages.history.emptyAction}
        </Link>
      </div>

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
          <AppSkeleton className="h-12 w-full" />
          <AppSkeleton className="h-12 w-full" />
          <AppSkeleton className="h-12 w-full" />
        </div>
      ) : null}

      {status === "error" ? (
        <AppCard className="space-y-3">
          <Text variant="meta" className="text-terracota">
            {messages.history.error}
          </Text>
          <Button type="button" size="compact" onClick={retry}>
            {messages.history.retry}
          </Button>
        </AppCard>
      ) : null}

      {status === "ready" && items.length === 0 ? (
        <AppCard className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-borda/20 bg-creme">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-borda">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <Text variant="meta" className="text-ink-muted">
            {messages.history.empty}
          </Text>
          <Link
            to="/app/generate"
            className="text-sm font-medium text-pigment-terracotta underline-offset-2 hover:underline"
          >
            {messages.history.emptyAction}
          </Link>
        </AppCard>
      ) : null}

      {items.length > 0 ? (
        <AppCard padding="none" className="overflow-hidden border-borda/15">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-borda/15 bg-creme">
              <tr>
                <th className="px-4 py-3 font-inter text-xs font-semibold uppercase tracking-wider text-texto-sec">
                  {messages.history.columns.format}
                </th>
                <th className="px-4 py-3 font-inter text-xs font-semibold uppercase tracking-wider text-texto-sec">
                  {messages.history.columns.date}
                </th>
                <th className="px-4 py-3 font-inter text-xs font-semibold uppercase tracking-wider text-texto-sec">
                  {messages.history.columns.status}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.jobId}
                  className="border-b border-borda/10 transition-colors last:border-b-0 hover:bg-creme/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/app/history/$executionId"
                      params={{ executionId: item.jobId }}
                      className="font-inter font-medium text-azul underline-offset-2 hover:text-terracota hover:underline"
                    >
                      {getContentTypeLabel(locale, item.contentType, item.contentType)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-inter text-texto-sec">
                    {new Date(item.createdAt).toLocaleString(locale === "en" ? "en-US" : "pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AppCard>
      ) : null}

      {hasMore ? (
        <div className="mt-4 text-center">
          <Button type="button" variant="ghost" size="compact" onClick={loadMore}>
            …
          </Button>
        </div>
      ) : null}
    </div>
  );
}
