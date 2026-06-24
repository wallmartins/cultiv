import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { Kysely } from "kysely";
import { DatabaseError } from "@my-ai-orchestrator/database";
import { createPostgresJobRepository } from "../src/infra/postgres-repositories/postgres-job-repository.js";
import { createPostgresVoiceProfileRepository } from "../src/infra/postgres-repositories/postgres-voice-profile-repository.js";
import type { DatabaseTables } from "../src/infra/postgres-tables.js";
import { mapDatabaseError } from "../src/error-mappers/error-map-database.js";
import { mapErrorToHttp } from "../src/http/error-response.js";

function createQueryBuilderMock(terminal: {
  execute?: () => Promise<unknown>;
  executeTakeFirst?: () => Promise<unknown>;
}) {
  const chain = new Proxy({} as Record<string, unknown>, {
    get(_target, prop) {
      if (prop === "execute") {
        return terminal.execute ?? (() => Promise.resolve([]));
      }
      if (prop === "executeTakeFirst") {
        return terminal.executeTakeFirst ?? (() => Promise.resolve(undefined));
      }
      if (prop === "then") {
        return undefined;
      }
      return (..._args: unknown[]) => chain;
    }
  });
  return chain;
}

function createFailingDb(message = "connection refused"): Kysely<DatabaseTables> {
  const fail = () => Promise.reject(new Error(message));
  return {
    selectFrom: () => createQueryBuilderMock({ execute: fail, executeTakeFirst: fail }),
    insertInto: () => createQueryBuilderMock({ execute: fail }),
    updateTable: () => createQueryBuilderMock({ execute: fail }),
    deleteFrom: () => createQueryBuilderMock({ executeTakeFirst: fail })
  } as unknown as Kysely<DatabaseTables>;
}

function createEmptyReadDb(): Kysely<DatabaseTables> {
  return {
    selectFrom: () =>
      createQueryBuilderMock({
        execute: () => Promise.resolve([]),
        executeTakeFirst: () => Promise.resolve(undefined)
      }),
    insertInto: () => createQueryBuilderMock({ execute: () => Promise.resolve(undefined) }),
    updateTable: () => createQueryBuilderMock({ execute: () => Promise.resolve(undefined) }),
    deleteFrom: () =>
      createQueryBuilderMock({
        executeTakeFirst: () => Promise.resolve({ numDeletedRows: 0n })
      })
  } as unknown as Kysely<DatabaseTables>;
}

describe("postgres repository error propagation", () => {
  it("job list surfaces DatabaseError instead of empty results", async () => {
    const repo = createPostgresJobRepository(createFailingDb());

    const result = await Effect.runPromiseExit(repo.list());

    expect(result._tag).toBe("Failure");
    if (result._tag === "Failure") {
      expect(result.cause._tag).toBe("Fail");
      if (result.cause._tag === "Fail") {
        expect(result.cause.error).toBeInstanceOf(DatabaseError);
        expect((result.cause.error as DatabaseError).operation).toBe("jobs.list");
      }
    }
  });

  it("job findById returns undefined for successful empty query", async () => {
    const repo = createPostgresJobRepository(createEmptyReadDb());

    const result = await Effect.runPromise(repo.findById("missing-job"));

    expect(result).toBeUndefined();
  });

  it("voice profile getByUser surfaces DatabaseError instead of undefined", async () => {
    const repo = createPostgresVoiceProfileRepository(createFailingDb());

    const result = await Effect.runPromiseExit(repo.getByUser("user-1"));

    expect(result._tag).toBe("Failure");
    if (result._tag === "Failure") {
      expect(result.cause._tag).toBe("Fail");
      if (result.cause._tag === "Fail") {
        expect(result.cause.error).toBeInstanceOf(DatabaseError);
        expect((result.cause.error as DatabaseError).operation).toBe("voice_profiles.getByUser");
      }
    }
  });

  it("voice profile getByUser returns undefined for successful empty query", async () => {
    const repo = createPostgresVoiceProfileRepository(createEmptyReadDb());

    const result = await Effect.runPromise(repo.getByUser("missing-user"));

    expect(result).toBeUndefined();
  });
});

describe("mapDatabaseError", () => {
  it("maps DatabaseError to HTTP 500", () => {
    const error = new DatabaseError({
      operation: "jobs.list",
      message: "connection refused"
    });

    const mapped = mapDatabaseError(error, "/jobs");
    expect(mapped?.status).toBe(500);
    expect(mapped?.body.code).toBe("internal_error");
    expect(mapped?.body.details).toMatchObject({ operation: "jobs.list", path: "/jobs" });
  });

  it("is wired into mapErrorToHttp", () => {
    const error = new DatabaseError({
      operation: "voice_profiles.getByUser",
      message: "connection refused"
    });

    const mapped = mapErrorToHttp(error, "/me/voice-profile");
    expect(mapped.status).toBe(500);
    expect(mapped.body.code).toBe("internal_error");
  });
});
