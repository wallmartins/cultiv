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
}
