import { BRAND_ICON_PATH, BRAND_OG_IMAGE_PATH } from "./assets.js";

const GOOGLE_FONTS_BASE = "https://fonts.googleapis.com/css2";

export const GOOGLE_FONTS_CRITICAL_STYLESHEET =
  `${GOOGLE_FONTS_BASE}?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600&display=swap`;

export const GOOGLE_FONTS_DEFERRED_STYLESHEET =
  `${GOOGLE_FONTS_BASE}?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=JetBrains+Mono:wght@400;500&display=swap`;

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
    { rel: "mask-icon", href: BRAND_ICON_PATH, color: "#1A1A18" }
  ] as const;
}

export { BRAND_OG_IMAGE_PATH };
