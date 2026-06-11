import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "./og-image.js";

export function seo({
  title,
  description,
  url,
  locale,
  image,
  imageAlt
}: {
  readonly title: string;
  readonly description?: string;
  readonly url?: string;
  readonly locale?: string;
  readonly image?: string;
  readonly imageAlt?: string;
}) {
  const ogLocale = locale === "pt" ? "pt_BR" : locale === "en" ? "en_US" : undefined;
  const twitterCard = image ? "summary_large_image" : "summary";

  return [
    { title },
    ...(description ? [{ name: "description", content: description }] : []),
    { name: "og:type", content: "website" },
    { name: "og:title", content: title },
    ...(description ? [{ name: "og:description", content: description }] : []),
    ...(url ? [{ name: "og:url", content: url }] : []),
    ...(ogLocale ? [{ name: "og:locale", content: ogLocale }] : []),
    ...(image ? [{ name: "og:image", content: image }] : []),
    ...(image ? [{ name: "og:image:width", content: String(OG_IMAGE_WIDTH) }] : []),
    ...(image ? [{ name: "og:image:height", content: String(OG_IMAGE_HEIGHT) }] : []),
    ...(image && imageAlt ? [{ name: "og:image:alt", content: imageAlt }] : []),
    { name: "twitter:card", content: twitterCard },
    { name: "twitter:title", content: title },
    ...(description ? [{ name: "twitter:description", content: description }] : []),
    ...(image ? [{ name: "twitter:image", content: image }] : []),
    ...(image && imageAlt ? [{ name: "twitter:image:alt", content: imageAlt }] : [])
  ];
}
