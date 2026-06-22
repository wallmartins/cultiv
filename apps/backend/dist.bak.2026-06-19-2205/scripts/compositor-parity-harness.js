#!/usr/bin/env tsx

// scripts/compositor-parity-harness.ts
import { mkdirSync, writeFileSync } from "node:fs";
import pg from "pg";
import { Effect as Effect3 } from "effect";

// src/product/generation/resolve-generation-target.ts
import { Effect as Effect2 } from "effect";

// src/http/errors.ts
import { Data } from "effect";
var BackendRequestBodyParseError = class extends Data.TaggedError("BackendRequestBodyParseError") {
};
var BackendValidationError = class extends Data.TaggedError("BackendValidationError") {
};
var BackendReadinessError = class extends Data.TaggedError("BackendReadinessError") {
};
var BackendRequestRateLimitError = class extends Data.TaggedError("BackendRequestRateLimitError") {
};
var BackendAuthenticationError = class extends Data.TaggedError("BackendAuthenticationError") {
};
var BackendAuthorizationError = class extends Data.TaggedError("BackendAuthorizationError") {
};
var BackendJobNotFoundError = class extends Data.TaggedError("BackendJobNotFoundError") {
};
var BackendVoiceProfileNotFoundError = class extends Data.TaggedError("BackendVoiceProfileNotFoundError") {
};
var BackendVoiceExampleNotFoundError = class extends Data.TaggedError("BackendVoiceExampleNotFoundError") {
};
var BackendExecutionNotFoundError = class extends Data.TaggedError("BackendExecutionNotFoundError") {
};
var BackendResponseValidationError = class extends Data.TaggedError("BackendResponseValidationError") {
};
var BackendExecutionConflictError = class extends Data.TaggedError("BackendExecutionConflictError") {
};
var BackendExecutionFailedError = class extends Data.TaggedError("BackendExecutionFailedError") {
};
var BackendExecutionIntegrityError = class extends Data.TaggedError("BackendExecutionIntegrityError") {
};
var BackendUsageAuthorizationError = class extends Data.TaggedError("BackendUsageAuthorizationError") {
};
var BackendExperimentalAccessError = class extends Data.TaggedError("BackendExperimentalAccessError") {
};
var BackendAIPolicyLoadError = class extends Data.TaggedError("BackendAIPolicyLoadError") {
};
var BackendAIPolicyValidationError = class extends Data.TaggedError("BackendAIPolicyValidationError") {
};
var BackendAIPolicyCatalogError = class extends Data.TaggedError("BackendAIPolicyCatalogError") {
};
var BackendAIPolicyPricingError = class extends Data.TaggedError("BackendAIPolicyPricingError") {
};
var BackendSafetyPolicyLoadError = class extends Data.TaggedError("BackendSafetyPolicyLoadError") {
};
var BackendSafetyPolicyValidationError = class extends Data.TaggedError("BackendSafetyPolicyValidationError") {
};
var BackendSafetyPolicyDefinitionError = class extends Data.TaggedError("BackendSafetyPolicyDefinitionError") {
};
var BackendInputSafetyGatewayFailureError = class extends Data.TaggedError("BackendInputSafetyGatewayFailureError") {
};
var BackendInputSafetyPolicyError = class extends Data.TaggedError("BackendInputSafetyPolicyError") {
};
var BackendInstructionOverrideDetectorFailureError = class extends Data.TaggedError("BackendInstructionOverrideDetectorFailureError") {
};
var BackendStepScopeViolationError = class extends Data.TaggedError("BackendStepScopeViolationError") {
};
var BackendUserSuspendedError = class extends Data.TaggedError("BackendUserSuspendedError") {
};
var BackendVoiceTrainingConsentRequiredError = class extends Data.TaggedError("BackendVoiceTrainingConsentRequiredError") {
};
var BackendVoiceTrainingConsentFailureError = class extends Data.TaggedError("BackendVoiceTrainingConsentFailureError") {
};
var BackendGenerationQuoteMismatchError = class extends Data.TaggedError("BackendGenerationQuoteMismatchError") {
};
var BackendOutputReleaseGateFailureError = class extends Data.TaggedError("BackendOutputReleaseGateFailureError") {
};
var BackendOutputReleasePolicyError = class extends Data.TaggedError("BackendOutputReleasePolicyError") {
};
var BackendOperationalOverrideStateError = class extends Data.TaggedError("BackendOperationalOverrideStateError") {
};
var BackendBillingNotConfiguredError = class extends Data.TaggedError("BackendBillingNotConfiguredError") {
};

// src/product/generation/compositor/compositor-planner.ts
import { createHash } from "node:crypto";

// src/product/generation/compositor/expression.ts
var CHANNEL_EXPRESSION_PREFIX = {
  email: "email",
  "professional-network": "professional",
  blog: "blog",
  social: "social"
};
function resolveExpressionProfile(input) {
  if (input.channel === "unspecified") {
    return `${input.intent}-default`;
  }
  return `${CHANNEL_EXPRESSION_PREFIX[input.channel]}-${input.intent}`;
}
function defaultPresetByIntentTier(intent, lengthTier) {
  if (intent === "tell-story") {
    return lengthTier === "long" ? "long-piece" : "serial-piece";
  }
  if (lengthTier === "long") {
    return "long-piece";
  }
  if (lengthTier === "medium") {
    if (intent === "update-subscribers" || intent === "explain-deeply" || intent === "document-decision") {
      return "edition-piece";
    }
    return "short-piece";
  }
  if (intent === "engage-audience" || intent === "document-decision") {
    return "serial-piece";
  }
  return "short-piece";
}
function pickBasePreset(input) {
  const channel = input.channel ?? "unspecified";
  if (channel === "email") {
    return "edition-piece";
  }
  if (channel === "professional-network" || channel === "social") {
    return "short-piece";
  }
  if (channel === "blog" && input.lengthTier === "long") {
    return "long-piece";
  }
  return defaultPresetByIntentTier(input.intent, input.lengthTier);
}

// src/product/generation/compositor/presets.ts
var COMPOSITOR_PRESET_IDS = [
  "short-piece",
  "long-piece",
  "serial-piece",
  "edition-piece"
];
var COMPOSITOR_PRESETS = {
  "short-piece": {
    id: "short-piece",
    relativeCostWeight: 1,
    steps: [
      { name: "hook", skill: "hook", execution: "llm", routingProfile: "linkedin-llm" },
      { name: "draft", skill: "draft", execution: "llm", routingProfile: "linkedin-llm" },
      { name: "refine", skill: "refine", execution: "llm", routingProfile: "linkedin-llm" },
      { name: "sanitize", skill: "sanitize", execution: "local" }
    ]
  },
  "long-piece": {
    id: "long-piece",
    relativeCostWeight: 3,
    steps: [
      { name: "research", skill: "research", execution: "local" },
      { name: "outline", skill: "outline", execution: "local" },
      { name: "draft", skill: "draft", execution: "llm", routingProfile: "premium-llm" },
      { name: "refine", skill: "refine", execution: "llm", routingProfile: "premium-llm" },
      { name: "finalize", skill: "publish", execution: "local" },
      { name: "sanitize", skill: "sanitize", execution: "local" }
    ]
  },
  "serial-piece": {
    id: "serial-piece",
    relativeCostWeight: 1.5,
    steps: [
      { name: "analyze", skill: "analyze", execution: "local" },
      { name: "draft", skill: "draft", execution: "llm", routingProfile: "default-llm" },
      { name: "tighten", skill: "tighten", execution: "llm", routingProfile: "default-llm" },
      { name: "sanitize", skill: "sanitize", execution: "local" }
    ]
  },
  "edition-piece": {
    id: "edition-piece",
    relativeCostWeight: 2,
    steps: [
      { name: "draft", skill: "draft", execution: "llm", routingProfile: "default-llm" },
      { name: "refine", skill: "refine", execution: "llm", routingProfile: "default-llm" },
      { name: "tighten", skill: "tighten", execution: "llm", routingProfile: "default-llm" },
      { name: "sanitize", skill: "sanitize", execution: "local" }
    ]
  }
};
function getPreset(id) {
  return COMPOSITOR_PRESETS[id];
}
function stepExecutionWeight(step) {
  return step.execution === "llm" ? 1 : 0.1;
}
function presetContainsStep(presetId, step) {
  return COMPOSITOR_PRESETS[presetId].steps.some(
    (presetStep) => presetStep.name === step.name && presetStep.skill === step.skill && presetStep.routingProfile === step.routingProfile && presetStep.execution === step.execution
  );
}
function presetContainsStepName(presetId, stepName) {
  return COMPOSITOR_PRESETS[presetId].steps.some((presetStep) => presetStep.name === stepName);
}
function pickStepOwner(step, basePresetId) {
  const exactOwners = COMPOSITOR_PRESET_IDS.filter((presetId) => presetContainsStep(presetId, step));
  if (exactOwners.length === 1) {
    return exactOwners[0];
  }
  if (exactOwners.includes(basePresetId)) {
    return basePresetId;
  }
  if (exactOwners.length > 1) {
    return exactOwners.reduce(
      (current, candidate) => COMPOSITOR_PRESETS[candidate].steps.length < COMPOSITOR_PRESETS[current].steps.length ? candidate : current
    );
  }
  const nameOwners = COMPOSITOR_PRESET_IDS.filter((presetId) => presetContainsStepName(presetId, step.name));
  if (nameOwners.includes(basePresetId)) {
    return basePresetId;
  }
  if (nameOwners.length > 0) {
    return nameOwners.reduce(
      (current, candidate) => COMPOSITOR_PRESETS[candidate].steps.length < COMPOSITOR_PRESETS[current].steps.length ? candidate : current
    );
  }
  return basePresetId;
}
function resolveDominantPlanSignature(steps, basePresetId) {
  const scores = new Map(
    COMPOSITOR_PRESET_IDS.map((id) => [id, 0])
  );
  for (const step of steps) {
    const owner = pickStepOwner(step, basePresetId);
    const preset = COMPOSITOR_PRESETS[owner];
    const contribution = preset.relativeCostWeight / preset.steps.length * stepExecutionWeight(step);
    scores.set(owner, (scores.get(owner) ?? 0) + contribution);
  }
  let winner = basePresetId;
  let bestScore = scores.get(basePresetId) ?? 0;
  for (const presetId of COMPOSITOR_PRESET_IDS) {
    const score = scores.get(presetId) ?? 0;
    if (score > bestScore) {
      bestScore = score;
      winner = presetId;
    }
  }
  return winner;
}

// src/product/generation/compositor/rhetorical-profiles.ts
var RHETORICAL_PROFILES = {
  "share-idea": { goalClass: "share", promptPackId: "share-idea" },
  "explain-deeply": { goalClass: "explain", promptPackId: "explain-deeply" },
  "engage-audience": { goalClass: "engage", promptPackId: "engage-audience" },
  "tell-story": { goalClass: "story", promptPackId: "tell-story" },
  "update-subscribers": { goalClass: "update", promptPackId: "update-subscribers" },
  "document-decision": {
    goalClass: "document",
    promptPackId: "document-decision",
    structureStep: "structure"
  }
};
function getRhetoricalProfile(intent) {
  return RHETORICAL_PROFILES[intent];
}

// ../../packages/contracts/src/errors.ts
import { Data as Data2 } from "effect";
var ContractDecodeError = class extends Data2.TaggedError("ContractDecodeError") {
};

// ../../packages/contracts/src/content-types.ts
import { Schema as Schema10 } from "effect";

// ../../packages/contracts/src/execution/errors.ts
import { Schema as Schema2 } from "effect";

