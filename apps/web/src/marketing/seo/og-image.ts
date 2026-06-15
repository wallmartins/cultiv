import { BRAND_OG_IMAGE_PATH } from "../../brand/assets.js";

export const OG_IMAGE_PATH = BRAND_OG_IMAGE_PATH;
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export function getOgImageUrl(siteUrl: string): string {
  return `${siteUrl}${OG_IMAGE_PATH}`;
}
