export interface JsonWebKey {
  readonly kty?: string;
  readonly n?: string;
  readonly e?: string;
  readonly kid?: string;
  readonly alg?: string;
  readonly use?: string;
  readonly [key: string]: string | undefined;
}

export interface BackendAuthProfile {
  readonly issuerUrl: string;
  readonly audience: string;
  readonly jwksUrl: string;
  readonly clockToleranceSeconds: number;
  readonly jwksCacheTtlMs: number;
}

export interface BackendJwtClaims {
  readonly iss: unknown;
  readonly aud: unknown;
  readonly sub?: string;
  readonly exp?: number;
  readonly nbf?: number;
  readonly iat?: number;
  readonly scope?: string;
  readonly permissions?: unknown;
  readonly [claimKey: string]: unknown;
}

export type AuthenticatedBackendJwtClaims = BackendJwtClaims & { readonly sub: string };

export interface JwtHeader {
  readonly alg: string;
  readonly typ?: string;
  readonly kid?: string;
}

export interface BackendJwksSet {
  readonly keys: readonly JsonWebKey[];
}