// ../../packages/contracts/src/shared.ts
import { Effect, ParseResult, Schema } from "effect";
function createSchemaDecoder(schemaName, schema) {
  const decode = Schema.decodeUnknown(schema);
  return (input) => decode(input).pipe(
    Effect.mapError(
      (error) => new ContractDecodeError({
        schema: schemaName,
        message: ParseResult.TreeFormatter.formatErrorSync(error),
        input
      })
    )
  );
}

// ../../packages/contracts/src/execution/errors.ts
var ApiErrorCategorySchema = Schema2.Literal(
  "invalid_request",
  "authentication",
  "authorization",
  "not_found",
  "conflict",
  "rate_limit",
  "internal"
);
var ApiErrorCodeSchema = Schema2.Literal(
  "invalid_request",
  "authentication_missing_token",
  "authentication_invalid_token",
  "authentication_expired_token",
  "authorization_insufficient_permission",
  "authorization_missing_role",
  "authorization_not_owner",
  "safety_input_blocked",
  "safety_input_quarantined",
  "user_suspended",
  "resource_not_found",
  "voice_training_consent_required",
  "quote_stale",
  "execution_conflict",
  "usage_restricted",
  "rate_limited",
  "service_unavailable",
  "internal_error"
);
var ApiErrorResponseSchema = Schema2.Struct({
  status: Schema2.Number,
  code: ApiErrorCodeSchema,
  category: ApiErrorCategorySchema,
  message: Schema2.String,
  retryable: Schema2.Boolean,
  details: Schema2.optional(Schema2.Record({ key: Schema2.String, value: Schema2.Unknown }))
});
var decodeApiErrorResponse = createSchemaDecoder("ApiErrorResponse", ApiErrorResponseSchema);

// ../../packages/contracts/src/execution/job.ts
import { Schema as Schema3 } from "effect";
var ExecutionModeSchema = Schema3.Literal("sync", "async");
var JobStatusSchema = Schema3.Literal("queued", "running", "done", "failed");
var PipelineTypeSchema = Schema3.Literal(
  "long-form-blog",
  "validation-post",
  "architecture-post",
  "linkedin-post",
  "twitter-thread",
  "newsletter",
  "short-piece",
  "long-piece",
  "serial-piece",
  "edition-piece"
);
var QualityModeSchema = Schema3.Literal("fast", "balanced", "strict");
var PreviewRecommendationSchema = Schema3.Struct({
  qualityMode: QualityModeSchema,
  reasonCodes: Schema3.Array(Schema3.String),
  explanation: Schema3.String
});
var PipelineStepDefinitionSchema = Schema3.Struct({
  name: Schema3.String,
  skill: Schema3.String,
  config: Schema3.optional(Schema3.Record({ key: Schema3.String, value: Schema3.Unknown }))
});
var PipelineDefinitionSchema = Schema3.Struct({
  name: Schema3.String,
  steps: Schema3.Array(PipelineStepDefinitionSchema)
});
var JobProgressSchema = Schema3.Struct({
  currentStep: Schema3.String,
  stepIndex: Schema3.Number,
  totalSteps: Schema3.Number,
  percent: Schema3.Number
});
var JobResultSchema = Schema3.Struct({
  content: Schema3.String,
  metadata: Schema3.Record({ key: Schema3.String, value: Schema3.Unknown })
});
var JobErrorSchema = Schema3.Struct({
  message: Schema3.String,
  step: Schema3.NullOr(Schema3.String)
});
var JobCreatedResponseSchema = Schema3.Struct({
  jobId: Schema3.String,
  status: Schema3.Literal("queued", "done"),
  contentType: Schema3.String,
  estimatedSteps: Schema3.Number,
  createdAt: Schema3.String
});
var HealthCheckResponseSchema = Schema3.Struct({
  status: Schema3.Literal("ok", "error"),
  time: Schema3.String,
  engine: Schema3.Struct({
    status: Schema3.Literal("ready", "degraded"),
    version: Schema3.String,
    uptimeSec: Schema3.Number
  })
});
var ReadinessCheckStatusSchema = Schema3.Literal("ready", "blocked");
var ReadinessCheckSchema = Schema3.Struct({
  status: ReadinessCheckStatusSchema,
  detail: Schema3.optional(Schema3.String)
});
var ReadinessResponseSchema = Schema3.Struct({
  status: ReadinessCheckStatusSchema,
  time: Schema3.String,
  service: Schema3.Struct({
    environment: Schema3.String,
    version: Schema3.String
  }),
  checks: Schema3.Struct({
    config: ReadinessCheckSchema,
    auth: ReadinessCheckSchema,
    database: ReadinessCheckSchema
  })
});
var ExecutionControlsSchema = Schema3.Struct({
  qualityMode: Schema3.optional(QualityModeSchema),
  targetScore: Schema3.optional(Schema3.Number),
  maxIterations: Schema3.optional(Schema3.Number),
  minImprovementDelta: Schema3.optional(Schema3.Number),
  maxLLMCalls: Schema3.optional(Schema3.Number)
});
var ExecutionTelemetrySchema = Schema3.Struct({
  llm: Schema3.optional(
    Schema3.Struct({
      executedCount: Schema3.Number,
      bypassedCount: Schema3.Number,
      llmCallsSaved: Schema3.Number,
      bypassRate: Schema3.Number
    })
  ),
  cost: Schema3.optional(
    Schema3.Struct({
      inputTokensTotal: Schema3.Number,
      outputTokensTotal: Schema3.Number,
      estimatedUsdCost: Schema3.Number,
      debitedCredits: Schema3.Number
    })
  ),
  selection: Schema3.optional(
    Schema3.Struct({
      reason: Schema3.String,
      adapter: Schema3.String,
      model: Schema3.String
    })
  ),
  preview: Schema3.optional(
    Schema3.Struct({
      quoteId: Schema3.optional(Schema3.String),
      recommendedQualityMode: Schema3.optional(QualityModeSchema),
      finalQualityMode: QualityModeSchema,
      divergedFromRecommendation: Schema3.Boolean,
      recommendationReasonCodes: Schema3.Array(Schema3.String)
    })
  ),
  pricing: Schema3.optional(
    Schema3.Struct({
      quoteId: Schema3.optional(Schema3.String),
      policyVersion: Schema3.optional(Schema3.String),
      contentType: Schema3.optional(Schema3.String),
      planSignature: Schema3.optional(Schema3.String),
      lengthTier: Schema3.optional(Schema3.String),
      plannedCreditPrice: Schema3.optional(Schema3.Number),
      observedDebitedCredits: Schema3.Number,
      observedUsdCost: Schema3.Number
    })
  ),
  compositor: Schema3.optional(
    Schema3.Struct({
      planId: Schema3.String
    })
  ),
  providers: Schema3.optional(
    Schema3.Struct({
      finalProvider: Schema3.String,
      finalModel: Schema3.String,
      attempts: Schema3.Array(
        Schema3.Struct({
          stepName: Schema3.String,
          stepIndex: Schema3.Number,
          provider: Schema3.String,
          model: Schema3.String,
          path: Schema3.Literal("preferred", "fallback"),
          status: Schema3.Literal("succeeded", "failed"),
          inputTokens: Schema3.optional(Schema3.Number),
          outputTokens: Schema3.optional(Schema3.Number),
          estimatedUsdCost: Schema3.optional(Schema3.Number),
          debitedCredits: Schema3.optional(Schema3.Number)
        })
      )
    })
  ),
  billing: Schema3.optional(
    Schema3.Struct({
      userId: Schema3.String,
      planId: Schema3.String,
      generationCycleId: Schema3.String
    })
  )
});
var AsyncRunResponseSchema = JobCreatedResponseSchema;
var decodeJobCreatedResponse = createSchemaDecoder("JobCreatedResponse", JobCreatedResponseSchema);
var decodeHealthCheckResponse = createSchemaDecoder("HealthCheckResponse", HealthCheckResponseSchema);
var decodeReadinessResponse = createSchemaDecoder("ReadinessResponse", ReadinessResponseSchema);

// ../../packages/contracts/src/execution/request.ts
import { Schema as Schema5 } from "effect";

// ../../packages/contracts/src/generation-intent.ts
import { Schema as Schema4 } from "effect";
var GenerationIntentSchema = Schema4.Literal(
  "share-idea",
  "explain-deeply",
  "engage-audience",
  "tell-story",
  "update-subscribers",
  "document-decision"
);
var GenerationLengthTierSchema = Schema4.Literal("short", "medium", "long");
var GenerationChannelSchema = Schema4.Literal(
  "unspecified",
  "professional-network",
  "blog",
  "email",
  "social"
);
var GenerationScopeSchema = Schema4.Struct({
  lengthTier: GenerationLengthTierSchema,
  channel: Schema4.optional(GenerationChannelSchema)
});
var BriefingValueSchema = Schema4.Union(
  Schema4.String,
  Schema4.Record({ key: Schema4.String, value: Schema4.Unknown })
);
var GenerationIntentRequestSchema = Schema4.Struct({
  intent: GenerationIntentSchema,
  scope: GenerationScopeSchema,
  briefing: Schema4.optional(BriefingValueSchema),
  importedContext: Schema4.optional(Schema4.String),
  language: Schema4.optional(Schema4.String),
  qualityMode: Schema4.optional(QualityModeSchema)
});

// ../../packages/contracts/src/execution/request.ts
var SimplifiedPipelineRequestSchema = Schema5.Struct({
  userId: Schema5.String,
  pipelineType: PipelineTypeSchema,
  briefing: Schema5.Union(Schema5.String, Schema5.Record({ key: Schema5.String, value: Schema5.Unknown })),
  importedContext: Schema5.optional(Schema5.String),
  context: Schema5.optional(Schema5.Record({ key: Schema5.String, value: Schema5.Unknown })),
  language: Schema5.optional(Schema5.String),
  qualityMode: Schema5.optional(QualityModeSchema),
  contentType: Schema5.optional(Schema5.String),
  model: Schema5.optional(Schema5.String),
  adapter: Schema5.optional(Schema5.String),
  quoteId: Schema5.optional(Schema5.String),
  previewRecommendation: Schema5.optional(PreviewRecommendationSchema),
  includeTrace: Schema5.optional(Schema5.Boolean),
  idempotencyKey: Schema5.optional(Schema5.String)
});
var ExplicitPipelineRequestSchema = Schema5.Struct({
  pipeline: PipelineDefinitionSchema,
  importedContext: Schema5.optional(Schema5.String),
  context: Schema5.optional(Schema5.Record({ key: Schema5.String, value: Schema5.Unknown })),
  inputs: Schema5.optional(Schema5.Record({ key: Schema5.String, value: Schema5.Unknown })),
  language: Schema5.optional(Schema5.String),
  qualityMode: Schema5.optional(QualityModeSchema),
  model: Schema5.optional(Schema5.String),
  adapter: Schema5.optional(Schema5.String),
  previewRecommendation: Schema5.optional(PreviewRecommendationSchema),
  includeTrace: Schema5.optional(Schema5.Boolean),
  idempotencyKey: Schema5.optional(Schema5.String)
});
var PipelineRequestSchema = Schema5.Union(
  SimplifiedPipelineRequestSchema,
  ExplicitPipelineRequestSchema
);
var MeExecutionRequestSchema = Schema5.Struct({
  contentType: Schema5.optional(Schema5.String),
  intent: Schema5.optional(GenerationIntentSchema),
  scope: Schema5.optional(GenerationScopeSchema),
  briefing: Schema5.Union(Schema5.String, Schema5.Record({ key: Schema5.String, value: Schema5.Unknown })),
  importedContext: Schema5.optional(Schema5.String),
  context: Schema5.optional(Schema5.Record({ key: Schema5.String, value: Schema5.Unknown })),
  language: Schema5.optional(Schema5.String),
  qualityMode: Schema5.optional(QualityModeSchema),
  model: Schema5.optional(Schema5.String),
  quoteId: Schema5.optional(Schema5.String),
  previewRecommendation: Schema5.optional(PreviewRecommendationSchema),
  includeTrace: Schema5.optional(Schema5.Boolean),
  idempotencyKey: Schema5.optional(Schema5.String)
});
var decodePipelineRequest = createSchemaDecoder("PipelineRequest", PipelineRequestSchema);
var decodeMeExecutionRequest = createSchemaDecoder("MeExecutionRequest", MeExecutionRequestSchema);

