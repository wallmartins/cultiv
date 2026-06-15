import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import { buildBatchId } from "../../apps/backend/src/product/voice/voice-batch-helpers.js";

const config: BackendConfig = {
  environment: "test",
  executionMode: "sync",
  qualityMode: "balanced",
  defaultLanguage: "pt-BR",
  serviceName: "backend",
  host: "127.0.0.1",
  port: 3000,
  version: "0.1.0",
  billingPlanId: "pro",
  billingUserId: "backend"
};

describe("backend voice batches", () => {
  it("builds batch ids that fit postgres varchar(64) primary keys", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const batchId = buildBatchId(userId, Date.parse("2026-05-14T00:00:00.000Z"));

    expect(batchId.length).toBeLessThanOrEqual(64);
    expect(batchId).toBe(`voice-batch:${userId}:1778716800000`);
  });

  it("creates batches and accepts partial item success", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    const batch = Effect.runSync(services.voice.createBatch("user_1"));
    const updated = Effect.runSync(
      services.voice.addBatchItems("user_1", batch.batchId, [
        {
          clientItemId: "item-1",
          input: {
            text: "Exemplo válido para LinkedIn com contexto suficiente para ser aproveitado.",
            explicitContentType: "linkedin-post"
          }
        },
        {
          clientItemId: "item-2",
          input: {
            text: "   "
          }
        }
      ])
    );

    expect(updated.acceptedItems).toBe(1);
    expect(updated.rejectedItems).toBe(1);
    expect(updated.itemResults).toHaveLength(2);
    expect(updated.itemResults[0]?.accepted).toBe(true);
    expect(updated.itemResults[1]?.accepted).toBe(false);
    expect(updated.itemResults[1]?.reasonCode).toBe("invalid_example_payload");
  });

  it("commits accepted staged items into active examples", () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    const batch = Effect.runSync(services.voice.createBatch("user_1"));
    Effect.runSync(
      services.voice.addBatchItems("user_1", batch.batchId, [
        {
          clientItemId: "item-1",
          input: {
            text: "Exemplo válido para newsletter com profundidade suficiente para entrar no perfil.",
            explicitContentType: "newsletter",
            pinned: true
          }
        }
      ])
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_1"));

    const committed = Effect.runSync(services.voice.commitBatch("user_1", batch.batchId));
    expect(committed.acceptedItems).toBe(1);
    expect(committed.targetProfileVersion).toBe(1);

    const examples = Effect.runSync(services.voice.listExamples("user_1"));
    expect(examples.total).toBe(1);
    expect(examples.items[0]?.explicitContentType).toBe("newsletter");
  });

  it("auto-commits expired batches", () => {
    let currentTime = new Date("2026-05-14T00:00:00.000Z");
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => currentTime
      })
    );

    const batch = Effect.runSync(
      services.voice.createBatch("user_1", {
        expiresAt: "2026-05-14T00:10:00.000Z"
      })
    );

    Effect.runSync(
      services.voice.addBatchItems("user_1", batch.batchId, [
        {
          clientItemId: "item-1",
          input: {
            text: "Exemplo válido que será consolidado pelo auto-commit ao expirar.",
            explicitContentType: "linkedin-post"
          }
        }
      ])
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_1"));

    currentTime = new Date("2026-05-14T00:11:00.000Z");
    const committed = Effect.runSync(services.voice.autoCommitExpiredBatches("user_1"));

    expect(committed).toHaveLength(1);
    expect(committed[0]?.batchId).toBe(batch.batchId);

    const examples = Effect.runSync(services.voice.listExamples("user_1"));
    expect(examples.total).toBe(1);
  });
});
