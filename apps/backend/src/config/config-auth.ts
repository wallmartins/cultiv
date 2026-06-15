export interface BackendAuthConfig {
  readonly authIssuerUrl?: string;
  readonly authAudience?: string;
  readonly authJwksUrl?: string;
  readonly authClockToleranceSeconds?: number;
  readonly authJwksCacheTtlMs?: number;
}

export interface ReadBackendAuthConfigInput {
  readonly AUTH_ISSUER_URL?: string;
  readonly AUTH_AUDIENCE?: string;
  readonly AUTH_JWKS_URL?: string;
  readonly AUTH_CLOCK_TOLERANCE_SECONDS?: string;
  readonly AUTH_JWKS_CACHE_TTL_MS?: string;
  readonly NODE_ENV?: string;
}

export function readBackendAuthConfig(envVars: ReadBackendAuthConfigInput): BackendAuthConfig {
  return {
    authIssuerUrl: normalizeIssuerUrl(readOptionalString(envVars.AUTH_ISSUER_URL)),
    authAudience: readOptionalString(envVars.AUTH_AUDIENCE),
    authJwksUrl: readOptionalString(envVars.AUTH_JWKS_URL),
    authClockToleranceSeconds: readPositiveInteger(envVars.AUTH_CLOCK_TOLERANCE_SECONDS),
    authJwksCacheTtlMs: readPositiveInteger(envVars.AUTH_JWKS_CACHE_TTL_MS)
  };
}

export function validateBackendAuthConfig(args: {
  readonly config: BackendAuthConfig;
  readonly environment: "development" | "production" | "test";
  readonly envVars: ReadBackendAuthConfigInput;
}): string[] {
  const issues: string[] = [];

  if (args.envVars.AUTH_ISSUER_URL && !isValidUrl(args.envVars.AUTH_ISSUER_URL)) {
    issues.push("AUTH_ISSUER_URL must be a valid URL");
  }

  if (args.envVars.AUTH_JWKS_URL && !isValidUrl(args.envVars.AUTH_JWKS_URL)) {
    issues.push("AUTH_JWKS_URL must be a valid URL");
  }

  if (args.environment === "production") {
    if (!args.config.authIssuerUrl) {
      issues.push("AUTH_ISSUER_URL is required in production");
    }

    if (!args.config.authAudience) {
      issues.push("AUTH_AUDIENCE is required in production");
    }

    if (!args.config.authJwksUrl) {
      issues.push("AUTH_JWKS_URL is required in production");
    }
  }

  return issues;
}

function readOptionalString(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readPositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** Auth0 JWT `iss` claim includes a trailing slash. */
function normalizeIssuerUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const withProtocol = value.includes("://") ? value : `https://${value}`;
  const parsed = new URL(withProtocol);
  return `${parsed.origin}/`;
}
