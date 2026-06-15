import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createPostgresVoiceTrainingConsentRepository } from "../src/infra/postgres-repositories/postgres-voice-training-consent-repository.js";
import {
  backendTestDatabaseUrl,
  closePostgresTestDatabase,
  openPostgresTestDatabase,
  shouldRunPostgresIntegrationTests,
  type PostgresTestContext
} from "./postgres-test-helpers.js";

const describeIfPostgres = backendTestDatabaseUrl && (await shouldRunPostgresIntegrationTests())
  ? describe
  : describe.skip;

describeIfPostgres("PostgreSQL Voice Training Consent Repository", () => {
  let context: PostgresTestContext;

  beforeAll(async () => {
    context = await openPostgresTestDatabase();
  });

  afterAll(async () => {
    await closePostgresTestDatabase(context);
  });

  beforeEach(async () => {
    await context.db.deleteFrom("voice_training_consents").execute();
  });

  it("persists and retrieves consent by user id", async () => {
    const repo = createPostgresVoiceTrainingConsentRepository(context.db);
    const timestamp = "2026-06-09T12:00:00.000Z";

    await Effect.runPromise(
      repo.put({
        id: "voice-consent:user-1",
        userId: "user-1",
        granted: true,
        grantedAt: timestamp,
        evidenceBoundary: "consent",
        createdAt: timestamp,
        updatedAt: timestamp
      })
    );

    const found = await Effect.runPromise(repo.getByUser("user-1"));
    expect(found?.granted).toBe(true);
    expect(found?.grantedAt).toBe(timestamp);
  });
});
