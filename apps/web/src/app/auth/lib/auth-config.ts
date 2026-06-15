import { resolveApiBaseUrl } from "~/marketing/seo/site-url";

export interface WebAuthConfig {
  readonly domain: string;
  readonly clientId: string;
  readonly audience: string;
  readonly apiBaseUrl: string;
}

export function readWebAuthConfig(): WebAuthConfig | null {
  const domain = normalizeAuth0Domain(readEnv("VITE_AUTH0_DOMAIN"));
  const clientId = readEnv("VITE_AUTH0_CLIENT_ID");
  const audience = readEnv("VITE_AUTH0_AUDIENCE");

  if (!domain || !clientId || !audience) {
    return null;
  }

  return { domain, clientId, audience, apiBaseUrl: resolveApiBaseUrl() };
}

export function isWebAuthConfigured(): boolean {
  return readWebAuthConfig() !== null;
}

export function getAuthCallbackUrl(): string {
  if (typeof window === "undefined") {
    return "/callback";
  }

  return `${window.location.origin}/callback`;
}

function readEnv(key: string): string | undefined {
  const value = import.meta.env[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Auth0 React SDK expects host only (no `https://`). */
function normalizeAuth0Domain(domain: string | undefined): string | undefined {
  if (!domain) {
    return undefined;
  }

  return domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
