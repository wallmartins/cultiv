#!/usr/bin/env tsx

// scripts/run-calibration-sweep.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname as dirname2, resolve as resolve2 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
import pg from "pg";

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

// scripts/calibration/load-env.ts
function loadCalibrationEnvironment() {
  loadBackendEnvironment({ mode: "local" });
}

// ../../packages/contracts/src/errors.ts
import { Data } from "effect";
var ContractDecodeError = class extends Data.TaggedError("ContractDecodeError") {
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
  "newsletter"
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
      plannedCreditPrice: Schema3.optional(Schema3.Number),
      observedDebitedCredits: Schema3.Number,
      observedUsdCost: Schema3.Number
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
function resolvePhase1LegacyContentTypeId(intent, lengthTier) {
  return PHASE1_LEGACY_INTENT_MAP[intent][lengthTier];
}

// ../../packages/contracts/src/generate-prefill.ts
import { Schema as Schema12 } from "effect";
var GeneratePrefillSchema = Schema12.Struct({
  contentType: Schema12.optional(Schema12.String),
  intent: Schema12.optional(GenerationIntentSchema),
  scope: Schema12.optional(GenerationScopeSchema),
  briefing: Schema12.optional(Schema12.Record({ key: Schema12.String, value: Schema12.Unknown })),
  language: Schema12.optional(Schema12.String),
  qualityMode: Schema12.optional(QualityModeSchema),
  importedContext: Schema12.optional(Schema12.String)
});
var decodeGeneratePrefill = createSchemaDecoder("GeneratePrefill", GeneratePrefillSchema);

// ../../packages/contracts/src/generation-preview.ts
import { Schema as Schema13 } from "effect";
var PreviewBriefingSchema = Schema13.Union(
  Schema13.String,
  Schema13.Record({ key: Schema13.String, value: Schema13.Unknown })
);
var GenerationPreviewRequestSchema = Schema13.Struct({
  contentType: Schema13.optional(Schema13.String),
  intent: Schema13.optional(GenerationIntentSchema),
  scope: Schema13.optional(GenerationScopeSchema),
  briefing: Schema13.optional(PreviewBriefingSchema),
  importedContext: Schema13.optional(Schema13.String),
  language: Schema13.optional(Schema13.String),
  qualityMode: Schema13.optional(QualityModeSchema),
  includeRecommendation: Schema13.optional(Schema13.Boolean)
});
var GenerationPreviewContentTypeOptionSchema = Schema13.Struct({
  id: Schema13.String,
  label: Schema13.String,
  allowed: Schema13.Boolean,
  blockedReason: Schema13.optional(Schema13.String)
});
var GenerationPreviewQualityModeOptionSchema = Schema13.Struct({
  id: QualityModeSchema,
  allowed: Schema13.Boolean,
  blockedReason: Schema13.optional(Schema13.String),
  creditPrice: Schema13.Number,
  recommended: Schema13.optional(Schema13.Boolean),
  recommendation: Schema13.optional(
    Schema13.Struct({
      reasonCodes: Schema13.Array(Schema13.String),
      explanation: Schema13.String
    })
  )
});
var GenerationPreviewRecommendationSchema = Schema13.Struct({
  qualityMode: QualityModeSchema,
  reasonCodes: Schema13.Array(Schema13.String),
  explanation: Schema13.String
});
var GenerationPricingSnapshotSchema = Schema13.Struct({
  quoteId: Schema13.String,
  policyVersion: Schema13.String,
  contentType: Schema13.String,
  qualityMode: QualityModeSchema,
  creditPrice: Schema13.Number
});
var GenerationPreviewResolvedIntentSchema = Schema13.Struct({
  intent: GenerationIntentSchema,
  scope: GenerationScopeSchema,
  wordTargetMin: Schema13.Number,
  wordTargetMax: Schema13.Number
});
var GenerationPreviewResponseSchema = Schema13.Struct({
  pricingSnapshot: GenerationPricingSnapshotSchema,
  currentBalance: Schema13.Number,
  projectedBalanceAfterGeneration: Schema13.Number,
  recommendation: Schema13.optional(GenerationPreviewRecommendationSchema),
  resolvedIntent: Schema13.optional(GenerationPreviewResolvedIntentSchema),
  options: Schema13.Struct({
    contentTypes: Schema13.Array(GenerationPreviewContentTypeOptionSchema),
    qualityModes: Schema13.Array(GenerationPreviewQualityModeOptionSchema)
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
import { Schema as Schema14 } from "effect";
var BillingLedgerEntryTypeSchema = Schema14.Literal(
  "grant_cycle",
  "grant_rollover",
  "grant_topup",
  "reserve",
  "capture",
  "release",
  "refund",
  "expire"
);
var BillingReferenceTypeSchema = Schema14.Literal(
  "subscription_cycle",
  "generation_cycle",
  "topup",
  "manual_adjustment",
  "usage_record"
);
var BillingRoundingSchema = Schema14.Literal("ceil_1_decimal");
var BillingModeCreditPolicySchema = Schema14.Struct({
  fast: Schema14.Number,
  balanced: Schema14.Number,
  strict: Schema14.Number
});
var BillingCreditPolicySchema = Schema14.Struct({
  baseCredits: BillingModeCreditPolicySchema,
  retrySurcharge: BillingModeCreditPolicySchema,
  rounding: BillingRoundingSchema,
  rolloverPercent: Schema14.Number,
  rolloverCap: Schema14.Number
});
var BillingLedgerEntrySchema = Schema14.Struct({
  subscriptionId: Schema14.String,
  accountId: Schema14.String,
  entryType: BillingLedgerEntryTypeSchema,
  creditsDelta: Schema14.Number,
  balanceAfter: Schema14.Number,
  referenceType: BillingReferenceTypeSchema,
  referenceId: Schema14.String,
  idempotencyKey: Schema14.String,
  metadata: Schema14.Record({ key: Schema14.String, value: Schema14.Unknown }),
  createdAt: Schema14.String
});
var BillingGenerationReservationStatusSchema = Schema14.Literal("reserved", "captured", "released");
var BillingGenerationReservationSchema = Schema14.Struct({
  reservationId: Schema14.String,
  generationCycleId: Schema14.String,
  subscriptionId: Schema14.String,
  accountId: Schema14.String,
  qualityMode: QualityModeSchema,
  retryCount: Schema14.Number,
  reservedCredits: Schema14.Number,
  status: BillingGenerationReservationStatusSchema,
  idempotencyKey: Schema14.String,
  metadata: Schema14.Record({ key: Schema14.String, value: Schema14.Unknown }),
  createdAt: Schema14.String,
  updatedAt: Schema14.String
});
var BillingWalletSchema = Schema14.Struct({
  accountId: Schema14.String,
  subscriptionId: Schema14.String,
  activeCycleId: Schema14.NullOr(Schema14.String),
  availableCredits: Schema14.Number,
  reservedCredits: Schema14.Number,
  pendingCredits: Schema14.Number,
  lifetimeGrantedCredits: Schema14.Number,
  lifetimeDebitedCredits: Schema14.Number
});
var BillingTopUpPackageSchema = Schema14.Struct({
  id: Schema14.String,
  credits: Schema14.Number,
  priceCents: Schema14.Number,
  currency: Schema14.String,
  description: Schema14.optional(Schema14.String)
});
var BillingCycleStateSchema = Schema14.Struct({
  cycleId: Schema14.String,
  subscriptionId: Schema14.String,
  accountId: Schema14.String,
  openedAt: Schema14.String,
  closedAt: Schema14.NullOr(Schema14.String),
  rolloverCredits: Schema14.Number,
  grantedCredits: Schema14.Number,
  expiredCredits: Schema14.Number
});
var decodeBillingLedgerEntry = createSchemaDecoder("BillingLedgerEntry", BillingLedgerEntrySchema);
var decodeBillingWallet = createSchemaDecoder("BillingWallet", BillingWalletSchema);
var decodeBillingGenerationReservation = createSchemaDecoder(
  "BillingGenerationReservation",
  BillingGenerationReservationSchema
);

// ../../packages/contracts/src/billing-checkout.ts
import { Schema as Schema15 } from "effect";
var BillingCurrencySchema = Schema15.Literal("BRL", "USD");
var BillingProductKindSchema = Schema15.Literal("subscription", "topup");
var BillingCheckoutPeriodSchema = Schema15.Literal("monthly", "annual", "one_time");
var BillingPaymentMethodSchema = Schema15.Literal("card", "pix");
var BillingCheckoutRequestSchema = Schema15.Struct({
  productKind: BillingProductKindSchema,
  internalRef: Schema15.String,
  currency: BillingCurrencySchema,
  billingPeriod: BillingCheckoutPeriodSchema,
  paymentMethod: Schema15.optional(BillingPaymentMethodSchema)
});
var BillingCheckoutResponseSchema = Schema15.Struct({
  url: Schema15.String,
  intentId: Schema15.String,
  gateway: Schema15.Literal("stripe", "asaas")
});
var BillingEntitlementViewSchema = Schema15.Struct({
  planId: Schema15.String,
  tier: Schema15.String,
  status: Schema15.String,
  availableCredits: Schema15.Number,
  monthlyCreditsRemaining: Schema15.Number,
  currency: Schema15.optional(BillingCurrencySchema)
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

// scripts/calibration/sweep-matrix.ts
var INTENTS = [
  "share-idea",
  "explain-deeply",
  "engage-audience",
  "tell-story",
  "update-subscribers",
  "document-decision"
];
var TIERS = ["short", "medium", "long"];
var MODES = ["fast", "balanced", "strict"];
function buildFullIntentTierModeGrid(repeats) {
  const cells = [];
  for (const intent of INTENTS) {
    for (const lengthTier of TIERS) {
      for (const qualityMode of MODES) {
        cells.push({
          id: `${intent}:${lengthTier}:${qualityMode}`,
          intent,
          lengthTier,
          qualityMode,
          repeats,
          expectedLegacyContentType: resolvePhase1LegacyContentTypeId(intent, lengthTier)
        });
      }
    }
  }
  return cells;
}
function buildTierPipelineVarianceGrid(repeats) {
  const byIntent = /* @__PURE__ */ new Map();
  for (const intent of INTENTS) {
    byIntent.set(
      intent,
      new Set(TIERS.map((tier) => resolvePhase1LegacyContentTypeId(intent, tier)))
    );
  }
  const cells = [];
  for (const intent of INTENTS) {
    if ((byIntent.get(intent)?.size ?? 0) <= 1) {
      continue;
    }
    for (const lengthTier of TIERS) {
      cells.push({
        id: `${intent}:${lengthTier}:balanced`,
        intent,
        lengthTier,
        qualityMode: "balanced",
        repeats,
        expectedLegacyContentType: resolvePhase1LegacyContentTypeId(intent, lengthTier)
      });
    }
  }
  return cells;
}
function resolveSweepProfile(profileId, repeats) {
  switch (profileId) {
    case "tier-variance":
      return {
        id: profileId,
        description: "Intent \xD7 tier (balanced) where tier changes legacy pipeline \u2014 Option B viability proxy",
        cells: buildTierPipelineVarianceGrid(repeats)
      };
    case "full":
    default:
      return {
        id: profileId,
        description: "All intent \xD7 tier \xD7 qualityMode combinations",
        cells: buildFullIntentTierModeGrid(repeats)
      };
  }
}
function countSweepRuns(cells) {
  return cells.reduce((total, cell) => total + cell.repeats, 0);
}

// scripts/run-calibration-sweep.ts
var repoRoot = resolve2(fileURLToPath2(new URL("../../..", import.meta.url)));
var { Client } = pg;
function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const profileId = argv.includes("--profile") ? argv[argv.indexOf("--profile") + 1] ?? "full" : "tier-variance";
  const repeats = argv.includes("--repeats") ? Number(argv[argv.indexOf("--repeats") + 1] ?? "3") : 3;
  const delayMs = argv.includes("--delay-ms") ? Number(argv[argv.indexOf("--delay-ms") + 1] ?? "2000") : 2e3;
  const pollMs = argv.includes("--poll-ms") ? Number(argv[argv.indexOf("--poll-ms") + 1] ?? "5000") : 5e3;
  const timeoutMs = argv.includes("--timeout-ms") ? Number(argv[argv.indexOf("--timeout-ms") + 1] ?? "900000") : 9e5;
  const outPath = argv.includes("--out") ? resolve2(argv[argv.indexOf("--out") + 1] ?? "calibration-sweep-manifest.json") : resolve2(repoRoot, "docs/superpowers/reports/calibration-sweep-manifest.json");
  return { dryRun, profileId, repeats, delayMs, pollMs, timeoutMs, outPath };
}
function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(
      `Missing required environment variable: ${name} (set in ~/app/.env or export before running)`
    );
    process.exit(1);
  }
  return value;
}
async function sleep(ms) {
  await new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
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
        `SELECT data->>'status' AS status FROM jobs WHERE id = $1`,
        [jobId]
      );
      const status = result.rows[0]?.status;
      if (status === "done") {
        return "done";
      }
      if (status === "failed") {
        return "failed";
      }
      await sleep(pollMs);
    }
    throw new Error(`Timed out waiting for job ${jobId}`);
  } finally {
    await client.end();
  }
}
async function runCell(args) {
  const baseEntry = {
    cellId: args.cell.id,
    runIndex: args.runIndex,
    intent: args.cell.intent,
    lengthTier: args.cell.lengthTier,
    qualityMode: args.cell.qualityMode,
    expectedLegacyContentType: args.cell.expectedLegacyContentType,
    status: "pending"
  };
  const previewBody = {
    intent: args.cell.intent,
    scope: { lengthTier: args.cell.lengthTier },
    qualityMode: args.cell.qualityMode,
    language: "pt-BR",
    briefing: CALIBRATION_BRIEFINGS[args.cell.intent]
  };
  const preview = await fetchJson(args.baseUrl, args.token, "/api/generation-preview", previewBody);
  if (preview.status !== 200) {
    return {
      ...baseEntry,
      status: "failed",
      error: `preview ${preview.status}: ${JSON.stringify(preview.json)}`
    };
  }
  const previewJson = preview.json;
  const quoteId = previewJson.pricingSnapshot?.quoteId;
  if (!quoteId) {
    return { ...baseEntry, status: "failed", error: "preview missing quoteId" };
  }
  const executeBody = {
    ...previewBody,
    quoteId,
    idempotencyKey: `calibration:${args.sweepId}:${args.cell.id}:${args.runIndex}`,
    context: {
      calibrationSweep: {
        sweepId: args.sweepId,
        cellId: args.cell.id,
        runIndex: args.runIndex,
        profile: "option-b-viability"
      }
    }
  };
  const execute = await fetchJson(args.baseUrl, args.token, "/me/executions/run", executeBody);
  if (execute.status !== 200 && execute.status !== 202) {
    return {
      ...baseEntry,
      status: "failed",
      error: `execute ${execute.status}: ${JSON.stringify(execute.json)}`
    };
  }
  const executeJson = execute.json;
  const jobId = executeJson.jobId;
  if (!jobId) {
    return { ...baseEntry, status: "failed", error: "execute missing jobId" };
  }
  if (executeJson.status === "queued" || execute.status === 202) {
    const finalStatus = await pollJobDone(args.databaseUrl, jobId, args.pollMs, args.timeoutMs);
    return {
      ...baseEntry,
      jobId,
      status: finalStatus === "done" ? "done" : "failed",
      error: finalStatus === "failed" ? "job failed" : void 0
    };
  }
  return { ...baseEntry, jobId, status: "done" };
}
async function main() {
  const { dryRun, profileId, repeats, delayMs, pollMs, timeoutMs, outPath } = parseArgs(process.argv.slice(2));
  const profile = resolveSweepProfile(profileId, repeats);
  const totalRuns = countSweepRuns(profile.cells);
  const baseUrl = (process.env.CALIBRATION_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
  const sweepId = process.env.CALIBRATION_SWEEP_ID ?? `sweep-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`;
  if (!dryRun) {
    loadCalibrationEnvironment();
  }
  const userId = process.env.CALIBRATION_USER_ID ?? "(from token)";
  console.log(`Calibration sweep: ${profile.id}`);
  console.log(profile.description);
  console.log(`Cells: ${profile.cells.length} | Runs: ${totalRuns} | Base URL: ${baseUrl}`);
  console.log(`User: ${userId} | Sweep ID: ${sweepId}`);
  if (dryRun) {
    for (const cell of profile.cells) {
      for (let runIndex = 0; runIndex < cell.repeats; runIndex += 1) {
        console.log(
          `[dry-run] ${cell.id} #${runIndex + 1} \u2192 ${cell.expectedLegacyContentType} (${cell.qualityMode})`
        );
      }
    }
    return;
  }
  const token = requireEnv("CALIBRATION_ACCESS_TOKEN");
  const databaseUrl = requireEnv("DATABASE_URL");
  const manifest = {
    sweepId,
    profileId: profile.id,
    userId,
    baseUrl,
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    entries: []
  };
  let completed = 0;
  for (const cell of profile.cells) {
    for (let runIndex = 0; runIndex < cell.repeats; runIndex += 1) {
      completed += 1;
      console.log(`[${completed}/${totalRuns}] ${cell.id} run ${runIndex + 1}/${cell.repeats}`);
      try {
        const entry = await runCell({
          baseUrl,
          token,
          databaseUrl,
          cell,
          runIndex,
          sweepId,
          pollMs,
          timeoutMs
        });
        manifest.entries.push(entry);
        console.log(`  \u2192 ${entry.status}${entry.jobId ? ` (${entry.jobId})` : ""}${entry.error ? ` \u2014 ${entry.error}` : ""}`);
      } catch (error) {
        manifest.entries.push({
          cellId: cell.id,
          runIndex,
          intent: cell.intent,
          lengthTier: cell.lengthTier,
          qualityMode: cell.qualityMode,
          expectedLegacyContentType: cell.expectedLegacyContentType,
          status: "failed",
          error: error instanceof Error ? error.message : String(error)
        });
      }
      mkdirSync(dirname2(outPath), { recursive: true });
      writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}
`);
      await sleep(delayMs);
    }
  }
  console.log(`
Manifest written to ${outPath}`);
  console.log("Next steps:");
  console.log(`  DATABASE_URL=... pnpm billing:export-jobs docs/superpowers/reports/calibration-jobs-sweep.json`);
  console.log(`  pnpm billing:calibrate docs/superpowers/reports/calibration-jobs-sweep.json --report docs/superpowers/reports/calibration-after-sweep.md`);
  console.log(`  pnpm billing:analyze-option-b docs/superpowers/reports/calibration-jobs-sweep.json`);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
//# sourceMappingURL=run-calibration-sweep.js.map
