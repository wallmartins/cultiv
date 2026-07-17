import type {
  ExecutionMode,
  JobStatus,
  PipelineDefinition,
  PipelineType,
  QualityMode,
  LanguageProfileSummary
} from "@my-ai-orchestrator/contracts";

export interface Entity<Id extends string = string> {
  id: Id;
}

export interface ValueObject {
  readonly [key: string]: unknown;
}

export interface Skill extends Entity {
  name: string;
  description?: string;
  tags?: readonly string[];
}

export interface PipelineStep extends Entity {
  skill: string;
  config?: Readonly<Record<string, unknown>>;
}

export interface Pipeline extends Entity {
  name: string;
  type: PipelineType;
  steps: readonly PipelineStep[];
  qualityMode: QualityMode;
}

export interface LanguageProfile extends Entity<string> {
  code: string;
  name: string;
  dictionary: ReadonlySet<string>;
  patterns: Readonly<Record<string, RegExp | readonly RegExp[]>>;
  prompts: Readonly<Record<string, string>>;
  defaults: {
    tone: string;
    constraints: readonly string[];
  };
  contracts: {
    forbiddenPatterns: readonly string[];
    requiredMarkers: readonly string[];
  };
}

export interface Job extends Entity {
  status: JobStatus;
  pipelineId?: string;
  executionMode: ExecutionMode;
  contentType: string;
  createdAt: string;
  completedAt: string | null;
  traceId?: string;
}

export interface MemoryRecord extends Entity {
  userId: string;
  key: string;
  value: unknown;
  createdAt: string;
  updatedAt: string;
  ttlSeconds?: number;
}

export interface ContentType extends Entity {
  label: string;
  defaultLanguage: string;
  steps: readonly string[];
  inputSchema: Readonly<Record<string, unknown>>;
}

export interface ExecutionPlan extends Entity {
  pipeline: PipelineDefinition;
  input: Readonly<Record<string, unknown>>;
  mode: ExecutionMode;
  qualityMode: QualityMode;
}

export interface DomainState {
  languageProfile?: LanguageProfileSummary;
  job?: Job;
  contentType?: ContentType;
}

const terminalJobStatuses = new Set<JobStatus>(["done", "failed", "cancelled"]);

export function isTerminalJobStatus(status: JobStatus): boolean {
  return terminalJobStatuses.has(status);
}

export function createLanguageProfile(profile: LanguageProfile): LanguageProfile {
  return profile;
}

export function createPipeline(pipeline: Pipeline): Pipeline {
  return pipeline;
}

export function createExecutionPlan(plan: ExecutionPlan): ExecutionPlan {
  return plan;
}

export function createContentType(contentType: ContentType): ContentType {
  return contentType;
}

export function createJob(job: Job): Job {
  return job;
}

export function createMemoryRecord(record: MemoryRecord): MemoryRecord {
  return record;
}
