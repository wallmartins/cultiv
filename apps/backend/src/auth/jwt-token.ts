import { createPublicKey, verify } from "node:crypto";
import { Effect } from "effect";
import { BackendAuthenticationError } from "../http/errors.js";
import { authClaimsNamespace } from "./constants.js";
import { findJwkByKid, loadBackendJwks } from "./jwt-jwks.js";
import type {
  BackendAuthProfile,
  BackendJwtClaims,
  JsonWebKey,
  JwtHeader
} from "./jwt-types.js";

export function verifyBackendJwt(
  token: string,
  profile: BackendAuthProfile,
  route: string
): Effect.Effect<BackendJwtClaims, BackendAuthenticationError> {
  return Effect.gen(function* () {
    const parsed = parseJwt(token);
    if (!parsed) {
      return yield* Effect.fail(
        new BackendAuthenticationError({
          route,
          reason: "invalid_token",
          message: "Authorization bearer token is not a valid JWT"
        })
      );
    }

    if (parsed.header.alg !== "RS256") {
      return yield* Effect.fail(
        new BackendAuthenticationError({
          route,
          reason: "unsupported_algorithm",
          message: `Unsupported JWT algorithm "${parsed.header.alg}"`
        })
      );
    }

    const jwks = yield* loadBackendJwks(profile, route);
    const jwk = findJwkByKid(jwks, parsed.header.kid);
    if (!jwk) {
      return yield* Effect.fail(
        new BackendAuthenticationError({
          route,
          reason: "invalid_token",
          message: "JWT key identifier was not found in the configured JWKS"
        })
      );
    }

    const verified = yield* verifyJwtSignature(parsed.signingInput, parsed.signature, jwk).pipe(
      Effect.mapError(
        () =>
          new BackendAuthenticationError({
            route,
            reason: "invalid_token",
            message: "JWT signature verification encountered an unexpected error"
          })
      )
    );
    if (!verified) {
      return yield* Effect.fail(
        new BackendAuthenticationError({
          route,
          reason: "invalid_signature",
          message: "JWT signature verification failed"
        })
      );
    }

    const claims = parsed.payload;
    if (claims.iss !== profile.issuerUrl) {
      return yield* Effect.fail(
        new BackendAuthenticationError({
          route,
          reason: "invalid_issuer",
          message: `JWT issuer "${String(claims.iss)}" does not match the configured issuer`
        })
      );
    }

    if (!audienceMatches(claims.aud, profile.audience)) {
      return yield* Effect.fail(
        new BackendAuthenticationError({
          route,
          reason: "invalid_audience",
          message: `JWT audience does not match the configured audience "${profile.audience}"`
        })
      );
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp === "number" && now > claims.exp + profile.clockToleranceSeconds) {
      return yield* Effect.fail(
        new BackendAuthenticationError({
          route,
          reason: "expired_token",
          message: "JWT is expired"
        })
      );
    }

    if (typeof claims.nbf === "number" && now + profile.clockToleranceSeconds < claims.nbf) {
      return yield* Effect.fail(
        new BackendAuthenticationError({
          route,
          reason: "invalid_token",
          message: "JWT is not yet valid"
        })
      );
    }

    return claims;
  });
}

export function parseBearerToken(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const [scheme, token, ...rest] = value.trim().split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token || rest.length > 0) {
    return undefined;
  }

  return token;
}

export function readStringArrayClaim(claims: BackendJwtClaims, claimName: "roles" | "permissions"): readonly string[] {
  const namespacedValue = claims[`${authClaimsNamespace}/${claimName}`];
  const standardValue = claims[claimName];
  return normalizeStringArray(namespacedValue ?? standardValue);
}

function verifyJwtSignature(
  signingInput: string,
  signature: string,
  jwk: JsonWebKey
): Effect.Effect<boolean, BackendAuthenticationError> {
  return Effect.try({
    try: () => {
      const key = createPublicKey({ key: jwk, format: "jwk" });
      return verify("RSA-SHA256", Buffer.from(signingInput), key, base64UrlToBuffer(signature));
    },
    catch: (error) =>
      new BackendAuthenticationError({
        route: "JWT signature verification",
        reason: "invalid_token",
        message: `JWT signature verification could not be completed: ${toErrorMessage(error)}`
      })
  });
}

function parseJwt(token: string): {
  readonly header: JwtHeader;
  readonly payload: BackendJwtClaims;
  readonly signature: string;
  readonly signingInput: string;
} | undefined {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return undefined;
  }

  const [headerPart, payloadPart, signature] = parts;
  const header = parseJson<JwtHeader>(headerPart);
  const payload = parseJson<BackendJwtClaims>(payloadPart);
  if (!header || !payload) {
    return undefined;
  }

  return {
    header,
    payload,
    signature,
    signingInput: `${headerPart}.${payloadPart}`
  };
}

function normalizeStringArray(value: unknown): readonly string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => (typeof entry === "string" && entry.trim().length > 0 ? [entry.trim()] : []));
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }

  return [];
}

function audienceMatches(aud: unknown, expectedAudience: string): boolean {
  if (typeof aud === "string") {
    return aud === expectedAudience;
  }

  if (Array.isArray(aud)) {
    return aud.some((value) => value === expectedAudience);
  }

  return false;
}

function parseJson<T>(value: string): T | undefined {
  try {
    return JSON.parse(base64UrlDecode(value)) as T;
  } catch {
    return undefined;
  }
}

function base64UrlToBuffer(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

function base64UrlDecode(value: string): string {
  return base64UrlToBuffer(value).toString("utf8");
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
}
