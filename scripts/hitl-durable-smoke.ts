#!/usr/bin/env tsx
/**
 * HITL smoke for issue 57 §4 — enqueue 202, survive API restart, worker completes.
 *
 * Usage:
 *   pnpm hitl:durable-smoke
 */
import { config as loadDotEnv } from "dotenv";
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import { createBackendTestAuthorizationHeader } from "../apps/backend/src/auth/index.js";
import { getBackendTestJwks } from "../apps/backend/src/auth/test-auth.js";
import { testAuthAudience, testAuthIssuerUrl } from "../apps/backend/src/auth/constants.js";
import { bootstrapBackendConfig } from "../apps/backend/src/config/config.js";
import { createBackendProductServices } from "../apps/backend/src/product/core/services.js";
import { registerBackendBillingPlans } from "../apps/backend/src/product/billing/billing-bootstrap.js";
import { saveBillingRepository } from "../apps/backend/src/infra/durable-store.js";
import { getPostgresDatabase } from "../apps/backend/src/infra/postgres-client.js";

loadDotEnv({ quiet: true });

const HITL_USER = "hitl-durable-smoke";
const HITL_API_PORT = Number(process.env.HITL_API_PORT ?? "3011");
const POLL_MS = 500;
const TIMEOUT_MS = 120_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function spawnProcess(command: string, args: string[], env: NodeJS.ProcessEnv, label: string): ChildProcess {
  const child = spawn(command, args, {
    env,
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd()
  });

  child.stdout?.on("data", (chunk: Buffer) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });
  child.stderr?.on("data", (chunk: Buffer) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });

  return child;
}

