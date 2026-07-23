import { Effect } from "effect";
import { decodeExecutionStatusView } from "@my-ai-orchestrator/contracts";
import type { GenerationChannel } from "@my-ai-orchestrator/contracts";
import { createBackendApp } from "../../apps/backend";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import { createBackendTestAuthorizationHeader } from "../../apps/backend/src/auth/index.js";
import { buildVoiceProfileSnapshotId } from "../../apps/backend/src/product/voice/voice-resolution-helpers.js";

export const backendAppTestStartedAt = new Date("2026-05-11T00:00:00.000Z");
export const backendAppTestNow = new Date("2026-05-11T00:00:05.000Z");

export const voiceProfileSnapshotIdPattern = /^vps:[a-f0-9]{32}$/;

export function expectedVoiceProfileSnapshotId(
  userId: string,
  profileVersion: number,
  channel: GenerationChannel,
  at: Date = backendAppTestStartedAt
): string {
  return buildVoiceProfileSnapshotId(userId, profileVersion, channel, at);
}

export const backendAppBaseConfig: BackendConfig = {
  environment: "test",
  executionMode: "sync",
  qualityMode: "balanced",
  defaultLanguage: "pt-BR",
  serviceName: "backend",
  host: "127.0.0.1",
  port: 3000,
  version: "0.1.0"
};

export function createBackendAppTestConfig(overrides: Partial<BackendConfig> = {}): BackendConfig {
  return {
    ...backendAppBaseConfig,
    ...overrides
  };
}

export function createBackendAppTestServices(config: BackendConfig) {
  return Effect.runSync(createBackendProductServices(config, { now: () => backendAppTestStartedAt }));
}

export function seedExecutionVoiceState(
  services: ReturnType<typeof createBackendAppTestServices>,
  userId = "user_1"
) {
  Effect.runSync(services.voiceConsent.grantConsent(userId));

  Effect.runSync(
    services.database.voiceProfiles.put({
      id: `voice-profile:${userId}`,
      userId,
      version: 2,
      snapshotId: `voice-profile-snapshot:${userId}:v2`,
      confidence: "high",
      primaryLanguage: "pt-BR",
      tone: "direct",
      cadence: "balanced",
      description: "Voice consistent for execution.",
      lexicon: ["produto", "opiniao"],
      constraints: ["preserve user voice"],
      styleMarkers: ["short paragraphs"],
      rules: ["prefer direct openings"],
      antiPatterns: ["generic intro"],
      createdAt: backendAppTestStartedAt.toISOString(),
      updatedAt: backendAppTestStartedAt.toISOString()
    })
  );

  Effect.runSync(
    services.database.voiceProfileDiagnostics.put({
      id: `voice-diagnostics:${userId}`,
      userId,
      activeVersion: 2,
      updating: false,
      reasonCodes: [],
      nextActionCodes: [],
      bestCoveredContentTypes: [],
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
        byContentType: { "linkedin-post": 1 },
        byLanguage: { "pt-BR": 1 }
      },
      summary: "Ready",
      createdAt: backendAppTestStartedAt.toISOString(),
      updatedAt: backendAppTestStartedAt.toISOString()
    })
  );
}

export function seedBillingSubscription(
  services: ReturnType<typeof createBackendAppTestServices>,
  userId: string,
  planId: "criador" | "explorador" | "profissional" = "criador"
) {
  services.billing.upsertSubscription({
    id: `${userId}:${planId}:subscription`,
    userId,
    planId,
    status: "active",
    startedAt: backendAppTestStartedAt.toISOString()
  });

  Effect.runPromise(
    services.billing.startCycle({
      userId,
      planId,
      cycleId: `${userId}:${planId}:cycle:test`,
      idempotencyKey: `test:${userId}:${planId}:cycle`
    })
  );
}

// ADR 0006 removed the "free" plan id from the canonical catalog, but the fast-only tier
// (BillingPlanTier "free" in quality-mode-entitlements.ts) is still a real gate to cover —
// register it as a local fixture plan instead of reintroducing it into DEFAULT_BILLING_PLANS.
export function registerLegacyFreeTierPlan(services: ReturnType<typeof createBackendAppTestServices>) {
  Effect.runSync(
    services.billing.registerPlan({
      id: "free",
      tier: "free",
      name: "Free (fixture)",
      monthlyCredits: 20,
      features: [{ key: "execution.sync_mode", enabled: true }],
      // espelha o que registerBackendBillingPlans() aplica: pseudo-modelos backend-* + os modelos
      // realmente roteados pela policy ativa (ADR 0009)
      allowedModels: [
        "backend-fast",
        "backend-balanced",
        "backend-strict",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
        "llama-3.3-70b-versatile"
      ]
    })
  );
}

