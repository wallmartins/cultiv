#!/usr/bin/env tsx

// scripts/analyze-calibration-option-b.ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname as dirname2 } from "node:path";

// ../../packages/payments/src/pricing-calibration/telemetry-ingest.ts
function parseJobTelemetryRow(job) {
  const record = job;
  if (record.status !== "done" || !record.result?.metadata?.telemetry?.cost) {
    return null;
  }
  const telemetry = record.result.metadata.telemetry;
  const cost = telemetry.cost;
  const qualityMode = telemetry.preview?.finalQualityMode ?? record.result.metadata.qualityMode ?? "balanced";
  return {
    jobId: record.id ?? "unknown",
    contentType: telemetry.pricing?.planSignature ?? telemetry.pricing?.contentType ?? record.contentType ?? "unknown",
    qualityMode,
    inputTokensTotal: cost.inputTokensTotal,
    outputTokensTotal: cost.outputTokensTotal,
    observedUsdCost: cost.estimatedUsdCost,
    debitedCredits: cost.debitedCredits,
    plannedCreditPrice: telemetry.pricing?.plannedCreditPrice ?? null,
    policyVersion: telemetry.pricing?.policyVersion ?? null
  };
}
function parseJobTelemetryRows(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((entry) => {
    const job = entry.data ?? entry;
    const row = parseJobTelemetryRow(job);
    return row ? [row] : [];
  });
}

// scripts/calibration/resolve-repo-path.ts
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
function findMonorepoRoot(startDir) {
  let dir = startDir;
  while (true) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return startDir;
    }
    dir = parent;
  }
}
var repoRoot = findMonorepoRoot(dirname(fileURLToPath(import.meta.url)));
function resolveCalibrationRepoPath(pathArg) {
  return pathArg.startsWith("/") ? pathArg : resolve(repoRoot, pathArg);
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

// scripts/analyze-calibration-option-b.ts
function mean(values) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function analyzeIntentVariance(intent, rows) {
  const tiers = ["short", "medium", "long"];
  const tierStats = [];
  for (const lengthTier of tiers) {
    const legacyContentType = resolvePhase1LegacyContentTypeId(intent, lengthTier);
    const costs = rows.filter((row) => row.contentType === legacyContentType).map((row) => row.observedUsdCost);
    if (costs.length === 0) {
      continue;
    }
    tierStats.push({
      lengthTier,
      legacyContentType,
      sampleCount: costs.length,
      meanUsd: mean(costs),
      minUsd: Math.min(...costs),
      maxUsd: Math.max(...costs)
    });
  }
  if (tierStats.length === 0) {
    return null;
  }
  const means = tierStats.map((stat) => stat.meanUsd);
  const minMean = Math.min(...means);
  const maxMean = Math.max(...means);
  const spreadRatio = minMean > 0 ? maxMean / minMean : maxMean > 0 ? Infinity : 1;
  const distinctPipelines = new Set(tierStats.map((stat) => stat.legacyContentType)).size;
  return {
    intent,
    tierStats,
    spreadRatio,
    distinctPipelines,
    tierChangesPipeline: distinctPipelines > 1
  };
}
function formatReport(reports, totalRows) {
  const lines = [
    "# Option B viability \u2014 calibration analysis",
    "",
    `Observed telemetry rows: ${totalRows}`,
    "",
    "This report uses Phase 1 behavior: `intent \xD7 lengthTier` resolves to legacy pipelines.",
    "High spread within an intent suggests tier-driven execution economics \u2014 supports hybrid/Option B pricing.",
    "",
    "## Per-intent tier cost spread",
    "",
    "| Intent | Tiers sampled | Distinct pipelines | Spread (max/min mean USD) | Signal |",
    "|--------|---------------|--------------------|---------------------------|--------|"
  ];
  for (const report of reports) {
    const signal = report.tierChangesPipeline && report.spreadRatio >= 1.35 ? "strong" : report.tierChangesPipeline ? "moderate" : "weak (tier = wordTarget only today)";
    lines.push(
      `| ${report.intent} | ${report.tierStats.length} | ${report.distinctPipelines} | ${report.spreadRatio.toFixed(2)}\xD7 | ${signal} |`
    );
  }
  lines.push("", "## Tier detail", "");
  for (const report of reports) {
    lines.push(`### ${report.intent}`, "");
    lines.push("| Tier | Legacy pipeline | n | mean USD | min | max |");
    lines.push("|------|-----------------|---|----------|-----|-----|");
    for (const stat of report.tierStats) {
      lines.push(
        `| ${stat.lengthTier} | ${stat.legacyContentType} | ${stat.sampleCount} | $${stat.meanUsd.toFixed(4)} | $${stat.minUsd.toFixed(4)} | $${stat.maxUsd.toFixed(4)} |`
      );
    }
    lines.push("");
  }
  const strongCount = reports.filter((r) => r.tierChangesPipeline && r.spreadRatio >= 1.35).length;
  lines.push("## Recommendation", "");
  if (strongCount >= 3) {
    lines.push(
      "- **Option B / hybrid tier modifiers:** Economically justified \u2014 tier changes pipeline and/or cost spread is material.",
      "- Phase 2: prefer **4 named profiles + tier in pricing matrix**; defer full parametric composer to Phase 3 unless quality tests demand it."
    );
  } else if (reports.some((r) => r.tierChangesPipeline)) {
    lines.push(
      "- **Hybrid (4 profiles + tier pricing):** Justified, but collect more samples per tier (n\u22655) before locking prices.",
      "- **Full Option B (1 parametric pipeline):** Not yet proven on cost data alone \u2014 run `tier-variance` profile with `--repeats 5`."
    );
  } else {
    lines.push(
      "- Insufficient tier-driven cost signal \u2014 stay on **Option A** (profiles only) for Phase 2 execution; tier affects wordTarget + pricing policy only."
    );
  }
  lines.push("");
  return lines.join("\n");
}
function main() {
  const inputPath = resolveCalibrationRepoPath(
    process.argv[2] ?? "docs/superpowers/reports/calibration-jobs-sweep.json"
  );
  const reportPath = resolveCalibrationRepoPath(
    process.argv[3] ?? "docs/superpowers/reports/calibration-option-b-viability.md"
  );
  let jobs;
  try {
    jobs = JSON.parse(readFileSync(inputPath, "utf8"));
  } catch {
    console.error(`Could not read calibration input at ${inputPath}`);
    console.error("Export jobs first:");
    console.error("  pnpm billing:export-jobs docs/superpowers/reports/calibration-jobs-sweep.json");
    process.exit(1);
  }
  const rows = parseJobTelemetryRows(jobs);
  const intents = [
    "share-idea",
    "explain-deeply",
    "engage-audience",
    "tell-story",
    "update-subscribers",
    "document-decision"
  ];
  const reports = intents.map((intent) => analyzeIntentVariance(intent, rows)).filter((report) => report !== null);
  const markdown = formatReport(reports, rows.length);
  mkdirSync(dirname2(reportPath), { recursive: true });
  writeFileSync(reportPath, `${markdown}
`);
  console.log(markdown);
  console.log(`
Report written to ${reportPath}`);
}
main();
//# sourceMappingURL=analyze-calibration-option-b.js.map
