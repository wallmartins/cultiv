import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";
import { saveVoiceExamples } from "../../apps/web/src/app/voice/lib/route-voice-save.js";
import type { ClientSdk } from "@my-ai-orchestrator/client-sdk";

function createMockClient(): ClientSdk {
  const voice = {
    getProfile: vi.fn(() => Effect.succeed({})),
    listExamples: vi.fn(() => Effect.succeed({ items: [], total: 0, limit: 20, offset: 0 })),
    createExample: vi.fn(() => Effect.succeed({ exampleId: "ex-1" })),
    updateExample: vi.fn(() => Effect.succeed({ exampleId: "ex-1" })),
    createBatch: vi.fn(() => Effect.succeed({ batchId: "batch-1" })),
    addBatchItems: vi.fn(() =>
      Effect.succeed({
        batchId: "batch-1",
        itemResults: []
      })
    ),
    commitBatch: vi.fn(() => Effect.succeed({ acceptedItems: 2, rejectedItems: 0 }))
  };

  return {
    toPromise: (effect) => Effect.runPromise(effect as Effect.Effect<unknown>),
    preview: {} as ClientSdk["preview"],
    executions: {} as ClientSdk["executions"],
    contentTypes: {} as ClientSdk["contentTypes"],
    transport: {} as ClientSdk["transport"],
    voice
  } as ClientSdk;
}

describe("saveVoiceExamples", () => {
  it("uses single create path for one slot", async () => {
    const client = createMockClient();
    const result = await saveVoiceExamples(client, [
      { clientItemId: "1", text: "hello world from my voice" }
    ]);

    expect(result.mode).toBe("single");
    expect(client.voice.createExample).toHaveBeenCalledOnce();
    expect(client.voice.createBatch).not.toHaveBeenCalled();
  });

  it("uses batch flow for multiple slots", async () => {
    const client = createMockClient();
    const result = await saveVoiceExamples(client, [
      { clientItemId: "1", text: "hello world from my voice" },
      { clientItemId: "2", text: "second example long enough" }
    ]);

    expect(result.mode).toBe("batch");
    expect(client.voice.createBatch).toHaveBeenCalledOnce();
    expect(client.voice.addBatchItems).toHaveBeenCalledOnce();
    expect(client.voice.commitBatch).toHaveBeenCalledOnce();
  });
});