export function createBackendAppTestApp(
  config: BackendConfig,
  services: NonNullable<Parameters<typeof createBackendApp>[1]>["services"]
) {
  const app = createBackendApp(config, {
    startedAt: backendAppTestStartedAt,
    now: () => backendAppTestNow,
    services
  });

  const originalRequest = app.request.bind(app);
  app.request = (async (input: Parameters<typeof app.request>[0], init?: Parameters<typeof app.request>[1]) => {
    const headers = new Headers(init?.headers ?? undefined);
    const route = typeof input === "string" ? input : input.toString();

    if (headers.has("authorization")) {
      if (!route.startsWith("/api/internal")) {
        const authorizedUserId = parseUserIdFromAuthorizationHeader(headers.get("authorization"));
        if (authorizedUserId) {
          ensureTestApplicationUser(services, authorizedUserId);
        }
      }
    } else {
      if (route.startsWith("/api/internal")) {
        const rawOperatorId = headers.get("x-backend-user-id")?.trim();
        const permissions = splitCsvHeader(headers.get("x-backend-permissions"));
        const roles = splitCsvHeader(headers.get("x-backend-roles") ?? headers.get("x-backend-role"));
        if (!rawOperatorId && permissions.length === 0 && roles.length === 0) {
          return originalRequest(input, {
            ...init,
            headers
          });
        }

        const operatorId = rawOperatorId || "operator_1";
        ensureTestOperator(services, operatorId, permissions, roles);
        headers.set(
          "authorization",
          createBackendTestAuthorizationHeader({
            userId: operatorId,
            permissions,
            roles
          })
        );
      } else {
        const userId = resolveTestAuthUserId(init?.body);
        ensureTestApplicationUser(services, userId);
        headers.set(
          "authorization",
          createBackendTestAuthorizationHeader({
            userId
          })
        );
      }
    }

    return originalRequest(input, {
      ...init,
      headers
    });
  }) as typeof app.request;

  return app;
}

function resolveTestAuthUserId(body: BodyInit | null | undefined): string {
  const userIdFromBody = parseUserIdFromJsonBody(body);
  if (userIdFromBody) {
    return userIdFromBody;
  }

  return "user_1";
}

function ensureTestApplicationUser(
  services: NonNullable<Parameters<typeof createBackendApp>[1]>["services"],
  userId: string
) {
  const existing = Effect.runSync(services.users.findByExternalSubject(userId));
  if (existing) {
    return existing;
  }

  return Effect.runSync(
    services.users.create({
      id: userId,
      externalSubject: userId,
      status: "active"
    })
  );
}

function ensureTestOperator(
  services: NonNullable<Parameters<typeof createBackendApp>[1]>["services"],
  operatorId: string,
  permissions: readonly string[],
  roles: readonly string[]
) {
  const existing = Effect.runSync(services.operators.findById(operatorId));
  if (existing) {
    return existing;
  }

  return Effect.runSync(
    services.operators.create({
      id: operatorId,
      permissions,
      roles,
      status: "active"
    })
  );
}

function splitCsvHeader(value: string | null): readonly string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseUserIdFromJsonBody(body: BodyInit | null | undefined): string | undefined {
  if (typeof body !== "string") {
    return undefined;
  }

  try {
    const parsed = JSON.parse(body) as { readonly userId?: unknown };
    if (typeof parsed.userId === "string" && parsed.userId.trim().length > 0) {
      return parsed.userId;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function parseUserIdFromAuthorizationHeader(header: string | null): string | undefined {
  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }

  const token = header.slice("Bearer ".length).trim();
  const segments = token.split(".");
  if (segments.length < 2 || !segments[1]) {
    return undefined;
  }

  try {
    const payload = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8")) as { readonly sub?: unknown };
    return typeof payload.sub === "string" && payload.sub.trim().length > 0 ? payload.sub : undefined;
  } catch {
    return undefined;
  }
}

export async function waitForJobStatus(
  app: ReturnType<typeof createBackendApp>,
  jobId: string,
  expected: string,
  userId = "user_1"
) {
  const headers = {
    authorization: createBackendTestAuthorizationHeader({ userId })
  };

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await app.request(`/me/executions/${jobId}`, { headers });
    const body = await response.json();
    const decoded = await Effect.runPromise(decodeExecutionStatusView(body));
    if (decoded.status === expected) {
      return decoded;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  const finalResponse = await app.request(`/me/executions/${jobId}`, { headers });
  const finalBody = await finalResponse.json();
  return Effect.runPromise(decodeExecutionStatusView(finalBody));
}
