import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import { createBackendObservabilityService } from "../../apps/backend/src/product/core/observability.js";
import { createBackendRedactionService } from "../../apps/backend/src/safety/redaction.js";
import { createClassifiedRedactionValue } from "../../apps/backend/src/safety/redaction-types.js";

describe("redacted logger", () => {
  it("does not emit secret values through wrapped logger", () => {
    const redaction = createBackendRedactionService();
    const captured: Array<{ message: string; meta?: Record<string, unknown> }> = [];
    const mockLogger: AppLogger = {
      info: (message, meta) => captured.push({ message, meta }),
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined
    };

    const redactedLogger = redaction.createRedactedLogger(mockLogger);
    redactedLogger.info("User action", {
      userId: "user_1",
      apiKey: "secret-key",
      briefing: "Some content"
    });

    expect(captured.length).toBe(1);
    expect(captured[0]?.meta?.userId).toBe("user_1");
    expect(captured[0]?.meta?.apiKey).toBe("[REDACTED: string(10)]");
    expect(captured[0]?.meta?.briefing).toBe("Some content");
  });

  it("does not emit classified protected payloads through wrapped logger", () => {
    const redaction = createBackendRedactionService();
    const captured: Array<{ message: string; meta?: Record<string, unknown> }> = [];
    const mockLogger: AppLogger = {
      info: (message, meta) => captured.push({ message, meta }),
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined
    };

    const redactedLogger = redaction.createRedactedLogger(mockLogger);
    redactedLogger.info("Input blocked", {
      payload: createClassifiedRedactionValue("personal_data", "customer@example.com")
    });

    expect(captured[0]?.meta?.payload).toEqual({
      _tag: "ClassifiedRedactionValue",
      classification: "personal_data",
      value: "[REDACTED: string(20)]"
    });
  });

  it("passes through messages without metadata", () => {
    const redaction = createBackendRedactionService();
    const captured: Array<{ message: string; meta?: Record<string, unknown> }> = [];
    const mockLogger: AppLogger = {
      info: (message, meta) => captured.push({ message, meta }),
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined
    };

    const redactedLogger = redaction.createRedactedLogger(mockLogger);
    redactedLogger.info("Simple message");

    expect(captured.length).toBe(1);
    expect(captured[0]?.message).toBe("Simple message");
    expect(captured[0]?.meta).toBeUndefined();
  });
});

describe("redacted observability", () => {
  it("redacts sensitive details in observability events", async () => {
    const redaction = createBackendRedactionService();
    const observability = await Effect.runPromise(createBackendObservabilityService(redaction));

    await Effect.runPromise(
      observability.recordVoiceBatchCommitted({
        userId: "user_1",
        apiKey: "should-not-appear",
        batchSize: 5
      })
    );

    const snapshot = await Effect.runPromise(observability.snapshot());
    const event = snapshot.events[0];

    expect(event).toBeDefined();
    expect(event?.details.apiKey).toBe("[REDACTED: string(17)]");
    expect(event?.details.userId).toBe("user_1");
    expect(event?.details.batchSize).toBe(5);
  });

  it("redacts classified details in observability events", async () => {
    const redaction = createBackendRedactionService();
    const observability = await Effect.runPromise(createBackendObservabilityService(redaction));

    await Effect.runPromise(
      observability.recordVoiceBatchCommitted({
        actorId: "user_1",
        protectedInput: createClassifiedRedactionValue("voice_training_input", {
          text: "Private writing sample"
        })
      })
    );

    const snapshot = await Effect.runPromise(observability.snapshot());
    expect(snapshot.events[0]?.details.protectedInput).toEqual({
      _tag: "ClassifiedRedactionValue",
      classification: "voice_training_input",
      value: "[REDACTED: object]"
    });
  });

  it("redacts observability snapshot via service", async () => {
    const redaction = createBackendRedactionService();
    const observability = await Effect.runPromise(createBackendObservabilityService(redaction));

    await Effect.runPromise(
      observability.recordVoiceBatchCommitted({
        secretToken: "hidden"
      })
    );

    const rawSnapshot = await Effect.runPromise(observability.snapshot());
    const redactedSnapshot = redaction.redactObservabilitySnapshot(rawSnapshot);

    expect(redactedSnapshot.events[0]?.details.secretToken).toBe("[REDACTED: string(6)]");
  });
});
