import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createDatabase, hydrateDatabase } from "@my-ai-orchestrator/database";
import { createBackendProductServices } from "../src/product/core/services.js";
import { createBackendAppTestConfig } from "../../../tests/backend/backend-app.fixtures.js";

describe("operational override durability", () => {
  it("persists approved grants durably and preserves one-shot consumption state across restart", () => {
    const now = new Date("2026-06-02T12:00:00.000Z");
    const config = createBackendAppTestConfig();
    const database = createDatabase();
    const services = Effect.runSync(
      createBackendProductServices(config, {
        database,
        now: () => now
      })
    );

    const approved = Effect.runSync(
      services.operationalOverride.requestOverride(validOverrideRequest("operator_restart"))
    );

    expect(approved.status).toBe("approved");
    const persisted = Effect.runSync(database.memories.get("safety_override_grants", approved.overrideId));
    expect(persisted?.key).toBe(approved.overrideId);

    const restartedDatabase = hydrateDatabase(database.snapshot());
    const restartedServices = Effect.runSync(
      createBackendProductServices(config, {
        database: restartedDatabase,
        now: () => now
      })
    );

    const consumed = Effect.runSync(
      restartedServices.operationalOverride.consumeOverride(approved.overrideId)
    );
    expect(consumed).toMatchObject({
      overrideId: approved.overrideId,
      status: "consumed",
      remainingUses: 0
    });

    const afterConsumptionDatabase = hydrateDatabase(restartedDatabase.snapshot());
    const afterConsumptionServices = Effect.runSync(
      createBackendProductServices(config, {
        database: afterConsumptionDatabase,
        now: () => now
      })
    );

    const replay = Effect.runSync(
      Effect.either(afterConsumptionServices.operationalOverride.consumeOverride(approved.overrideId))
    );
    expect(replay._tag).toBe("Left");
    if (replay._tag === "Left") {
      expect(replay.left).toMatchObject({
        _tag: "BackendOperationalOverrideStateError",
        reason: "override_already_consumed"
      });
    }

    const audits = Effect.runSync(afterConsumptionDatabase.audit.list())
      .filter((record) => record.resourceId === approved.overrideId);
    expect(audits.some((record) => record.mutationType === "safety_override.approved")).toBe(true);
    expect(audits.some((record) => record.mutationType === "safety_override.consumed")).toBe(true);
  });

  it("shares expiry state across service instances and records expiry only once", () => {
    const config = createBackendAppTestConfig();
    const sharedDatabase = createDatabase();
    const nowState = { current: new Date("2026-06-02T12:00:00.000Z") };
    const firstInstance = Effect.runSync(
      createBackendProductServices(config, {
        database: sharedDatabase,
        now: () => nowState.current
      })
    );
    const secondInstance = Effect.runSync(
      createBackendProductServices(config, {
        database: sharedDatabase,
        now: () => nowState.current
      })
    );

    const approved = Effect.runSync(
      firstInstance.operationalOverride.requestOverride({
        ...validOverrideRequest("operator_multi_instance"),
        lifecycle: {
          mode: "time_limited",
          expiresAt: "2026-06-02T12:20:00.000Z"
        }
      })
    );

    expect(approved.status).toBe("approved");
    nowState.current = new Date("2026-06-02T12:25:00.000Z");

    const firstConsume = Effect.runSync(
      Effect.either(secondInstance.operationalOverride.consumeOverride(approved.overrideId))
    );
    expect(firstConsume._tag).toBe("Left");
    if (firstConsume._tag === "Left") {
      expect(firstConsume.left).toMatchObject({
        _tag: "BackendOperationalOverrideStateError",
        reason: "override_expired"
      });
    }

    const secondConsume = Effect.runSync(
      Effect.either(firstInstance.operationalOverride.consumeOverride(approved.overrideId))
    );
    expect(secondConsume._tag).toBe("Left");
    if (secondConsume._tag === "Left") {
      expect(secondConsume.left).toMatchObject({
        _tag: "BackendOperationalOverrideStateError",
        reason: "override_expired"
      });
    }

    const expiredRecord = Effect.runSync(sharedDatabase.memories.get("safety_override_grants", approved.overrideId));
    expect(expiredRecord?.value).toMatchObject({
      status: "expired",
      overrideId: approved.overrideId
    });

    const audits = Effect.runSync(sharedDatabase.audit.list())
      .filter((record) => record.resourceId === approved.overrideId && record.mutationType === "safety_override.expired");
    expect(audits).toHaveLength(1);
  });
});

function validOverrideRequest(operatorId: string) {
  return {
    operatorId,
    justification: "Emergency override for a support-led release that requires controlled output review.",
    scope: {
      targetFamily: "output_release" as const,
      boundary: "output" as const,
      resourceId: "execution:newsletter:quote_1",
      targetOutcome: "require_override" as const,
      categories: ["personal_data"] as const,
      fields: ["content"] as const,
      pipelineName: "newsletter"
    }
  };
}
