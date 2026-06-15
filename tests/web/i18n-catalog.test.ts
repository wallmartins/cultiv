import { describe, expect, it } from "vitest";
import { en } from "../../apps/web/src/i18n/marketing/locales/en.js";
import { pt } from "../../apps/web/src/i18n/marketing/locales/pt.js";

function collectKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    collectKeys(nested, prefix ? `${prefix}.${key}` : key)
  );
}

describe("marketing locale catalogs", () => {
  it("keeps matching namespace keys between pt and en", () => {
    const ptKeys = collectKeys(pt).sort();
    const enKeys = collectKeys(en).sort();

    expect(ptKeys).toEqual(enKeys);
  });

  it("defines at least four FAQ entries per locale", () => {
    expect(pt.faq.items.length).toBeGreaterThanOrEqual(4);
    expect(en.faq.items.length).toBeGreaterThanOrEqual(4);
  });
});
