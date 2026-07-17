import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import { createBackendTestAccessToken } from "../src/auth/test-auth.js";
import { createTestConfig, createMinimalServices, createTestApp } from "./test-helpers.js";

describe("POST /me/generation-prefill", () => {
  it("returns 401 when the token is missing", async () => {
    const config = createTestConfig();
    const services = createMinimalServices();
    const app = createTestApp(config, services);

    const response = await app.request("/me/generation-prefill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: "Um tema qualquer" })
    });

    expect(response.status).toBe(401);
  });

  it("resolves the actor and returns the prefill response from the service", async () => {
    const config = createTestConfig();
    const users = createBackendApplicationUserMemoryRepository();
    Effect.runSync(users.create({ id: "user-1", externalSubject: "auth0|test-user", status: "active" }));
    let receivedInput: unknown;
    const services = createMinimalServices({
      users,
      generationPrefill: {
        infer: (input) =>
          Effect.sync(() => {
            receivedInput = input;
            return {
              prefill: { intent: "share-idea" as const, scope: { lengthTier: "short" as const } },
              intentAmbiguity: null,
              detectedPlatform: "linkedin",
              questionPlan: [{ id: "thesis", angle: "thesis" as const, prompt: "Qual é a tese?" }]
            };
          })
      } as never
    });
    const app = createTestApp(config, services);
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });

    const response = await app.request("/me/generation-prefill", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ theme: "Um post sobre LinkedIn", language: "pt-BR" })
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      prefill: { intent: "share-idea", scope: { lengthTier: "short" } },
      intentAmbiguity: null,
      detectedPlatform: "linkedin"
    });
    expect(body.questionPlan).toHaveLength(1);
    expect(receivedInput).toMatchObject({
      userId: "user-1",
      theme: "Um post sobre LinkedIn",
      language: "pt-BR"
    });
  });
});
