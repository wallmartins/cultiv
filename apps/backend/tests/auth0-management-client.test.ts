import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { createAuth0ManagementClient } from "../src/auth/auth0-management-client.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// contract-08 §5 task 5 — stubbed Management API only, per coordinator instruction (never call real Auth0).
describe("Auth0ManagementClient", () => {
  it("obtains an M2M token then deletes the user, sending the bearer token", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = vi.fn(async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: url.toString(), init });
      if (url.toString().endsWith("/oauth/token")) {
        return jsonResponse(200, { access_token: "m2m-token", expires_in: 86400 });
      }
      return new Response(null, { status: 204 });
    });

    const client = createAuth0ManagementClient({
      domain: "test-tenant.auth0.com",
      clientId: "client-id",
      clientSecret: "client-secret",
      fetchImpl: fetchImpl as unknown as typeof fetch
    });

    await Effect.runPromise(client.deleteUser("auth0|user-1"));

    expect(calls).toHaveLength(2);
    expect(calls[0].url).toBe("https://test-tenant.auth0.com/oauth/token");
    expect(calls[1].url).toBe("https://test-tenant.auth0.com/api/v2/users/auth0%7Cuser-1");
    expect((calls[1].init?.headers as Record<string, string>).Authorization).toBe("Bearer m2m-token");
  });

  it("caches the token across calls and only refetches once it expires", async () => {
    let now = 0;
    const fetchImpl = vi.fn(async (url: string | URL) => {
      if (url.toString().endsWith("/oauth/token")) {
        return jsonResponse(200, { access_token: `token-${now}`, expires_in: 3600 });
      }
      return new Response(null, { status: 204 });
    });

    const client = createAuth0ManagementClient({
      domain: "test-tenant.auth0.com",
      clientId: "client-id",
      clientSecret: "client-secret",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now: () => new Date(now)
    });

    await Effect.runPromise(client.deleteUser("auth0|user-1"));
    await Effect.runPromise(client.deleteUser("auth0|user-2"));
    const tokenCalls = fetchImpl.mock.calls.filter(([url]) => url.toString().endsWith("/oauth/token"));
    expect(tokenCalls).toHaveLength(1);

    now += 3600_000; // past expiry (minus the 60s margin) — must refetch.
    await Effect.runPromise(client.deleteUser("auth0|user-3"));
    const tokenCallsAfterExpiry = fetchImpl.mock.calls.filter(([url]) => url.toString().endsWith("/oauth/token"));
    expect(tokenCallsAfterExpiry).toHaveLength(2);
  });

  it("treats a 404 delete as success — idempotent for retries against an already-gone user", async () => {
    const fetchImpl = vi.fn(async (url: string | URL) => {
      if (url.toString().endsWith("/oauth/token")) {
        return jsonResponse(200, { access_token: "m2m-token", expires_in: 3600 });
      }
      return jsonResponse(404, { error: "not_found" });
    });

    const client = createAuth0ManagementClient({
      domain: "test-tenant.auth0.com",
      clientId: "client-id",
      clientSecret: "client-secret",
      fetchImpl: fetchImpl as unknown as typeof fetch
    });

    const result = await Effect.runPromise(Effect.either(client.deleteUser("auth0|already-gone")));
    expect(result._tag).toBe("Right");
  });

  it("fails (retryable by the outbox relay) on a non-404 error status", async () => {
    const fetchImpl = vi.fn(async (url: string | URL) => {
      if (url.toString().endsWith("/oauth/token")) {
        return jsonResponse(200, { access_token: "m2m-token", expires_in: 3600 });
      }
      return jsonResponse(500, { error: "server_error" });
    });

    const client = createAuth0ManagementClient({
      domain: "test-tenant.auth0.com",
      clientId: "client-id",
      clientSecret: "client-secret",
      fetchImpl: fetchImpl as unknown as typeof fetch
    });

    const result = await Effect.runPromise(Effect.either(client.deleteUser("auth0|user-1")));
    expect(result._tag).toBe("Left");
  });
});
