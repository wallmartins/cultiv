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
import type { JobProgress } from "@my-ai-orchestrator/contracts";
import type {
  ContentTypeRecord,
  JobCreateOptions,
  JobRecord,
  MemoryEntryRecord,
  PipelineRecord,
  VoiceExampleRecord,
  VoiceProfileDiagnosticsRecord,
  VoiceProfileRecord,
  VoiceProfileSnapshotRecord,
  VoiceTrainingConsentRecord
} from "./types.js";

export function toJobRecord(job: Job, options: JobCreateOptions = {}): JobRecord {
  const progress =
    options.progress ??
    createDefaultProgress(job, job.status === "done" ? 100 : 0);
  const progressHistory =
    options.progressHistory ?? [
      {
        at: job.createdAt,
        progress
      }
    ];

  return {
    ...job,
    version: 1,
    progress,
    progressHistory,
    result: options.result ?? null,
    error: options.error ?? null,
    updatedAt: options.updatedAt ?? job.createdAt,
    history:
      options.history ?? [
        {
          type: "created",
          at: job.createdAt,
          payload: { status: job.status, contentType: job.contentType }
        }
      ]
  };
}

export function toJobDomain(record: JobRecord): Job {
  const { version, progress, progressHistory, result, error, updatedAt, history, ...job } = record;
  return job;
}

export function toMemoryEntryRecord(record: DomainMemoryRecord, version = 1): MemoryEntryRecord {
  return {
    ...record,
    version
  };
}

export function toMemoryDomain(record: MemoryEntryRecord): DomainMemoryRecord {
  const { version, ...memory } = record;
  return memory;
}

export function toContentTypeRecord(record: ContentType, version = 1, updatedAt = new Date().toISOString()): ContentTypeRecord {
  return {
    ...record,
    version,
    updatedAt
  };
}

export function toContentTypeDomain(record: ContentTypeRecord): ContentType {
  const { version, updatedAt, ...contentType } = record;
  return contentType;
}

export function toPipelineRecord(record: Pipeline, version = 1, updatedAt = new Date().toISOString()): PipelineRecord {
  return {
    ...record,
    version,
    updatedAt
  };
}

export function toPipelineDomain(record: PipelineRecord): Pipeline {
  const { version, updatedAt, ...pipeline } = record;
  return pipeline;
}

export function toVoiceExampleRecord(record: VoiceExample, version = 1): VoiceExampleRecord {
  return {
    ...record,
    version
  };
}

export function toVoiceExampleDomain(record: VoiceExampleRecord): VoiceExample {
  const { version, ...example } = record;
  return example;
}

export function toVoiceProfileRecord(record: DerivedVoiceProfile, version = 1): VoiceProfileRecord {
  const { version: profileVersion, ...profile } = record;
  return {
    ...profile,
    profileVersion,
    version
  };
}

export function toVoiceProfileDomain(record: VoiceProfileRecord): DerivedVoiceProfile {
  const { version, profileVersion, ...profile } = record;
  return {
    ...profile,
    version: profileVersion
  };
}

export function toVoiceProfileDiagnosticsRecord(record: VoiceProfileDiagnostics, version = 1): VoiceProfileDiagnosticsRecord {
  return {
    ...record,
    version
  };
}

export function toVoiceProfileDiagnosticsDomain(record: VoiceProfileDiagnosticsRecord): VoiceProfileDiagnostics {
  const { version, ...diagnostics } = record;
  return diagnostics;
}

export function toVoiceProfileSnapshotRecord(record: VoiceProfileSnapshot, version = 1): VoiceProfileSnapshotRecord {
  return {
    ...record,
    version
  };
}

export function toVoiceProfileSnapshotDomain(record: VoiceProfileSnapshotRecord): VoiceProfileSnapshot {
  const { version, ...snapshot } = record;
  return snapshot;
}

export function toVoiceTrainingConsentRecord(record: VoiceTrainingConsent, version = 1): VoiceTrainingConsentRecord {
  return {
    ...record,
    version
  };
}

export function toVoiceTrainingConsentDomain(record: VoiceTrainingConsentRecord): VoiceTrainingConsent {
  const { version, ...consent } = record;
  return consent;
}

export function createDefaultProgress(job: Job, percent = 0): JobProgress {
  return {
    currentStep: job.pipelineId ?? job.contentType ?? "queued",
    stepIndex: 0,
    totalSteps: 0,
    percent
  };
}