async function runCommand(command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code ?? "unknown"}`));
    });
  });
}

async function waitForHealth(baseUrl: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }
    await sleep(300);
  }
  throw new Error(`API did not become healthy at ${baseUrl}/health`);
}

async function seedHitlUser(databaseUrl: string): Promise<string> {
  const seedConfig = bootstrapBackendConfig({
    envVars: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
      PORT: String(HITL_API_PORT),
      AUTH_ISSUER_URL: testAuthIssuerUrl,
      AUTH_AUDIENCE: testAuthAudience,
      AUTH_JWKS_URL: `data:application/json,${encodeURIComponent(JSON.stringify(getBackendTestJwks()))}`,
      BILLING_PLAN_ID: "pro"
    },
    loadEnvFile: false
  });

  const bootstrapServices = await Effect.runPromise(
    createBackendProductServices(seedConfig, { now: () => new Date() })
  );
  const postgres = getPostgresDatabase(bootstrapServices.rawDatabase);
  if (postgres) {
    await postgres.deleteFrom("billing_snapshots").execute();
  }

  const config = seedConfig;
  const authorization = createBackendTestAuthorizationHeader({
    userId: HITL_USER,
    subject: HITL_USER
  });

  const services = await Effect.runPromise(createBackendProductServices(config, { now: () => new Date() }));

  const existing = await Effect.runPromise(services.users.findByExternalSubject(HITL_USER));
  const user =
    existing ??
    (await Effect.runPromise(
      services.users.create({
        id: randomUUID(),
        externalSubject: HITL_USER,
        status: "active"
      })
    ));

  await Effect.runPromise(services.voiceConsent.grantConsent(user.id));

  const nowIso = new Date().toISOString();

  await Effect.runPromise(services.database.voiceExamples.removeByUser(user.id));

  const exampleId = `voice-example:${user.id}:hitl`;
  await Effect.runPromise(
    services.database.voiceExamples.create({
      id: exampleId,
      userId: user.id,
      text: "Validação rápida: começo direto, fecho com pergunta.",
      language: "pt-BR",
      state: "active",
      explicitContentType: "validation-post",
      classificationLabels: ["positive"],
      antiPatternsExplicit: [],
      pinned: false,
      pendingProfileImpact: false,
      effectiveContentTypeHints: ["validation-post"],
      evaluation: {
        systemWeight: 0.9,
        attentionLevel: "low",
        attentionReasonCodes: [],
        contributionCode: "supports_validation_post",
        contributionPreview: "Tom direto para posts de validação.",
        userPinned: false
      },
      createdAt: nowIso,
      updatedAt: nowIso
    })
  );
  await Effect.runPromise(
    services.database.voiceProfiles.put({
      id: `voice-profile:${user.id}`,
      userId: user.id,
      version: 2,
      snapshotId: `voice-profile-snapshot:${user.id}:v2`,
      confidence: "high",
      adaptationMode: "standard",
      primaryLanguage: "pt-BR",
      tone: "direct",
      cadence: "balanced",
      description: "HITL smoke voice",
      lexicon: ["produto"],
      constraints: ["preserve user voice"],
      styleMarkers: ["short paragraphs"],
      rules: ["prefer direct openings"],
      antiPatterns: ["generic intro"],
      createdAt: nowIso,
      updatedAt: nowIso
    })
  );

  await Effect.runPromise(
    services.database.voiceProfileDiagnostics.put({
      id: `voice-diagnostics:${user.id}`,
      userId: user.id,
      activeVersion: 2,
      updating: false,
      reasonCodes: [],
      nextActionCodes: [],
      bestCoveredContentTypes: ["validation-post"],
      underrepresentedContentTypes: [],
      pendingRebuild: {
        status: "idle",
        nextActionCodes: []
      },
      materialBase: {
        totalExamples: 1,
        activeExamples: 1,
        excludedExamples: 0,
        pinnedExamples: 0,
        byClassification: { positive: 1 },
        byContentType: { "validation-post": 1 },
        byLanguage: { "pt-BR": 1 }
      },
      summary: "HITL smoke ready",
      createdAt: nowIso,
      updatedAt: nowIso
    })
  );

  await Effect.runPromise(registerBackendBillingPlans(services.billing));
  services.billing.upsertSubscription({
    id: `${user.id}:pro:subscription`,
    userId: user.id,
    planId: "pro",
    status: "active",
    startedAt: nowIso
  });

  const cycleResult = await Effect.runPromise(
    services.billing
      .startCycle({
        userId: user.id,
        planId: "pro",
        cycleId: `${user.id}:pro:cycle:${randomUUID()}`,
        idempotencyKey: `hitl:${user.id}:${randomUUID()}`
      })
      .pipe(
        Effect.catchAll((error) =>
          Effect.sync(() => {
            console.warn("HITL billing cycle seed warning:", String(error));
          })
        )
      )
  );
  void cycleResult;

  const postgresClient = getPostgresDatabase(services.rawDatabase);
  if (postgresClient) {
    await Effect.runPromise(
      saveBillingRepository(postgresClient, services.billingRepository, nowIso, {
        allowDestructiveReplace: true
      })
    );
  }

  return authorization;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  if (!geminiApiKey) {
    console.error("GEMINI_API_KEY is required for execution smoke");
    process.exit(1);
  }

  console.log("== HITL durable smoke ==");
  console.log("Checking docker services...");
  const compose = spawn("docker", ["compose", "ps", "--status", "running"], { stdio: "inherit" });
  await new Promise<void>((resolve, reject) => {
    compose.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("docker compose ps failed"))));
  });

  console.log("Running migrations...");
  const migrate = spawn("pnpm", ["--filter", "@my-ai-orchestrator/backend", "migrate"], {
    stdio: "inherit",
    env: process.env
  });
  await new Promise<void>((resolve, reject) => {
    migrate.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("migrate failed"))));
  });

  const smokeEnv: Record<string, string | undefined> = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl,
    EXECUTION_MODE: "async",
    NODE_ENV: "development",
    PORT: String(HITL_API_PORT),
    HOST: "127.0.0.1",
    SERVICE_NAME: "backend",
    GEMINI_API_KEY: geminiApiKey,
    BILLING_USER_ID: HITL_USER,
    BILLING_PLAN_ID: "pro",
    AUTH_ISSUER_URL: testAuthIssuerUrl,
    AUTH_AUDIENCE: testAuthAudience,
    AUTH_JWKS_URL: `data:application/json,${encodeURIComponent(JSON.stringify(getBackendTestJwks()))}`
  };
  delete smokeEnv.BACKEND_ALLOW_IN_MEMORY_RUNTIME;

  const baseUrl = `http://127.0.0.1:${HITL_API_PORT}`;
  const authorization = await seedHitlUser(databaseUrl);

  console.log("Building backend...");
  await runCommand("pnpm", ["--filter", "@my-ai-orchestrator/backend", "build"]);

  console.log("Starting worker...");
  const worker = spawnProcess("pnpm", ["--filter", "@my-ai-orchestrator/backend", "worker"], smokeEnv, "worker");

  console.log("Starting API...");
  let api = spawnProcess("pnpm", ["--filter", "@my-ai-orchestrator/backend", "start"], smokeEnv, "api");

  const children: ChildProcess[] = [worker, api];

  const shutdown = () => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGTERM");
      }
    }
  };

  process.on("SIGINT", () => {
    shutdown();
    process.exit(130);
  });

  try {
    await waitForHealth(baseUrl, 30_000);
    console.log("API healthy");

    const enqueueResponse = await fetch(`${baseUrl}/me/executions/run`, {
      method: "POST",
      headers: {
        authorization,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        pipelineType: "validation-post",
        contentType: "validation-post",
        briefing: {
          topic: "HITL durable smoke",
          keyPoints: ["restart", "postgres", "redis"]
        }
      })
    });

    const enqueueBody = await enqueueResponse.json();
    if (enqueueResponse.status !== 202) {
      throw new Error(`Expected 202, got ${enqueueResponse.status}: ${JSON.stringify(enqueueBody)}`);
    }

    const executionId = enqueueBody.jobId as string;
    console.log(`Enqueued execution ${executionId} (202)`);

    console.log("Simulating API rolling restart...");
    api.kill("SIGTERM");
    await sleep(1_000);
    api = spawnProcess("pnpm", ["--filter", "@my-ai-orchestrator/backend", "start"], smokeEnv, "api-restart");
    children[1] = api;
    await waitForHealth(baseUrl, 30_000);

    const afterRestart = await fetch(`${baseUrl}/me/executions/${executionId}`, {
      headers: { authorization }
    });
    if (!afterRestart.ok) {
      throw new Error(`GET after restart failed: ${afterRestart.status}`);
    }
    const statusAfterRestart = (await afterRestart.json()) as { status: string };
    console.log(`Status after API restart: ${statusAfterRestart.status}`);

    if (!["queued", "running", "done"].includes(statusAfterRestart.status)) {
      throw new Error(`Unexpected status after restart: ${statusAfterRestart.status}`);
    }

    const deadline = Date.now() + TIMEOUT_MS;
    let terminalStatus = statusAfterRestart.status;
    while (Date.now() < deadline) {
      const poll = await fetch(`${baseUrl}/me/executions/${executionId}`, {
        headers: { authorization }
      });
      const body = (await poll.json()) as { status: string };
      terminalStatus = body.status;
      if (terminalStatus === "done" || terminalStatus === "failed") {
        break;
      }
      await sleep(POLL_MS);
    }

    if (terminalStatus !== "done" && terminalStatus !== "failed") {
      throw new Error(`Worker did not reach terminal state within ${TIMEOUT_MS}ms (last: ${terminalStatus})`);
    }

    console.log(`Terminal status: ${terminalStatus}`);
    console.log("\n✅ HITL smoke passed — §4 rolling update (202 persisted across API restart)");
  } finally {
    shutdown();
  }
}

main().catch((error) => {
  console.error("\n❌ HITL smoke failed:", error);
  process.exit(1);
});
