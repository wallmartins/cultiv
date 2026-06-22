import { Text, cn } from "@my-ai-orchestrator/ui";
import type { AppMessages } from "~/i18n/app/types";
import type { AppLocale } from "~/i18n/app/types";
import type { ActiveExecutionItem } from "~/platform/active-executions/types";
import { getExecutionStepPresentation } from "~/app/execution/lib/execution-step-messages";

export interface ActiveExecutionListProps {
  readonly items: readonly ActiveExecutionItem[];
  readonly messages: AppMessages;
  readonly locale: AppLocale;
  readonly className?: string;
  readonly onSelect?: (executionId: string) => void;
}

function formatStatus(item: ActiveExecutionItem, locale: AppLocale, messages: AppMessages): string {
  switch (item.status) {
    case "queued":
      return messages.shell.activeExecutions.statusQueued;
    case "running": {
      const stepLabel = item.progress
        ? getExecutionStepPresentation(locale, item.progress.currentStep, messages).label
        : null;
      return stepLabel
        ? `${stepLabel} · ${item.progress?.percent ?? 0}%`
        : messages.shell.activeExecutions.statusRunning;
    }
    case "done":
      return messages.shell.activeExecutions.statusDone;
    case "failed":
      return messages.shell.activeExecutions.statusFailed;
  }
}

export function ActiveExecutionList({
  items,
  messages,
  locale,
  className,
  onSelect
}: ActiveExecutionListProps) {
  return (
    <section
      className={cn("flex min-h-0 flex-col", className)}
      aria-label={messages.shell.activeExecutions.title}
    >
      <Text as="h2" variant="label" className="mb-3 px-1 text-ink-muted">
        {messages.shell.activeExecutions.title}
      </Text>

      {items.length === 0 ? (
        <Text variant="meta" className="px-1 text-ink-muted">
          {messages.shell.activeExecutions.empty}
        </Text>
      ) : (
        <ul className="space-y-2 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full rounded-xl border border-ink-ghost bg-paper-elevated px-3 py-2 text-left transition-colors hover:bg-paper-pressed"
                onClick={() => onSelect?.(item.id)}
              >
                <Text variant="meta" className="block font-medium">
                  {item.contentTypeLabel}
                </Text>
                <Text variant="meta" className="text-ink-muted">
                  {formatStatus(item, locale, messages)}
                </Text>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
