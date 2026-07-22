import { Effect } from "effect";
import { Hono } from "hono";
import { createBillingService, createBillingRepository } from "@my-ai-orchestrator/payments";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { VoiceExample } from "@my-ai-orchestrator/domain";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import { createBackendOperatorMemoryRepository } from "../src/auth/operator-memory.js";
import { registerBackendRoutes } from "../src/app/routes.js";
import type { BackendConfig } from "../src/config/config.js";
import type { BackendProductServices } from "../src/product.js";
import type { BackendJobStoreServiceContract } from "../src/jobs/job-store.js";
import { createBackendOperationalOverrideService } from "../src/safety/operational-override.js";
import { createBackendPublicInputSafetyGatewayService } from "../src/safety/public-input-safety.js";
import { createBackendOutputReleaseGateService } from "../src/safety/output-release.js";
import { createBackendVoiceConsentService } from "../src/safety/voice-consent.js";
import { createBackendHardening } from "../src/app/production-hardening.js";
import {
  buildExampleId,
  buildInitialEvaluation,
  resolveContentTypeHints,
  resolveTargetProfileVersion
} from "../src/product/voice/voice-shared.js";
import type { BackendVoiceRebuildService } from "../src/product/voice/voice-rebuild-types.js";

export function createTestConfig(overrides?: Partial<BackendConfig>): BackendConfig {
  return {
    environment: "development",
    executionMode: "sync",
    qualityMode: "balanced",
    defaultLanguage: "pt-BR",
    serviceName: "backend",
    host: "0.0.0.0",
    port: 3000,
    version: "0.1.0",
    allowInMemoryRuntime: true,
    ...overrides
  } as BackendConfig;
}

