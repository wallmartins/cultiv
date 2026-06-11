import { BRAND_ICON_PATH, BRAND_OG_IMAGE_PATH } from "./assets.js";

export function brandHeadLinks() {
  return [
    { rel: "icon", type: "image/svg+xml", href: BRAND_ICON_PATH },
    { rel: "apple-touch-icon", href: BRAND_ICON_PATH },
    { rel: "mask-icon", href: BRAND_ICON_PATH, color: "#243830" }
  ] as const;
}

export { BRAND_OG_IMAGE_PATH };
