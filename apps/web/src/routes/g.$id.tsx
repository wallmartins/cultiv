import { useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import type { ExecutionReactionValue } from "@my-ai-orchestrator/contracts";
import {
  useCancelExecution,
  useClearReaction,
  useExecution,
  useExecutionWatch,
  useReaction
} from "@my-ai-orchestrator/shared";
import { DetailFailed, ExecutionDetail, WritingCenter } from "@my-ai-orchestrator/ui/app/detail";
import { LongTimeoutWatch } from "@my-ai-orchestrator/ui/app/states";
import { buildAlignment, buildDetailMeta, formatElapsed, isLongRunning, splitParagraphs } from "./detail-view.js";

const routeApi = getRouteApi("/_shell/g/$executionId");

// Container for /app/g/$executionId (route + loader are S1's, in router.tsx — untouched here).
// The loader already ensureQueryData's this execution and marks it read; useExecution below is a
// cache hit on mount, no extra fetch/flash.
export function ExecutionDetailContainer() {
  const { executionId } = routeApi.useParams();
  const navigate = routeApi.useNavigate();
  const [alignmentOpen, setAlignmentOpen] = useState(false);
  const [timeoutAcknowledged, setTimeoutAcknowledged] = useState(false);

  const { data: execution } = useExecution(executionId);
  useExecutionWatch(executionId);
  const reactionMutation = useReaction(executionId);
  const clearReactionMutation = useClearReaction(executionId);
  const cancelMutation = useCancelExecution(executionId);

  if (!execution) return null;

  if (execution.status === "queued" || execution.status === "running") {
    const now = new Date();
    if (isLongRunning(execution.createdAt, now) && !timeoutAcknowledged) {
      return (
        <LongTimeoutWatch
          theme={execution.briefingTopic ?? ""}
          progress={(execution.progress?.percent ?? 0) / 100}
          elapsed={formatElapsed(execution.createdAt, now)}
          refundCredits={execution.reservedCredits}
          onCancel={() => cancelMutation.mutate(undefined)}
          onWait={() => setTimeoutAcknowledged(true)}
        />
      );
    }
    return <WritingCenter percent={execution.progress?.percent ?? 0} topic={execution.briefingTopic ?? ""} />;
  }

  if (execution.status === "failed" || execution.status === "cancelled") {
    const reason =
      execution.error?.message ?? (execution.status === "cancelled" ? "geração cancelada" : "motivo desconhecido");
    return <DetailFailed reason={reason} onRedo={() => navigate({ to: "/generate" })} />;
  }

  const handleReact = (value: ExecutionReactionValue) => {
    if (execution.reaction?.value === value) {
      clearReactionMutation.mutate();
    } else {
      reactionMutation.mutate({ reaction: value });
    }
  };

  return (
    <ExecutionDetail
      meta={buildDetailMeta(execution, new Date())}
      usedFallbackVoiceProfile={execution.voice?.usedFallbackVoiceProfile ?? false}
      topic={execution.briefingTopic ?? "sem tema"}
      paragraphs={splitParagraphs(execution.result?.content ?? "")}
      alignment={buildAlignment(execution.voice)}
      alignmentOpen={alignmentOpen}
      onToggleAlignment={() => setAlignmentOpen((open) => !open)}
      onSeeVoiceProfile={() => navigate({ to: "/voice" })}
      reaction={execution.reaction?.value ?? null}
      onReact={handleReact}
      reactionPending={reactionMutation.isPending || clearReactionMutation.isPending}
    />
  );
}
