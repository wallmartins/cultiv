import { Effect } from "effect";
import type {
  AuditRepository,
  ContentTypeRepository,
  DatabaseClient,
  DatabaseSeed,
  DatabaseSnapshot,
  DatabaseState,
  ExecutionReactionRepository,
  JobRepository,
  MemoryRepository,
  PipelineRepository,
  PracticeProfileDiagnosticsRepository,
  PracticeProfileRepository,
  VoiceExampleBatchRepository,
  VoiceExampleRepository,
  VoiceProfileDiagnosticsRepository,
  VoiceProfileRepository,
  VoiceProfileSnapshotRepository,
  VoiceTrainingConsentRepository
} from "../types.js";
import { cloneState, indexBy } from "./shared.js";
import { createAuditRepository } from "./audit-repository.js";
import { createContentTypeRepository } from "./content-type-repository.js";
import { createExecutionReactionRepository } from "./execution-reaction-repository.js";
import { createJobRepository } from "./job-repository.js";
import { createMemoryRepository } from "./memory-repository.js";
import { createPipelineRepository } from "./pipeline-repository.js";
import { createPracticeProfileRepository } from "./practice-profile-repository.js";
import { createPracticeProfileDiagnosticsRepository } from "./practice-profile-diagnostics-repository.js";
import { createVoiceExampleRepository } from "./voice-example-repository.js";
import { createVoiceExampleBatchRepository } from "./voice-example-batch-repository.js";
import { createVoiceProfileDiagnosticsRepository } from "./voice-profile-diagnostics-repository.js";
import { createVoiceProfileRepository } from "./voice-profile-repository.js";
import { createVoiceProfileSnapshotRepository } from "./voice-profile-snapshot-repository.js";
import { createVoiceTrainingConsentRepository } from "./voice-training-consent-repository.js";

export function createState(seed: DatabaseSeed): DatabaseState {
  return {
    jobs: indexBy(seed.jobs ?? [], (record) => record.id),
    memories: indexBy(seed.memories ?? [], (record) => `${record.userId}:${record.key}`),
    contentTypes: indexBy(seed.contentTypes ?? [], (record) => record.id),
    pipelines: indexBy(seed.pipelines ?? [], (record) => record.id),
    voiceExamples: indexBy(seed.voiceExamples ?? [], (record) => record.id),
    voiceProfiles: indexBy(seed.voiceProfiles ?? [], (record) => record.userId),
    voiceProfileDiagnostics: indexBy(seed.voiceProfileDiagnostics ?? [], (record) => record.userId),
    voiceProfileSnapshots: indexBy(seed.voiceProfileSnapshots ?? [], (record) => record.id),
    voiceTrainingConsents: indexBy(seed.voiceTrainingConsents ?? [], (record) => record.userId),
    auditRecords: indexBy(seed.auditRecords ?? [], (record) => record.id),
    executionReactions: indexBy(seed.executionReactions ?? [], (record) => record.executionId),
    voiceExampleBatches: indexBy(seed.voiceExampleBatches ?? [], (record) => record.id),
    practiceProfiles: indexBy(seed.practiceProfiles ?? [], (record) => record.userId),
    practiceProfileDiagnostics: indexBy(seed.practiceProfileDiagnostics ?? [], (record) => record.userId)
  };
}

export function createClient(state: DatabaseState): DatabaseClient {
  const stateRef = { current: state };

  const client: DatabaseClient = {
    jobs: createJobRepository(stateRef),
    memories: createMemoryRepository(stateRef),
    contentTypes: createContentTypeRepository(stateRef),
    pipelines: createPipelineRepository(stateRef),
    voiceExamples: createVoiceExampleRepository(stateRef),
    voiceProfiles: createVoiceProfileRepository(stateRef),
    voiceProfileDiagnostics: createVoiceProfileDiagnosticsRepository(stateRef),
    voiceProfileSnapshots: createVoiceProfileSnapshotRepository(stateRef),
    voiceTrainingConsents: createVoiceTrainingConsentRepository(stateRef),
    executionReactions: createExecutionReactionRepository(stateRef),
    voiceExampleBatches: createVoiceExampleBatchRepository(stateRef),
    practiceProfiles: createPracticeProfileRepository(stateRef),
    practiceProfileDiagnostics: createPracticeProfileDiagnosticsRepository(stateRef),
    audit: createAuditRepository(stateRef),
    transaction: (operation) =>
      Effect.gen(function* () {
        const snapshot = cloneState(stateRef.current);
        const nested = createClient(snapshot);
        const result = yield* operation(nested);
        stateRef.current = nested.snapshot();
        return result;
      }),
    snapshot: () => cloneState(stateRef.current)
  };

  return client;
}

export function createJobRepositoryFromClient(client: DatabaseClient): JobRepository {
  return client.jobs;
}

export function createMemoryRepositoryFromClient(client: DatabaseClient): MemoryRepository {
  return client.memories;
}

export function createContentTypeRepositoryFromClient(client: DatabaseClient): ContentTypeRepository {
  return client.contentTypes;
}

export function createPipelineRepositoryFromClient(client: DatabaseClient): PipelineRepository {
  return client.pipelines;
}

export function createVoiceExampleRepositoryFromClient(client: DatabaseClient): VoiceExampleRepository {
  return client.voiceExamples;
}

export function createVoiceProfileRepositoryFromClient(client: DatabaseClient): VoiceProfileRepository {
  return client.voiceProfiles;
}

export function createVoiceProfileDiagnosticsRepositoryFromClient(client: DatabaseClient): VoiceProfileDiagnosticsRepository {
  return client.voiceProfileDiagnostics;
}

export function createVoiceProfileSnapshotRepositoryFromClient(client: DatabaseClient): VoiceProfileSnapshotRepository {
  return client.voiceProfileSnapshots;
}

export function createAuditRepositoryFromClient(client: DatabaseClient): AuditRepository {
  return client.audit;
}

export function createVoiceTrainingConsentRepositoryFromClient(client: DatabaseClient): VoiceTrainingConsentRepository {
  return client.voiceTrainingConsents;
}

export function createExecutionReactionRepositoryFromClient(client: DatabaseClient): ExecutionReactionRepository {
  return client.executionReactions;
}

export function createVoiceExampleBatchRepositoryFromClient(client: DatabaseClient): VoiceExampleBatchRepository {
  return client.voiceExampleBatches;
}

export function createPracticeProfileRepositoryFromClient(client: DatabaseClient): PracticeProfileRepository {
  return client.practiceProfiles;
}

export function createPracticeProfileDiagnosticsRepositoryFromClient(
  client: DatabaseClient
): PracticeProfileDiagnosticsRepository {
  return client.practiceProfileDiagnostics;
}
