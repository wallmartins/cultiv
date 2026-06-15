import { describe, expect, it } from "vitest";
import { MARKETING_CONTENT_TYPE_IDS } from "../../apps/web/src/marketing/content/content-types/catalog.js";
import {
  getContentTypeDescription,
  getContentTypeLabel,
  sortContentTypesByLabel
} from "../../apps/web/src/i18n/app/content-types.js";

describe("app content type copy", () => {
  it("defines product-friendly labels and descriptions for every catalog format", () => {
    for (const id of MARKETING_CONTENT_TYPE_IDS) {
      for (const locale of ["pt", "en"] as const) {
        const label = getContentTypeLabel(locale, id, "");
        const description = getContentTypeDescription(locale, id);

        expect(label.length).toBeGreaterThan(0);
        expect(description?.length ?? 0).toBeGreaterThan(20);
        expect(label.toLowerCase()).not.toContain("linkedin post");
        expect(label.toLowerCase()).not.toContain("validation post");
        expect(label.toLowerCase()).not.toContain("architecture post");
      }
    }
  });

  it("sorts catalog items by localized label", () => {
    const items = MARKETING_CONTENT_TYPE_IDS.map((id) => ({
      id,
      label: id
    }));

    const sorted = sortContentTypesByLabel("pt", items).map((item) =>
      getContentTypeLabel("pt", item.id, item.label)
    );

    expect(sorted).toEqual([
      "Artigo aprofundado",
      "Edição de newsletter",
      "Explicar uma decisão",
      "Publicação profissional",
      "Sequência de posts",
      "Teste de ideia"
    ]);
  });
});
