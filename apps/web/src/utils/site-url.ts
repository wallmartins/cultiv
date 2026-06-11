const DEFAULT_SITE_URL = "https://cultiv.app";

export function getSiteUrl(): string {
  const configured = process.env.SITE_URL ?? process.env.VERCEL_URL;
  if (!configured) {
    return DEFAULT_SITE_URL;
  }

  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return configured.replace(/\/$/, "");
  }

  return `https://${configured.replace(/\/$/, "")}`;
}
