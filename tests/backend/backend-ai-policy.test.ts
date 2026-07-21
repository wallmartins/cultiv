import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { BackendConfig } from "../../apps/backend";
import {
  BackendAIPolicyCatalogError,
  BackendAIPolicyValidationError,
  createBackendProductServices
} from "../../apps/backend";

const baseConfig: BackendConfig = {
  environment: "test",
  executionMode: "sync",
  qualityMode: "balanced",
  defaultLanguage: "pt-BR",
  serviceName: "backend",
  host: "127.0.0.1",
  port: 3000,
  version: "0.1.0"
};

describe("backend ai policy", () => {
  it("loads the official policy set at boot as a deep module", () => {
    const services = Effect.runSync(createBackendProductServices(baseConfig));
    const policy = Effect.runSync(services.aiPolicy.getActivePolicy());

    expect(policy.version).toBe("2026-07-20");
    expect(policy.orchestrationCatalog.pipelines["long-piece"]?.steps[0]?.config).toMatchObject({
      executionType: "local"
    });
  });

  it("fails boot with typed validation errors when the manifest is invalid", () => {
    const directory = mkdtempSync(join(tmpdir(), "backend-ai-policy-"));
    const manifestPath = join(directory, "manifest.json");
    writeFileSync(
      manifestPath,
      JSON.stringify({
        activeVersion: "missing",
        versions: []
      }),
      "utf8"
    );

    const result = Effect.runSync(
      Effect.either(
        createBackendProductServices({
          ...baseConfig,
          aiPolicyManifestPath: manifestPath
        })
      )
    );

    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(BackendAIPolicyValidationError);
  });

  it("rejects explicit pipelines that diverge from the active policy catalog", () => {
    const services = Effect.runSync(createBackendProductServices(baseConfig));

    const result = Effect.runSync(
      Effect.either(
        services.aiPolicy.validatePipelineRequest({
          pipeline: {
            name: "validation-post",
            steps: [
              { name: "research", skill: "research" },
              { name: "draft", skill: "draft" }
            ]
          },
          inputs: {
            briefing: {
              topic: "policy"
            }
          }
        })
      )
    );

    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(BackendAIPolicyCatalogError);
  });

  it("resolves pricing envelopes for active and legacy-supported policy versions", () => {
    const services = Effect.runSync(
      createBackendProductServices({
        ...baseConfig,
        aiPolicyAttachedVersion: "2026-06-22"
      })
    );

    const activePricing = Effect.runSync(
      services.aiPolicy.resolvePricingEnvelope({
        planTier: "pro",
        contentType: "edition-piece",
        qualityMode: "balanced",
        planSignature: "edition-piece",
        lengthTier: "medium"
      })
    );
    const legacyPricing = Effect.runSync(
      services.aiPolicy.resolvePricingEnvelope({
        planTier: "pro",
        contentType: "edition-piece",
        qualityMode: "balanced",
        planSignature: "edition-piece",
        lengthTier: "medium",
        attachedPolicyVersion: "2026-06-22"
      })
    );

    expect(activePricing.policyVersion).toBe("2026-06-22");
    expect(activePricing.lifecycle).toBe("legacy-supported");
    expect(legacyPricing.creditPrice).toBe(3.8);
  });

  it("resolves an immutable execution snapshot from the attached policy version", () => {
    const services = Effect.runSync(
      createBackendProductServices({
        ...baseConfig,
        aiPolicyAttachedVersion: "2026-06-22"
      })
    );

    const snapshot = Effect.runSync(
      services.aiPolicy.resolveExecutionSnapshot({
        request: {
          userId: "user_1",
          pipelineType: "edition-piece",
          contentType: "edition-piece",
          briefing: {
            topic: "Execution snapshot"
          },
          qualityMode: "balanced",
          context: {
            compositor: {
              planSignature: "edition-piece",
              lengthTier: "medium"
            }
          }
        },
        planTier: "pro",
        executionMode: "sync",
        qualityMode: "balanced",
        defaultLanguage: "pt-BR",
        attachedPolicyVersion: "2026-06-22"
      })
    );

    expect(snapshot.policyVersion).toBe("2026-06-22");
    expect(snapshot.pricingEnvelope.policyVersion).toBe("2026-06-22");
    expect(snapshot.plan.contentType.id).toBe("edition-piece");
    expect(snapshot.steps.length).toBe(snapshot.plan.pipeline.steps.length);
    expect(snapshot.steps.find((step) => step.execution === "llm")?.attempts.length).toBeGreaterThan(0);
    expect(snapshot.steps.find((step) => step.execution === "local")?.attempts).toEqual([]);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.steps)).toBe(true);
    expect(Object.isFrozen(snapshot.plan.pipeline.steps)).toBe(true);
  });

  it("loads the experimental policy catalog separately from the official catalog", () => {
    const services = Effect.runSync(
      createBackendProductServices({
        ...baseConfig,
        experimentalDebugEnabled: true
      })
    );

    const experimentalPolicy = services.experimentalAIPolicy;
    expect(experimentalPolicy).toBeDefined();

    const officialPolicy = Effect.runSync(services.aiPolicy.getActivePolicy());
    const experimentalResolved = Effect.runSync(experimentalPolicy!.getActivePolicy());

    expect(officialPolicy.version).toBe("2026-07-20");
    expect(experimentalResolved.version).toBe("2026-05-24-exp");
    expect(
      experimentalResolved.routingProfiles["experimental-llm"]?.preferredAttempts[0]
    ).toMatchObject({
      provider: "anthropic",
      model: "claude-3-5-sonnet-latest"
    });
    expect(officialPolicy.routingProfiles["default-llm"]?.preferredAttempts[0]).toMatchObject({
      provider: "gemini",
      model: "gemini-3.1-flash-lite"
    });
    expect(officialPolicy.routingProfiles["linkedin-llm"]?.preferredAttempts[0]).toMatchObject({
      provider: "gemini",
      model: "gemini-3.1-flash-lite"
    });
  });
});