// ../../packages/contracts/src/execution/sse.ts
import { Schema as Schema6 } from "effect";
var SSEEventSchema = Schema6.Struct({
  type: Schema6.Literal("progress", "done", "error"),
  jobId: Schema6.String,
  payload: Schema6.Union(JobProgressSchema, JobResultSchema, JobErrorSchema)
});
var ExecutionSseEventSchema = Schema6.Struct({
  type: Schema6.Literal("progress", "done", "error"),
  payload: Schema6.Union(JobProgressSchema, JobResultSchema, JobErrorSchema),
  occurredAt: Schema6.String
});
var decodeExecutionSseEvent = createSchemaDecoder("ExecutionSseEvent", ExecutionSseEventSchema);

// ../../packages/contracts/src/execution/view.ts
import { Schema as Schema9 } from "effect";

// ../../packages/contracts/src/voice.ts
import { Schema as Schema8 } from "effect";

// ../../packages/contracts/src/reasoning.ts
import { Schema as Schema7 } from "effect";
var CertaintyLevelSchema = Schema7.Literal("low", "moderate", "high");
var JudgmentFrequencySchema = Schema7.Literal("low", "moderate", "high");
var ConclusionPaceSchema = Schema7.Literal("slow", "moderate", "fast");
var ReaderRelationshipSchema = Schema7.Literal(
  "peer",
  "mentor",
  "observer",
  "collaborator",
  "guide"
);
var AuthoritySourceSchema = Schema7.Literal(
  "personal_observation",
  "lived_experience",
  "data",
  "reference",
  "practice"
);
var FormatRegisterSchema = Schema7.Literal("formal", "informal", "technical", "conversational");
var OpeningStyleSchema = Schema7.Literal("direct", "contextual", "provocative");
var TechnicalDensitySchema = Schema7.Literal("low", "medium", "high");
var CoreReasoningSignatureSchema = Schema7.Struct({
  narrativeProse: Schema7.String,
  certaintyLevel: CertaintyLevelSchema,
  judgmentFrequency: JudgmentFrequencySchema,
  conclusionPace: ConclusionPaceSchema,
  readerRelationship: ReaderRelationshipSchema,
  authoritySource: AuthoritySourceSchema,
  derivedAntiPatterns: Schema7.Array(Schema7.String)
});
var FormatExpressionProfileSchema = Schema7.Struct({
  contentType: Schema7.String,
  narrativeProse: Schema7.String,
  register: FormatRegisterSchema,
  openingStyle: OpeningStyleSchema,
  technicalDensity: TechnicalDensitySchema
});
var ReasoningExtractionResultSchema = Schema7.Struct({
  core: CoreReasoningSignatureSchema,
  formatExpressions: Schema7.Record({ key: Schema7.String, value: FormatExpressionProfileSchema })
});
var TransitionFrequencySchema = Schema7.Literal("rare", "occasional", "common", "dominant");
var TransitionTendencySchema = Schema7.Struct({
  from: Schema7.String,
  to: Schema7.String,
  frequency: TransitionFrequencySchema
});
var EpistemicPostureSchema = Schema7.Literal(
  "exploratory",
  "investigative",
  "advocacy_mixed"
);
var TraitFrequencySchema = Schema7.Literal("rare", "occasional", "common", "dominant");
var OpeningModeSchema = Schema7.Literal("observation", "thesis", "mixed");
var PerspectiveShiftDensitySchema = Schema7.Literal("low", "moderate", "high");
var SelfQuestioningLevelSchema = Schema7.Literal("low", "moderate", "high");
var InsightTimingSchema = Schema7.Literal("early", "moderate", "late");
var ClosingModeSchema = Schema7.Literal("conclusion", "open_question", "mixed");
var TraitKeySchema = Schema7.Literal(
  "openingMode",
  "perspectiveShiftDensity",
  "usesCounterexamples",
  "selfQuestioning",
  "insightTiming",
  "usesAnalogies",
  "closingMode"
);
var TraitConfidenceSchema = Schema7.Literal("low", "medium", "high");
var TraitStatusSchema = Schema7.Literal("inferred", "confirmed", "disputed", "unknown");
var TraitValueSchema = Schema7.Union(
  OpeningModeSchema,
  PerspectiveShiftDensitySchema,
  TraitFrequencySchema,
  SelfQuestioningLevelSchema,
  InsightTimingSchema,
  ClosingModeSchema
);
var DevelopmentTraitsSchema = Schema7.Struct({
  openingMode: Schema7.optional(OpeningModeSchema),
  perspectiveShiftDensity: Schema7.optional(PerspectiveShiftDensitySchema),
  usesCounterexamples: Schema7.optional(TraitFrequencySchema),
  selfQuestioning: Schema7.optional(SelfQuestioningLevelSchema),
  insightTiming: Schema7.optional(InsightTimingSchema),
  usesAnalogies: Schema7.optional(TraitFrequencySchema),
  closingMode: Schema7.optional(ClosingModeSchema)
});
var TraitRecordSchema = Schema7.Struct({
  value: Schema7.optional(TraitValueSchema),
  confidence: TraitConfidenceSchema,
  status: TraitStatusSchema,
  evidenceExampleIds: Schema7.Array(Schema7.String)
});
var DevelopmentTraitProfileSchema = Schema7.Struct({
  traits: DevelopmentTraitsSchema,
  records: Schema7.Record({ key: TraitKeySchema, value: TraitRecordSchema })
});
var TraitEvidenceEntrySchema = Schema7.Struct({
  exampleIndex: Schema7.optional(Schema7.Number),
  exampleId: Schema7.optional(Schema7.String),
  value: Schema7.optional(TraitValueSchema)
});
var TraitEvidenceDraftSchema = Schema7.Record({
  key: TraitKeySchema,
  value: Schema7.Array(TraitEvidenceEntrySchema)
});
var TraitConfirmationResponseSchema = Schema7.Literal("confirmed", "rejected", "skipped");
var TraitConfirmationInputSchema = Schema7.Struct({
  traitKey: TraitKeySchema,
  response: TraitConfirmationResponseSchema
});
var TraitConfirmationRecordSchema = Schema7.Struct({
  response: TraitConfirmationResponseSchema,
  recordedAt: Schema7.String
});
var ArgumentDevelopmentSignatureSchema = Schema7.Struct({
  developmentProse: Schema7.String,
  moveLabels: Schema7.Array(Schema7.String),
  transitionTendencies: Schema7.Array(TransitionTendencySchema),
  epistemicPosture: EpistemicPostureSchema,
  structuralAntiPatterns: Schema7.Array(Schema7.String),
  traitProfile: Schema7.optional(DevelopmentTraitProfileSchema)
});
var ArgumentDevelopmentExtractionResultSchema = Schema7.Struct({
  development: ArgumentDevelopmentSignatureSchema,
  traits: Schema7.optional(DevelopmentTraitsSchema),
  traitEvidence: Schema7.optional(TraitEvidenceDraftSchema)
});
var UnifiedVoiceSignatureSchema = Schema7.Struct({
  core: CoreReasoningSignatureSchema,
  development: ArgumentDevelopmentSignatureSchema,
  formatExpressions: Schema7.Record({ key: Schema7.String, value: FormatExpressionProfileSchema })
});
var VoiceReasoningPresentationViewSchema = Schema7.Struct({
  core: CoreReasoningSignatureSchema,
  formatExpressions: Schema7.Array(FormatExpressionProfileSchema),
  reasoningVersion: Schema7.optional(Schema7.Number),
  development: Schema7.optional(ArgumentDevelopmentSignatureSchema),
  developmentImmature: Schema7.optional(Schema7.Boolean),
  traitProfile: Schema7.optional(DevelopmentTraitProfileSchema)
});
var decodeArgumentDevelopmentSignature = createSchemaDecoder(
  "ArgumentDevelopmentSignature",
  ArgumentDevelopmentSignatureSchema
);
var decodeArgumentDevelopmentExtractionResult = createSchemaDecoder(
  "ArgumentDevelopmentExtractionResult",
  ArgumentDevelopmentExtractionResultSchema
);
var decodeUnifiedVoiceSignature = createSchemaDecoder(
  "UnifiedVoiceSignature",
  UnifiedVoiceSignatureSchema
);
var decodeCoreReasoningSignature = createSchemaDecoder(
  "CoreReasoningSignature",
  CoreReasoningSignatureSchema
);
var decodeFormatExpressionProfile = createSchemaDecoder(
  "FormatExpressionProfile",
  FormatExpressionProfileSchema
);
var decodeReasoningExtractionResult = createSchemaDecoder(
  "ReasoningExtractionResult",
  ReasoningExtractionResultSchema
);
var decodeVoiceReasoningPresentationView = createSchemaDecoder(
  "VoiceReasoningPresentationView",
  VoiceReasoningPresentationViewSchema
);
var decodeDevelopmentTraitProfile = createSchemaDecoder(
  "DevelopmentTraitProfile",
  DevelopmentTraitProfileSchema
);
var decodeTraitConfirmationInput = createSchemaDecoder(
  "TraitConfirmationInput",
  TraitConfirmationInputSchema
);

