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
process.env.RUN_POSTGRES_TESTS = "true";
process.env.VITEST_DURABLE_SUITE = "true";
process.env.BACKEND_ALLOW_IN_MEMORY_RUNTIME = "false";

const testFiles = [
  "tests/backend/durable-runtime.integration.test.ts",
  "tests/backend/billing-postgres-persistence.test.ts"
];

const extraArgs = process.argv.slice(2);

function runVitestFile(testFile) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["vitest", "run", testFile, ...extraArgs], {
      stdio: "inherit",
      env: process.env
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`vitest terminated by signal ${signal}`));
        return;
      }

      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`vitest exited with code ${code ?? 1}`));
    });
  });
}

try {
  for (const testFile of testFiles) {
    await runVitestFile(testFile);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
