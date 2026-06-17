import { Button, Text } from "@my-ai-orchestrator/ui";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { ActiveExecutionList } from "~/app/shell/ActiveExecutionList";
import { ExecutionResultView } from "~/app/execution/components/ExecutionResultView";
import { ProgressSteps } from "~/app/execution/components/ProgressSteps";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useActiveExecutions } from "~/platform/active-executions/active-execution-store";
import { storeGeneratePrefill } from "~/app/generation/lib/generate-prefill";
import { lenisScrollRegionClassName, lenisScrollRegionProps } from "~/platform/ui/lenis-scroll-region";

export function ActiveExecutionDrawer() {
  const { locale, messages } = useAppLocale();
  const navigate = useNavigate();
  const { items, drawerOpen, drawerExecutionId, closeDrawer, openDrawer } = useActiveExecutions();
  const titleId = useId();
  const item = drawerExecutionId
    ? (items.find((entry) => entry.id === drawerExecutionId) ?? null)
    : null;
  const open = drawerOpen;

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeDrawer, open]);

  function handleRegenerate() {
    if (!item) {
      return;
    }

    storeGeneratePrefill({
      contentType: item.contentType,
      briefing: item.briefing,
      language: item.language,
      qualityMode: item.qualityMode
    });
    closeDrawer();
    void navigate({ to: "/app/generate" });
  }

  async function handleCopy() {
    if (!item?.result?.content) {
      return;
    }

    await navigator.clipboard.writeText(item.result.content);
  }

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        className="absolute inset-0 bg-rich-soil/25 backdrop-blur-sm transition-opacity"
        aria-label={messages.shell.activeExecutions.closeDrawer}
        onClick={closeDrawer}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="workspace-drawer-panel absolute inset-0 flex max-h-dvh min-h-0 flex-col border-border-subtle/60 bg-surface/95 backdrop-blur-xl md:inset-auto md:top-0 md:right-0 md:bottom-0 md:h-dvh md:w-full md:max-w-[32.5rem] md:border-l md:shadow-[var(--workspace-shadow-card)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border-subtle/50 bg-surface/90 px-[var(--spacing-gutter)] py-4 backdrop-blur-md">
          <Text id={titleId} as="h2" variant="label" className="text-foreground">
            {item?.contentTypeLabel ?? messages.shell.activeExecutions.title}
          </Text>
          <button
            type="button"
            className="workspace-field-control flex size-10 items-center justify-center text-lg leading-none"
            aria-label={messages.shell.activeExecutions.closeDrawer}
            onClick={closeDrawer}
          >
            <span aria-hidden>×</span>
          </button>
        </div>

        <div
          className={`min-h-0 flex-1 overflow-y-auto px-[var(--spacing-gutter)] py-5 ${lenisScrollRegionClassName}`}
          {...lenisScrollRegionProps}
        >
        {!item ? (
          <ActiveExecutionList
            items={items}
            messages={messages}
            locale={locale}
            onSelect={(executionId) => openDrawer(executionId)}
          />
        ) : null}

        {item && (item.status === "running" || item.status === "queued") ? (
          <div className="space-y-4">
            <Text variant="meta" className="rounded-xl border border-border-subtle/70 bg-soft-loam/40 px-3 py-3 text-muted-foreground">
              {messages.shell.activeExecutions.hybridHint}
            </Text>
            {item.progress ? (
              <ProgressSteps progress={item.progress} locale={locale} messages={messages} />
            ) : (
              <ProgressSteps
                progress={{
                  currentStep: "queued",
                  stepIndex: 0,
                  totalSteps: 1,
                  percent: 0
                }}
                locale={locale}
                messages={messages}
              />
            )}
          </div>
        ) : null}

        {item && item.status === "done" && item.result ? (
          <div className="space-y-4">
            <ExecutionResultView content={item.result.content} embedInScrollParent />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="compact" onClick={() => void handleCopy()}>
                {messages.shell.activeExecutions.copy}
              </Button>
              <Button type="button" variant="ghost" size="compact" onClick={handleRegenerate}>
                {messages.shell.activeExecutions.regenerate}
              </Button>
            </div>
            <Link
              to="/app/history/$executionId"
              params={{ executionId: item.id }}
              className="text-sm font-medium text-moss underline-offset-2 hover:underline"
              onClick={closeDrawer}
            >
              {messages.shell.activeExecutions.viewHistory}
            </Link>
          </div>
        ) : null}

        {item && item.status === "failed" ? (
          <div className="space-y-4">
            <Text variant="meta" className="text-red-700">
              {item.error?.message ?? messages.shell.activeExecutions.statusFailed}
            </Text>
            <Text variant="meta" className="text-muted-foreground">
              {messages.shell.activeExecutions.noCreditsCharged}
            </Text>
            <Button type="button" size="compact" onClick={handleRegenerate}>
              {messages.shell.activeExecutions.retry}
            </Button>
          </div>
        ) : null}
        </div>
      </aside>
    </div>,
    document.body
  );
}

export function ActiveExecutionMobileTrigger({
  inFlightCount,
  onOpen
}: {
  readonly inFlightCount: number;
  readonly onOpen: () => void;
}) {
  const { messages } = useAppLocale();

  return (
    <button
      type="button"
      className="relative flex size-10 items-center justify-center rounded-full border border-border-subtle/70 bg-surface-elevated/80 shadow-[0_4px_20px_color-mix(in_srgb,var(--color-rich-soil)_8%,transparent)] backdrop-blur-sm"
      aria-label={messages.shell.activeExecutions.openDrawer}
      onClick={onOpen}
    >
      <span aria-hidden className="text-lg leading-none">
        ⧗
      </span>
      {inFlightCount > 0 ? (
        <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-moss px-1 text-[0.65rem] font-medium text-surface">
          {inFlightCount}
        </span>
      ) : null}
    </button>
  );
}

export function useOpenActiveExecutionDrawer() {
  const { openDrawer, items } = useActiveExecutions();
  return (executionId?: string) => {
    openDrawer(executionId ?? items[0]?.id ?? "");
  };
}