// ../../packages/contracts/src/voice.ts
var VoiceProfileConfidenceSchema = Schema8.Literal("low", "medium", "high");
var VoiceAdaptationModeSchema = Schema8.Literal("conservative", "standard");
var VoiceExampleStateSchema = Schema8.Literal("active", "excluded");
var AttentionLevelSchema = Schema8.Literal("low", "medium", "high");
var ReasonCodeSchema = Schema8.Literal(
  "insufficient_examples",
  "insufficient_diversity",
  "conflicting_signals",
  "processing_failed",
  "plan_restriction",
  "subscription_inactive",
  "feature_flag_disabled",
  "rebuild_failed",
  "rebuild_in_progress",
  "reasoning_extraction_failed",
  "development_extraction_failed",
  "voice_signature_reconciliation_failed",
  "language_conflict",
  "too_many_pinned_examples",
  "invalid_example_payload",
  "batch_expired"
);
var NextActionCodeSchema = Schema8.Literal(
  "add_more_examples",
  "add_examples_from_other_content_types",
  "review_conflicting_examples",
  "remove_pinned_example",
  "retry_batch_commit",
  "wait_for_profile_update",
  "upgrade_plan"
);
var ContributionCodeSchema = Schema8.Literal(
  "reinforces_informal_tone",
  "reinforces_formal_tone",
  "useful_for_linkedin",
  "useful_for_newsletter",
  "useful_for_blog",
  "supports_first_person_voice",
  "redundant_with_recent_examples",
  "signals_negative_pattern"
);
var AttentionReasonCodeSchema = Schema8.Literal(
  "redundant_example",
  "too_short",
  "low_specificity",
  "format_specific_only",
  "conflicts_with_profile",
  "language_conflict",
  "excluded_from_profile"
);
var FallbackReasonCodeSchema = Schema8.Literal("rebuild_failed", "rebuild_in_progress");
var VoiceCoverageSchema = Schema8.Literal("low", "medium", "high");
var VoiceSignalSummarySchema = Schema8.Struct({
  styleMarkers: Schema8.Array(Schema8.String),
  rules: Schema8.Array(Schema8.String),
  antiPatterns: Schema8.Array(Schema8.String),
  reasoningApplied: Schema8.optional(Schema8.Boolean),
  certaintyLevel: Schema8.optional(Schema8.Literal("low", "moderate", "high")),
  conclusionPace: Schema8.optional(Schema8.Literal("slow", "moderate", "fast")),
  developmentApplied: Schema8.optional(Schema8.Boolean),
  epistemicPosture: Schema8.optional(EpistemicPostureSchema),
  developmentTraitsApplied: Schema8.optional(Schema8.Boolean),
  openingMode: Schema8.optional(OpeningModeSchema),
  closingMode: Schema8.optional(ClosingModeSchema),
  insightTiming: Schema8.optional(InsightTimingSchema)
});
var VoiceProfileViewSchema = Schema8.Struct({
  userId: Schema8.String,
  snapshotId: Schema8.String,
  version: Schema8.Number,
  confidence: VoiceProfileConfidenceSchema,
  adaptationMode: VoiceAdaptationModeSchema,
  primaryLanguage: Schema8.String,
  tone: Schema8.String,
  cadence: Schema8.String,
  description: Schema8.optional(Schema8.String),
  lexicon: Schema8.Array(Schema8.String),
  constraints: Schema8.Array(Schema8.String),
  styleMarkers: Schema8.Array(Schema8.String),
  rules: Schema8.Array(Schema8.String),
  antiPatterns: Schema8.Array(Schema8.String)
});
var VoiceMaterialBaseBreakdownSchema = Schema8.Struct({
  totalExamples: Schema8.Number,
  activeExamples: Schema8.Number,
  excludedExamples: Schema8.Number,
  pinnedExamples: Schema8.Number,
  byClassification: Schema8.Record({ key: Schema8.String, value: Schema8.Number }),
  byContentType: Schema8.Record({ key: Schema8.String, value: Schema8.Number }),
  byLanguage: Schema8.Record({ key: Schema8.String, value: Schema8.Number })
});
var VoiceCoverageItemViewSchema = Schema8.Struct({
  contentType: Schema8.String,
  coverage: VoiceCoverageSchema,
  reasonCodes: Schema8.Array(ReasonCodeSchema)
});
var VoiceProfileDiagnosticsViewSchema = Schema8.Struct({
  updating: Schema8.Boolean,
  activeVersion: Schema8.Number,
  pendingVersion: Schema8.optional(Schema8.Number),
  summary: Schema8.optional(Schema8.String),
  reasonCodes: Schema8.Array(ReasonCodeSchema),
  nextActionCodes: Schema8.Array(NextActionCodeSchema),
  bestCoveredContentTypes: Schema8.Array(VoiceCoverageItemViewSchema),
  underrepresentedContentTypes: Schema8.Array(VoiceCoverageItemViewSchema),
  pendingRebuild: Schema8.Struct({
    status: Schema8.Literal("idle", "in_progress", "failed"),
    reasonCode: Schema8.optional(ReasonCodeSchema),
    nextActionCodes: Schema8.Array(NextActionCodeSchema)
  }),
  traitConfirmations: Schema8.optional(
    Schema8.Record({ key: Schema8.String, value: TraitConfirmationRecordSchema })
  )
});
var VoiceProfileScreenViewSchema = Schema8.Struct({
  profile: VoiceProfileViewSchema,
  diagnostics: VoiceProfileDiagnosticsViewSchema,
  materialBase: VoiceMaterialBaseBreakdownSchema,
  reasoning: Schema8.optional(VoiceReasoningPresentationViewSchema)
});
var VoiceExampleEvaluationViewSchema = Schema8.Struct({
  systemWeight: Schema8.Number,
  attentionLevel: AttentionLevelSchema,
  attentionReasonCodes: Schema8.Array(AttentionReasonCodeSchema),
  contributionCode: ContributionCodeSchema,
  contributionPreview: Schema8.String,
  userPinned: Schema8.Boolean
});
var VoiceExampleListItemViewSchema = Schema8.Struct({
  exampleId: Schema8.String,
  version: Schema8.Number,
  state: VoiceExampleStateSchema,
  text: Schema8.String,
  previewText: Schema8.String,
  language: Schema8.String,
  channel: Schema8.optional(Schema8.String),
  format: Schema8.optional(Schema8.String),
  explicitContentType: Schema8.optional(Schema8.String),
  effectiveContentTypeHints: Schema8.Array(Schema8.String),
  classificationLabels: Schema8.Array(Schema8.String),
  pinned: Schema8.Boolean,
  pendingProfileImpact: Schema8.Boolean,
  targetProfileVersion: Schema8.optional(Schema8.Number),
  evaluation: VoiceExampleEvaluationViewSchema,
  createdAt: Schema8.String,
  updatedAt: Schema8.String
});
var VoiceExamplesPageViewSchema = Schema8.Struct({
  items: Schema8.Array(VoiceExampleListItemViewSchema),
  total: Schema8.Number,
  limit: Schema8.Number,
  offset: Schema8.Number
});
var VoiceExampleCreateInputSchema = Schema8.Struct({
  text: Schema8.String,
  language: Schema8.optional(Schema8.String),
  channel: Schema8.optional(Schema8.String),
  format: Schema8.optional(Schema8.String),
  explicitContentType: Schema8.optional(Schema8.String),
  context: Schema8.optional(Schema8.String),
  antiPatternsExplicit: Schema8.optional(Schema8.Array(Schema8.String)),
  userLabels: Schema8.optional(Schema8.Array(Schema8.String)),
  pinned: Schema8.optional(Schema8.Boolean),
  performance: Schema8.optional(
    Schema8.Struct({
      channel: Schema8.optional(Schema8.String),
      publishedAt: Schema8.optional(Schema8.String),
      selfRating: Schema8.optional(Schema8.Number),
      likes: Schema8.optional(Schema8.Number),
      comments: Schema8.optional(Schema8.Number)
    })
  )
});
var VoiceExampleUpdateInputSchema = Schema8.Struct({
  text: Schema8.optional(Schema8.String),
  language: Schema8.optional(Schema8.String),
  channel: Schema8.optional(Schema8.String),
  format: Schema8.optional(Schema8.String),
  explicitContentType: Schema8.optional(Schema8.String),
  context: Schema8.optional(Schema8.String),
  antiPatternsExplicit: Schema8.optional(Schema8.Array(Schema8.String)),
  userLabels: Schema8.optional(Schema8.Array(Schema8.String)),
  pinned: Schema8.optional(Schema8.Boolean),
  state: Schema8.optional(VoiceExampleStateSchema)
});
var VoiceExampleBatchCreateInputSchema = Schema8.Struct({
  expiresAt: Schema8.optional(Schema8.String)
});
var VoiceExampleBatchItemInputSchema = Schema8.Struct({
  clientItemId: Schema8.String,
  input: VoiceExampleCreateInputSchema
});
var VoiceExampleBatchItemsInputSchema = Schema8.Struct({
  items: Schema8.Array(VoiceExampleBatchItemInputSchema)
});
var VoiceExampleBatchItemResultViewSchema = Schema8.Struct({
  clientItemId: Schema8.String,
  accepted: Schema8.Boolean,
  exampleId: Schema8.optional(Schema8.String),
  reasonCode: Schema8.optional(ReasonCodeSchema),
  message: Schema8.optional(Schema8.String)
});
var VoiceExampleBatchViewSchema = Schema8.Struct({
  batchId: Schema8.String,
  status: Schema8.Literal("open", "committed", "expired"),
  expiresAt: Schema8.String,
  acceptedItems: Schema8.Number,
  rejectedItems: Schema8.Number,
  itemResults: Schema8.Array(VoiceExampleBatchItemResultViewSchema)
});
var VoiceExampleBatchCommitResultViewSchema = Schema8.Struct({
  batchId: Schema8.String,
  committedAt: Schema8.String,
  acceptedItems: Schema8.Number,
  rejectedItems: Schema8.Number,
  targetProfileVersion: Schema8.optional(Schema8.Number)
});
var decodeVoiceExampleListItemView = createSchemaDecoder(
  "VoiceExampleListItemView",
  VoiceExampleListItemViewSchema
);
var VoiceTrainingConsentStatusViewSchema = Schema8.Struct({
  granted: Schema8.Boolean,
  grantedAt: Schema8.optional(Schema8.String),
  revokedAt: Schema8.optional(Schema8.String)
});
var decodeVoiceProfileScreenView = createSchemaDecoder("VoiceProfileScreenView", VoiceProfileScreenViewSchema);
var decodeVoiceProfileDiagnosticsView = createSchemaDecoder(
  "VoiceProfileDiagnosticsView",
  VoiceProfileDiagnosticsViewSchema
);
var decodeVoiceTrainingConsentStatusView = createSchemaDecoder(
  "VoiceTrainingConsentStatusView",
  VoiceTrainingConsentStatusViewSchema
);
var decodeVoiceExamplesPageView = createSchemaDecoder("VoiceExamplesPageView", VoiceExamplesPageViewSchema);
var decodeVoiceExampleCreateInput = createSchemaDecoder("VoiceExampleCreateInput", VoiceExampleCreateInputSchema);
var decodeVoiceExampleUpdateInput = createSchemaDecoder("VoiceExampleUpdateInput", VoiceExampleUpdateInputSchema);
var decodeVoiceExampleBatchCreateInput = createSchemaDecoder(
  "VoiceExampleBatchCreateInput",
  VoiceExampleBatchCreateInputSchema
);
var decodeVoiceExampleBatchItemsInput = createSchemaDecoder(
  "VoiceExampleBatchItemsInput",
  VoiceExampleBatchItemsInputSchema
);
var decodeVoiceExampleBatchView = createSchemaDecoder("VoiceExampleBatchView", VoiceExampleBatchViewSchema);
var decodeVoiceExampleBatchCommitResultView = createSchemaDecoder(
  "VoiceExampleBatchCommitResultView",
  VoiceExampleBatchCommitResultViewSchema
);

