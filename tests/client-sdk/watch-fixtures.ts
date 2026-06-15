import type { ExecutionStatusView } from "@my-ai-orchestrator/contracts";

export const voiceMetadata = {
  voiceProfileConfidence: "high",
  voiceAdaptationMode: "standard",
  voiceProfileVersionUsed: 2,
  voiceProfileSnapshotId: "snap_1",
  usedFallbackVoiceProfile: false,
  appliedSignals: { styleMarkers: [], rules: [], antiPatterns: [] },
  pendingProfileRebuild: { status: "idle", nextActionCodes: [] }
} as const;

export function createDoneExecutionStatus(executionId: string, content = "hello"): ExecutionStatusView {
  return {
    jobId: executionId,
    status: "done",
    contentType: "validation-post",
    progress: null,
    result: { content, metadata: {} },
    error: null,
    createdAt: "2026-05-09T00:00:00.000Z",
    completedAt: "2026-05-09T00:00:05.000Z",
    voice: voiceMetadata
  };
}

export function createSseDoneStream(content = "hello"): ReadableStream<Uint8Array> {
  const payload =
    `event: done\ndata: {"type":"done","payload":{"content":"${content}","metadata":{}},"occurredAt":"2026-05-09T00:00:05.000Z"}\n\n`;
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(payload));
      controller.close();
    }
  });
}

export async function waitUntil(predicate: () => boolean, timeoutMs = 5_000): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (predicate()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  throw new Error("Timed out waiting for watch condition");
}
