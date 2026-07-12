import { Effect } from "effect";
import type {
  ContentType,
  DerivedVoiceProfile,
  Job,
  MemoryRecord as DomainMemoryRecord,
  Pipeline,
  VoiceExample,
  VoiceProfileDiagnostics,
  VoiceProfileSnapshot,
  VoiceTrainingConsent
} from "@my-ai-orchestrator/domain";
import type { JobError, JobProgress, JobResult, ExecutionsListFilters } from "@my-ai-orchestrator/contracts";
import type {
  DatabaseError,
  DatabaseJobAlreadyExistsError,
  DatabaseJobNotFoundError,
  DatabaseTransactionInvariantError,
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
  create: (
    job: Job,
    options?: JobCreateOptions
  ) => Effect.Effect<JobRecord, DatabaseJobAlreadyExistsError | DatabaseError>;
  save: (record: JobRecord) => Effect.Effect<JobRecord, DatabaseJobNotFoundError | DatabaseError>;
  findById: (id: string) => Effect.Effect<JobRecord | undefined, DatabaseError>;
  list: () => Effect.Effect<readonly JobRecord[], DatabaseError>;
  listByUser: (
    userId: string,
    limit: number,
    offset: number,
    filters?: ExecutionsListFilters
  ) => Effect.Effect<readonly JobRecord[], DatabaseError>;
  countByUser: (userId: string, filters?: ExecutionsListFilters) => Effect.Effect<number, DatabaseError>;
  remove: (id: string) => Effect.Effect<boolean, DatabaseError>;
  appendHistory: (
    id: string,
    entry: DatabaseHistoryEntry
  ) => Effect.Effect<JobRecord, DatabaseJobNotFoundError | DatabaseError>;
  recordProgress: (
    id: string,
    progress: JobProgress,
    at?: string
  ) => Effect.Effect<JobRecord, DatabaseJobNotFoundError | DatabaseError>;
  complete: (
    id: string,
    result: JobResult,
    at?: string
  ) => Effect.Effect<JobRecord, DatabaseJobNotFoundError | DatabaseError>;
  fail: (
    id: string,
    error: JobError,
    at?: string
  ) => Effect.Effect<JobRecord, DatabaseJobNotFoundError | DatabaseError>;
}

export interface MemoryRepository {
  put: (record: DomainMemoryRecord, version?: number) => Effect.Effect<MemoryEntryRecord, DatabaseError>;
  get: (userId: string, key: string) => Effect.Effect<MemoryEntryRecord | undefined, DatabaseError>;
  listByUser: (userId: string) => Effect.Effect<readonly MemoryEntryRecord[], DatabaseError>;
  remove: (userId: string, key: string) => Effect.Effect<boolean, DatabaseError>;
}

export interface ContentTypeRepository {
  put: (
    record: ContentType,
    version?: number,
    updatedAt?: string
  ) => Effect.Effect<ContentTypeRecord, DatabaseError>;
  get: (id: string) => Effect.Effect<ContentTypeRecord | undefined, DatabaseError>;
  list: () => Effect.Effect<readonly ContentTypeRecord[], DatabaseError>;
}

export interface PipelineRepository {
  put: (
    record: Pipeline,
    version?: number,
    updatedAt?: string
  ) => Effect.Effect<PipelineRecord, DatabaseError>;
  get: (id: string) => Effect.Effect<PipelineRecord | undefined, DatabaseError>;
  list: () => Effect.Effect<readonly PipelineRecord[], DatabaseError>;
}

export interface VoiceExampleRepository {
  create: (
    record: VoiceExample,
    version?: number
  ) => Effect.Effect<VoiceExampleRecord, DatabaseVoiceExampleAlreadyExistsError | DatabaseError>;
  save: (
    record: VoiceExampleRecord
  ) => Effect.Effect<VoiceExampleRecord, DatabaseVoiceExampleNotFoundError | DatabaseError>;
  get: (id: string) => Effect.Effect<VoiceExampleRecord | undefined, DatabaseError>;
  listByUser: (userId: string) => Effect.Effect<readonly VoiceExampleRecord[], DatabaseError>;
  remove: (id: string) => Effect.Effect<boolean, DatabaseError>;
  removeByUser: (userId: string) => Effect.Effect<number, DatabaseError>;
}

export interface VoiceProfileRepository {
  put: (record: DerivedVoiceProfile, version?: number) => Effect.Effect<VoiceProfileRecord, DatabaseError>;
  getByUser: (userId: string) => Effect.Effect<VoiceProfileRecord | undefined, DatabaseError>;
  removeByUser: (userId: string) => Effect.Effect<boolean, DatabaseError>;
}

export interface VoiceProfileDiagnosticsRepository {
  put: (
    record: VoiceProfileDiagnostics,
    version?: number
  ) => Effect.Effect<VoiceProfileDiagnosticsRecord, DatabaseError>;
  getByUser: (userId: string) => Effect.Effect<VoiceProfileDiagnosticsRecord | undefined, DatabaseError>;
  removeByUser: (userId: string) => Effect.Effect<boolean, DatabaseError>;
}

export interface VoiceProfileSnapshotRepository {
  create: (
    record: VoiceProfileSnapshot,
    version?: number
  ) => Effect.Effect<VoiceProfileSnapshotRecord, DatabaseError>;
  get: (id: string) => Effect.Effect<VoiceProfileSnapshotRecord | undefined, DatabaseError>;
  listByUser: (userId: string) => Effect.Effect<readonly VoiceProfileSnapshotRecord[], DatabaseError>;
  removeByUser: (userId: string) => Effect.Effect<number, DatabaseError>;
}

export interface VoiceTrainingConsentRepository {
  readonly put: (
    record: VoiceTrainingConsent,
    version?: number
  ) => Effect.Effect<VoiceTrainingConsentRecord, DatabaseError>;
  readonly getByUser: (userId: string) => Effect.Effect<VoiceTrainingConsentRecord | undefined, DatabaseError>;
}

export interface AuditRepository {
  putIfAbsent: (record: AuditRecord) => Effect.Effect<AuditRecord, DatabaseError>;
  getByLogicalKey: (logicalKey: string) => Effect.Effect<AuditRecord | undefined, DatabaseError>;
  list: () => Effect.Effect<readonly AuditRecord[], DatabaseError>;
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
  readonly voiceTrainingConsents?: readonly VoiceTrainingConsentRecord[];
  readonly auditRecords?: readonly AuditRecord[];
}
