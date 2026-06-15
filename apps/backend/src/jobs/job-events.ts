import { runEffectOrThrow } from "../http/http.js";
import type { BackendJobEvent, BackendJobStoreServiceContract } from "./job-store.js";

/** Keep proxies (e.g. Cloudflare Free) from closing idle SSE streams between pipeline steps. */
export const SSE_HEARTBEAT_INTERVAL_MS = 25_000;

export async function createJobEventStream(
  jobs: Pick<BackendJobStoreServiceContract, "listJobEvents" | "subscribe">,
  jobId: string
): Promise<Response> {
  const encoder = new TextEncoder();
  const initialEvents = await runEffectOrThrow(jobs.listJobEvents(jobId));
  let unsubscribe = () => {};
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const event of initialEvents) {
        controller.enqueue(encoder.encode(formatSseEvent(event.type, event.payload, event.occurredAt)));
      }
      unsubscribe = await runEffectOrThrow(
        jobs.subscribe(jobId, (event) => {
          controller.enqueue(encoder.encode(formatSseEvent(event.type, event.payload, event.occurredAt)));
        })
      );

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
      unsubscribe();
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

export function formatSseEvent(type: BackendJobEvent["type"], payload: unknown, occurredAt: string): string {
  return `event: ${type}\ndata: ${JSON.stringify({ type, payload, occurredAt })}\n\n`;
}

export function formatSseComment(comment: string): string {
  return `: ${comment}\n\n`;
}
