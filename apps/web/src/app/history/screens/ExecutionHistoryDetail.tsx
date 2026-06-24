import type { ExecutionStatusView } from "@my-ai-orchestrator/contracts";
import { Button, cn, Text } from "@my-ai-orchestrator/ui";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExecutionResultView } from "~/app/execution/components/ExecutionResultView";
import { ProgressSteps } from "~/app/execution/components/ProgressSteps";
import { AppCard } from "~/platform/ui/AppCard";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import {
  getExecutionFormatLabel,
  getExecutionSubtitle,
  getExecutionTitle
} from "~/app/history/lib/execution-presentation";
import { storeGeneratePrefill } from "~/app/generation/lib/generate-prefill";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";

function StatusBadge({ status }: { readonly status: string }) {
  const configs: Record<string, { bg: string; border: string; text: string; label: string }> = {
    done: {
      bg: "bg-musgo/10",
      border: "border-musgo/30",
      text: "text-musgo",
      label: "Concluída"
    },
    running: {
      bg: "bg-azul/8",
      border: "border-azul/25",
      text: "text-azul",
      label: "Em andamento"
    },
    queued: {
      bg: "bg-ocre/12",
      border: "border-ocre/30",
      text: "text-ocre",
      label: "Na fila"
    },
    failed: {
      bg: "bg-terracota/8",
      border: "border-terracota/25",
      text: "text-terracota",
      label: "Falha"
    }
  };

  const config = configs[status] ?? {
    bg: "bg-borda/10",
    border: "border-borda/20",
    text: "text-borda",
    label: status
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-inter text-xs font-medium", config.bg, config.border, config.text)}>
      {config.label}
    </span>
  );
}

export function ExecutionHistoryDetail({ executionId }: { readonly executionId: string }) {
  const { locale, messages } = useAppLocale();
  const client = useClientSdk();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [execution, setExecution] = useState<ExecutionStatusView | null>(null);

  useEffect(() => {
    let cancelled = false;
    let handle: { stop: () => void } | null = null;

    void client
      .toPromise(client.executions.get({ executionId }))
      .then((snapshot) => {
        if (!cancelled) {
          setExecution(snapshot);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    handle = client.executions.watch({
      executionId,
      onTransition: (transition) => {
        if (transition.snapshot) {
          setExecution(transition.snapshot);
        } else if (transition.type === "completed") {
          setExecution((current) =>
            current
              ? {
                  ...current,
                  status: "done",
                  result: transition.result,
                  completedAt: transition.occurredAt
                }
              : current
          );
        } else if (transition.type === "failed") {
          setExecution((current) =>
            current
              ? {
                  ...current,
                  status: "failed",
                  error: transition.error
                }
              : current
          );
        } else if (transition.type === "progressed" || transition.type === "started") {
          setExecution((current) =>
            current
              ? {
                  ...current,
                  status: "running",
                  progress: transition.progress
                }
              : current
          );
        }
      }
    });

    return () => {
      cancelled = true;
      handle?.stop();
    };
  }, [client, executionId]);

  if (status === "loading") {
    return (
      <div className="space-y-4 px-[var(--spacing-gutter)] py-8">
        <AppSkeleton className="h-10 w-48" />
        <AppSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === "error" || !execution) {
    return (
      <div className="px-[var(--spacing-gutter)] py-8">
        <AppCard className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-terracota/20 bg-terracota/5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-terracota">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <Text variant="meta" className="text-terracota">
            {messages.history.detail.notFound}
          </Text>
        </AppCard>
      </div>
    );
  }

  const metadata = execution.result?.metadata ?? {};
  const subtitle = getExecutionSubtitle(execution, locale);
  const formatLabel = getExecutionFormatLabel(execution, locale);

  return (
    <div className="px-[var(--spacing-gutter)] py-8 md:py-10">
      <div className="mb-6">
        <Text as="h1" variant="h1" className="mb-2 font-playfair text-azul">
          {getExecutionTitle(execution, locale)}
        </Text>
        {subtitle ? (
          <Text variant="body" className="mb-3 text-ink-muted">
            {subtitle}
          </Text>
        ) : null}
        {formatLabel ? (
          <Text variant="meta" className="mb-3 text-ink-muted">
            {messages.history.columns.format}: {formatLabel}
          </Text>
        ) : null}
        <StatusBadge status={execution.status} />
      </div>

      {execution.progress && (execution.status === "running" || execution.status === "queued") ? (
        <div className="mb-6">
          <ProgressSteps progress={execution.progress} locale={locale} messages={messages} />
        </div>
      ) : null}

      {execution.result ? (
        <AppCard className="mb-6 border-borda/15">
          <ExecutionResultView content={execution.result.content} />
        </AppCard>
      ) : null}

      {execution.error ? (
        <AppCard className="mb-6 border-terracota/20 bg-terracota/5">
          <Text variant="meta" className="text-terracota">
            {execution.error.message}
          </Text>
        </AppCard>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        {execution.result ? (
          <Button
            type="button"
            size="compact"
            onClick={() => void navigator.clipboard.writeText(execution.result?.content ?? "")}
          >
            {messages.history.detail.copy}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="compact"
          onClick={() => {
            storeGeneratePrefill({
              contentType: execution.contentType,
              intent: execution.generationIntent,
              scope:
                execution.lengthTier
                  ? {
                      lengthTier: execution.lengthTier,
                      ...(execution.channel ? { channel: execution.channel } : {})
                    }
                  : undefined,
              briefing:
                typeof metadata.briefing === "object" && metadata.briefing
                  ? (metadata.briefing as Record<string, unknown>)
                  : undefined,
              language: typeof metadata.language === "string" ? metadata.language : undefined,
              qualityMode:
                metadata.qualityMode === "fast" ||
                metadata.qualityMode === "balanced" ||
                metadata.qualityMode === "strict"
                  ? metadata.qualityMode
                  : undefined
            });
            void navigate({ to: "/app/generate" });
          }}
        >
          {messages.history.detail.regenerate}
        </Button>
      </div>

      <AppCard padding="compact" className="border-borda/15">
        <details>
          <summary className="cursor-pointer font-inter text-sm font-medium text-azul">
            {messages.history.detail.details}
          </summary>
          <div className="mt-3 space-y-2">
            <Text variant="meta" className="font-inter">
              {messages.history.detail.executionId}: <span className="font-mono text-texto-sec">{execution.jobId}</span>
            </Text>
            <Text variant="meta" className="font-inter">
              {messages.history.detail.createdAt}: <span className="text-texto-sec">{execution.createdAt}</span>
            </Text>
            {execution.completedAt ? (
              <Text variant="meta" className="font-inter">
                {messages.history.detail.completedAt}: <span className="text-texto-sec">{execution.completedAt}</span>
              </Text>
            ) : null}
            {execution.voice ? (
              <>
                <Text variant="meta" className="font-inter">
                  {messages.history.detail.voiceConfidence}: <span className="text-texto-sec">{execution.voice.voiceProfileConfidence}</span>
                </Text>
                <Text variant="meta" className="font-inter">
                  {messages.history.detail.adaptationMode}: <span className="text-texto-sec">{execution.voice.voiceAdaptationMode}</span>
                </Text>
              </>
            ) : null}
          </div>
        </details>
      </AppCard>
    </div>
  );
}
