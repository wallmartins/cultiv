import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createBackendDatabaseClient } from "../src/infra/database-bootstrap.js";
import type { BackendConfig } from "../src/config/config.js";

describe("PostgreSQL bootstrap", () => {
  it("returns in-memory client when DATABASE_URL is absent", async () => {
    const config: BackendConfig = {
      environment: "development",
      executionMode: "sync",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR",
      serviceName: "backend",
      host: "0.0.0.0",
      port: 3000,
      version: "0.1.0"
    };

    const client = await Effect.runPromise(createBackendDatabaseClient(config));

    expect(client).toBeDefined();
    expect(client.jobs).toBeDefined();
    expect(client.memories).toBeDefined();
    expect(client.snapshot).toBeDefined();
  });

  it("fails fast when DATABASE_URL is invalid", async () => {
    const config: BackendConfig = {
      environment: "production",
      executionMode: "sync",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR",
      serviceName: "backend",
      host: "0.0.0.0",
      port: 3000,
      version: "0.1.0",
      databaseUrl: "postgresql://invalid:5432/db"
    };

    const result = await Effect.runPromise(
      createBackendDatabaseClient(config).pipe(Effect.either)
    );

    expect(result._tag).toBe("Left");
  });
});
