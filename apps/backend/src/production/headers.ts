import type { BackendConfig } from "../config/config.js";

const DEV_DEFAULT_CORS_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000"
] as const;

export function getSecurityHeaders(isProductionStrict: boolean): Readonly<Record<string, string>> {
  if (!isProductionStrict) {
    return {};
  }

  return {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "x-robots-tag": "noindex, nofollow",
    "strict-transport-security": "max-age=31536000; includeSubDomains"
  };
}

export function isCorsOriginAllowed(
  config: BackendConfig,
  origin: string,
  isProductionStrict: boolean
): boolean {
  const configured = config.corsAllowedOrigins ?? [];
  if (configured.length > 0) {
    return configured.includes(origin);
  }

  if (!isProductionStrict) {
    return DEV_DEFAULT_CORS_ORIGINS.includes(origin as (typeof DEV_DEFAULT_CORS_ORIGINS)[number]);
  }

  return false;
}

export function getCorsHeaders(
  isProductionStrict: boolean,
  config: BackendConfig,
  origin: string | undefined
): Readonly<Record<string, string>> {
  if (!origin || !isCorsOriginAllowed(config, origin, isProductionStrict)) {
    return {};
  }

  return {
    "access-control-allow-origin": origin,
    vary: "Origin",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-headers": "authorization,content-type,x-requested-with",
    "access-control-max-age": "86400"
  };
}
