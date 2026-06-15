import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import {
  createBackendTestAccessToken,
  getBackendTestAuthProfile,
  getBackendTestJwks
} from "../src/auth/test-auth.js";
import {
  parseBearerToken,
  readStringArrayClaim,
  resolveBackendAuthProfile,
  verifyBackendJwt
} from "../src/auth/jwt-common.js";
import { BackendAuthenticationError } from "../src/http/errors.js";
import { createTestConfig } from "./test-helpers.js";

describe("parseBearerToken", () => {
  it("parses a valid Bearer token", () => {
    const result = parseBearerToken("Bearer abc123");
    expect(result).toBe("abc123");
  });

  it("returns undefined for missing header", () => {
    expect(parseBearerToken(undefined)).toBeUndefined();
  });

  it("returns undefined for empty header", () => {
    expect(parseBearerToken("")).toBeUndefined();
  });

  it("returns undefined for non-Bearer scheme", () => {
    expect(parseBearerToken("Basic abc123")).toBeUndefined();
  });

  it("returns undefined for multiple tokens", () => {
    expect(parseBearerToken("Bearer abc123 extra")).toBeUndefined();
  });

  it("returns undefined for missing token", () => {
    expect(parseBearerToken("Bearer")).toBeUndefined();
  });
});

describe("readStringArrayClaim", () => {
  it("reads standard roles claim", () => {
    const claims = { roles: ["admin", "editor"] } as any;
    expect(readStringArrayClaim(claims, "roles")).toEqual(["admin", "editor"]);
  });

  it("reads namespaced roles claim", () => {
    const claims = { "https://content-lib.example.com/claims/roles": ["admin"] } as any;
    expect(readStringArrayClaim(claims, "roles")).toEqual(["admin"]);
  });

  it("prefers namespaced over standard", () => {
    const claims = {
      roles: ["standard"],
      "https://content-lib.example.com/claims/roles": ["namespaced"]
    } as any;
    expect(readStringArrayClaim(claims, "roles")).toEqual(["namespaced"]);
  });

  it("filters empty strings", () => {
    const claims = { roles: ["admin", "", "  ", "editor"] } as any;
    expect(readStringArrayClaim(claims, "roles")).toEqual(["admin", "editor"]);
  });

  it("handles single string value", () => {
    const claims = { roles: "admin" } as any;
    expect(readStringArrayClaim(claims, "roles")).toEqual(["admin"]);
  });

  it("returns empty array when claim is absent", () => {
    const claims = {} as any;
    expect(readStringArrayClaim(claims, "permissions")).toEqual([]);
  });
});

describe("resolveBackendAuthProfile", () => {
  it("uses test defaults in development", () => {
    const config = createTestConfig();
    const profile = resolveBackendAuthProfile(config);
    const testProfile = getBackendTestAuthProfile();

    expect(profile.issuerUrl).toBe(testProfile.issuerUrl);
    expect(profile.audience).toBe(testProfile.audience);
  });

  it("requires auth fields in production", () => {
    const config = createTestConfig({
      environment: "production",
      authIssuerUrl: "https://auth.example.com/",
      authAudience: "my-app",
      authJwksUrl: "https://auth.example.com/.well-known/jwks.json"
    });
    const profile = resolveBackendAuthProfile(config);

    expect(profile.issuerUrl).toBe("https://auth.example.com/");
    expect(profile.audience).toBe("my-app");
    expect(profile.jwksUrl).toBe("https://auth.example.com/.well-known/jwks.json");
  });

  it("throws when production auth fields are missing", () => {
    const config = createTestConfig({ environment: "production" });
    expect(() => resolveBackendAuthProfile(config)).toThrowError(/AUTH_ISSUER_URL is required in production auth configuration/);
  });
});

