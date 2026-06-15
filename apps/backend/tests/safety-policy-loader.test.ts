import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  BackendSafetyPolicyDefinitionError,
  BackendSafetyPolicyValidationError
} from "../src/http/errors.js";
import { loadBackendSafetyPolicyService } from "../src/product/safety-policy/safety-policy.js";
import { loadResolvedSafetyPolicyDocuments } from "../src/product/safety-policy/safety-policy-loader.js";
import { createTestConfig } from "./test-helpers.js";

describe("Safety policy boot loader", () => {
  it("loads the official safety policy with typed families and classifications", async () => {
    const service = await Effect.runPromise(loadBackendSafetyPolicyService(createTestConfig()));
    const policy = await Effect.runPromise(service.getActivePolicy());
    const outputFamily = await Effect.runPromise(service.getPolicyFamily("output_release"));
    const prohibitedClassification = await Effect.runPromise(service.getClassification("llm_prohibited_data"));

    expect(policy.version).toBe("2026-06-01");
    expect(policy.unknownInputOutcome).toBe("block");
    expect(outputFamily.overrideability).toBe("one_shot");
    expect(prohibitedClassification.defaultOutcome).toBe("block");
    expect(service.listPolicyVersions()).toEqual([{ version: "2026-06-01", lifecycle: "active" }]);
  });

  it("fails when a required family is missing", async () => {
    const manifestPath = createSafetyPolicyFixture({
      mutatePolicy: (policy) => ({
        ...policy,
        families: policy.families.filter((family: any) => family.family !== "consent")
      })
    });

    const result = await Effect.runPromise(Effect.flip(loadResolvedSafetyPolicyDocuments(manifestPath)));

    expect(result).toBeInstanceOf(BackendSafetyPolicyDefinitionError);
    expect(result).toMatchObject({
      _tag: "BackendSafetyPolicyDefinitionError",
      family: "consent"
    });
  });

  it("fails when a required classification is missing", async () => {
    const manifestPath = createSafetyPolicyFixture({
      mutatePolicy: (policy) => ({
        ...policy,
        classifications: policy.classifications.filter(
          (classification: any) => classification.category !== "security_sensitive_data"
        )
      })
    });

    const result = await Effect.runPromise(Effect.flip(loadResolvedSafetyPolicyDocuments(manifestPath)));

    expect(result).toBeInstanceOf(BackendSafetyPolicyDefinitionError);
    expect(result).toMatchObject({
      _tag: "BackendSafetyPolicyDefinitionError",
      classification: "security_sensitive_data"
    });
  });

  it("fails when deny-by-default unknown input handling is removed", async () => {
    const manifestPath = createSafetyPolicyFixture({
      mutatePolicy: (policy) => ({
        ...policy,
        unknownInputOutcome: "approve"
      })
    });

    const result = await Effect.runPromise(Effect.flip(loadResolvedSafetyPolicyDocuments(manifestPath)));

    expect(result).toBeInstanceOf(BackendSafetyPolicyValidationError);
    expect(result._tag).toBe("BackendSafetyPolicyValidationError");
  });

  it("fails when a family default outcome is not part of its decision contract", async () => {
    const manifestPath = createSafetyPolicyFixture({
      mutatePolicy: (policy) => ({
        ...policy,
        families: policy.families.map((family: any) =>
          family.family === "output_release"
            ? {
                ...family,
                allowedOutcomes: ["approve", "sanitize"]
              }
            : family
        )
      })
    });

    const result = await Effect.runPromise(Effect.flip(loadResolvedSafetyPolicyDocuments(manifestPath)));

    expect(result).toBeInstanceOf(BackendSafetyPolicyDefinitionError);
    expect(result).toMatchObject({
      _tag: "BackendSafetyPolicyDefinitionError",
      family: "output_release"
    });
  });
});

