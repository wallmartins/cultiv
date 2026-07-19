import type {
  ContentTypeDefinition,
  ExecutionMode,
  JobError,
  JobProgress,
  JobResult,
  JobStatus,
  PipelineDefinition,
  PipelineRequest,
  PipelineType,
  QualityMode
} from "@my-ai-orchestrator/contracts";
import type {
  ContentType,
  ExecutionPlan
} from "@my-ai-orchestrator/domain";

export type OrchestrationRequest = PipelineRequest;

export type OrchestrationDecision = "continue" | "halt";
export type OrchestrationStepStatus = "pending" | "running" | "done" | "failed";

export interface OrchestrationStepProgress {
  readonly stepName: string;
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly percent: number;
  readonly status: OrchestrationStepStatus;
  readonly skill: string;
}

export interface OrchestrationStepStartProgress extends OrchestrationStepProgress {
  readonly status: "running";
}

export interface OrchestrationStepCompleteProgress extends OrchestrationStepProgress {
  readonly status: "done" | "failed";
  readonly durationMs: number;
}

export interface OrchestrationStepErrorProgress extends OrchestrationStepProgress {
  readonly status: "failed";
  readonly error: {
    readonly message: string;
    readonly type: string;
    readonly stack?: string;
  };
}

export interface NormalizedOrchestrationRequest {
  readonly variant: "simplified" | "explicit";
  readonly pipelineType: PipelineType | null;
  readonly pipelineName: string;
  readonly contentTypeId: string;
  readonly language: string;
  readonly qualityMode: QualityMode;
  readonly executionMode: ExecutionMode;
  readonly idempotencyKey: string | null;
  readonly input: Readonly<Record<string, unknown>>;
  readonly pipeline: PipelineDefinition;
}

export interface OrchestrationPlan {
  readonly request: NormalizedOrchestrationRequest;
  readonly pipelineType: PipelineType | null;
  readonly pipeline: PipelineDefinition;
  readonly contentType: ContentType;
  readonly executionPlan: ExecutionPlan;
  readonly estimatedSteps: number;
  readonly progress: JobProgress;
  readonly stepProgress: readonly OrchestrationStepProgress[];
}

export interface OrchestrationCatalog {
  readonly pipelines: Readonly<Record<PipelineType, PipelineDefinition>>;
  readonly contentTypes: Readonly<Record<string, ContentTypeDefinition>>;
  readonly defaultLanguageByPipeline: Readonly<Record<PipelineType, string>>;
  readonly defaultQualityModeByPipeline: Readonly<Record<PipelineType, QualityMode>>;
}

export interface OrchestrationPolicy {
  readonly allowPartialResults: boolean;
  readonly retryLimitPerStep: number;
  readonly defaultExecutionMode: ExecutionMode;
  readonly defaultQualityMode: QualityMode;
  readonly defaultLanguage: string;
}

export interface OrchestrationPlanner {
  readonly normalizeRequest: (
    request: OrchestrationRequest,
    options?: Partial<BuildOrchestrationPlanOptions>
  ) => NormalizedOrchestrationRequest;
  readonly resolvePipelineDefinition: (
    request: OrchestrationRequest,
    catalog?: OrchestrationCatalog
  ) => PipelineDefinition;
  readonly resolveContentType: (
    request: OrchestrationRequest,
    catalog?: OrchestrationCatalog
  ) => ContentType;
  readonly estimateStepCount: (pipeline: PipelineDefinition) => number;
  readonly buildPlan: (request: OrchestrationRequest, options?: BuildOrchestrationPlanOptions) => OrchestrationPlan;
}

export interface StepOutcome {
  readonly status: JobStatus;
  readonly continueOnError?: boolean;
}

export interface OrchestrationPolicyService {
  readonly shouldContinue: (outcome: StepOutcome, policy?: Partial<OrchestrationPolicy>) => boolean;
  readonly shouldRetry: (
    attempt: number,
    outcome: StepOutcome,
    policy?: Partial<OrchestrationPolicy>
  ) => boolean;
  readonly isTerminalStatus: (status: JobStatus) => boolean;
}

export interface OrchestrationExecutionStrategy {
  readonly name: "SyncStrategy" | "AsyncStrategy";
  readonly mode: ExecutionMode;
  readonly immediate: boolean;
}

export interface CoordinatedJob {
  readonly id: string;
  readonly status: JobStatus;
  readonly strategy: OrchestrationExecutionStrategy;
  readonly plan: OrchestrationPlan;
  readonly progress: JobProgress;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
  readonly result: JobResult | null;
  readonly error: JobError | null;
}

export interface JobCoordinator {
  readonly selectStrategy: (
    requestOrPlan: OrchestrationRequest | OrchestrationPlan,
    policy?: Partial<OrchestrationPolicy>
  ) => OrchestrationExecutionStrategy;
  readonly createJob: (
    plan: OrchestrationPlan,
    options?: { readonly jobId?: string; readonly createdAt?: string }
  ) => CoordinatedJob;
  readonly startJob: (job: CoordinatedJob, startedAt?: string) => CoordinatedJob;
  readonly updateProgress: (
    job: CoordinatedJob,
    progress: JobProgress,
    updatedAt?: string
  ) => CoordinatedJob;
  readonly completeJob: (
    job: CoordinatedJob,
    result: JobResult,
    completedAt?: string
  ) => CoordinatedJob;
  readonly failJob: (job: CoordinatedJob, error: JobError, completedAt?: string) => CoordinatedJob;
}

export interface BuildOrchestrationPlanOptions {
  readonly catalog: OrchestrationCatalog;
  readonly executionMode: ExecutionMode;
  readonly qualityMode: QualityMode;
  readonly defaultLanguage: string;
}

export interface OrchestratorLayerOptions {
  readonly catalog?: OrchestrationCatalog;
  readonly policy?: Partial<OrchestrationPolicy>;
}

export interface QualityLanePlanOptions {
  readonly laneCount?: number;
  readonly adapter: string;
  readonly model: string;
  readonly baseTemperature?: number;
}
