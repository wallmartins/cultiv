import { describe, expect, it } from "vitest";
import {
  consumeGeneratePrefill,
  mapLegacyContentTypeToIntent,
  resolveLegacyContentTypeId,
  storeGeneratePrefill
} from "../../apps/web/src/app/generation/lib/generate-prefill.js";

describe("generate prefill", () => {
  it("resolves legacy content type ids from intent and length tier", () => {
    expect(resolveLegacyContentTypeId("engage-audience", "long")).toBe("newsletter");
  });

  it("maps ambiguous linkedin-post prefill to share-idea short", () => {
    expect(mapLegacyContentTypeToIntent("linkedin-post")).toEqual({
      intent: "share-idea",
      scope: { lengthTier: "short" }
    });
  });

  it("stores and consumes validated prefill payloads from session storage", () => {
    const storage = new Map<string, string>();
    const sessionStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      }
    };

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { sessionStorage }
    });

    storeGeneratePrefill({
      intent: "tell-story",
      scope: { lengthTier: "medium" },
      briefing: { topic: "A turning point" },
      qualityMode: "balanced"
    });

    expect(consumeGeneratePrefill()).toEqual({
      intent: "tell-story",
      scope: { lengthTier: "medium" },
      briefing: { topic: "A turning point" },
      qualityMode: "balanced"
    });
    expect(consumeGeneratePrefill()).toBeNull();
  });

  it("returns null for invalid stored prefill payloads", () => {
    const storage = new Map<string, string>([
      ["cultiv.generate.prefill", JSON.stringify({ intent: "not-a-real-intent" })]
    ]);
    const sessionStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      }
    };

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { sessionStorage }
    });

    expect(consumeGeneratePrefill()).toBeNull();
  });
});
