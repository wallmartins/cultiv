import type { Effect } from "effect";
import type {
  ExecutionMode,
  JobError,
  JobProgress,
  JobResult,
  JobStatus,
  PipelineDefinition,
  PipelineStepDefinition,
  PipelineType,
  QualityMode,
  ContentTypeDefinition,
  LanguageProfileSummary
} from "@my-ai-orchestrator/contracts";

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly backoff?: "fixed" | "exponential";
  readonly delayMs?: number;
}

export interface PipelineStep extends PipelineStepDefinition {
  retry?: RetryPolicy;
  continueOnError?: boolean;
}

export interface MemoryBinding {
  backend: string;
  namespace: string;
  config?: Record<string, unknown>;
}

export interface RefinementLoopConfig {
  enabled?: boolean;
  maxIterations?: number;
  minImprovementDelta?: number;
  targetScore?: number;
  earlyExitOnConvergence?: boolean;
  briefing?: string;
  userVoiceProfile?: Record<string, unknown>;
  voiceExamples?: string[];
}

export interface PipelineConfig {
  retry?: RetryPolicy;
  continueOnError?: boolean;
  adapter?: string;
  memory?: MemoryBinding;
  refinementLoop?: RefinementLoopConfig;
}

export interface Pipeline extends PipelineDefinition {
  type?: PipelineType;
  inputs?: Record<string, unknown>;
  config?: PipelineConfig;
  steps: PipelineStep[];
}

