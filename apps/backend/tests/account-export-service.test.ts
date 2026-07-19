import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createDatabase } from "@my-ai-orchestrator/database";
import { createBillingRepository, createBillingService } from "@my-ai-orchestrator/payments";
import type { Redis } from "ioredis";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import {
  consumeAccountExportDownload,
  createBackendAccountExportService
} from "../src/product/account/account-export-service.js";
import { createVoiceExampleInDatabase } from "./test-helpers.js";

// minimal fake Redis — just the 3 commands the export service actually calls.
function fakeRedis(): Redis {
  const store = new Map<string, string>();
  return {
    setex: async (key: string, _ttl: number, value: string) => {
      store.set(key, value);
      return "OK";
    },
    get: async (key: string) => store.get(key) ?? null,
    del: async (key: string) => {
      const existed = store.delete(key);
      return existed ? 1 : 0;
    }
  } as unknown as Redis;
}

// contract-08 §5 task 8 — export builder + delivery, runnable without Postgres (in-memory database).
describe("account export service", () => {
  it("assembles a bundle with decrypted examples, delivers it once via download, then it's gone", async () => {
    const database = createDatabase();
    const users = createBackendApplicationUserMemoryRepository();
    Effect.runSync(users.create({ id: "user-1", externalSubject: "auth0|user-1", status: "active" }));
    Effect.runSync(createVoiceExampleInDatabase(database, "user-1", { text: "Minha voz autêntica." }));

    const billing = createBillingService({ repository: createBillingRepository() });
    const redis = fakeRedis();
    const service = createBackendAccountExportService({
      database,
      billing,
      users,
      redis,
      now: () => new Date("2026-01-01T00:00:00.000Z")
    });

    const jobView = await Effect.runPromise(service.requestExport("user-1"));
    expect(jobView.status).toBe("ready");
    expect(jobView.downloadUrl).toBe(`/me/account/export/${jobView.jobId}/download`);

    const polled = await Effect.runPromise(service.getExportStatus("user-1", jobView.jobId));
    expect(polled.status).toBe("ready");

    const download = await Effect.runPromise(consumeAccountExportDownload(redis, "user-1", jobView.jobId));
    expect(download).toBeDefined();
    expect(download?.bundle.account.id).toBe("user-1");
    expect(download?.bundle.voiceExamples).toHaveLength(1);
    expect((download?.bundle.voiceExamples[0] as { text: string }).text).toBe("Minha voz autêntica.");

    // one-time: a second download attempt finds nothing.
    const secondDownload = await Effect.runPromise(consumeAccountExportDownload(redis, "user-1", jobView.jobId));
    expect(secondDownload).toBeUndefined();
  });

  it("refuses to deliver a download to a different user than the one who requested it", async () => {
    const database = createDatabase();
    const users = createBackendApplicationUserMemoryRepository();
    Effect.runSync(users.create({ id: "user-1", externalSubject: "auth0|user-1", status: "active" }));
    const billing = createBillingService({ repository: createBillingRepository() });
    const redis = fakeRedis();
    const service = createBackendAccountExportService({ database, billing, users, redis, now: () => new Date() });

    const jobView = await Effect.runPromise(service.requestExport("user-1"));

    const download = await Effect.runPromise(consumeAccountExportDownload(redis, "user-2", jobView.jobId));
    expect(download).toBeUndefined();
  });
});