// ../../packages/contracts/src/execution/view.ts
var PendingVoiceProfileRebuildViewSchema = Schema9.Struct({
  status: Schema9.Literal("idle", "in_progress", "failed"),
  reasonCode: Schema9.optional(ReasonCodeSchema),
  nextActionCodes: Schema9.Array(NextActionCodeSchema)
});
var ExecutionVoiceMetadataViewSchema = Schema9.Struct({
  voiceProfileConfidence: VoiceProfileConfidenceSchema,
  voiceAdaptationMode: VoiceAdaptationModeSchema,
  voiceProfileVersionUsed: Schema9.Number,
  pendingVoiceProfileVersion: Schema9.optional(Schema9.Number),
  voiceProfileSnapshotId: Schema9.String,
  usedFallbackVoiceProfile: Schema9.Boolean,
  fallbackReasonCode: Schema9.optional(FallbackReasonCodeSchema),
  appliedSignals: VoiceSignalSummarySchema,
  pendingProfileRebuild: PendingVoiceProfileRebuildViewSchema
});
var JobStatusResponseSchema = Schema9.Struct({
  jobId: Schema9.String,
  status: JobStatusSchema,
  contentType: Schema9.String,
  progress: Schema9.NullOr(JobProgressSchema),
  result: Schema9.NullOr(JobResultSchema),
  error: Schema9.NullOr(JobErrorSchema),
  createdAt: Schema9.String,
  completedAt: Schema9.NullOr(Schema9.String),
  voice: Schema9.optional(ExecutionVoiceMetadataViewSchema),
  userId: Schema9.optional(Schema9.String)
});
var SyncRunResponseSchema = Schema9.Struct({
  mode: ExecutionModeSchema,
  adapter: Schema9.String,
  model: Schema9.String,
  content: Schema9.String,
  contentType: Schema9.String,
  pipelineName: Schema9.String,
  qualityMode: QualityModeSchema,
  controls: Schema9.optional(ExecutionControlsSchema),
  telemetry: Schema9.optional(ExecutionTelemetrySchema),
  voice: Schema9.optional(ExecutionVoiceMetadataViewSchema),
  trace: Schema9.optional(Schema9.Unknown),
  idempotencyKey: Schema9.optional(Schema9.String)
});
var RunResponseSchema = Schema9.Union(SyncRunResponseSchema, AsyncRunResponseSchema);
var SyncExecutionViewSchema = Schema9.Struct({
  mode: Schema9.Literal("sync"),
  contentType: Schema9.String,
  pipelineName: Schema9.String,
  content: Schema9.String,
  adapter: Schema9.String,
  model: Schema9.String,
  qualityMode: QualityModeSchema,
  controls: Schema9.optional(ExecutionControlsSchema),
  telemetry: Schema9.optional(ExecutionTelemetrySchema),
  trace: Schema9.optional(Schema9.Unknown),
  voice: ExecutionVoiceMetadataViewSchema,
  idempotencyKey: Schema9.optional(Schema9.String)
});
var QueuedExecutionViewSchema = Schema9.Struct({
  jobId: Schema9.String,
  status: Schema9.Literal("queued"),
  contentType: Schema9.String,
  estimatedSteps: Schema9.Number,
  createdAt: Schema9.String,
  voice: ExecutionVoiceMetadataViewSchema
});
var ExecutionStatusViewSchema = Schema9.Struct({
  jobId: Schema9.String,
  status: JobStatusSchema,
  contentType: Schema9.String,
  progress: Schema9.NullOr(JobProgressSchema),
  result: Schema9.NullOr(JobResultSchema),
  error: Schema9.NullOr(JobErrorSchema),
  createdAt: Schema9.String,
  completedAt: Schema9.NullOr(Schema9.String),
  voice: Schema9.optional(ExecutionVoiceMetadataViewSchema)
});
var ExecutionsPageViewSchema = Schema9.Struct({
  items: Schema9.Array(ExecutionStatusViewSchema),
  total: Schema9.Number,
  limit: Schema9.Number,
  offset: Schema9.Number
});
var ExecutionTransitionStartedSchema = Schema9.Struct({
  type: Schema9.Literal("started"),
  executionId: Schema9.String,
  snapshot: Schema9.optional(ExecutionStatusViewSchema),
  progress: JobProgressSchema,
  occurredAt: Schema9.String
});
var ExecutionTransitionProgressedSchema = Schema9.Struct({
  type: Schema9.Literal("progressed"),
  executionId: Schema9.String,
  snapshot: Schema9.optional(ExecutionStatusViewSchema),
  progress: JobProgressSchema,
  occurredAt: Schema9.String
});
var ExecutionTransitionCompletedSchema = Schema9.Struct({
  type: Schema9.Literal("completed"),
  executionId: Schema9.String,
  snapshot: Schema9.optional(ExecutionStatusViewSchema),
  result: JobResultSchema,
  occurredAt: Schema9.String
});
var ExecutionTransitionFailedSchema = Schema9.Struct({
  type: Schema9.Literal("failed"),
  executionId: Schema9.String,
  snapshot: Schema9.optional(ExecutionStatusViewSchema),
  error: JobErrorSchema,
  occurredAt: Schema9.String
});
var ExecutionTransitionSchema = Schema9.Union(
  ExecutionTransitionStartedSchema,
  ExecutionTransitionProgressedSchema,
  ExecutionTransitionCompletedSchema,
  ExecutionTransitionFailedSchema
);
var ObservationFailureReasonSchema = Schema9.Literal(
  "reconnect_exhausted",
  "poll_fallback_exhausted",
  "timeout"
);
var ObservationFailureSchema = Schema9.Struct({
  reason: ObservationFailureReasonSchema,
  message: Schema9.String
});
var decodeRunResponse = createSchemaDecoder("RunResponse", RunResponseSchema);
var decodeJobStatusResponse = createSchemaDecoder("JobStatusResponse", JobStatusResponseSchema);
var decodeSyncExecutionView = createSchemaDecoder("SyncExecutionView", SyncExecutionViewSchema);
var decodeQueuedExecutionView = createSchemaDecoder("QueuedExecutionView", QueuedExecutionViewSchema);
var decodeExecutionStatusView = createSchemaDecoder("ExecutionStatusView", ExecutionStatusViewSchema);
var decodeExecutionsPageView = createSchemaDecoder("ExecutionsPageView", ExecutionsPageViewSchema);
var decodeExecutionTransition = createSchemaDecoder("ExecutionTransition", ExecutionTransitionSchema);

// ../../packages/contracts/src/content-types.ts
var ContentTypeDefinitionSchema = Schema10.Struct({
  id: Schema10.String,
  label: Schema10.String,
  steps: Schema10.Array(Schema10.String),
  defaultLanguage: Schema10.String,
  inputSchema: Schema10.Record({ key: Schema10.String, value: Schema10.Unknown })
});
var LanguageProfileSummarySchema = Schema10.Struct({
  code: Schema10.String,
  name: Schema10.String,
  defaults: Schema10.NullOr(
    Schema10.Struct({
      tone: Schema10.optional(Schema10.String),
      constraints: Schema10.optional(Schema10.Array(Schema10.String))
    })
  )
});
var ContentTypeFieldTypeSchema = Schema10.Literal("string", "text", "number", "boolean", "enum", "object", "array");
var ContentTypeFieldViewSchema = Schema10.Struct({
  key: Schema10.String,
  label: Schema10.String,
  type: ContentTypeFieldTypeSchema,
  required: Schema10.Boolean,
  highImpact: Schema10.Boolean,
  helpText: Schema10.optional(Schema10.String),
  options: Schema10.optional(Schema10.Array(Schema10.String))
});
var BriefingGuidanceViewSchema = Schema10.Struct({
  objective: Schema10.String,
  tips: Schema10.Array(Schema10.String),
  exampleBriefing: Schema10.String,
  commonMistakes: Schema10.Array(Schema10.String)
});
var ContentTypeCatalogItemViewSchema = Schema10.Struct({
  id: Schema10.String,
  label: Schema10.String,
  available: Schema10.Boolean,
  deprecated: Schema10.optional(Schema10.Boolean),
  reasonCode: Schema10.optional(ReasonCodeSchema),
  defaultLanguage: Schema10.String,
  supportedLanguages: Schema10.Array(Schema10.String),
  steps: Schema10.Array(Schema10.String),
  inputSchema: Schema10.Array(ContentTypeFieldViewSchema),
  briefingGuidance: BriefingGuidanceViewSchema,
  briefingGuidanceByLanguage: Schema10.optional(
    Schema10.Record({ key: Schema10.String, value: BriefingGuidanceViewSchema })
  )
});
var ContentTypeCatalogCommercialSchema = Schema10.Struct({
  planTier: Schema10.String,
  allowedQualityModes: Schema10.Array(QualityModeSchema)
});
var ContentTypeCatalogViewSchema = Schema10.Struct({
  items: Schema10.Array(ContentTypeCatalogItemViewSchema),
  commercial: Schema10.optional(ContentTypeCatalogCommercialSchema)
});
var decodeContentTypeCatalogView = createSchemaDecoder("ContentTypeCatalogView", ContentTypeCatalogViewSchema);

// ../../packages/contracts/src/generation-intents-catalog.ts
import { Schema as Schema11 } from "effect";
var GenerationIntentCatalogItemSchema = Schema11.Struct({
  id: GenerationIntentSchema,
  label: Schema11.String,
  description: Schema11.String,
  defaultLengthTier: GenerationLengthTierSchema,
  featured: Schema11.Boolean,
  inputSchema: Schema11.Array(ContentTypeFieldViewSchema),
  briefingGuidance: BriefingGuidanceViewSchema
});
var GenerationIntentCatalogViewSchema = Schema11.Struct({
  items: Schema11.Array(GenerationIntentCatalogItemSchema)
});
var decodeGenerationIntentCatalogView = createSchemaDecoder(
  "GenerationIntentCatalogView",
  GenerationIntentCatalogViewSchema
);

// ../../packages/contracts/src/generation-intent-legacy-map.ts
var PHASE1_LEGACY_INTENT_MAP = {
  "share-idea": { short: "linkedin-post", medium: "linkedin-post", long: "long-form-blog" },
  "explain-deeply": { short: "validation-post", medium: "architecture-post", long: "long-form-blog" },
  "engage-audience": { short: "validation-post", medium: "linkedin-post", long: "newsletter" },
  "tell-story": { short: "twitter-thread", medium: "twitter-thread", long: "long-form-blog" },
  "update-subscribers": { short: "linkedin-post", medium: "newsletter", long: "newsletter" },
  "document-decision": { short: "validation-post", medium: "architecture-post", long: "architecture-post" }
};
var PHASE1_WORD_TARGETS = {
  short: { min: 150, max: 400 },
  medium: { min: 400, max: 1200 },
  long: { min: 1200, max: 3500 }
};
function resolvePhase1LegacyContentTypeId(intent, lengthTier) {
  return PHASE1_LEGACY_INTENT_MAP[intent][lengthTier];
}

// ../../packages/contracts/src/generation-compositor.ts
import { Schema as Schema12 } from "effect";
var PlanSignatureSchema = Schema12.Literal(
  "short-piece",
  "long-piece",
  "serial-piece",
  "edition-piece"
);
var PlannedStepSchema = Schema12.Struct({
  name: Schema12.String,
  skill: Schema12.String,
  execution: Schema12.Literal("local", "llm"),
  routingProfile: Schema12.optional(Schema12.String)
});
var ExecutionPlanParametersSchema = Schema12.Struct({
  wordTarget: Schema12.Struct({ min: Schema12.Number, max: Schema12.Number }),
  expressionProfile: Schema12.String,
  intent: GenerationIntentSchema,
  lengthTier: GenerationLengthTierSchema
});
var ExecutionPlanSchema = Schema12.Struct({
  planId: Schema12.String,
  planSignature: PlanSignatureSchema,
  steps: Schema12.Array(PlannedStepSchema),
  parameters: ExecutionPlanParametersSchema
});
var CompositorMetadataSchema = Schema12.Struct({
  planId: Schema12.String,
  planSignature: PlanSignatureSchema,
  expressionProfile: Schema12.String,
  lengthTier: GenerationLengthTierSchema,
  wordTarget: Schema12.Struct({ min: Schema12.Number, max: Schema12.Number })
});

// ../../packages/contracts/src/generate-prefill.ts
import { Schema as Schema13 } from "effect";
var GeneratePrefillSchema = Schema13.Struct({
  contentType: Schema13.optional(Schema13.String),
  intent: Schema13.optional(GenerationIntentSchema),
  scope: Schema13.optional(GenerationScopeSchema),
  briefing: Schema13.optional(Schema13.Record({ key: Schema13.String, value: Schema13.Unknown })),
  language: Schema13.optional(Schema13.String),
  qualityMode: Schema13.optional(QualityModeSchema),
  importedContext: Schema13.optional(Schema13.String)
});
var decodeGeneratePrefill = createSchemaDecoder("GeneratePrefill", GeneratePrefillSchema);