export interface StepOutput {
  readonly output: unknown;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface StepError {
  readonly message: string;
  readonly stack?: string;
  readonly type: string;
  readonly stepName?: string;
  readonly cause?: unknown;
}

export interface Context {
  pipeline: Pipeline;
  stepIndex: number;
  state: Record<string, unknown>;
  inputs: Record<string, unknown>;
  memory?: MemoryManager;
  corpus?: CorpusManager;
}

export interface TraceStep {
  step: PipelineStep;
  input: unknown;
  instruction?: string;
  output?: unknown;
  error?: StepError;
  startedAt: string;
  completedAt?: string;
  attempt: number;
  resolvedInputs?: Record<string, unknown>;
  contract?: unknown;
  parsedOutput?: unknown;
  contractValidation?: {
    passed: boolean;
    missingInputs?: readonly string[];
  };
  languageGateResult?: {
    passed: boolean;
    errorCount: number;
    warningCount: number;
    errorsSample?: Array<{
      type: string;
      token?: string;
      language?: string;
      position?: number;
      context?: string;
    }>;
    warningsSample?: Array<{
      type: string;
      token?: string;
      language?: string;
      position?: number;
      context?: string;
    }>;
  };
}

export type TraceStatus = "running" | "completed" | "failed" | "partial";

export interface TraceEvent {
  readonly type:
    | "step-start"
    | "step-retry"
    | "step-complete"
    | "step-error"
    | "preview-correlation"
    | "provider-attempt"
    | "icl-retrieval"
    | "llm-gate"
    | "language-gate"
    | "contract-validation"
    | "refinement-loop-start"
    | "refinement-loop-iteration"
    | "iteration-dimensions"
    | "refinement-loop-complete";
  readonly stepIndex?: number;
  readonly stepName?: string;
  readonly skill?: string;
  readonly attempt?: number;
  readonly status?: string;
  readonly durationMs?: number;
  readonly payload?: Record<string, unknown>;
  readonly occurredAt: string;
}

export interface Trace {
  id: string;
  pipeline: Pipeline;
  initialInputs: Record<string, unknown>;
  steps: TraceStep[];
  events?: TraceEvent[];
  startedAt: string;
  completedAt?: string;
  adapter?: string;
  status: TraceStatus;
  warnings?: string[];
}

export interface ExecutionResult {
  readonly output: unknown;
  readonly trace: Trace;
}

export interface ProgressCallbacks {
  readonly onStepStart?: (progress: StepProgress) => void | Effect.Effect<void, never>;
  readonly onStepComplete?: (progress: StepCompleteProgress) => void | Effect.Effect<void, never>;
  readonly onStepError?: (progress: StepErrorProgress) => void | Effect.Effect<void, never>;
}

export interface StepProgress {
  readonly stepName: string;
  readonly stepIndex: number;
  readonly attempt: number;
}

export interface StepCompleteProgress extends StepProgress {
  readonly durationMs: number;
  readonly status: "completed" | "failed" | "partial";
}

export interface StepErrorProgress extends StepProgress {
  readonly error: StepError;
}

export interface StructuredPrompt {
  readonly system: string;
  readonly user: string;
}

export interface ExecutionAdapter<E = unknown> {
  readonly name: string;
  readonly configure: (config: Record<string, unknown>) => void;
  readonly execute: (instruction: string | StructuredPrompt, context: Context) => Effect.Effect<string, E>;
}

export interface MemoryQuery {
  readonly prefix?: string;
}

export interface MemoryBackend<E = never> {
  readonly read: (namespace: string, key: string) => Effect.Effect<unknown, E>;
  readonly write: (namespace: string, key: string, value: unknown) => Effect.Effect<void, E>;
  readonly list: (namespace: string) => Effect.Effect<string[], E>;
  readonly delete: (namespace: string, key: string) => Effect.Effect<void, E>;
  readonly query: (namespace: string, query: MemoryQuery) => Effect.Effect<Record<string, unknown>, E>;
}

export interface MemoryManager {
  readonly read: (key: string) => Effect.Effect<unknown, never>;
  readonly write: (key: string, value: unknown) => Effect.Effect<void, never>;
  readonly list: () => Effect.Effect<string[], never>;
  readonly delete: (key: string) => Effect.Effect<void, never>;
  readonly query: (query: MemoryQuery) => Effect.Effect<Record<string, unknown>, never>;
}

export interface CorpusManager {
  readonly getById: (id: string) => Effect.Effect<ReferenceText | undefined, never>;
  readonly queryByTag: (tag: string) => Effect.Effect<ReferenceText[], never>;
  readonly queryByPrefix: (prefix: string) => Effect.Effect<ReferenceText[], never>;
}

export interface ReferenceText {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly tags?: string[];
  readonly excerpt?: string;
  readonly createdAt: string;
}

export interface TraceStoreLike {
  readonly save: (trace: Trace) => Effect.Effect<void, never>;
  readonly load: (id: string) => Effect.Effect<Trace | undefined, never>;
  readonly list: () => Effect.Effect<string[], never>;
}

export interface SkillInfo {
  readonly name: string;
  readonly type: "native" | "declarative";
  readonly contract?: unknown;
  readonly description?: string;
}

export interface Job {
  readonly id: string;
  readonly status: JobStatus;
  readonly pipelineId?: string;
  readonly executionMode: ExecutionMode;
  readonly contentType: string;
  readonly createdAt: string;
  readonly completedAt: string | null;
  readonly traceId?: string;
}

export interface ContentType extends ContentTypeDefinition {
  readonly label: string;
  readonly defaultLanguage: string;
  readonly steps: readonly string[];
  readonly inputSchema: Readonly<Record<string, unknown>>;
}

export interface DomainState {
  readonly languageProfile?: LanguageProfileSummary;
  readonly job?: Job;
  readonly contentType?: ContentType;
}

export interface StepRuntime {
  readonly stepName: string;
  readonly attempt: number;
  readonly totalAttempts: number;
}

export interface StepExecutionOutcome {
  readonly success: boolean;
  readonly finalAttempt: number;
}

export interface StepExecutionErrorLike {
  readonly stepName: string;
  readonly message: string;
  readonly cause?: unknown;
}

export type { JobError, JobProgress, JobResult, JobStatus, QualityMode };
