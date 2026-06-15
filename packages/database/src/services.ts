import { Context, Effect, Layer } from "effect";
import type {
  ContentTypeRepository,
  DatabaseClient,
  JobRepository,
  MemoryRepository,
  PipelineRepository,
  VoiceExampleBatchRepository,
  VoiceExampleRepository,
  VoiceProfileDiagnosticsRepository,
  VoiceProfileRepository,
  VoiceProfileSnapshotRepository,
  VoiceTrainingConsentRepository
} from "./types.js";

export class DatabaseService extends Context.Tag("DatabaseService")<DatabaseService, DatabaseClient>() {}

export class JobRepositoryService extends Context.Tag("JobRepositoryService")<
  JobRepositoryService,
  JobRepository
>() {}

export class MemoryRepositoryService extends Context.Tag("MemoryRepositoryService")<
  MemoryRepositoryService,
  MemoryRepository
>() {}

export class ContentTypeRepositoryService extends Context.Tag("ContentTypeRepositoryService")<
  ContentTypeRepositoryService,
  ContentTypeRepository
>() {}

export class PipelineRepositoryService extends Context.Tag("PipelineRepositoryService")<
  PipelineRepositoryService,
  PipelineRepository
>() {}

export class VoiceExampleRepositoryService extends Context.Tag("VoiceExampleRepositoryService")<
  VoiceExampleRepositoryService,
  VoiceExampleRepository
>() {}

export class VoiceProfileRepositoryService extends Context.Tag("VoiceProfileRepositoryService")<
  VoiceProfileRepositoryService,
  VoiceProfileRepository
>() {}

export class VoiceProfileDiagnosticsRepositoryService extends Context.Tag("VoiceProfileDiagnosticsRepositoryService")<
  VoiceProfileDiagnosticsRepositoryService,
  VoiceProfileDiagnosticsRepository
>() {}

export class VoiceProfileSnapshotRepositoryService extends Context.Tag("VoiceProfileSnapshotRepositoryService")<
  VoiceProfileSnapshotRepositoryService,
  VoiceProfileSnapshotRepository
>() {}

export class VoiceExampleBatchRepositoryService extends Context.Tag("VoiceExampleBatchRepositoryService")<
  VoiceExampleBatchRepositoryService,
  VoiceExampleBatchRepository
>() {}

export class VoiceTrainingConsentRepositoryService extends Context.Tag("VoiceTrainingConsentRepositoryService")<
  VoiceTrainingConsentRepositoryService,
  VoiceTrainingConsentRepository
>() {}

export function createDatabaseLayer(client: DatabaseClient) {
  return Layer.succeed(DatabaseService, client);
}

export function createJobRepositoryLayer(repository: JobRepository) {
  return Layer.succeed(JobRepositoryService, repository);
}

export function createMemoryRepositoryLayer(repository: MemoryRepository) {
  return Layer.succeed(MemoryRepositoryService, repository);
}

export function createContentTypeRepositoryLayer(repository: ContentTypeRepository) {
  return Layer.succeed(ContentTypeRepositoryService, repository);
}

export function createPipelineRepositoryLayer(repository: PipelineRepository) {
  return Layer.succeed(PipelineRepositoryService, repository);
}

export function createVoiceExampleRepositoryLayer(repository: VoiceExampleRepository) {
  return Layer.succeed(VoiceExampleRepositoryService, repository);
}

export function createVoiceProfileRepositoryLayer(repository: VoiceProfileRepository) {
  return Layer.succeed(VoiceProfileRepositoryService, repository);
}

export function createVoiceProfileDiagnosticsRepositoryLayer(repository: VoiceProfileDiagnosticsRepository) {
  return Layer.succeed(VoiceProfileDiagnosticsRepositoryService, repository);
}

export function createVoiceProfileSnapshotRepositoryLayer(repository: VoiceProfileSnapshotRepository) {
  return Layer.succeed(VoiceProfileSnapshotRepositoryService, repository);
}

export function createVoiceExampleBatchRepositoryLayer(repository: VoiceExampleBatchRepository) {
  return Layer.succeed(VoiceExampleBatchRepositoryService, repository);
}

export function createVoiceTrainingConsentRepositoryLayer(repository: VoiceTrainingConsentRepository) {
  return Layer.succeed(VoiceTrainingConsentRepositoryService, repository);
}

export const createDatabaseClientLayer = (client: DatabaseClient) =>
  Layer.mergeAll(
    createDatabaseLayer(client),
    createJobRepositoryLayer(client.jobs),
    createMemoryRepositoryLayer(client.memories),
    createContentTypeRepositoryLayer(client.contentTypes),
    createPipelineRepositoryLayer(client.pipelines),
    createVoiceExampleRepositoryLayer(client.voiceExamples),
    createVoiceProfileRepositoryLayer(client.voiceProfiles),
    createVoiceProfileDiagnosticsRepositoryLayer(client.voiceProfileDiagnostics),
    createVoiceProfileSnapshotRepositoryLayer(client.voiceProfileSnapshots),
    createVoiceExampleBatchRepositoryLayer(client.voiceExampleBatches),
    createVoiceTrainingConsentRepositoryLayer(client.voiceTrainingConsents)
  );

export function withDatabase<T>(effect: Effect.Effect<T>, client: DatabaseClient) {
  return effect.pipe(Effect.provide(createDatabaseClientLayer(client)));
}