// ../../packages/contracts/src/generation-preview.ts
import { Schema as Schema14 } from "effect";
var PreviewBriefingSchema = Schema14.Union(
  Schema14.String,
  Schema14.Record({ key: Schema14.String, value: Schema14.Unknown })
);
var GenerationPreviewRequestSchema = Schema14.Struct({
  contentType: Schema14.optional(Schema14.String),
  intent: Schema14.optional(GenerationIntentSchema),
  scope: Schema14.optional(GenerationScopeSchema),
  briefing: Schema14.optional(PreviewBriefingSchema),
  importedContext: Schema14.optional(Schema14.String),
  language: Schema14.optional(Schema14.String),
  qualityMode: Schema14.optional(QualityModeSchema),
  includeRecommendation: Schema14.optional(Schema14.Boolean)
});
var GenerationPreviewContentTypeOptionSchema = Schema14.Struct({
  id: Schema14.String,
  label: Schema14.String,
  allowed: Schema14.Boolean,
  blockedReason: Schema14.optional(Schema14.String)
});
var GenerationPreviewQualityModeOptionSchema = Schema14.Struct({
  id: QualityModeSchema,
  allowed: Schema14.Boolean,
  blockedReason: Schema14.optional(Schema14.String),
  creditPrice: Schema14.Number,
  recommended: Schema14.optional(Schema14.Boolean),
  recommendation: Schema14.optional(
    Schema14.Struct({
      reasonCodes: Schema14.Array(Schema14.String),
      explanation: Schema14.String
    })
  )
});
var GenerationPreviewRecommendationSchema = Schema14.Struct({
  qualityMode: QualityModeSchema,
  reasonCodes: Schema14.Array(Schema14.String),
  explanation: Schema14.String
});
var GenerationPricingSnapshotSchema = Schema14.Struct({
  quoteId: Schema14.String,
  policyVersion: Schema14.String,
  contentType: Schema14.String,
  qualityMode: QualityModeSchema,
  creditPrice: Schema14.Number,
  planSignature: Schema14.optional(PlanSignatureSchema),
  lengthTier: Schema14.optional(GenerationLengthTierSchema)
});
var GenerationPreviewResolvedIntentSchema = Schema14.Struct({
  intent: GenerationIntentSchema,
  scope: GenerationScopeSchema,
  wordTargetMin: Schema14.Number,
  wordTargetMax: Schema14.Number
});
var GenerationPreviewResponseSchema = Schema14.Struct({
  pricingSnapshot: GenerationPricingSnapshotSchema,
  currentBalance: Schema14.Number,
  projectedBalanceAfterGeneration: Schema14.Number,
  recommendation: Schema14.optional(GenerationPreviewRecommendationSchema),
  resolvedIntent: Schema14.optional(GenerationPreviewResolvedIntentSchema),
  compositor: Schema14.optional(CompositorMetadataSchema),
  options: Schema14.Struct({
    contentTypes: Schema14.Array(GenerationPreviewContentTypeOptionSchema),
    qualityModes: Schema14.Array(GenerationPreviewQualityModeOptionSchema)
  })
});
var decodeGenerationPreviewRequest = createSchemaDecoder(
  "GenerationPreviewRequest",
  GenerationPreviewRequestSchema
);
var decodeGenerationPreviewResponse = createSchemaDecoder(
  "GenerationPreviewResponse",
  GenerationPreviewResponseSchema
);

// ../../packages/contracts/src/billing.ts
import { Schema as Schema15 } from "effect";
var BillingLedgerEntryTypeSchema = Schema15.Literal(
  "grant_cycle",
  "grant_rollover",
  "grant_topup",
  "reserve",
  "capture",
  "release",
  "refund",
  "expire"
);
var BillingReferenceTypeSchema = Schema15.Literal(
  "subscription_cycle",
  "generation_cycle",
  "topup",
  "manual_adjustment",
  "usage_record"
);
var BillingRoundingSchema = Schema15.Literal("ceil_1_decimal");
var BillingModeCreditPolicySchema = Schema15.Struct({
  fast: Schema15.Number,
  balanced: Schema15.Number,
  strict: Schema15.Number
});
var BillingCreditPolicySchema = Schema15.Struct({
  baseCredits: BillingModeCreditPolicySchema,
  retrySurcharge: BillingModeCreditPolicySchema,
  rounding: BillingRoundingSchema,
  rolloverPercent: Schema15.Number,
  rolloverCap: Schema15.Number
});
var BillingLedgerEntrySchema = Schema15.Struct({
  subscriptionId: Schema15.String,
  accountId: Schema15.String,
  entryType: BillingLedgerEntryTypeSchema,
  creditsDelta: Schema15.Number,
  balanceAfter: Schema15.Number,
  referenceType: BillingReferenceTypeSchema,
  referenceId: Schema15.String,
  idempotencyKey: Schema15.String,
  metadata: Schema15.Record({ key: Schema15.String, value: Schema15.Unknown }),
  createdAt: Schema15.String
});
var BillingGenerationReservationStatusSchema = Schema15.Literal("reserved", "captured", "released");
var BillingGenerationReservationSchema = Schema15.Struct({
  reservationId: Schema15.String,
  generationCycleId: Schema15.String,
  subscriptionId: Schema15.String,
  accountId: Schema15.String,
  qualityMode: QualityModeSchema,
  retryCount: Schema15.Number,
  reservedCredits: Schema15.Number,
  status: BillingGenerationReservationStatusSchema,
  idempotencyKey: Schema15.String,
  metadata: Schema15.Record({ key: Schema15.String, value: Schema15.Unknown }),
  createdAt: Schema15.String,
  updatedAt: Schema15.String
});
var BillingWalletSchema = Schema15.Struct({
  accountId: Schema15.String,
  subscriptionId: Schema15.String,
  activeCycleId: Schema15.NullOr(Schema15.String),
  availableCredits: Schema15.Number,
  reservedCredits: Schema15.Number,
  pendingCredits: Schema15.Number,
  lifetimeGrantedCredits: Schema15.Number,
  lifetimeDebitedCredits: Schema15.Number
});
var BillingTopUpPackageSchema = Schema15.Struct({
  id: Schema15.String,
  credits: Schema15.Number,
  priceCents: Schema15.Number,
  currency: Schema15.String,
  description: Schema15.optional(Schema15.String)
});
var BillingCycleStateSchema = Schema15.Struct({
  cycleId: Schema15.String,
  subscriptionId: Schema15.String,
  accountId: Schema15.String,
  openedAt: Schema15.String,
  closedAt: Schema15.NullOr(Schema15.String),
  rolloverCredits: Schema15.Number,
  grantedCredits: Schema15.Number,
  expiredCredits: Schema15.Number
});
var decodeBillingLedgerEntry = createSchemaDecoder("BillingLedgerEntry", BillingLedgerEntrySchema);
var decodeBillingWallet = createSchemaDecoder("BillingWallet", BillingWalletSchema);
var decodeBillingGenerationReservation = createSchemaDecoder(
  "BillingGenerationReservation",
  BillingGenerationReservationSchema
);

// ../../packages/contracts/src/billing-checkout.ts
import { Schema as Schema16 } from "effect";
var BillingCurrencySchema = Schema16.Literal("BRL", "USD");
var BillingProductKindSchema = Schema16.Literal("subscription", "topup");
var BillingCheckoutPeriodSchema = Schema16.Literal("monthly", "annual", "one_time");
var BillingPaymentMethodSchema = Schema16.Literal("card", "pix");
var BillingCheckoutRequestSchema = Schema16.Struct({
  productKind: BillingProductKindSchema,
  internalRef: Schema16.String,
  currency: BillingCurrencySchema,
  billingPeriod: BillingCheckoutPeriodSchema,
  paymentMethod: Schema16.optional(BillingPaymentMethodSchema)
});
var BillingCheckoutResponseSchema = Schema16.Struct({
  url: Schema16.String,
  intentId: Schema16.String,
  gateway: Schema16.Literal("stripe", "asaas")
});
var BillingEntitlementViewSchema = Schema16.Struct({
  planId: Schema16.String,
  tier: Schema16.String,
  status: Schema16.String,
  availableCredits: Schema16.Number,
  monthlyCreditsRemaining: Schema16.Number,
  currency: Schema16.optional(BillingCurrencySchema)
});
var decodeBillingCheckoutRequest = createSchemaDecoder(
  "BillingCheckoutRequest",
  BillingCheckoutRequestSchema
);
var decodeBillingCheckoutResponse = createSchemaDecoder(
  "BillingCheckoutResponse",
  BillingCheckoutResponseSchema
);
var decodeBillingEntitlementView = createSchemaDecoder(
  "BillingEntitlementView",
  BillingEntitlementViewSchema
);

// src/product/generation/compositor/scale.ts
function resolveWordTarget(lengthTier) {
  return PHASE1_WORD_TARGETS[lengthTier];
}
function gateHeavySteps(lengthTier) {
  return lengthTier === "long";
}

// src/product/generation/compositor/compositor-planner.ts
var STRUCTURE_STEP = {
  name: "structure",
  skill: "structure",
  execution: "llm",
  routingProfile: "premium-llm"
};
var HOOK_STEP = {
  name: "hook",
  skill: "hook",
  execution: "llm",
  routingProfile: "linkedin-llm"
};
var TIGHTEN_STEP = {
  name: "tighten",
  skill: "tighten",
  execution: "llm",
  routingProfile: "default-llm"
};
function cloneSteps(steps) {
  return steps.map((step) => ({ ...step }));
}
function insertBeforeDraft(steps, stepToInsert) {
  if (steps.some((step) => step.name === stepToInsert.name)) {
    return steps;
  }
  const draftIndex = steps.findIndex((step) => step.name === "draft");
  if (draftIndex === -1) {
    return [...steps, stepToInsert];
  }
  return [...steps.slice(0, draftIndex), stepToInsert, ...steps.slice(draftIndex)];
}
function insertBeforeSanitize(steps, stepToInsert) {
  if (steps.some((step) => step.name === stepToInsert.name)) {
    return steps;
  }
  const sanitizeIndex = steps.findIndex((step) => step.name === "sanitize");
  if (sanitizeIndex === -1) {
    return [...steps, stepToInsert];
  }
  return [...steps.slice(0, sanitizeIndex), stepToInsert, ...steps.slice(sanitizeIndex)];
}
function removeStep(steps, name) {
  return steps.filter((step) => step.name !== name);
}
function applyIntentPatches(steps, intent, lengthTier) {
  const rhetorical = getRhetoricalProfile(intent);
  if (!rhetorical.structureStep) {
    return steps;
  }
  if (lengthTier !== "medium" && lengthTier !== "long") {
    return steps;
  }
  return insertBeforeDraft(steps, STRUCTURE_STEP);
}
function applyChannelPatches(steps, channel) {
  switch (channel) {
    case "email":
      return insertBeforeSanitize(removeStep(steps, "hook"), TIGHTEN_STEP);
    case "professional-network":
      return insertBeforeDraft(steps, HOOK_STEP);
    case "social":
      return insertBeforeDraft(steps, HOOK_STEP);
    case "blog":
      return steps;
    case "unspecified":
      return steps;
    default: {
      const _exhaustive = channel;
      return _exhaustive;
    }
  }
}
function applyScaleGates(steps, lengthTier) {
  if (gateHeavySteps(lengthTier)) {
    return steps;
  }
  return steps.filter((step) => step.name !== "research" && step.name !== "outline");
}
function resolvePlanSignature(steps, basePresetId) {
  return resolveDominantPlanSignature(steps, basePresetId);
}
function createPlanId(input) {
  const channel = input.scope.channel ?? "unspecified";
  const payload = `${input.intent}:${input.scope.lengthTier}:${channel}:${input.qualityMode}`;
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}
function planGeneration(input) {
  const channel = input.scope.channel ?? "unspecified";
  const { lengthTier } = input.scope;
  const basePresetId = pickBasePreset({
    intent: input.intent,
    lengthTier,
    channel: input.scope.channel
  });
  let steps = cloneSteps(getPreset(basePresetId).steps);
  steps = applyIntentPatches(steps, input.intent, lengthTier);
  steps = applyChannelPatches(steps, channel);
  steps = applyScaleGates(steps, lengthTier);
  return {
    planId: createPlanId(input),
    planSignature: resolvePlanSignature(steps, basePresetId),
    steps,
    parameters: {
      wordTarget: resolveWordTarget(lengthTier),
      expressionProfile: resolveExpressionProfile({ intent: input.intent, channel }),
      intent: input.intent,
      lengthTier
    }
  };
}

