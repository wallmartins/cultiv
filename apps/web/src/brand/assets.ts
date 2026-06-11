export const BRAND_ICON_PATH = "/cultiv-icon.svg";
export const BRAND_WORDMARK_PATH = "/cultiv-logo-wordmark.svg";
export const BRAND_WORDMARK_DARK_PATH = "/cultiv-logo-dark.svg";
export const BRAND_LOGO_FULL_PATH = "/cultiv-logo-full.svg";
export const BRAND_OG_IMAGE_PATH = "/cultiv-og.svg";

export function getBrandIconUrl(siteUrl: string): string {
  return `${siteUrl}${BRAND_ICON_PATH}`;
}

export function getBrandWordmarkUrl(siteUrl: string, dark = false): string {
  return `${siteUrl}${dark ? BRAND_WORDMARK_DARK_PATH : BRAND_WORDMARK_PATH}`;
}
