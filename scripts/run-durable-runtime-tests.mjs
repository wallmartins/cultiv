import { spawn } from "node:child_process";
import { config as loadEnv } from "dotenv";

loadEnv({ quiet: true });

if (!process.env.BACKEND_TEST_DATABASE_URL) {
  console.error("BACKEND_TEST_DATABASE_URL is required to run durable runtime integration tests.");
  process.exit(1);
}

if (!process.env.REDIS_URL && !process.env.BACKEND_TEST_REDIS_URL) {
  console.error("REDIS_URL or BACKEND_TEST_REDIS_URL is required to run durable runtime integration tests.");
  process.exit(1);
}

process.env.RUN_DURABLE_RUNTIME_TESTS = "true";
process.env.VITEST_DURABLE_SUITE = "true";
process.env.BACKEND_ALLOW_IN_MEMORY_RUNTIME = "false";

const testFiles = ["tests/backend/durable-runtime.integration.test.ts", "tests/backend/durable-runtime-guard.test.ts"];

const child = spawn("pnpm", ["vitest", "run", ...testFiles, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
