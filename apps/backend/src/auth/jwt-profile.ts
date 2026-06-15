import type { BackendConfig } from "../config/config.js";
import { BackendAuthenticationError } from "../http/errors.js";
import { getBackendTestAuthProfile } from "./test-auth.js";
import type { BackendAuthProfile } from "./jwt-types.js";

export function resolveBackendAuthProfile(config: BackendConfig): BackendAuthProfile {
  const testProfile = getBackendTestAuthProfile();
  if (config.environment === "production") {
    return {
      issuerUrl: requireString(config.authIssuerUrl, "AUTH_ISSUER_URL"),
      audience: requireString(config.authAudience, "AUTH_AUDIENCE"),
      jwksUrl: requireString(config.authJwksUrl, "AUTH_JWKS_URL"),
      clockToleranceSeconds: config.authClockToleranceSeconds ?? testProfile.clockToleranceSeconds,
      jwksCacheTtlMs: config.authJwksCacheTtlMs ?? testProfile.jwksCacheTtlMs
    };
  }

  return {
    issuerUrl: config.authIssuerUrl ?? testProfile.issuerUrl,
    audience: config.authAudience ?? testProfile.audience,
    jwksUrl: config.authJwksUrl ?? testProfile.jwksUrl,
    clockToleranceSeconds: config.authClockToleranceSeconds ?? testProfile.clockToleranceSeconds,
    jwksCacheTtlMs: config.authJwksCacheTtlMs ?? testProfile.jwksCacheTtlMs
  };
}

function requireString(value: string | undefined, envName: string): string {
  if (!value || value.trim().length === 0) {
    throw new BackendAuthenticationError({
      route: "backend auth profile bootstrap",
      reason: "invalid_configuration",
      message: `${envName} is required in production auth configuration`
    });
  }

  return value;
}