export function createMinimalServices(
  overrides?: Partial<BackendProductServices>
): BackendProductServices {
  const safetyPolicy = {
    getActivePolicy: () => Effect.succeed({
      version: "2026-06-01",
      lifecycle: "active",
      families: {
        input: {
          family: "input",
          defaultOutcome: "block",
          allowedOutcomes: ["approve", "sanitize", "quarantine", "block"],
          overrideability: "one_shot",
          evidenceBoundary: "input",
          detectorAdapters: [],
          nonOverridableCategories: ["security_sensitive_data", "llm_prohibited_data", "operational_data"]
        },
        imported_context: {
          family: "imported_context",
          defaultOutcome: "block",
          allowedOutcomes: ["approve", "sanitize", "quarantine", "block"],
          overrideability: "one_shot",
          evidenceBoundary: "input",
          detectorAdapters: [],
          nonOverridableCategories: ["security_sensitive_data", "llm_prohibited_data", "operational_data"]
        },
        step_scope: {
          family: "step_scope",
          defaultOutcome: "block",
          allowedOutcomes: ["approve", "block"],
          overrideability: "never",
          evidenceBoundary: "scope",
          detectorAdapters: []
        },
        consent: {
          family: "consent",
          defaultOutcome: "block",
          allowedOutcomes: ["approve", "block", "revoke"],
          overrideability: "never",
          evidenceBoundary: "consent",
          detectorAdapters: []
        },
        output_release: {
          family: "output_release",
          defaultOutcome: "block",
          allowedOutcomes: ["approve", "sanitize", "block", "require_override"],
          overrideability: "one_shot",
          evidenceBoundary: "output",
          detectorAdapters: [],
          nonOverridableCategories: ["security_sensitive_data", "llm_prohibited_data", "operational_data"]
        },
        policy_evidence: {
          family: "policy_evidence",
          defaultOutcome: "approve",
          allowedOutcomes: ["approve", "block"],
          overrideability: "never",
          evidenceBoundary: "output",
          detectorAdapters: []
        },
        operational_override: {
          family: "operational_override",
          defaultOutcome: "require_override",
          allowedOutcomes: ["approve", "block", "require_override"],
          overrideability: "time_limited",
          evidenceBoundary: "override",
          detectorAdapters: [],
          maxOverrideWindowMinutes: 30
        }
      },
      classifications: {
        ordinary_generation_input: {
          category: "ordinary_generation_input",
          defaultOutcome: "approve",
          minimizationRequired: true,
          description: "test classification"
        },
        personal_data: {
          category: "personal_data",
          defaultOutcome: "sanitize",
          minimizationRequired: true,
          description: "test personal data"
        },
        imported_context_out_of_scope: {
          category: "imported_context_out_of_scope",
          defaultOutcome: "block",
          minimizationRequired: true,
          description: "test imported context"
        },
        voice_training_input: {
          category: "voice_training_input",
          defaultOutcome: "block",
          minimizationRequired: true,
          description: "test voice training"
        },
        customer_confidential_data: {
          category: "customer_confidential_data",
          defaultOutcome: "quarantine",
          minimizationRequired: true,
          description: "test confidential data"
        },
        operational_data: {
          category: "operational_data",
          defaultOutcome: "block",
          minimizationRequired: true,
          description: "test operational data"
        },
        security_sensitive_data: {
          category: "security_sensitive_data",
          defaultOutcome: "block",
          minimizationRequired: true,
          description: "test security data"
        },
        llm_prohibited_data: {
          category: "llm_prohibited_data",
          defaultOutcome: "block",
          minimizationRequired: true,
          description: "test prohibited data"
        }
      },
      evidenceBoundaries: ["input", "scope", "output", "consent", "override"],
      unknownInputOutcome: "block",
      detectorAdapters: {}
    }),
    listPolicyVersions: () => [{ version: "2026-06-01", lifecycle: "active" }],
    getPolicyFamily: () =>
      Effect.succeed({
        family: "input",
        defaultOutcome: "block",
        allowedOutcomes: ["approve", "sanitize", "quarantine", "block"],
        overrideability: "one_shot",
        evidenceBoundary: "input",
        detectorAdapters: [],
        nonOverridableCategories: ["security_sensitive_data", "llm_prohibited_data", "operational_data"]
      }),
    getClassification: (category: string) =>
      Effect.succeed({
        category,
        defaultOutcome: category === "personal_data"
          ? "sanitize"
          : category === "customer_confidential_data"
            ? "quarantine"
            : category === "ordinary_generation_input"
              ? "approve"
              : "block",
        minimizationRequired: true,
        description: "test classification"
      })
  } as any;

  const inputSafety = createBackendPublicInputSafetyGatewayService({
    safetyPolicy
  });
  const outputSafety = createBackendOutputReleaseGateService({
    safetyPolicy
  });
  const operationalOverride = createBackendOperationalOverrideService({
    database: {
      audit: {
        putIfAbsent: (record: any) => Effect.succeed(record),
        getByLogicalKey: () => Effect.succeed(undefined),
        list: () => Effect.succeed([])
      }
    } as any,
    now: () => new Date(),
    safetyPolicy,
    redaction: {
      redactObject: (value: Record<string, unknown>) => ({
        redacted: value,
        report: {
          redactedPaths: [],
          reasons: {},
          totalFieldsInspected: Object.keys(value).length
        }
      }),
      isSecretLikeField: () => false,
      isRedactedClassification: () => false,
      createRedactedLogger: (logger) => logger,
      redactObservabilitySnapshot: (snapshot) => snapshot
    } as any
  });

  return {
    database: {} as any,
    featureFlags: {
      isEnabled: () => true,
      getFlag: () => ({ enabled: true }),
      evaluate: () => ({ enabled: true })
    } as any,
    featureFlagRegistry: {} as any,
    aiAdapters: {} as any,
    billing: createBillingService(),
    billingRepository: createBillingRepository(),
    rawDatabase: {} as any,
    observability: {} as any,
    persistence: {
      recordExecutionPlan: () => Effect.succeed(undefined),
      recordQueuedJob: () => Effect.succeed(undefined),
      recordJobProgress: () => Effect.succeed(undefined),
      recordJobCompletion: () => Effect.succeed(undefined),
      recordJobFailure: () => Effect.succeed(undefined),
      recordMemoryWrite: () => Effect.succeed(undefined)
    } as any,
    aiPolicy: {
      validatePipelineRequest: () => Effect.succeed(undefined),
      getActiveOrchestrationCatalog: () => ({
        contentTypes: {},
        pipelines: {},
        skills: {},
        adapters: {},
        providers: {}
      }),
      listPolicyVersions: () => [],
      getActivePolicyPointer: () => Effect.succeed({
        activePolicyVersion: "v1",
        updatedAt: new Date().toISOString(),
        updatedBy: "test",
        history: []
      }),
      recommendFuturePolicyVersion: () => Effect.succeed(undefined),
      activatePolicyVersion: () => Effect.succeed(undefined),
      reloadActivePolicyPointer: () => Effect.succeed(undefined)
    } as any,
    experimentalAIPolicy: undefined,
    safetyPolicy,
    inputSafety,
    outputSafety,
    usagePolicy: {
      authorize: () => Effect.succeed({ authorized: true })
    } as any,
    generationPreview: {
      preview: () => Effect.succeed({
        quoteId: "quote-1",
        creditPrice: 1,
        estimatedTokens: 100,
        recommendedQualityMode: "balanced",
        policyVersion: "v1",
        pipelineName: "test",
        contentType: "twitter-thread"
      })
    } as any,
    generationPrefill: {
      infer: () => Effect.succeed({
        prefill: { scope: { lengthTier: "short" } },
        questionPlan: []
      })
    } as any,
    genreInference: {
      infer: () => Effect.succeed({
        genre: { rhetoricalMode: { dominant: "expound" }, epistemicPosture: "expository", prose: "" }
      })
    } as any,
    policyEvidence: {
      recordInputEvidence: () => Effect.succeed(undefined),
      recordOutputEvidence: () => Effect.succeed(undefined),
      recordScopeEvidence: () => Effect.succeed(undefined),
      recordConsentEvidence: () => Effect.succeed(undefined),
      recordOverrideEvidence: () => Effect.succeed(undefined),
      listOperationalEvidence: () => Effect.succeed([])
    } as any,
    operationalOverride,
    voiceRebuild: {} as any,
    voiceConsent: createBackendVoiceConsentService({
      database: {
        voiceTrainingConsents: {
          getByUser: () => Effect.succeed({
            id: "voice-consent:user_1",
            userId: "user_1",
            granted: true,
            grantedAt: new Date().toISOString(),
            evidenceBoundary: "consent",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
          }),
          put: () => Effect.succeed(undefined)
        }
      } as any,
      now: () => new Date()
    }),
    voice: {
      getProfileScreen: () => Effect.succeed(null)
    } as any,
    voiceCalibration: {
      startSession: () => Effect.succeed({} as any),
      setContext: () => Effect.succeed({} as any),
      getSession: () => Effect.succeed({} as any),
      getStepPrompt: () => Effect.succeed({} as any),
      submitStep: () => Effect.succeed({} as any),
      skipStep: () => Effect.succeed({} as any),
      completeReview: () => Effect.succeed({} as any),
      getEntitlement: () => Effect.succeed({} as any)
    } as any,
    users: createBackendApplicationUserMemoryRepository(),
    operators: createBackendOperatorMemoryRepository(),
    ...overrides
  } as BackendProductServices;
}

