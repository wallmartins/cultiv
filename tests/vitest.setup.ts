import "@testing-library/jest-dom/vitest";
import { config as loadDotEnv } from "dotenv";

loadDotEnv({ quiet: true });
process.env.BACKEND_ALLOW_IN_MEMORY_RUNTIME ??= "true";
process.env.RUN_DURABLE_RUNTIME_TESTS =
  process.env.VITEST_DURABLE_SUITE === "true" ? "true" : "false";

// jsdom doesn't implement window.scrollTo — TanStack Router's scroll-restoration calls it on
// every navigate(), and jsdom's "not implemented" throw otherwise breaks navigation mid-commit
// in any web test that drives a real route change (not just router.load()'s initial gate).
if (typeof window !== "undefined") {
  window.scrollTo = () => {};

  // This jsdom build ships without window.localStorage. zustand's persist middleware resolves the
  // storage once, at store-creation time (i.e. on import), so the polyfill has to exist before any
  // test module is imported — hence here rather than in a beforeAll.
  if (!window.localStorage) {
    const store = new Map<string, string>();
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
}
