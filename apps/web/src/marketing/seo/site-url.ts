const DEFAULT_SITE_URL = "https://www.cultiv.app";

export function getSiteUrl(): string {
  const configured = readConfiguredSiteUrl();
  if (!configured) {
    return DEFAULT_SITE_URL;
  }

  return normalizeSiteUrl(configured);
}

/** Public API Surface base URL for client-sdk. */
export function resolveApiBaseUrl(): string {
  const apiBaseUrl = readApiBaseUrlFromImportMeta();
  if (apiBaseUrl) {
    return normalizeSiteUrl(apiBaseUrl);
  }

  const siteUrl = readSiteUrlFromImportMeta() ?? readConfiguredSiteUrl();
  if (siteUrl) {
    return normalizeSiteUrl(siteUrl);
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return DEFAULT_SITE_URL;
}

function readConfiguredSiteUrl(): string | undefined {
  const configured = process.env.SITE_URL ?? process.env.VERCEL_URL;
  if (!configured || configured.trim().length === 0) {
    return undefined;
  }

  return configured.trim();
}

function readSiteUrlFromImportMeta(): string | undefined {
  return readImportMetaEnv("SITE_URL");
}

function readApiBaseUrlFromImportMeta(): string | undefined {
  return readImportMetaEnv("VITE_API_BASE_URL");
}

function readImportMetaEnv(key: "SITE_URL" | "VITE_API_BASE_URL"): string | undefined {
  const value = import.meta.env[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeSiteUrl(configured: string): string {
  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return configured.replace(/\/$/, "");
  }

  return `https://${configured.replace(/\/$/, "")}`;
}
