export const BRAND_NAME = "Cultiv";

export const BRAND_ICON_PATH = "/cultiv-compass.svg";
export const BRAND_WORDMARK_PATH = "/cultiv-press-mark.svg";
export const BRAND_WORDMARK_DARK_PATH = "/cultiv-press-mark.svg";
export const BRAND_LOGO_FULL_PATH = "/cultiv-og-imprint.svg";
export const BRAND_OG_IMAGE_PATH = "/cultiv-og-imprint.svg";

export function getBrandIconUrl(siteUrl: string): string {
  return `${siteUrl}${BRAND_ICON_PATH}`;
}

export function getBrandWordmarkUrl(siteUrl: string, dark = false): string {
  return `${siteUrl}${dark ? BRAND_WORDMARK_DARK_PATH : BRAND_WORDMARK_PATH}`;
}