// src/product/generation/compositor/plan-materializer.ts
function materializeCompositorPipeline(plan) {
  return {
    name: plan.planSignature,
    steps: plan.steps.map((step) => ({
      name: step.name,
      skill: step.skill,
      config: {
        executionType: step.execution,
        ...step.routingProfile ? { routingProfile: step.routingProfile } : {}
      }
    }))
  };
}

// src/product/generation/intent-resolver.ts
function resolveGenerationIntent(input) {
  const channelHint = input.scope.channel ?? "unspecified";
  const legacyContentTypeId = resolvePhase1LegacyContentTypeId(input.intent, input.scope.lengthTier);
  return {
    intent: input.intent,
    scope: input.scope,
    legacyContentTypeId,
    wordTarget: PHASE1_WORD_TARGETS[input.scope.lengthTier],
    channelHint
  };
}

// src/product/generation/resolve-generation-target.ts
function resolveGenerationTarget(request) {
  if (request.intent && request.scope) {
    const resolved = resolveGenerationIntent({ intent: request.intent, scope: request.scope });
    if (request.compositorEnabled) {
      const plan = planGeneration({
        intent: request.intent,
        scope: request.scope,
        qualityMode: request.qualityMode ?? "balanced"
      });
      const pipeline = materializeCompositorPipeline(plan);
      const compositorResult = {
        contentTypeId: plan.planSignature,
        resolvedIntent: resolved,
        compositor: { plan, pipeline }
      };
      if (request.contentType && request.contentType !== resolved.legacyContentTypeId) {
        return Effect2.zipRight(
          Effect2.logWarning("Ignoring legacy contentType in favor of compositor planning", {
            intent: request.intent,
            scope: request.scope,
            contentType: request.contentType,
            planSignature: plan.planSignature,
            resolvedContentType: resolved.legacyContentTypeId
          }),
          Effect2.succeed({
            ...compositorResult,
            ignoredLegacyContentType: request.contentType
          })
        );
      }
      return Effect2.succeed(compositorResult);
    }
    if (request.contentType && request.contentType !== resolved.legacyContentTypeId) {
      return Effect2.zipRight(
        Effect2.logWarning("Ignoring legacy contentType in favor of intent resolution", {
          intent: request.intent,
          scope: request.scope,
          contentType: request.contentType,
          resolvedContentType: resolved.legacyContentTypeId
        }),
        Effect2.succeed({
          contentTypeId: resolved.legacyContentTypeId,
          resolvedIntent: resolved,
          ignoredLegacyContentType: request.contentType
        })
      );
    }
    return Effect2.succeed({
      contentTypeId: resolved.legacyContentTypeId,
      resolvedIntent: resolved
    });
  }
  if (request.contentType) {
    return Effect2.succeed({ contentTypeId: request.contentType });
  }
  return Effect2.fail(
    new BackendValidationError({
      message: "Either intent and scope or contentType must be provided"
    })
  );
}

