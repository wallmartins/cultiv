/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeFormatters, messagesFor, APP_LOCALES, isAppLocale, type AppLocale } from "@my-ai-orchestrator/ui/app/i18n";
import { languageFromNavigator, resolveInitialUiLanguage } from "@my-ai-orchestrator/shared";

// This repo's jsdom build ships without window.localStorage, so each test installs its own.
function useStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear()
    }
  });
}

afterEach(() => {
  Reflect.deleteProperty(window, "localStorage");
  vi.unstubAllGlobals();
});

describe("locale resolution", () => {
  it("honours a language already chosen on the landing page", () => {
    useStorage({ "cultiv-lang": "en" });
    expect(resolveInitialUiLanguage()).toBe("en");
    useStorage({ "cultiv-lang": "pt" });
    expect(resolveInitialUiLanguage()).toBe("pt-BR");
  });

  it("falls back to the browser language when nothing was chosen", () => {
    expect(languageFromNavigator("pt-BR")).toBe("pt-BR");
    expect(languageFromNavigator("pt")).toBe("pt-BR");
    expect(languageFromNavigator("en-US")).toBe("en");
    expect(languageFromNavigator("fr-FR")).toBe("en");
    // The old store hardcoded "pt-BR" here regardless of the browser.
    expect(languageFromNavigator(undefined)).toBe("en");
  });

  it("survives localStorage throwing (Safari private mode)", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error("denied");
        }
      }
    });
    expect(resolveInitialUiLanguage()).toBe("pt-BR");
  });
});

// Prices must read identically to apps/landing for the same plan, and the currency toggle is
// independent of UI language — so formatting follows the CURRENCY, not the reader's locale.
// Values are the real catalog (packages/payments/src/catalog-pricing.json), in units.
describe("currency formatting", () => {
  // Intl separates symbol and number with a non-breaking space.
  const money = (locale: AppLocale, value: number, currency: string) =>
    makeFormatters(locale, "agora").currency(value, currency).replace(/ /g, " ");

  it("matches the landing's convention for BRL and USD", () => {
    expect(money("pt-BR", 49, "BRL")).toBe("R$ 49");
    expect(money("pt-BR", 39.2, "BRL")).toBe("R$ 39,20");
    expect(money("pt-BR", 9, "USD")).toBe("$9");
    expect(money("pt-BR", 86.4, "USD")).toBe("$86.40");
  });

  it("formats a price the same way in either interface language", () => {
    for (const [value, currency] of [[49, "BRL"], [39.2, "BRL"], [9, "USD"], [86.4, "USD"]] as const) {
      expect(money("en", value, currency)).toBe(money("pt-BR", value, currency));
    }
  });

  it("groups thousands — the hand-rolled formatter it replaced rendered R$ 2390,40", () => {
    expect(money("pt-BR", 2390.4, "BRL")).toBe("R$ 2.390,40");
  });
});

describe("dictionaries", () => {
  it("exposes exactly the two supported locales", () => {
    expect([...APP_LOCALES]).toEqual(["pt-BR", "en"]);
    expect(isAppLocale("pt-BR")).toBe(true);
    expect(isAppLocale("es")).toBe(false);
  });

  it("resolves a distinct dictionary per locale", () => {
    expect(messagesFor("pt-BR").common.retry).toBe("Tentar de novo");
    expect(messagesFor("en").common.retry).toBe("Try again");
  });

  // TypeScript already enforces this at compile time (en is annotated AppMessages), but a runtime
  // walk also catches a leaf typed as a plain string in one locale and a function in the other.
  it("keeps pt-BR and en structurally identical", () => {
    const shapeOf = (value: unknown, path = ""): string[] => {
      if (typeof value === "function") return [`${path}:function`];
      if (value && typeof value === "object") {
        return Object.entries(value as Record<string, unknown>)
          .flatMap(([key, child]) => shapeOf(child, path ? `${path}.${key}` : key))
          .sort();
      }
      return [`${path}:${typeof value}`];
    };

    expect(shapeOf(messagesFor("en"))).toEqual(shapeOf(messagesFor("pt-BR")));
  });

  it("leaves no empty strings in either dictionary", () => {
    const emptyLeaves = (value: unknown, path = ""): string[] => {
      if (value && typeof value === "object") {
        return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
          emptyLeaves(child, path ? `${path}.${key}` : key)
        );
      }
      return typeof value === "string" && value.trim() === "" ? [path] : [];
    };

    for (const locale of APP_LOCALES as readonly AppLocale[]) {
      expect(emptyLeaves(messagesFor(locale))).toEqual([]);
    }
  });
});
