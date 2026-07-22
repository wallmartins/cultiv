import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import { createBackendTestAccessToken } from "../src/auth/test-auth.js";
import { createTestConfig, createMinimalServices, createTestApp } from "./test-helpers.js";

function authedUser() {
  const users = createBackendApplicationUserMemoryRepository();
  Effect.runSync(users.create({ id: "user-1", externalSubject: "auth0|test-user", status: "active" }));
  return users;
}

describe("POST /me/genre-inference", () => {
  it("returns 401 when the token is missing", async () => {
    const app = createTestApp(createTestConfig(), createMinimalServices());
    const response = await app.request("/me/genre-inference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ briefing: { topic: "x" } })
    });
    expect(response.status).toBe(401);
  });

  it("returns the inferred genre from the service", async () => {
    let received: unknown;
    const services = createMinimalServices({
      users: authedUser(),
      genreInference: {
        infer: (input) =>
          Effect.sync(() => {
            received = input;
            return { genre: { rhetoricalMode: { dominant: "promote" as const }, epistemicPosture: "promotional" as const, prose: "p" } };
          })
      } as never
    });
    const app = createTestApp(createTestConfig(), services);
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });

    const response = await app.request("/me/genre-inference", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ briefing: { topic: "vender meu SaaS" }, language: "pt-BR" })
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.genre.rhetoricalMode.dominant).toBe("promote");
    expect(received).toMatchObject({ briefing: { topic: "vender meu SaaS" }, language: "pt-BR" });
  });
});

describe("GET /me/practice-profile", () => {
  it("returns 401 when the token is missing", async () => {
    const app = createTestApp(createTestConfig(), createMinimalServices());
    const response = await app.request("/me/practice-profile", { method: "GET" });
    expect(response.status).toBe(401);
  });

  it("returns a null profile when the author has none", async () => {
    const services = createMinimalServices({
      users: authedUser(),
      database: { practiceProfiles: { getByUser: () => Effect.succeed(undefined) } } as never
    });
    const app = createTestApp(createTestConfig(), services);
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });

    const response = await app.request("/me/practice-profile", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ profile: null });
  });
});
