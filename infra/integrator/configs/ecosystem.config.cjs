const { readFileSync, existsSync } = require("fs");
const { resolve, join } = require("path");

const APP_ROOT = resolve(__dirname);
const LOG_ROOT = process.env.CULTIV_LOG_ROOT || resolve(APP_ROOT, "..", "logs");

function loadDotenvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const entries = readFileSync(filePath, "utf-8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"));
  return Object.fromEntries(
    entries.map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
  );
}

const dotenv = loadDotenvFile(resolve(__dirname, ".env"));

const apiEnv = {
  NODE_ENV: "production",
  HOST: "127.0.0.1",
  PORT: "3001",
  SERVICE_NAME: "cultiv-api",
  APP_VERSION: "0.1.0",
  EXECUTION_MODE: "async",
  QUALITY_MODE: "balanced",
  DEFAULT_LANGUAGE: "pt-BR",
  BACKEND_TRUST_PROXY: "true",
  OUTBOX_RELAY_INTERVAL_MS: "1000",
  RATE_LIMIT_MAX_REQUESTS: "60",
  RATE_LIMIT_WINDOW_MS: "60000",
};

for (const [k, v] of Object.entries(dotenv)) {
  if (v !== undefined) apiEnv[k] = v;
}

module.exports = {
  apps: [
    {
      name: "cultiv-api",
      script: join(APP_ROOT, "apps/backend/dist/cli/main.js"),
      cwd: APP_ROOT,
      instances: 1,
      exec_mode: "fork",
      env: apiEnv,
      log_file: join(LOG_ROOT, "api-combined.log"),
      out_file: join(LOG_ROOT, "api-out.log"),
      err_file: join(LOG_ROOT, "api-err.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      max_memory_restart: "512M",
      restart_delay: 3000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
    },
    {
      name: "cultiv-worker",
      script: join(APP_ROOT, "apps/backend/dist/cli/worker-main.js"),
      cwd: APP_ROOT,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        EXECUTION_WORKER_CONCURRENCY: "2",
        ...dotenv,
      },
      log_file: join(LOG_ROOT, "worker-combined.log"),
      out_file: join(LOG_ROOT, "worker-out.log"),
      err_file: join(LOG_ROOT, "worker-err.log"),
      max_memory_restart: "512M",
      restart_delay: 3000,
      kill_timeout: 5000,
    },
  ],
};
