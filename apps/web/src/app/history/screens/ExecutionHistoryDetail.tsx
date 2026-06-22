import type { ExecutionStatusView } from "@my-ai-orchestrator/contracts";
import { Button, Text } from "@my-ai-orchestrator/ui";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExecutionResultView } from "~/app/execution/components/ExecutionResultView";
import { ProgressSteps } from "~/app/execution/components/ProgressSteps";
import { AppCard } from "~/platform/ui/AppCard";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { getContentTypeLabel } from "~/i18n/app/content-types";
import { storeGeneratePrefill } from "~/app/generation/lib/generate-prefill";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";

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
      <Text variant="meta" className="px-[var(--spacing-gutter)] py-8 text-red-700">
        {messages.history.detail.notFound}
      </Text>
    );
  }

  const metadata = execution.result?.metadata ?? {};

  return (
    <div className="px-[var(--spacing-gutter)] py-8 md:py-10">
      <Text as="h1" variant="h1" className="mb-3">
        {getContentTypeLabel(locale, execution.contentType, execution.contentType)}
      </Text>
      <Text variant="meta" className="mb-6 text-ink-muted">
        {execution.status}
      </Text>

      {execution.progress && (execution.status === "running" || execution.status === "queued") ? (
        <div className="mb-6">
          <ProgressSteps progress={execution.progress} locale={locale} messages={messages} />
        </div>
      ) : null}

      {execution.result ? (
        <AppCard className="mb-6">
          <ExecutionResultView content={execution.result.content} />
        </AppCard>
      ) : null}

      {execution.error ? (
        <Text variant="meta" className="mb-6 text-red-700">
          {execution.error.message}
        </Text>
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

      <AppCard padding="compact" className="mb-6">
        <details>
          <summary className="cursor-pointer text-sm font-medium">
            {messages.history.detail.details}
          </summary>
          <div className="mt-3 space-y-2">
          <Text variant="meta">
            {messages.history.detail.executionId}: {execution.jobId}
          </Text>
          <Text variant="meta">
            {messages.history.detail.createdAt}: {execution.createdAt}
          </Text>
          {execution.completedAt ? (
            <Text variant="meta">
              {messages.history.detail.completedAt}: {execution.completedAt}
            </Text>
          ) : null}
          {execution.voice ? (
            <>
              <Text variant="meta">
                {messages.history.detail.voiceConfidence}: {execution.voice.voiceProfileConfidence}
              </Text>
              <Text variant="meta">
                {messages.history.detail.adaptationMode}: {execution.voice.voiceAdaptationMode}
              </Text>
            </>
          ) : null}
        </div>
        </details>
      </AppCard>
    </div>
  );
}
