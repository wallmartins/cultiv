import { Effect } from "effect";
import { BackendAuthenticationError } from "../http/errors.js";
import type {
  BackendAuthProfile,
  BackendJwksSet,
  JsonWebKey
} from "./jwt-types.js";

const jwksCache = new Map<string, { readonly expiresAt: number; readonly jwks: BackendJwksSet }>();

export function loadBackendJwks(
  profile: BackendAuthProfile,
  route: string
): Effect.Effect<BackendJwksSet, BackendAuthenticationError> {
  const cached = jwksCache.get(profile.jwksUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return Effect.succeed(cached.jwks);
  }

  return Effect.tryPromise({
    try: async () => {
      const response = await fetch(profile.jwksUrl);
      if (!response.ok) {
        throw new BackendAuthenticationError({
          route,
          reason: "invalid_configuration",
          message: `JWKS endpoint "${profile.jwksUrl}" responded with HTTP ${response.status}`
        });
      }

      const payload = (await response.json()) as unknown;
      return parseBackendJwks(payload);
    },
    catch: (error) =>
      error instanceof BackendAuthenticationError
        ? error
        : new BackendAuthenticationError({
            route,
            reason: "invalid_configuration",
            message: `Failed to load JWKS from ${profile.jwksUrl}: ${toErrorMessage(error)}`
          })
  }).pipe(
    Effect.tap((jwks) =>
      Effect.sync(() => {
        jwksCache.set(profile.jwksUrl, {
          expiresAt: Date.now() + profile.jwksCacheTtlMs,
          jwks
        });
      })
    )
  );
}

export function warmBackendAuthProfile(
  profile: BackendAuthProfile
): Effect.Effect<void, BackendAuthenticationError> {
  return loadBackendJwks(profile, "GET /ready").pipe(Effect.asVoid);
}

export function findJwkByKid(jwks: BackendJwksSet, kid: string | undefined): JsonWebKey | undefined {
  if (!kid) {
    return undefined;
  }

  return jwks.keys.find((key) => key.kid === kid);
}

function parseBackendJwks(payload: unknown): BackendJwksSet {
  if (typeof payload !== "object" || payload === null || !("keys" in payload)) {
    throw new Error("JWKS payload is invalid: missing top-level keys array");
  }

  const keys = (payload as { readonly keys?: unknown }).keys;
  if (!Array.isArray(keys)) {
    throw new Error("JWKS payload is invalid: keys must be an array");
  }

  const parsedKeys = keys.filter((key): key is JsonWebKey => {
    return typeof key === "object" && key !== null && "kid" in key;
  });

  if (parsedKeys.length === 0) {
    throw new Error("JWKS payload is invalid: it does not contain any usable key entries");
  }

  return { keys: parsedKeys };
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
}
