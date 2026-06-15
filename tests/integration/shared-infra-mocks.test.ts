import { describe, expect, it } from "vitest";
import {
  createFeatureFlagRegistry,
  createFeatureFlagService
} from "../../packages/feature-flags/src/index.js";
import {
  createBillingRepository,
  createBillingService
} from "../../packages/payments/src/index.js";
import { Effect } from "effect";
import { createClientSdk } from "../../packages/client-sdk/src/index.js";

describe("shared infra with mocks", () => {
  it("combines feature flags, billing and typed sdk transport", async () => {
    const featureFlags = Effect.runSync(createFeatureFlagService({
      registry: Effect.runSync(createFeatureFlagRegistry([
        {
          key: "execution.sync_mode",
          scope: "execution",
          enabled: true,
          defaultVariant: "sync",
          variants: ["sync", "async"]
        }
      ]))
    }));

    const billing = createBillingService({
      repository: createBillingRepository({
        plans: [
          {
            id: "starter",
            tier: "free",
            name: "Starter",
            monthlyCredits: 50,
            dailyCredits: 10,
            features: [{ key: "execution.sync_mode", enabled: true }],
            allowedModels: ["gpt-4o-mini"]
          }
        ]
      }),
      gateway: {
        name: "mock",
        charge: () => Effect.succeed({
          gateway: "mock",
          status: "paid",
          transactionId: "tx_mock"
        })
      }
    });

    billing.upsertSubscription({
      id: "sub_1",
      userId: "user_1",
      planId: "starter",
      status: "active",
      startedAt: "2026-05-09T00:00:00.000Z"
    });

    expect(featureFlags.getVariant("execution.sync_mode")).toBe("sync");
    const entitlement = billing.getEntitlement("user_1", "starter");
    expect(entitlement?.monthlyCreditsRemaining).toBe(50);

    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const sdk = createClientSdk({
      baseUrl: "https://api.example.com",
      fetcher: async (url, init) => {
        calls.push({ url, init });
        return new Response(
          JSON.stringify({
            jobId: "job_1",
            status: "queued",
            contentType: "validation-post",
            estimatedSteps: 3,
            createdAt: "2026-05-09T00:00:00.000Z",
            voice: {
              voiceProfileConfidence: "high",
              voiceAdaptationMode: "standard",
              voiceProfileVersionUsed: 2,
              voiceProfileSnapshotId: "snap_1",
              usedFallbackVoiceProfile: false,
              appliedSignals: { styleMarkers: [], rules: [], antiPatterns: [] },
              pendingProfileRebuild: { status: "idle", nextActionCodes: [] }
            }
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        );
      }
    });

    const job = await Effect.runPromise(
      sdk.executions.create({
        contentType: "validation-post",
        briefing: "Teste de infra compartilhada"
      })
    );

    Effect.runSync(billing.consumeCredits("user_1", "starter", 5, "generation"));
    const updated = billing.getEntitlement("user_1", "starter");

    expect(job.status).toBe("queued");
    expect(calls[0]?.url).toBe("https://api.example.com/me/executions/run");
    expect(updated?.monthlyCreditsRemaining).toBe(45);
  });
});
