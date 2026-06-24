import { Effect } from "effect";
import type {
  ContentType,
  DerivedVoiceProfile,
  Job,
  MemoryRecord as DomainMemoryRecord,
  Pipeline,
  VoiceExample,
  VoiceExampleBatch,
  VoiceProfileDiagnostics,
  VoiceProfileSnapshot,
  VoiceTrainingConsent
} from "@my-ai-orchestrator/domain";
import type { JobError, JobProgress, JobResult, ExecutionsListFilters } from "@my-ai-orchestrator/contracts";
import type {
  DatabaseJobAlreadyExistsError,
  DatabaseJobNotFoundError,
  DatabaseTransactionInvariantError,
  DatabaseVoiceBatchAlreadyExistsError,
  DatabaseVoiceBatchNotFoundError,
  DatabaseVoiceExampleAlreadyExistsError,
  DatabaseVoiceExampleNotFoundError
} from "./errors.js";

export interface DatabaseHistoryEntry {
  readonly type: "created" | "started" | "progress" | "completed" | "failed" | "updated";
  readonly at: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface JobProgressEntry {
  readonly at: string;
  readonly progress: JobProgress;
}

export interface JobRecord extends Job {
  readonly version: number;
  readonly progress: JobProgress;
  readonly progressHistory: readonly JobProgressEntry[];
  readonly result: JobResult | null;
  readonly error: JobError | null;
  readonly updatedAt: string;
  readonly history: readonly DatabaseHistoryEntry[];
}

export interface MemoryEntryRecord extends DomainMemoryRecord {
  readonly version: number;
}

export interface ContentTypeRecord extends ContentType {
  readonly version: number;
  readonly updatedAt: string;
}

export interface PipelineRecord extends Pipeline {
  readonly version: number;
  readonly updatedAt: string;
}

export interface VoiceExampleRecord extends VoiceExample {
  readonly version: number;
}

export interface VoiceProfileRecord extends Omit<DerivedVoiceProfile, "version"> {
  readonly profileVersion: number;
  readonly version: number;
}

export interface VoiceProfileDiagnosticsRecord extends VoiceProfileDiagnostics {
  readonly version: number;
}

export interface VoiceProfileSnapshotRecord extends VoiceProfileSnapshot {
  readonly version: number;
}

export interface VoiceExampleBatchRecord extends VoiceExampleBatch {
  readonly version: number;
}

export interface VoiceTrainingConsentRecord extends VoiceTrainingConsent {
  readonly version: number;
}

export interface AuditRecord {
  readonly id: string;
  readonly logicalKey: string;
  readonly actorId: string;
  readonly actorType: "application_user" | "operator" | "system";
  readonly resourceType: string;
  readonly resourceId: string;
  readonly mutationType: string;
  readonly occurredAt: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface DatabaseState {
  readonly jobs: Record<string, JobRecord>;
  readonly memories: Record<string, MemoryEntryRecord>;
  readonly contentTypes: Record<string, ContentTypeRecord>;
  readonly pipelines: Record<string, PipelineRecord>;
  readonly voiceExamples: Record<string, VoiceExampleRecord>;
  readonly voiceProfiles: Record<string, VoiceProfileRecord>;
  readonly voiceProfileDiagnostics: Record<string, VoiceProfileDiagnosticsRecord>;
  readonly voiceProfileSnapshots: Record<string, VoiceProfileSnapshotRecord>;
  readonly voiceExampleBatches: Record<string, VoiceExampleBatchRecord>;
  readonly voiceTrainingConsents: Record<string, VoiceTrainingConsentRecord>;
  readonly auditRecords: Record<string, AuditRecord>;
}

export interface JobCreateOptions {
  readonly progress?: JobProgress;
  readonly progressHistory?: readonly JobProgressEntry[];
  readonly result?: JobResult | null;
  readonly error?: JobError | null;
  readonly updatedAt?: string;
  readonly history?: readonly DatabaseHistoryEntry[];
}

export interface JobRepository {
  create: (job: Job, options?: JobCreateOptions) => Effect.Effect<JobRecord, DatabaseJobAlreadyExistsError>;
  save: (record: JobRecord) => Effect.Effect<JobRecord, DatabaseJobNotFoundError>;
  findById: (id: string) => Effect.Effect<JobRecord | undefined>;
  list: () => Effect.Effect<readonly JobRecord[]>;
  listByUser: (
    userId: string,
    limit: number,
    offset: number,
    filters?: ExecutionsListFilters
  ) => Effect.Effect<readonly JobRecord[]>;
  countByUser: (userId: string, filters?: ExecutionsListFilters) => Effect.Effect<number>;
  remove: (id: string) => Effect.Effect<boolean>;
  appendHistory: (id: string, entry: DatabaseHistoryEntry) => Effect.Effect<JobRecord, DatabaseJobNotFoundError>;
  recordProgress: (id: string, progress: JobProgress, at?: string) => Effect.Effect<JobRecord, DatabaseJobNotFoundError>;
  complete: (id: string, result: JobResult, at?: string) => Effect.Effect<JobRecord, DatabaseJobNotFoundError>;
  fail: (id: string, error: JobError, at?: string) => Effect.Effect<JobRecord, DatabaseJobNotFoundError>;
}

export interface MemoryRepository {
  put: (record: DomainMemoryRecord, version?: number) => Effect.Effect<MemoryEntryRecord>;
  get: (userId: string, key: string) => Effect.Effect<MemoryEntryRecord | undefined>;
  listByUser: (userId: string) => Effect.Effect<readonly MemoryEntryRecord[]>;
  remove: (userId: string, key: string) => Effect.Effect<boolean>;
}

export interface ContentTypeRepository {
  put: (record: ContentType, version?: number, updatedAt?: string) => Effect.Effect<ContentTypeRecord>;
  get: (id: string) => Effect.Effect<ContentTypeRecord | undefined>;
  list: () => Effect.Effect<readonly ContentTypeRecord[]>;
}

export interface PipelineRepository {
  put: (record: Pipeline, version?: number, updatedAt?: string) => Effect.Effect<PipelineRecord>;
  get: (id: string) => Effect.Effect<PipelineRecord | undefined>;
  list: () => Effect.Effect<readonly PipelineRecord[]>;
}

export interface VoiceExampleRepository {
  create: (record: VoiceExample, version?: number) => Effect.Effect<VoiceExampleRecord, DatabaseVoiceExampleAlreadyExistsError>;
  save: (record: VoiceExampleRecord) => Effect.Effect<VoiceExampleRecord, DatabaseVoiceExampleNotFoundError>;
  get: (id: string) => Effect.Effect<VoiceExampleRecord | undefined>;
  listByUser: (userId: string) => Effect.Effect<readonly VoiceExampleRecord[]>;
  remove: (id: string) => Effect.Effect<boolean>;
  removeByUser: (userId: string) => Effect.Effect<number>;
}

export interface VoiceProfileRepository {
  put: (record: DerivedVoiceProfile, version?: number) => Effect.Effect<VoiceProfileRecord>;
  getByUser: (userId: string) => Effect.Effect<VoiceProfileRecord | undefined>;
  removeByUser: (userId: string) => Effect.Effect<boolean>;
}

export interface VoiceProfileDiagnosticsRepository {
  put: (record: VoiceProfileDiagnostics, version?: number) => Effect.Effect<VoiceProfileDiagnosticsRecord>;
  getByUser: (userId: string) => Effect.Effect<VoiceProfileDiagnosticsRecord | undefined>;
  removeByUser: (userId: string) => Effect.Effect<boolean>;
}

export interface VoiceProfileSnapshotRepository {
  create: (record: VoiceProfileSnapshot, version?: number) => Effect.Effect<VoiceProfileSnapshotRecord>;
  get: (id: string) => Effect.Effect<VoiceProfileSnapshotRecord | undefined>;
  listByUser: (userId: string) => Effect.Effect<readonly VoiceProfileSnapshotRecord[]>;
  removeByUser: (userId: string) => Effect.Effect<number>;
}

export interface VoiceExampleBatchRepository {
  readonly create: (record: VoiceExampleBatch, version?: number) => Effect.Effect<VoiceExampleBatchRecord, DatabaseVoiceBatchAlreadyExistsError>;
  readonly save: (record: VoiceExampleBatchRecord) => Effect.Effect<VoiceExampleBatchRecord, DatabaseVoiceBatchNotFoundError>;
  readonly get: (id: string) => Effect.Effect<VoiceExampleBatchRecord | undefined>;
  readonly listByUser: (userId: string) => Effect.Effect<readonly VoiceExampleBatchRecord[]>;
  readonly remove: (id: string) => Effect.Effect<boolean>;
}

export interface VoiceTrainingConsentRepository {
  readonly put: (record: VoiceTrainingConsent, version?: number) => Effect.Effect<VoiceTrainingConsentRecord>;
  readonly getByUser: (userId: string) => Effect.Effect<VoiceTrainingConsentRecord | undefined>;
}

export interface AuditRepository {
  putIfAbsent: (record: AuditRecord) => Effect.Effect<AuditRecord>;
  getByLogicalKey: (logicalKey: string) => Effect.Effect<AuditRecord | undefined>;
  list: () => Effect.Effect<readonly AuditRecord[]>;
}

export interface DatabaseClient {
  readonly jobs: JobRepository;
  readonly memories: MemoryRepository;
  readonly contentTypes: ContentTypeRepository;
  readonly pipelines: PipelineRepository;
  readonly voiceExamples: VoiceExampleRepository;
  readonly voiceProfiles: VoiceProfileRepository;
  readonly voiceProfileDiagnostics: VoiceProfileDiagnosticsRepository;
  readonly voiceProfileSnapshots: VoiceProfileSnapshotRepository;
  readonly voiceExampleBatches: VoiceExampleBatchRepository;
  readonly voiceTrainingConsents: VoiceTrainingConsentRepository;
  readonly audit: AuditRepository;
  readonly transaction: <T, E>(
    operation: (client: DatabaseClient) => Effect.Effect<T, E>
  ) => Effect.Effect<T, E | DatabaseTransactionInvariantError>;
  readonly snapshot: () => DatabaseSnapshot;
}

export interface DatabaseSnapshot {
  readonly jobs: Record<string, JobRecord>;
  readonly memories: Record<string, MemoryEntryRecord>;
  readonly contentTypes: Record<string, ContentTypeRecord>;
  readonly pipelines: Record<string, PipelineRecord>;
  readonly voiceExamples: Record<string, VoiceExampleRecord>;
  readonly voiceProfiles: Record<string, VoiceProfileRecord>;
  readonly voiceProfileDiagnostics: Record<string, VoiceProfileDiagnosticsRecord>;
  readonly voiceProfileSnapshots: Record<string, VoiceProfileSnapshotRecord>;
  readonly voiceExampleBatches: Record<string, VoiceExampleBatchRecord>;
  readonly voiceTrainingConsents: Record<string, VoiceTrainingConsentRecord>;
  readonly auditRecords: Record<string, AuditRecord>;
}

export interface DatabaseSeed {
  readonly jobs?: readonly JobRecord[];
  readonly memories?: readonly MemoryEntryRecord[];
  readonly contentTypes?: readonly ContentTypeRecord[];
  readonly pipelines?: readonly PipelineRecord[];
  readonly voiceExamples?: readonly VoiceExampleRecord[];
  readonly voiceProfiles?: readonly VoiceProfileRecord[];
  readonly voiceProfileDiagnostics?: readonly VoiceProfileDiagnosticsRecord[];
  readonly voiceProfileSnapshots?: readonly VoiceProfileSnapshotRecord[];
  readonly voiceExampleBatches?: readonly VoiceExampleBatchRecord[];
  readonly voiceTrainingConsents?: readonly VoiceTrainingConsentRecord[];
  readonly auditRecords?: readonly AuditRecord[];
}