function createSafetyPolicyFixture(options: {
  readonly mutatePolicy?: (policy: any) => any;
} = {}): string {
  const directory = mkdtempSync(join(tmpdir(), "safety-policy-fixture-"));
  const version = "2026-06-01-test";
  const policyDirectory = join(directory, version);
  const manifestPath = join(directory, "manifest.json");
  const policyPath = join(policyDirectory, "policy.json");

  mkdirSync(policyDirectory, { recursive: true });

  const policy = {
    policyVersion: version,
    lifecycle: "active",
    unknownInputOutcome: "block",
    evidenceBoundaries: ["input", "scope", "output", "consent", "override"],
    families: [
      {
        family: "input",
        defaultOutcome: "block",
        allowedOutcomes: ["approve", "sanitize", "quarantine", "block"],
        overrideability: "one_shot",
        evidenceBoundary: "input",
        detectorAdapters: ["instruction-override-classifier"],
        nonOverridableCategories: ["security_sensitive_data", "llm_prohibited_data", "operational_data"]
      },
      {
        family: "imported_context",
        defaultOutcome: "block",
        allowedOutcomes: ["approve", "sanitize", "quarantine", "block"],
        overrideability: "one_shot",
        evidenceBoundary: "input",
        detectorAdapters: ["instruction-override-classifier"],
        nonOverridableCategories: ["security_sensitive_data", "llm_prohibited_data", "operational_data"]
      },
      {
        family: "step_scope",
        defaultOutcome: "block",
        allowedOutcomes: ["approve", "block"],
        overrideability: "never",
        evidenceBoundary: "scope",
        detectorAdapters: []
      },
      {
        family: "consent",
        defaultOutcome: "block",
        allowedOutcomes: ["approve", "block", "revoke"],
        overrideability: "never",
        evidenceBoundary: "consent",
        detectorAdapters: []
      },
      {
        family: "output_release",
        defaultOutcome: "block",
        allowedOutcomes: ["approve", "sanitize", "block", "require_override"],
        overrideability: "one_shot",
        evidenceBoundary: "output",
        detectorAdapters: ["unsafe-code-scanner"],
        nonOverridableCategories: ["security_sensitive_data", "llm_prohibited_data", "operational_data"]
      },
      {
        family: "policy_evidence",
        defaultOutcome: "approve",
        allowedOutcomes: ["approve", "block"],
        overrideability: "never",
        evidenceBoundary: "output",
        detectorAdapters: []
      },
      {
        family: "operational_override",
        defaultOutcome: "require_override",
        allowedOutcomes: ["approve", "block", "require_override"],
        overrideability: "time_limited",
        evidenceBoundary: "override",
        detectorAdapters: [],
        maxOverrideWindowMinutes: 30
      }
    ],
    classifications: [
      {
        category: "ordinary_generation_input",
        defaultOutcome: "approve",
        minimizationRequired: true,
        description: "ordinary"
      },
      {
        category: "imported_context_out_of_scope",
        defaultOutcome: "block",
        minimizationRequired: true,
        description: "out of scope"
      },
      {
        category: "voice_training_input",
        defaultOutcome: "block",
        minimizationRequired: true,
        description: "voice"
      },
      {
        category: "personal_data",
        defaultOutcome: "sanitize",
        minimizationRequired: true,
        description: "personal"
      },
      {
        category: "customer_confidential_data",
        defaultOutcome: "quarantine",
        minimizationRequired: true,
        description: "confidential"
      },
      {
        category: "operational_data",
        defaultOutcome: "block",
        minimizationRequired: true,
        description: "operational"
      },
      {
        category: "security_sensitive_data",
        defaultOutcome: "block",
        minimizationRequired: true,
        description: "security"
      },
      {
        category: "llm_prohibited_data",
        defaultOutcome: "block",
        minimizationRequired: true,
        description: "prohibited"
      }
    ],
    detectorAdapters: [
      {
        id: "instruction-override-classifier",
        kind: "classifier",
        optional: true,
        boundaries: ["input", "override"]
      },
      {
        id: "unsafe-code-scanner",
        kind: "heuristic",
        optional: true,
        boundaries: ["output"]
      }
    ]
  };

  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        activeVersion: version,
        versions: [
          {
            version,
            lifecycle: "active",
            policyPath: `./${version}/policy.json`
          }
        ]
      },
      null,
      2
    )
  );
  writeFileSync(policyPath, JSON.stringify(options.mutatePolicy ? options.mutatePolicy(policy) : policy, null, 2), {
    encoding: "utf8",
    flag: "w"
  });

  return manifestPath;
}
