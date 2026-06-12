import { BRAND_ICON_PATH, BRAND_OG_IMAGE_PATH } from "./assets.js";

const GOOGLE_FONTS_BASE = "https://fonts.googleapis.com/css2";

export const GOOGLE_FONTS_CRITICAL_STYLESHEET = `${GOOGLE_FONTS_BASE}?family=Caveat:wght@400;500;600&family=Inter:wght@400;500;600&display=swap`;

export const GOOGLE_FONTS_DEFERRED_STYLESHEET = `${GOOGLE_FONTS_BASE}?family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;1,400&display=swap`;

export const googleFontsAsyncScript = `(function(){
  var critical=${JSON.stringify(GOOGLE_FONTS_CRITICAL_STYLESHEET)};
  var deferred=${JSON.stringify(GOOGLE_FONTS_DEFERRED_STYLESHEET)};
  function addStylesheet(href){
    var link=document.createElement("link");
    link.rel="stylesheet";
    link.href=href;
    document.head.appendChild(link);
  }
  addStylesheet(critical);
  var schedule=window.requestIdleCallback||function(cb){setTimeout(cb,1);};
  schedule(function(){addStylesheet(deferred);});
})();`;

export function brandHeadLinks() {
  return [
    { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
    { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous" as const
    },
    { rel: "icon", type: "image/svg+xml", href: BRAND_ICON_PATH },
    { rel: "apple-touch-icon", href: BRAND_ICON_PATH },
    { rel: "mask-icon", href: BRAND_ICON_PATH, color: "#243830" }
  ] as const;
}

export { BRAND_OG_IMAGE_PATH };
