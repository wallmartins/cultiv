import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { createHttpTransport } from "../../packages/client-sdk/src/transport.js";

describe("http transport retry", () => {
  it("retries GET on 429 and succeeds", async () => {
    let callCount = 0;
    const fetcher = vi.fn(async () => {
      callCount += 1;
      if (callCount === 1) {
        return new Response("rate limited", { status: 429 });
      }

      return new Response('{"ok":true}', {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });

    const transport = createHttpTransport({
      baseUrl: "https://api.example.com",
      fetcher,
      retryPolicy: { get: { maxRetries: 1, backoffBaseMs: 1 } }
    });

    const response = await Effect.runPromise(
      transport.send({ method: "GET", path: "/resource" })
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
