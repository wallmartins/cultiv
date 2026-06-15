import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createDatabase } from "../../packages/database";
import { AIAdapterTransportError } from "../../packages/ai-adapters";
import { createBackendMemoryBundleService } from "../../apps/backend";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import { createBackendProviderTransport } from "../../apps/backend/src/execution/pipeline/provider-transport.js";

describe("backend support infrastructure", () => {
  it("provides memory and corpus behavior from the new stack", async () => {
    const database = createDatabase();
    const bundle = Effect.runSync(
      createBackendMemoryBundleService({
        database,
        namespace: "voice-user",
        seedTexts: [
          {
            id: "voice-guide",
            title: "Voice Guide",
            content: "Use direct language and concrete examples.",
            tags: ["voice", "style"],
            excerpt: "Use direct language",
            createdAt: "2026-05-11T00:00:00.000Z"
          },
          {
            id: "migration-playbook",
            title: "Migration Playbook",
            content: "Prefer packages first and typed contracts.",
            tags: ["migration"],
            excerpt: "packages first",
            createdAt: "2026-05-11T00:00:00.000Z"
          }
        ]
      })
    );

    await Effect.runPromise(bundle.memory.write("voice.profile", {
      tone: "direct",
      bannedPhrases: ["As an AI language model"]
    }));
    await Effect.runPromise(bundle.memory.write("voice.examples.primary", "Prefer short openings."));

    const memoryValue = await Effect.runPromise(bundle.memory.read("voice.profile"));
    const memoryKeys = await Effect.runPromise(bundle.memory.list());
    const memoryQuery = await Effect.runPromise(bundle.memory.query({ prefix: "voice." }));
    const persistedRecord = await Effect.runPromise(database.memories.get("voice-user", "voice.profile"));
    const corpusById = await Effect.runPromise(bundle.corpus.getById("voice-guide"));
    const corpusByTag = await Effect.runPromise(bundle.corpus.queryByTag("voice"));
    const corpusByPrefix = await Effect.runPromise(bundle.corpus.queryByPrefix("migration"));

    expect(memoryValue).toEqual({
      tone: "direct",
      bannedPhrases: ["As an AI language model"]
    });
    expect(memoryKeys).toEqual(["voice.profile", "voice.examples.primary"]);
    expect(memoryQuery).toEqual({
      "voice.profile": {
        tone: "direct",
        bannedPhrases: ["As an AI language model"]
      },
      "voice.examples.primary": "Prefer short openings."
    });
    expect(persistedRecord?.id).toBe("voice-user:voice.profile");
    expect(persistedRecord?.value).toEqual({
      tone: "direct",
      bannedPhrases: ["As an AI language model"]
    });
    expect(corpusById?.title).toBe("Voice Guide");
    expect(corpusByTag.map((entry) => entry.id)).toEqual(["voice-guide"]);
    expect(corpusByPrefix.map((entry) => entry.id)).toEqual(["migration-playbook"]);
  });

  it("uses adapter and storage boundaries from the new monorepo packages", async () => {
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

    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-11T00:00:00.000Z")
      })
    );

    const completion = await Effect.runPromise(
      services.aiAdapters.complete({
        request: {
          provider: "openai",
          model: "gpt-4.1",
          messages: [{ role: "user", content: "Write a direct sentence." }],
          metadata: { traceId: "trace_support_infra" }
        },
        transport: () =>
          Effect.succeed({
            choices: [{ message: { content: "Write with direct language." }, finish_reason: "stop" }],
            usage: { promptTokens: 4, completionTokens: 5, totalTokens: 9 }
          })
      })
    );

    await Effect.runPromise(
      services.persistence.recordMemoryWrite({
        key: "support.lastAdapter",
        value: completion.response.provider,
        at: "2026-05-11T00:00:01.000Z"
      })
    );

    const persistedRecord = await Effect.runPromise(
      services.database.memories.get("backend", "support.lastAdapter")
    );

    expect(completion.providerRequest.provider).toBe("openai");
    expect(completion.response.text).toBe("Write with direct language.");
    expect(persistedRecord?.value).toBe("openai");
  });

  it("fails Gemini and DeepSeek transport setup with typed configuration errors", () => {
    const config: BackendConfig = {
      environment: "development",
      executionMode: "sync",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR",
      serviceName: "backend",
      host: "127.0.0.1",
      port: 3000,
      version: "0.1.0"
    };
    const transport = createBackendProviderTransport(config);

    const geminiResult = Effect.runSync(
      Effect.either(
        transport.complete({
          provider: "gemini",
          model: "gemini-1.5-pro",
          headers: { "content-type": "application/json" },
          metadata: {},
          body: { contents: [] }
        })
      )
    );
    const deepSeekResult = Effect.runSync(
      Effect.either(
        transport.complete({
          provider: "deepseek",
          model: "deepseek-chat",
          headers: { "content-type": "application/json" },
          metadata: {},
          body: { messages: [] }
        })
      )
    );

    expect(geminiResult._tag).toBe("Left");
    expect(geminiResult.left).toBeInstanceOf(AIAdapterTransportError);
    expect(String(geminiResult.left)).toContain("GEMINI_API_KEY");
    expect(deepSeekResult._tag).toBe("Left");
    expect(deepSeekResult.left).toBeInstanceOf(AIAdapterTransportError);
    expect(String(deepSeekResult.left)).toContain("DEEPSEEK_API_KEY");
  });
});
