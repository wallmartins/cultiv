import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  createDatabase,
  hydrateDatabase
} from "../../packages/database/src/index.js";
import { createBackendProductServices } from "../../apps/backend/src/index.js";
import {
  backendAppTestStartedAt,
  createBackendAppTestConfig
} from "./backend-app.fixtures.js";

describe("backend audit trail", () => {
  it.skip("persists voice mutation audits across restart", () => {
    const database = createDatabase();
    const services = Effect.runSync(
      createBackendProductServices(createBackendAppTestConfig(), {
        now: () => backendAppTestStartedAt,
        database
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_1"));

    const created = Effect.runSync(
      services.voice.createExample("user_1", {
        text: "Eu escrevo com abertura direta e exemplos concretos.",
        explicitContentType: "linkedin-post",
        pinned: true
      })
    );
    Effect.runSync(
      services.voice.updateExample("user_1", created.exampleId, {
        state: "excluded",
        text: "Atualizei o exemplo para exclui-lo do perfil ativo."
      })
    );

    const rehydrated = hydrateDatabase(database.snapshot());
    const audits = Effect.runSync(rehydrated.audit.list());
    const voiceAudits = audits.filter((record) => record.resourceType === "voice_example");

    expect(voiceAudits.map((record) => record.mutationType)).toEqual([
      "voice_example.created",
      "voice_example.updated"
    ]);
    expect(voiceAudits[0]).toMatchObject({
      actorId: "user_1",
      resourceType: "voice_example",
      resourceId: created.exampleId
    });
  });

  it("captures actor and resource metadata for policy activation", () => {
    const database = createDatabase();
    const services = Effect.runSync(
      createBackendProductServices(createBackendAppTestConfig(), {
        now: () => backendAppTestStartedAt,
        database
      })
    );

    Effect.runSync(
      services.aiPolicy.activatePolicyVersion({
        policyVersion: "2026-04-01",
        actor: "operator_1",
        approvedAt: backendAppTestStartedAt.toISOString()
      })
    );

    const audits = Effect.runSync(database.audit.list());
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actorId: "operator_1",
      actorType: "operator",
      resourceType: "ai_policy_pointer",
      resourceId: "official",
      mutationType: "ai_policy.activated"
    });
  });

  it("dedupes repeated execution-state audit writes", () => {
    const database = createDatabase();
    const services = Effect.runSync(
      createBackendProductServices(createBackendAppTestConfig(), {
        now: () => backendAppTestStartedAt,
        database
      })
    );

    Effect.runSync(
      services.database.jobs.create(
        {
          id: "job-1",
          status: "queued",
          executionMode: "async",
          contentType: "newsletter",
          createdAt: backendAppTestStartedAt.toISOString(),
          completedAt: null,
          pipelineId: "newsletter"
        },
        {
          progress: {
            currentStep: "queued",
            stepIndex: 0,
            totalSteps: 2,
            percent: 0
          },
          updatedAt: backendAppTestStartedAt.toISOString(),
          history: [
            {
              type: "created",
              at: backendAppTestStartedAt.toISOString(),
              payload: {}
            }
          ]
        }
      )
    );

    Effect.runSync(
      services.persistence.recordJobProgress({
        jobId: "job-1",
        progress: {
          currentStep: "draft",
          stepIndex: 1,
          totalSteps: 2,
          percent: 50
        },
        updatedAt: "2026-05-31T12:20:00.000Z"
      })
    );
    Effect.runSync(
      services.persistence.recordJobProgress({
        jobId: "job-1",
        progress: {
          currentStep: "draft",
          stepIndex: 1,
          totalSteps: 2,
          percent: 50
        },
        updatedAt: "2026-05-31T12:20:00.000Z"
      })
    );
    Effect.runSync(
      services.persistence.recordJobCompletion({
        jobId: "job-1",
        result: {
          content: "ok",
          metadata: {}
        },
        completedAt: "2026-05-31T12:25:00.000Z"
      })
    );
    Effect.runSync(
      services.persistence.recordJobCompletion({
        jobId: "job-1",
        result: {
          content: "ok",
          metadata: {}
        },
        completedAt: "2026-05-31T12:25:00.000Z"
      })
    );

    const audits = Effect.runSync(database.audit.list());
    expect(audits.map((record) => record.mutationType)).toEqual([
      "job.progress_recorded",
      "job.completed"
    ]);
  });
});
