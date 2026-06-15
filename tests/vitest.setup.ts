import { config as loadDotEnv } from "dotenv";

loadDotEnv({ quiet: true });
process.env.BACKEND_ALLOW_IN_MEMORY_RUNTIME ??= "true";
process.env.WAITLIST_ALLOW_IN_MEMORY_RATE_LIMIT ??= "true";
process.env.RUN_DURABLE_RUNTIME_TESTS =
  process.env.VITEST_DURABLE_SUITE === "true" ? "true" : "false";
