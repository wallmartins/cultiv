// Site identity — name + bilingual title/description used by both the
// per-page `<title>`/meta (`LandingLayout`, `index.astro`) and the JSON-LD
// graph (`seo.ts`, which reads `SITE.name` + `SITE.pt.description`). Kept
// consistent with the existing `Layout.astro` meta (same descriptions —
// only the title changes, to the v5 slogan per the binding exceptions).
export const SITE = {
  name: "Cultiv",
  pt: {
    title: "Cultiv — Escreve como você pensa",
    description:
      "Um motor de escrita com IA que aprende como você pensa e argumenta — e escreve textos que só poderiam ser seus.",
  },
  en: {
    title: "Cultiv — Writes the way you think",
    description:
      "An AI writing engine that learns how you think and argue — and drafts what only you could have written.",
  },
} as const;
