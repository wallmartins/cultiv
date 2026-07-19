import { runEffectOrThrow } from "../http/http.js";
import type { BackendJobEvent, BackendJobStoreServiceContract } from "./job-store.js";

export const SSE_HEARTBEAT_INTERVAL_MS = 25_000;

export async function createJobEventStream(
  jobs: Pick<BackendJobStoreServiceContract, "listJobEvents" | "subscribe" | "getJobStatus">,
  jobId: string
): Promise<Response> {
  const encoder = new TextEncoder();
  const initialEvents = await runEffectOrThrow(jobs.listJobEvents(jobId));
  const terminalEvent = await resolveTerminalReplayEvent(jobs, jobId, initialEvents);
  const replayEvents = terminalEvent ? [...initialEvents, terminalEvent] : initialEvents;
  let unsubscribe = () => {};
  let subscribeTask: Promise<void> = Promise.resolve();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const event of replayEvents) {
        controller.enqueue(encoder.encode(formatSseEvent(event.type, event.payload, event.occurredAt)));
      }

      subscribeTask = runEffectOrThrow(
        jobs.subscribe(jobId, (event) => {
          controller.enqueue(encoder.encode(formatSseEvent(event.type, event.payload, event.occurredAt)));
        })
      ).then((unsub) => {
        unsubscribe = unsub;
      });

      await subscribeTask;

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(formatSseComment(`ping ${new Date().toISOString()}`)));
        } catch {
          if (heartbeat) {
            clearInterval(heartbeat);
          }
        }
      }, SSE_HEARTBEAT_INTERVAL_MS);
    },
    cancel() {
      if (heartbeat) {
        clearInterval(heartbeat);
      }

      void subscribeTask.finally(() => unsubscribe());
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      connection: "keep-alive",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no"
    }
  });
}

async function resolveTerminalReplayEvent(
  jobs: Pick<BackendJobStoreServiceContract, "getJobStatus">,
  jobId: string,
  initialEvents: readonly BackendJobEvent[]
): Promise<BackendJobEvent | undefined> {
  const hasTerminal = initialEvents.some(
    (event) => event.type === "done" || event.type === "error" || event.type === "cancelled"
  );
  if (hasTerminal) {
    return undefined;
  }

  const status = await runEffectOrThrow(jobs.getJobStatus(jobId));
  if (!status) {
    return undefined;
  }

  const occurredAt = status.completedAt ?? status.createdAt;

  if (status.status === "done" && status.result) {
    return {
      type: "done",
      jobId,
      payload: status.result,
      occurredAt
    };
  }

  if (status.status === "failed" && status.error) {
    return {
      type: "error",
      jobId,
      payload: status.error,
      occurredAt
    };
  }

  if (status.status === "cancelled") {
    return {
      type: "cancelled",
      jobId,
      payload: { cancelledAt: occurredAt },
      occurredAt
    };
  }

  return undefined;
}

export function formatSseEvent(type: BackendJobEvent["type"], payload: unknown, occurredAt: string): string {
  return `event: ${type}\ndata: ${JSON.stringify({ type, payload, occurredAt })}\n\n`;
}

export function formatSseComment(comment: string): string {
  return `: ${comment}\n\n`;
}