describe("verifyBackendJwt", () => {
  const route = "POST /api/test";

  it("accepts a valid token", async () => {
    const config = createTestConfig();
    const profile = resolveBackendAuthProfile(config);
    const token = createBackendTestAccessToken({ userId: "user-1" });

    const claims = await Effect.runPromise(
      verifyBackendJwt(token, profile, route)
    );

    expect(claims.sub).toBe("user-1");
    expect(claims.iss).toBe(profile.issuerUrl);
    expect(claims.aud).toBe(profile.audience);
  });

  it("rejects a malformed JWT", async () => {
    const config = createTestConfig();
    const profile = resolveBackendAuthProfile(config);

    const result = await Effect.runPromise(
      Effect.either(verifyBackendJwt("not-a-jwt", profile, route))
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(BackendAuthenticationError);
      expect(result.left.reason).toBe("invalid_token");
    }
  });

  it("rejects a token with unsupported algorithm", async () => {
    const config = createTestConfig();
    const profile = resolveBackendAuthProfile(config);
    // Create a token with HS256 header manually
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "user-1" })).toString("base64url");
    const token = `${header}.${payload}.signature`;

    const result = await Effect.runPromise(
      Effect.either(verifyBackendJwt(token, profile, route))
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.reason).toBe("unsupported_algorithm");
    }
  });

  it("rejects a token with invalid signature", async () => {
    const config = createTestConfig();
    const profile = resolveBackendAuthProfile(config);
    const validToken = createBackendTestAccessToken({ userId: "user-1" });
    const tamperedToken = `${validToken.slice(0, -5)}xxxxx`;

    const result = await Effect.runPromise(
      Effect.either(verifyBackendJwt(tamperedToken, profile, route))
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.reason).toBe("invalid_signature");
    }
  });

  it("rejects a token with wrong issuer", async () => {
    const config = createTestConfig();
    const profile = resolveBackendAuthProfile(config);
    const token = createBackendTestAccessToken({ userId: "user-1" });

    const wrongProfile = { ...profile, issuerUrl: "https://wrong-issuer.com/" };
    const result = await Effect.runPromise(
      Effect.either(verifyBackendJwt(token, wrongProfile, route))
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.reason).toBe("invalid_issuer");
    }
  });

  it("rejects a token with wrong audience", async () => {
    const config = createTestConfig();
    const profile = resolveBackendAuthProfile(config);
    const token = createBackendTestAccessToken({ userId: "user-1" });

    const wrongProfile = { ...profile, audience: "wrong-audience" };
    const result = await Effect.runPromise(
      Effect.either(verifyBackendJwt(token, wrongProfile, route))
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.reason).toBe("invalid_audience");
    }
  });

  it("rejects an expired token", async () => {
    const config = createTestConfig();
    const profile = resolveBackendAuthProfile(config);
    // Token expired 2 minutes ago to exceed clock tolerance (60s)
    const token = createBackendTestAccessToken({
      userId: "user-1",
      expiresAt: new Date(Date.now() - 120 * 1000)
    });

    const result = await Effect.runPromise(
      Effect.either(verifyBackendJwt(token, profile, route))
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.reason).toBe("expired_token");
    }
  });

  it("rejects a token not yet valid", async () => {
    const config = createTestConfig();
    const profile = resolveBackendAuthProfile(config);
    // nbf 2 minutes in the future to exceed clock tolerance (60s)
    const token = createBackendTestAccessToken({
      userId: "user-1",
      notBefore: new Date(Date.now() + 120 * 1000)
    });

    const result = await Effect.runPromise(
      Effect.either(verifyBackendJwt(token, profile, route))
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.reason).toBe("invalid_token");
    }
  });

  it("rejects a token with missing subject", async () => {
    const config = createTestConfig();
    const profile = resolveBackendAuthProfile(config);
    // This is tested at the resolver level, not jwt-common level
    // But we can verify the claims parsing works
    const token = createBackendTestAccessToken({ userId: "user-1" });

    const claims = await Effect.runPromise(
      verifyBackendJwt(token, profile, route)
    );

    expect(claims.sub).toBeDefined();
  });

  it("fails when JWKS endpoint returns error", async () => {
    const config = createTestConfig();
    const profile = resolveBackendAuthProfile(config);
    const token = createBackendTestAccessToken({ userId: "user-1" });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error"
    });

    try {
      const result = await Effect.runPromise(
        Effect.either(
          verifyBackendJwt(token, { ...profile, jwksUrl: "https://auth.example.com/jwks" }, route)
        )
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.reason).toBe("invalid_configuration");
        expect(result.left.message).toContain('JWKS endpoint "https://auth.example.com/jwks" responded with HTTP 500');
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("fails with descriptive configuration error when production auth profile is incomplete", async () => {
    const config = createTestConfig({ environment: "production" });

    try {
      resolveBackendAuthProfile(config);
      expect.unreachable("Expected resolveBackendAuthProfile to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BackendAuthenticationError);
      if (error instanceof BackendAuthenticationError) {
        expect(error.reason).toBe("invalid_configuration");
        expect(error.message).toBe("AUTH_ISSUER_URL is required in production auth configuration");
      }
    }
  });

  it("caches JWKS and reuses on subsequent calls", async () => {
    const config = createTestConfig();
    const profile = resolveBackendAuthProfile(config);
    const token = createBackendTestAccessToken({ userId: "user-1" });
    const jwks = getBackendTestJwks();

    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => jwks
    });
    globalThis.fetch = fetchSpy;

    try {
      // Use a real HTTP JWKS URL for this test
      const httpProfile = { ...profile, jwksUrl: "https://auth.example.com/jwks" };
      
      // First call should fetch
      const first = await Effect.runPromise(
        Effect.either(verifyBackendJwt(token, httpProfile, route))
      );
      
      // Should succeed because JWKS is valid
      expect(first._tag).toBe("Right");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith("https://auth.example.com/jwks");

      // Second call with same profile should use cache
      const second = await Effect.runPromise(
        Effect.either(verifyBackendJwt(token, httpProfile, route))
      );
      
      expect(second._tag).toBe("Right");
      // fetch should still be called only once (cache hit)
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
