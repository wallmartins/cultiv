export const blogTags = [
  { slug: "voice", label: { pt: "Voz", en: "Voice" } },
  { slug: "product", label: { pt: "Produto", en: "Product" } },
  { slug: "writing", label: { pt: "Escrita", en: "Writing" } }
] as const;

export type BlogTagSlug = (typeof blogTags)[number]["slug"];

export const blogTagSlugs = blogTags.map((tag) => tag.slug);

export function getBlogTag(slug: string) {
  return blogTags.find((tag) => tag.slug === slug);
}

export function getBlogTagLabel(slug: BlogTagSlug, locale: "pt" | "en") {
  return getBlogTag(slug)?.label[locale] ?? slug;
}
