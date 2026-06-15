import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";

function createLoggerSpy(): AppLogger & { readonly entries: Array<{ level: string; message: string; meta?: Record<string, unknown> }> } {
  const entries: Array<{ level: string; message: string; meta?: Record<string, unknown> }> = [];
  return {
    entries,
    info(message, meta) {
      entries.push({ level: "info", message, meta });
    },
    warn(message, meta) {
      entries.push({ level: "warn", message, meta });
    },
    error(message, meta) {
      entries.push({ level: "error", message, meta });
    },
    debug(message, meta) {
      entries.push({ level: "debug", message, meta });
    }
  };
}

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

describe("backend observability", () => {
  it("records rebuild, commit, snapshot and refresh signals", async () => {
    const logger = createLoggerSpy();
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z"),
        logger
      })
    );

    await Effect.runPromise(services.voiceConsent.grantConsent("user_1"));

    await Effect.runPromise(
      services.voice.createExample("user_1", {
        text: "Eu escrevo com abertura direta, voz clara e ritmo curto para LinkedIn.",
        explicitContentType: "linkedin-post",
        pinned: true
      })
    );
    await Effect.runPromise(services.voiceRebuild.drain("user_1"));

    const effective = Effect.runSync(
      services.voice.resolveEffectiveVoice("user_1", {
        contentType: "linkedin-post",
        requestedLanguage: "pt-BR"
      })
    );
    expect(effective).toBeDefined();

    const batch = Effect.runSync(services.voice.createBatch("user_1"));
    Effect.runSync(
      services.voice.addBatchItems("user_1", batch.batchId, [
        {
          clientItemId: "item-1",
          input: {
            text: "Texto em lote para consolidar a observabilidade.",
            explicitContentType: "newsletter"
          }
        }
      ])
    );
    await Effect.runPromise(services.voice.commitBatch("user_1", batch.batchId));
    await Effect.runPromise(services.voiceRebuild.drain("user_1"));

    const snapshot = Effect.runSync(services.observability.snapshot());
    expect(snapshot.counters.voice_rebuild_queued).toBeGreaterThanOrEqual(2);
    expect(snapshot.counters.voice_rebuild_started).toBeGreaterThanOrEqual(2);
    expect(snapshot.counters.voice_rebuild_completed).toBeGreaterThanOrEqual(2);
    expect(snapshot.counters.voice_snapshot_persisted).toBeGreaterThanOrEqual(1);
    expect(snapshot.counters.voice_batch_committed).toBeGreaterThanOrEqual(1);
    expect(snapshot.counters.voice_refresh_event).toBeGreaterThanOrEqual(2);

    expect(snapshot.events.some((event) => event.kind === "voice_refresh_event")).toBe(true);
    expect(snapshot.events.some((event) => event.kind === "voice_snapshot_persisted")).toBe(true);
    expect(logger.entries.some((entry) => entry.message === "Queued voice profile rebuild")).toBe(true);
    expect(logger.entries.some((entry) => entry.message === "Committed voice example batch")).toBe(true);
    expect(logger.entries.some((entry) => entry.message === "Persisted execution voice snapshot")).toBe(true);
  });
});
