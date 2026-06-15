import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ quiet: true });

if (!process.env.BACKEND_TEST_DATABASE_URL) {
  console.error("BACKEND_TEST_DATABASE_URL is required to run PostgreSQL integration tests.");
  process.exit(1);
}

process.env.RUN_POSTGRES_TESTS = "true";

const testsDirectory = "apps/backend/tests";
const testFiles = readdirSync(testsDirectory)
  .filter((file) => /^postgres-.*-repository\.test\.ts$/.test(file))
  .map((file) => join(testsDirectory, file))
  .sort();

if (testFiles.length === 0) {
  console.error("No PostgreSQL integration test files were found.");
  process.exit(1);
}

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
