import { sign, type KeyObject } from "node:crypto";
import { authClaimsNamespace, testAuthAudience, testAuthIssuerUrl, testAuthKeyId } from "./constants.js";
import { createLocalDevAuthKeyPair } from "./dev-local-auth-keys.js";

interface JsonWebKey {
  readonly kty?: string;
  readonly n?: string;
  readonly e?: string;
  readonly kid?: string;
  readonly alg?: string;
  readonly use?: string;
  readonly [key: string]: string | undefined;
}

export interface BackendTestAuthProfile {
  readonly issuerUrl: string;
  readonly audience: string;
  readonly jwksUrl: string;
  readonly jwksCacheTtlMs: number;
  readonly clockToleranceSeconds: number;
  readonly keyId: string;
}

export interface BackendTestAuthorizationHeaderOptions {
  readonly userId: string;
  readonly roles?: readonly string[];
  readonly permissions?: readonly string[];
  readonly issuedAt?: Date;
  readonly expiresAt?: Date;
  readonly notBefore?: Date;
  readonly subject?: string;
}

let cachedTestAuthContext: {
  readonly keyPair: { readonly privateKey: KeyObject; readonly publicKey: KeyObject };
  readonly profile: BackendTestAuthProfile;
} | undefined;

export function getBackendTestAuthProfile(): BackendTestAuthProfile {
  return getBackendAuthContext().profile;
}

export function getBackendTestJwks(): { readonly keys: readonly JsonWebKey[] } {
  const context = getBackendAuthContext();
  const publicJwk = context.keyPair.publicKey.export({ format: "jwk" }) as JsonWebKey;
  return {
    keys: [
      {
        ...publicJwk,
        alg: "RS256",
        use: "sig",
        kid: context.profile.keyId
      }
    ]
  };
}

export function createBackendTestAuthorizationHeader(options: BackendTestAuthorizationHeaderOptions): string {
  return `Bearer ${createBackendTestAccessToken(options)}`;
}

export function createBackendTestAccessToken(options: BackendTestAuthorizationHeaderOptions): string {
  const context = getBackendAuthContext();
  const now = options.issuedAt ?? new Date();
  const issuedAt = Math.floor(now.getTime() / 1000);
  const notBefore = Math.floor((options.notBefore ?? now).getTime() / 1000);
  const expiresAt = Math.floor((options.expiresAt ?? new Date(now.getTime() + 60 * 60 * 1000)).getTime() / 1000);
  const payload: Record<string, unknown> = {
    iss: context.profile.issuerUrl,
    aud: context.profile.audience,
    sub: options.subject ?? options.userId,
    iat: issuedAt,
    nbf: notBefore,
    exp: expiresAt,
    scope: options.permissions?.join(" "),
    permissions: [...(options.permissions ?? [])],
    [`${authClaimsNamespace}/roles`]: [...(options.roles ?? [])],
    [`${authClaimsNamespace}/permissions`]: [...(options.permissions ?? [])]
  };

  return signJwt(payload);
}

function signJwt(payload: Record<string, unknown>): string {
  const context = getBackendAuthContext();
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: context.profile.keyId
  };
  const signingInput = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(payload)}`;
  const signature = sign("RSA-SHA256", Buffer.from(signingInput), context.keyPair.privateKey);
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

function base64UrlEncodeJson(value: Record<string, unknown>): string {
  return base64UrlEncode(Buffer.from(JSON.stringify(value)));
}

function base64UrlEncode(value: Buffer): string {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

function getBackendAuthContext() {
  if (cachedTestAuthContext) {
    return cachedTestAuthContext;
  }

  const keyPair = createLocalDevAuthKeyPair();
  const publicJwk = keyPair.publicKey.export({ format: "jwk" }) as JsonWebKey;
  const jwks = {
    keys: [
      {
        ...publicJwk,
        alg: "RS256",
        use: "sig",
        kid: testAuthKeyId
      }
    ]
  };
  const profile: BackendTestAuthProfile = {
    issuerUrl: testAuthIssuerUrl,
    audience: testAuthAudience,
    jwksUrl: `data:application/json,${encodeURIComponent(JSON.stringify(jwks))}`,
    jwksCacheTtlMs: 5 * 60 * 1000,
    clockToleranceSeconds: 60,
    keyId: testAuthKeyId
  };

  cachedTestAuthContext = { keyPair, profile };
  return cachedTestAuthContext;
}