export function createTestApp(
  config: BackendConfig,
  services: BackendProductServices,
  jobOverrides?: Partial<BackendJobStoreServiceContract>
) {
  const app = new Hono();
  const now = () => new Date();
  const hardening = createBackendHardening({ config, services, now });

  app.onError(async (error, c) => {
    const { mapErrorToHttp } = await import("../src/http/error-response.js");
    const { createErrorBody, toErrorMessage } = await import("../src/http/http.js");
    const { status, body } = mapErrorToHttp(error, c.req.path);
    try {
      const response = await createErrorBody(body);
      return c.json(response, status);
    } catch (validationError) {
      const fallback = await createErrorBody({
        error: "InternalServerError",
        message: toErrorMessage(validationError)
      });
      return c.json(fallback, 500);
    }
  });

  registerBackendRoutes(app, {
    config,
    startedAt: new Date(),
    now,
    services,
    hardening,
    jobs: {
      createQueuedJob: () => Effect.succeed({ jobId: "job-1", status: "queued" as const, contentType: "twitter-thread", createdAt: new Date().toISOString() }),
      getJobStatus: () => Effect.succeed(undefined),
      listJobs: () => Effect.succeed([]),
      listJobsForUser: () => Effect.succeed({ items: [], total: 0 }),
      claimQueuedJob: () => Effect.succeed(true),
      ...jobOverrides
    } as any,
    execution: {
      execute: () => Effect.succeed({
        mode: "sync" as const,
        adapter: "openai",
        model: "gpt-4",
        content: "Test result",
        contentType: "twitter-thread",
        pipelineName: "test-pipeline",
        qualityMode: "balanced" as const
      }),
      executeTrusted: () => Effect.succeed({
        mode: "sync" as const,
        adapter: "openai",
        model: "gpt-4",
        content: "Test result",
        contentType: "twitter-thread",
        pipelineName: "test-pipeline",
        qualityMode: "balanced" as const
      })
    } as any
  });
  return app;
}

export interface CreateVoiceExampleInput {
  readonly text: string;
  readonly language?: string;
  readonly pinned?: boolean;
  readonly channel?: string;
  readonly explicitContentType?: string;
  readonly context?: string;
}

export function createVoiceExampleInDatabase(
  database: DatabaseClient,
  userId: string,
  input: CreateVoiceExampleInput,
  voiceRebuild?: BackendVoiceRebuildService
): Effect.Effect<VoiceExample, never> {
  return Effect.gen(function* () {
    const existing = yield* database.voiceExamples.listByUser(userId);
    const timestamp = new Date().toISOString();
    const targetProfileVersion = yield* resolveTargetProfileVersion(database, userId);
    const evaluation = buildInitialEvaluation({
      text: input.text,
      pinned: input.pinned ?? false
    });

    const example: VoiceExample = {
      id: buildExampleId(userId, existing.length + 1),
      userId,
      text: input.text.trim(),
      language: input.language ?? "pt-BR",
      state: "active",
      classificationLabels: ["positive"],
      antiPatternsExplicit: [],
      pinned: input.pinned ?? false,
      pendingProfileImpact: true,
      targetProfileVersion,
      effectiveContentTypeHints: resolveContentTypeHints(input.explicitContentType, input.channel),
      channel: input.channel,
      explicitContentType: input.explicitContentType,
      context: input.context,
      evaluation,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const stored = yield* database.voiceExamples.create(example).pipe(Effect.orDie);

    if (voiceRebuild) {
      yield* voiceRebuild.schedule(userId).pipe(Effect.orDie);
      yield* voiceRebuild.drain(userId).pipe(Effect.orDie);
    }

    return stored;
  });
}
