export const BRAND_NAME = "Cultiv";

export const BRAND_ICON_PATH = "/cultiv-compass-mark.svg";
export const BRAND_WORDMARK_PATH = "/cultiv-compass-mark.svg";
export const BRAND_WORDMARK_DARK_PATH = "/cultiv-compass-mark.svg";
export const BRAND_LOGO_FULL_PATH = "/cultiv-og-cartography.svg";
export const BRAND_OG_IMAGE_PATH = "/cultiv-og-cartography.svg";

export function getBrandIconUrl(siteUrl: string): string {
  return `${siteUrl}${BRAND_ICON_PATH}`;
}

export function getBrandWordmarkUrl(siteUrl: string, dark = false): string {
  return `${siteUrl}${dark ? BRAND_WORDMARK_DARK_PATH : BRAND_WORDMARK_PATH}`;
}
