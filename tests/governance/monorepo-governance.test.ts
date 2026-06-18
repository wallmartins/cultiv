import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createCoreLayer, RuntimeConfigService } from "@my-ai-orchestrator/core";
import { createClientSdkLayer, createClientSdk, ClientSdkService } from "@my-ai-orchestrator/client-sdk";
import { buildOrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import { createBillingRepository, createBillingServiceLayer, BillingService } from "@my-ai-orchestrator/payments";
import { createDeclarativeSkillExecutor, createSkillRegistry } from "@my-ai-orchestrator/skills";
import { createFeatureFlagRegistry, createFeatureFlagServiceLayer, FeatureFlagService } from "@my-ai-orchestrator/feature-flags";
import { PACKAGE_DIRS, readPackageJson } from "./shared.js";

describe("monorepo governance", () => {
  it("keeps package metadata aligned with the workspace rules", async () => {
    for (const dir of PACKAGE_DIRS) {
      const pkg = await readPackageJson(dir);
      expect(pkg.private).toBe(true);
      expect(pkg.type).toBe("module");
      expect(pkg.main).toBe("./src/index.ts");
      expect(pkg.types).toBe("./src/index.ts");
      expect(pkg.exports?.["."]).toBe("./src/index.ts");
      expect(pkg.name).toBe(`@my-ai-orchestrator/${dir}`);
    }
  });

  it("enforces the allowed dependency directions for the current packages", async () => {
    const allowed = {
      contracts: new Set(["effect"]),
      domain: new Set(["@my-ai-orchestrator/contracts", "effect"]),
      core: new Set(["@my-ai-orchestrator/contracts", "effect"]),
      orchestrator: new Set([
        "@my-ai-orchestrator/contracts",
        "@my-ai-orchestrator/core",
        "@my-ai-orchestrator/domain",
        "@my-ai-orchestrator/text-quality",
        "@my-ai-orchestrator/skills",
        "effect"
      ]),
      database: new Set([
        "@my-ai-orchestrator/contracts",
        "@my-ai-orchestrator/domain",
        "effect"
      ]),
      "ai-adapters": new Set(["effect"]),
      "feature-flags": new Set(["@my-ai-orchestrator/contracts", "effect"]),
      payments: new Set(["@my-ai-orchestrator/contracts", "effect", "stripe"]),
      "client-sdk": new Set(["@my-ai-orchestrator/contracts", "effect"]),
      skills: new Set([
        "@my-ai-orchestrator/contracts",
        "@my-ai-orchestrator/domain",
        "effect",
        "franc"
      ]),
      "text-quality": new Set([
        "@my-ai-orchestrator/contracts",
        "@my-ai-orchestrator/skills",
        "effect"
      ])
    } as const;

    for (const [name, expected] of Object.entries(allowed)) {
      const pkg = await readPackageJson(name);
      for (const dependency of Object.keys(pkg.dependencies ?? {})) {
        expect(expected.has(dependency)).toBe(true);
      }
    }
  });

  it("smokes the monorepo entrypoints through a real composition path", async () => {
    const corePackage = await import("@my-ai-orchestrator/core");
    const orchestratorPackage = await import("@my-ai-orchestrator/orchestrator");
    const skillsPackage = await import("@my-ai-orchestrator/skills");
    const clientSdkPackage = await import("@my-ai-orchestrator/client-sdk");
    const featureFlagsPackage = await import("@my-ai-orchestrator/feature-flags");
    const paymentsPackage = await import("@my-ai-orchestrator/payments");

    expect(corePackage.createCoreLayer).toBe(createCoreLayer);
    expect(orchestratorPackage.buildOrchestrationPlan).toBe(buildOrchestrationPlan);
    expect(skillsPackage.createSkillRegistry).toBe(createSkillRegistry);
    expect(clientSdkPackage.createClientSdk).toBe(createClientSdk);
    expect(featureFlagsPackage.createFeatureFlagRegistry).toBe(createFeatureFlagRegistry);
    expect(paymentsPackage.createBillingRepository).toBe(createBillingRepository);

    const plan = buildOrchestrationPlan({
      userId: "user_1",
      pipelineType: "validation-post",
      briefing: "Write a validation post"
    });

    const registry = createSkillRegistry();
    Effect.runSync(registry.registerDeclarative({
      name: "summarize",
      description: "Summarize a draft",
      promptTemplate: "Draft: {{$state.draft}}"
    }));

    const skill = registry.resolve("summarize");
    expect(skill).toBeDefined();

    const serviceName = Effect.runSync(
      Effect.gen(function* () {
        const runtime = yield* RuntimeConfigService;
        return runtime.serviceName;
      }).pipe(
        Effect.provide(
          createCoreLayer({
            environment: "test",
            executionMode: "sync",
            qualityMode: "balanced",
            defaultLanguage: "pt-BR",
            serviceName: "monorepo-smoke"
          })
        )
      )
    );

    const execution = Effect.runSync(createDeclarativeSkillExecutor({
      name: "summarize",
      description: "Summarize a draft",
      promptTemplate: "Draft: {{$state.draft}}"
    }));
    const executed = await Effect.runPromise(execution.execute({
      pipeline: {
        name: "validation-post",
        steps: [{ name: "summarize", skill: "summarize", config: { tone: "professional" } }]
      },
      stepIndex: 0,
      state: { draft: "Hello monorepo" },
      inputs: {}
    }));

    expect(plan.pipeline.name).toBe("validation-post");
    expect(plan.estimatedSteps).toBe(4);
    expect(serviceName).toBe("monorepo-smoke");
    expect(execution.name).toBe("summarize");
    expect(executed.output).toBe("Draft: Hello monorepo");

    const featureFlagEnabled = Effect.runSync(
      Effect.gen(function* () {
        const flags = yield* FeatureFlagService;
        return flags.isEnabled("content.language.refinement", { environment: "test" });
      }).pipe(
        Effect.provide(
            createFeatureFlagServiceLayer({
            registry: Effect.runSync(createFeatureFlagRegistry([
              {
                key: "content.language.refinement",
                scope: "content",
                enabled: true,
                defaultVariant: "on",
                variants: ["on", "off"]
              }
            ]))
          }
          )
        )
      )
    );

    expect(featureFlagEnabled).toBe(true);

    const billingPlan = Effect.runSync(
      Effect.gen(function* () {
        const billing = yield* BillingService;
        return billing.listPlans().map((plan) => plan.id);
      }).pipe(
        Effect.provide(
          createBillingServiceLayer({
            repository: createBillingRepository()
          })
        )
      )
    );

    expect(billingPlan).toContain("free");
    expect(billingPlan).toContain("pro");

    const sdk = Effect.runSync(
      Effect.gen(function* () {
        const client = yield* ClientSdkService;
        return client;
      }).pipe(
        Effect.provide(
          createClientSdkLayer({
            baseUrl: "https://api.example.com",
            fetcher: async () =>
              new Response(
                JSON.stringify({
                  jobId: "job_1",
                  status: "queued",
                  contentType: "validation-post",
                  estimatedSteps: 3,
                  createdAt: "2026-05-09T00:00:00.000Z"
                }),
                {
                  status: 200,
                  headers: { "content-type": "application/json" }
                }
              )
          })
        )
      )
    );

    expect(typeof sdk.preview.get).toBe("function");
    expect(typeof sdk.executions.create).toBe("function");
  });
});
