import { BRAND_ICON_PATH, BRAND_OG_IMAGE_PATH } from "./assets.js";

export const GOOGLE_FONTS_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Caveat:wght@400;500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&display=swap";

export function brandHeadLinks() {
  return [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous" as const
    },
    { rel: "stylesheet", href: GOOGLE_FONTS_STYLESHEET },
    { rel: "icon", type: "image/svg+xml", href: BRAND_ICON_PATH },
    { rel: "apple-touch-icon", href: BRAND_ICON_PATH },
    { rel: "mask-icon", href: BRAND_ICON_PATH, color: "#243830" }
  ] as const;
}

export { BRAND_OG_IMAGE_PATH };