// src/config/config-env.ts
import { config as loadDotEnv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// src/internal/utils.ts
function dedupeStrings(values) {
  return [...new Set(values)];
}

// src/config/config-env.ts
function loadBackendEnvironment(options = {}) {
  const env = options.env ?? process.env;
  const mode = options.mode ?? inferBackendEnvLoadMode(env);
  if (mode === "production") {
    return env;
  }
  const envPaths = resolveBackendEnvPaths(options);
  if (envPaths.length > 0) {
    loadDotEnv({
      processEnv: env,
      path: [...envPaths],
      override: options.override
    });
  }
  return env;
}
function inferBackendEnvLoadMode(envVars) {
  return envVars.NODE_ENV === "production" ? "production" : "local";
}
function resolveBackendEnvPaths(options) {
  if (options.envFilePath) {
    return [options.envFilePath];
  }
  const cwd = options.cwd ?? process.cwd();
  const candidates = [
    resolve(cwd, ".env.local"),
    resolve(cwd, ".env"),
    resolve(backendPackageRoot, ".env.local"),
    resolve(backendPackageRoot, ".env"),
    resolve(repositoryRoot, ".env.local"),
    resolve(repositoryRoot, ".env")
  ];
  return dedupeStrings(candidates.filter((candidate) => existsSync(candidate)));
}
var currentFilePath = fileURLToPath(import.meta.url);
var currentDirectory = dirname(currentFilePath);
var backendPackageRoot = resolve(currentDirectory, "../..");
var repositoryRoot = resolve(currentDirectory, "../../../..");

// scripts/calibration/resolve-repo-path.ts
import { existsSync as existsSync2 } from "node:fs";
import { dirname as dirname2, resolve as resolve2 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
function findMonorepoRoot(startDir) {
  let dir = startDir;
  while (true) {
    if (existsSync2(resolve2(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = dirname2(dir);
    if (parent === dir) {
      return startDir;
    }
    dir = parent;
  }
}
var repoRoot = findMonorepoRoot(dirname2(fileURLToPath2(import.meta.url)));
function resolveCalibrationRepoPath(pathArg) {
  return pathArg.startsWith("/") ? pathArg : resolve2(repoRoot, pathArg);
}
function calibrationRepoRoot() {
  return repoRoot;
}

// scripts/calibration/load-env.ts
function loadCalibrationEnvironment() {
  loadBackendEnvironment({
    mode: "local",
    cwd: calibrationRepoRoot()
  });
}

// scripts/calibration/briefings.ts
var CALIBRATION_BRIEFINGS = {
  "share-idea": {
    topic: "Delegar decis\xF5es de produto sem perder alinhamento",
    audience: "lideran\xE7as de produto",
    angle: "Clareza de crit\xE9rios antes de delegar"
  },
  "explain-deeply": {
    topic: "Como estruturar decis\xF5es de arquitetura em times pequenos",
    thesis: "Decis\xF5es expl\xEDcitas reduzem retrabalho",
    audience: "engenheiros de software"
  },
  "engage-audience": {
    topic: "Monorepos atrasam times pequenos?",
    hypothesis: "A coordena\xE7\xE3o extra pode custar mais do que a duplica\xE7\xE3o evitada",
    question: "Voc\xEA j\xE1 viu monorepo acelerar ou travar seu time?"
  },
  "tell-story": {
    topic: "A primeira vez que deleguei uma decis\xE3o importante",
    hook: "Eu achava que controle era cuidado",
    beats: ["O conflito", "O aprendizado", "O novo ritual"]
  },
  "update-subscribers": {
    topic: "Novidades do produto neste m\xEAs",
    audience: "assinantes da newsletter",
    promise: "O que mudou e por qu\xEA",
    sections: ["Lan\xE7amentos", "Pr\xF3ximos passos"]
  },
  "document-decision": {
    systemContext: "Precisamos separar orquestra\xE7\xE3o de produto da execu\xE7\xE3o de runtime",
    tradeoffs: ["Mais contratos", "Menos drift", "Mais arquivos"],
    decision: "Adotar snapshots imut\xE1veis entre preview e execu\xE7\xE3o"
  }
};

// scripts/compositor/parity-fixtures.ts
var COMPOSITOR_PARITY_QUALITY_MODE = "balanced";
function fixture(args) {
  const lengthTier = args.scope.lengthTier;
  const channel = args.scope.channel ?? "unspecified";
  return {
    id: args.id,
    label: `${args.intent} / ${lengthTier} / ${channel}`,
    intent: args.intent,
    scope: args.scope,
    qualityMode: COMPOSITOR_PARITY_QUALITY_MODE,
    briefing: { ...CALIBRATION_BRIEFINGS[args.intent] },
    expectedLegacyContentType: resolvePhase1LegacyContentTypeId(args.intent, lengthTier),
    expectedCompositorPlanSignature: args.expectedCompositorPlanSignature,
    expectedExpressionProfile: args.expectedExpressionProfile
  };
}
var COMPOSITOR_PARITY_FIXTURES = [
  fixture({
    id: "share-idea-short-professional-network",
    intent: "share-idea",
    scope: { lengthTier: "short", channel: "professional-network" },
    expectedCompositorPlanSignature: "short-piece",
    expectedExpressionProfile: "professional-share-idea"
  }),
  fixture({
    id: "share-idea-medium-email",
    intent: "share-idea",
    scope: { lengthTier: "medium", channel: "email" },
    expectedCompositorPlanSignature: "edition-piece",
    expectedExpressionProfile: "email-share-idea"
  }),
  fixture({
    id: "explain-deeply-long-blog",
    intent: "explain-deeply",
    scope: { lengthTier: "long", channel: "blog" },
    expectedCompositorPlanSignature: "long-piece",
    expectedExpressionProfile: "blog-explain-deeply"
  }),
  fixture({
    id: "document-decision-medium-unspecified",
    intent: "document-decision",
    scope: { lengthTier: "medium" },
    expectedCompositorPlanSignature: "edition-piece",
    expectedExpressionProfile: "document-decision-default"
  }),
  fixture({
    id: "engage-audience-short-social",
    intent: "engage-audience",
    scope: { lengthTier: "short", channel: "social" },
    expectedCompositorPlanSignature: "short-piece",
    expectedExpressionProfile: "social-engage-audience"
  }),
  fixture({
    id: "tell-story-medium-unspecified",
    intent: "tell-story",
    scope: { lengthTier: "medium" },
    expectedCompositorPlanSignature: "serial-piece",
    expectedExpressionProfile: "tell-story-default"
  })
];
function findCompositorParityFixture(id) {
  return COMPOSITOR_PARITY_FIXTURES.find((entry) => entry.id === id);
}

// scripts/compositor-parity-harness.ts
var { Client } = pg;
function parseArgs(argv) {
  const dryRunOnly = argv.includes("--dry-run");
  const executeHttp = argv.includes("--execute");
  const fixtureId = argv.includes("--fixture") ? argv[argv.indexOf("--fixture") + 1] : void 0;
  const fromFixtureId = argv.includes("--from") ? argv[argv.indexOf("--from") + 1] : void 0;
  const outPath = argv.includes("--out") ? resolveCalibrationRepoPath(argv[argv.indexOf("--out") + 1] ?? "docs/superpowers/reports/compositor-parity-report.md") : resolveCalibrationRepoPath("docs/superpowers/reports/compositor-parity-report.md");
  return { dryRunOnly, executeHttp, fixtureId, fromFixtureId, outPath };
}
function selectParityFixtures(args) {
  if (args.fixtureId) {
    const fixture2 = findCompositorParityFixture(args.fixtureId);
    if (!fixture2) {
      throw new Error(`Unknown --fixture id "${args.fixtureId}"`);
    }
    return [fixture2];
  }
  if (args.fromFixtureId) {
    const startIndex = COMPOSITOR_PARITY_FIXTURES.findIndex((fixture2) => fixture2.id === args.fromFixtureId);
    if (startIndex === -1) {
      throw new Error(`Unknown --from fixture id "${args.fromFixtureId}"`);
    }
    return COMPOSITOR_PARITY_FIXTURES.slice(startIndex);
  }
  return COMPOSITOR_PARITY_FIXTURES;
}
function fixtureTimeoutMs(fixture2, defaultTimeoutMs) {
  if (fixture2.expectedCompositorPlanSignature === "long-piece" && fixture2.scope.lengthTier === "long") {
    return Number(process.env.COMPOSITOR_PARITY_LONG_TIMEOUT_MS ?? String(defaultTimeoutMs * 2));
  }
  return defaultTimeoutMs;
}
function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
async function sleep(ms) {
  await new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}
function compareFixturePlans(fixture2) {
  const legacy = Effect3.runSync(
    resolveGenerationTarget({
      intent: fixture2.intent,
      scope: fixture2.scope,
      compositorEnabled: false,
      qualityMode: fixture2.qualityMode
    })
  );
  const compositorPlan = planGeneration({
    intent: fixture2.intent,
    scope: fixture2.scope,
    qualityMode: fixture2.qualityMode
  });
  return {
    fixtureId: fixture2.id,
    label: fixture2.label,
    legacyContentType: legacy.contentTypeId,
    compositorPlanSignature: compositorPlan.planSignature,
    legacyStepCount: null,
    compositorStepCount: compositorPlan.steps.length,
    compositorStepNames: compositorPlan.steps.map((step) => step.name),
    expressionProfile: compositorPlan.parameters.expressionProfile,
    planSignatureMatchesExpectation: compositorPlan.planSignature === fixture2.expectedCompositorPlanSignature && legacy.contentTypeId === fixture2.expectedLegacyContentType && compositorPlan.parameters.expressionProfile === fixture2.expectedExpressionProfile
  };
}
async function fetchJson(baseUrl, token, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let json = null;
  try {
    json = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: response.status, json };
}
async function pollJobDone(databaseUrl, jobId, pollMs, timeoutMs) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const started = Date.now();
  try {
    while (Date.now() - started < timeoutMs) {
      const result = await client.query(
        `SELECT data FROM jobs WHERE id = $1`,
        [jobId]
      );
      const data = result.rows[0]?.data ?? void 0;
      const status = typeof data?.status === "string" ? data.status : null;
      if (status === "done") {
        return { status: "done", data };
      }
      if (status === "failed") {
        const errorMessage = readJobFailureMessage(data);
        return { status: "failed", data, errorMessage };
      }
      await sleep(pollMs);
    }
    throw new Error(`Timed out waiting for job ${jobId} after ${timeoutMs}ms`);
  } finally {
    await client.end();
  }
}
function readJobFailureMessage(jobData) {
  const error = jobData?.error;
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  if (error && typeof error === "object") {
    const message = error.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  const result = jobData?.result;
  if (result && typeof result === "object") {
    const message = result.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return void 0;
}
function readUsdCost(jobData) {
  const result = jobData?.result;
  if (!result || typeof result !== "object") {
    return void 0;
  }
  const metadata = result.metadata;
  const telemetry = metadata?.telemetry;
  if (!telemetry || typeof telemetry !== "object") {
    return void 0;
  }
  const cost = telemetry.cost?.estimatedUsdCost;
  return typeof cost === "number" ? cost : void 0;
}
function readPlanSignature(jobData) {
  const result = jobData?.result;
  if (!result || typeof result !== "object") {
    return void 0;
  }
  const metadata = result.metadata;
  if (!metadata || typeof metadata !== "object") {
    return void 0;
  }
  const direct = metadata.planSignature;
  if (typeof direct === "string") {
    return direct;
  }
  const telemetry = metadata.telemetry;
  if (telemetry && typeof telemetry === "object") {
    const pricing = telemetry.pricing?.planSignature;
    if (typeof pricing === "string") {
      return pricing;
    }
  }
  return void 0;
}
async function runHttpFixture(args) {
  const previewBody = {
    intent: args.fixture.intent,
    scope: args.fixture.scope,
    qualityMode: args.fixture.qualityMode,
    language: "pt-BR",
    briefing: args.fixture.briefing
  };
  const preview = await fetchJson(args.baseUrl, args.token, "/api/generation-preview", previewBody);
  if (preview.status !== 200) {
    return {
      mode: "compositor",
      fixtureId: args.fixture.id,
      status: "failed",
      error: `preview ${preview.status}: ${JSON.stringify(preview.json)}`
    };
  }
  const previewJson = preview.json;
  const quoteId = previewJson.pricingSnapshot?.quoteId;
  if (!quoteId) {
    return {
      mode: "compositor",
      fixtureId: args.fixture.id,
      status: "failed",
      error: "preview missing quoteId"
    };
  }
  if (typeof previewJson.projectedBalanceAfterGeneration === "number" && previewJson.projectedBalanceAfterGeneration < 0) {
    return {
      mode: "compositor",
      fixtureId: args.fixture.id,
      status: "failed",
      error: `insufficient credits: price=${previewJson.pricingSnapshot?.creditPrice ?? "?"} balance=${previewJson.currentBalance ?? "?"} projected=${previewJson.projectedBalanceAfterGeneration}`
    };
  }
  const executeBody = {
    ...previewBody,
    quoteId,
    idempotencyKey: `compositor-parity:${args.fixture.id}:${Date.now()}`
  };
  const execute = await fetchJson(args.baseUrl, args.token, "/me/executions/run", executeBody);
  if (execute.status !== 200 && execute.status !== 202) {
    return {
      mode: "compositor",
      fixtureId: args.fixture.id,
      status: "failed",
      error: `execute ${execute.status}: ${JSON.stringify(execute.json)}`
    };
  }
  const executeJson = execute.json;
  const jobId = executeJson.jobId;
  if (!jobId) {
    return {
      mode: "compositor",
      fixtureId: args.fixture.id,
      status: "failed",
      error: "execute missing jobId"
    };
  }
  if (executeJson.status !== "queued" && execute.status !== 202) {
    return {
      mode: "compositor",
      fixtureId: args.fixture.id,
      jobId,
      status: "done",
      planSignature: previewJson.compositor?.planSignature ?? previewJson.pricingSnapshot?.contentType,
      legacyContentType: previewJson.pricingSnapshot?.contentType
    };
  }
  const final = await pollJobDone(args.databaseUrl, jobId, args.pollMs, args.timeoutMs);
  const progressHistory = Array.isArray(final.data?.progressHistory) ? final.data.progressHistory : [];
  return {
    mode: "compositor",
    fixtureId: args.fixture.id,
    jobId,
    status: final.status,
    usdCost: readUsdCost(final.data),
    stepCount: progressHistory.length,
    planSignature: readPlanSignature(final.data) ?? previewJson.compositor?.planSignature,
    legacyContentType: previewJson.pricingSnapshot?.contentType,
    error: final.status === "failed" ? final.errorMessage ?? "job failed" : void 0
  };
}
function renderReport(input) {
  const lines = [
    "# Compositor parity report",
    "",
    `Generated: ${input.generatedAt}`,
    "",
    "## Dry plan comparison (local)",
    "",
    "| Fixture | Legacy contentType | Compositor plan | Steps | Expression | Expectations OK |",
    "|---------|-------------------|-----------------|-------|------------|-----------------|"
  ];
  for (const row of input.dryComparisons) {
    lines.push(
      `| ${row.label} | ${row.legacyContentType} | ${row.compositorPlanSignature} | ${row.compositorStepCount} (${row.compositorStepNames.join(" \u2192 ")}) | ${row.expressionProfile} | ${row.planSignatureMatchesExpectation ? "yes" : "**no**"} |`
    );
  }
  lines.push(
    "",
    "## Optional HTTP execution",
    "",
    input.httpEnabled ? "HTTP runs executed against the live API (server flag determines legacy vs compositor path)." : "Skipped \u2014 set `CALIBRATION_ACCESS_TOKEN` and `DATABASE_URL`, then rerun with `--execute`.",
    ""
  );
  if (input.httpRuns.length > 0) {
    lines.push(
      "| Fixture | Job ID | Status | planSignature | USD est. | Progress events |",
      "|---------|--------|--------|---------------|----------|-----------------|"
    );
    for (const run of input.httpRuns) {
      lines.push(
        `| ${run.fixtureId} | ${run.jobId ?? "\u2014"} | ${run.status} | ${run.planSignature ?? "\u2014"} | ${run.usdCost?.toFixed(4) ?? "\u2014"} | ${run.stepCount ?? "\u2014"} |`
      );
    }
    lines.push("");
  }
  lines.push(
    "## Manual rubric (founder \u2014 fill after reading outputs)",
    "",
    "Score each fixture 1\u20135:",
    "",
    "1. **Intent fit** \u2014 does the output match the stated goal?",
    "2. **Structure** \u2014 appropriate sections/beats for channel?",
    "3. **Voice fidelity** \u2014 matches voice profile?",
    "4. **Factual discipline** \u2014 no hallucinated claims beyond briefing?",
    "5. **Cost band** \u2014 USD within \xB130% of legacy median for comparable intent class?",
    "",
    "| Fixture | Intent fit | Structure | Voice | Factual | Cost | Notes |",
    "|---------|------------|-----------|-------|---------|------|-------|"
  );
  for (const row of input.dryComparisons) {
    lines.push(`| ${row.label} | | | | | | |`);
  }
  lines.push("");
  return `${lines.join("\n")}
`;
}
async function main() {
  const { dryRunOnly, executeHttp, fixtureId, fromFixtureId, outPath } = parseArgs(process.argv.slice(2));
  const fixtures = selectParityFixtures({ fixtureId, fromFixtureId });
  if (executeHttp && !dryRunOnly) {
    loadCalibrationEnvironment();
  }
  const generatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const dryComparisons = fixtures.map((fixture2) => compareFixturePlans(fixture2));
  const httpRuns = [];
  console.log("Compositor parity harness");
  console.log(`Fixtures: ${fixtures.length}`);
  console.log(`Dry comparisons: ${dryComparisons.filter((row) => row.planSignatureMatchesExpectation).length}/${dryComparisons.length} matched expectations`);
  for (const row of dryComparisons) {
    console.log(
      `[dry] ${row.fixtureId}: legacy=${row.legacyContentType} compositor=${row.compositorPlanSignature} (${row.compositorStepCount} steps)`
    );
  }
  const token = process.env.CALIBRATION_ACCESS_TOKEN?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const httpEnabled = Boolean(token && databaseUrl && executeHttp && !dryRunOnly);
  if (executeHttp && !dryRunOnly) {
    if (!token || !databaseUrl) {
      const missing = [
        !token ? "CALIBRATION_ACCESS_TOKEN" : null,
        !databaseUrl ? "DATABASE_URL" : null
      ].filter((name) => name !== null);
      console.warn(
        `Skipping HTTP runs \u2014 missing ${missing.join(" and ")} (expected in ${calibrationRepoRoot()}/.env).`
      );
    } else {
      const baseUrl = (process.env.CALIBRATION_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
      const pollMs = Number(process.env.COMPOSITOR_PARITY_POLL_MS ?? "5000");
      const timeoutMs = Number(process.env.COMPOSITOR_PARITY_TIMEOUT_MS ?? "900000");
      const delayMs = Number(process.env.COMPOSITOR_PARITY_DELAY_MS ?? "3000");
      console.log(`HTTP execution enabled (base URL: ${baseUrl})`);
      for (const fixture2 of fixtures) {
        console.log(`[http] ${fixture2.id}`);
        try {
          const result = await runHttpFixture({
            baseUrl,
            token: requireEnv("CALIBRATION_ACCESS_TOKEN"),
            databaseUrl: requireEnv("DATABASE_URL"),
            fixture: fixture2,
            pollMs,
            timeoutMs: fixtureTimeoutMs(fixture2, timeoutMs)
          });
          httpRuns.push(result);
          console.log(
            `  \u2192 ${result.status}${result.jobId ? ` (${result.jobId})` : ""}${result.planSignature ? ` plan=${result.planSignature}` : ""}${result.error ? ` \u2014 ${result.error}` : ""}`
          );
        } catch (error) {
          httpRuns.push({
            mode: "compositor",
            fixtureId: fixture2.id,
            status: "failed",
            error: error instanceof Error ? error.message : String(error)
          });
          console.log(
            `  \u2192 failed \u2014 ${error instanceof Error ? error.message : String(error)}`
          );
        }
        if (delayMs > 0) {
          await sleep(delayMs);
        }
      }
    }
  }
  mkdirSync(outPath.slice(0, outPath.lastIndexOf("/")), { recursive: true });
  writeFileSync(
    outPath,
    renderReport({
      generatedAt,
      dryComparisons,
      httpRuns,
      httpEnabled
    })
  );
  console.log(`Report written to ${outPath}`);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
//# sourceMappingURL=compositor-parity-harness.js.map
