import { Button, LogbookProse, RouteLine, Text, motionTokens } from "@my-ai-orchestrator/ui";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ActiveExecutionList } from "~/app/shell/ActiveExecutionList";
import { ExecutionResultView } from "~/app/execution/components/ExecutionResultView";
import { getExecutionStepPresentation } from "~/app/execution/lib/execution-step-messages";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useActiveExecutions } from "~/platform/active-executions/active-execution-store";
import { storeGeneratePrefill } from "~/app/generation/lib/generate-prefill";
import { lenisScrollRegionClassName, lenisScrollRegionProps } from "~/platform/ui/lenis-scroll-region";

export function ActiveExecutionDrawer() {
  const { locale, messages } = useAppLocale();
  const navigate = useNavigate();
  const { items, drawerOpen, drawerExecutionId, closeDrawer, openDrawer } = useActiveExecutions();
  const titleId = useId();
  const [slideIn, setSlideIn] = useState(false);
  const item = drawerExecutionId
    ? (items.find((entry) => entry.id === drawerExecutionId) ?? null)
    : null;
  const open = drawerOpen;

  useEffect(() => {
    if (!open) {
      setSlideIn(false);
      return;
    }

    const frame = requestAnimationFrame(() => setSlideIn(true));

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
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

  function handleExport() {
    if (!item?.result?.content) {
      return;
    }

    const blob = new Blob([item.result.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${item.contentTypeLabel || "expedition"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const progressPercent =
    item?.progress?.percent !== undefined
      ? Math.min(100, Math.max(0, item.progress.percent)) / 100
      : item?.status === "queued"
        ? 0.05
        : 0;

  const stepPresentation =
    item?.progress
      ? getExecutionStepPresentation(locale, item.progress.currentStep, messages)
      : null;

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        className={`absolute inset-0 bg-ink/25 transition-opacity duration-[350ms] ease-out motion-reduce:transition-none ${
          slideIn ? "opacity-100" : "opacity-0"
        }`}
        aria-label={messages.shell.activeExecutions.closeDrawer}
        onClick={closeDrawer}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-0 flex max-h-dvh min-h-0 flex-col border-ink-ghost/60 bg-cream md:inset-auto md:top-0 md:right-0 md:bottom-0 md:h-dvh md:w-full md:max-w-[520px] md:border-l md:shadow-cartography"
        style={{
          transform: slideIn ? "translateX(0)" : "translateX(100%)",
          transition: `transform ${motionTokens.duration.drawer}ms ${motionTokens.easing.easeOut}`
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-dotted-cartography bg-cream px-[var(--spacing-gutter)] py-4">
          <Text id={titleId} as="h2" variant="label" className="font-playfair text-deep-blue">
            {item?.contentTypeLabel ?? messages.shell.activeExecutions.title}
          </Text>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-[5px] border border-dotted-cartography bg-off-white text-lg leading-none text-ink transition-colors duration-[250ms] hover:border-terracotta motion-reduce:transition-none"
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
            <div className="space-y-5">
              <LogbookProse className="p-4">
                <Text variant="logbook" className="text-ink-muted">
                  {messages.shell.activeExecutions.hybridHint}
                </Text>
              </LogbookProse>

              <div className="space-y-3">
                {stepPresentation ? (
                  <div className="space-y-1">
                    <Text variant="label" className="text-deep-blue">
                      {stepPresentation.label}
                    </Text>
                    <Text variant="meta" className="ui-type-mono text-ink-muted">
                      {stepPresentation.summary}
                      {item.progress
                        ? ` · ${item.progress.stepIndex + 1}/${item.progress.totalSteps} · ${item.progress.percent}%`
                        : null}
                    </Text>
                  </div>
                ) : null}

                <div
                  className="relative h-2 w-full overflow-hidden rounded-[5px] border border-dotted-cartography bg-off-white"
                  role="progressbar"
                  aria-valuenow={Math.round(progressPercent * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={stepPresentation?.label ?? messages.shell.activeExecutions.statusRunning}
                >
                  <div className="absolute inset-0">
                    <RouteLine
                      progress={progressPercent}
                      orientation="horizontal"
                      animate
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {item && item.status === "done" && item.result ? (
            <div className="space-y-5">
              <ExecutionResultView content={item.result.content} embedInScrollParent />
              <div className="flex flex-wrap gap-2 border-t border-dotted-cartography pt-4">
                <Button type="button" size="compact" onClick={() => void handleCopy()}>
                  {messages.shell.activeExecutions.copy}
                </Button>
                <Button type="button" variant="ghost" size="compact" onClick={handleExport}>
                  {messages.shell.activeExecutions.export}
                </Button>
                <Button type="button" variant="ghost" size="compact" onClick={handleRegenerate}>
                  {messages.shell.activeExecutions.newExpedition}
                </Button>
              </div>
              <Link
                to="/app/history/$executionId"
                params={{ executionId: item.id }}
                className="text-sm font-medium text-terracotta underline-offset-2 hover:underline"
                onClick={closeDrawer}
              >
                {messages.shell.activeExecutions.viewHistory}
              </Link>
            </div>
          ) : null}

          {item && item.status === "failed" ? (
            <div className="space-y-4">
              <LogbookProse className="border-red-700/30 bg-red-700/5 p-4">
                <Text variant="meta" className="text-red-700">
                  {item.error?.message ?? messages.shell.activeExecutions.statusFailed}
                </Text>
                <Text variant="meta" className="mt-2 text-ink-muted">
                  {messages.shell.activeExecutions.noCreditsCharged}
                </Text>
              </LogbookProse>
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
      className="relative flex size-10 items-center justify-center rounded-full border border-dotted-cartography bg-off-white shadow-cartography"
      aria-label={messages.shell.activeExecutions.openDrawer}
      onClick={onOpen}
    >
      <span aria-hidden className="text-lg leading-none">
        ⧗
      </span>
      {inFlightCount > 0 ? (
        <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-[0.65rem] font-medium text-cream">
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
