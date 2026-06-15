export interface JobsTable {
  id: string;
  user_id: string | null;
  data: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface MemoriesTable {
  id: string;
  user_id: string;
  key: string;
  data: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ContentTypesTable {
  id: string;
  data: string;
  version: number;
  updated_at: string;
}

export interface PipelinesTable {
  id: string;
  data: string;
  version: number;
  updated_at: string;
}

export interface VoiceExamplesTable {
  id: string;
  user_id: string;
  data: string;
  version: number;
  created_at: string;
}

export interface VoiceProfilesTable {
  id: string;
  user_id: string;
  data: string;
  version: number;
}

export interface VoiceProfileDiagnosticsTable {
  id: string;
  user_id: string;
  data: string;
  version: number;
}

export interface VoiceProfileSnapshotsTable {
  id: string;
  user_id: string;
  data: string;
  version: number;
  created_at: string;
}

export interface VoiceExampleBatchesTable {
  id: string;
  user_id: string;
  data: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicationUsersTable {
  id: string;
  external_subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OperatorsTable {
  id: string;
  permissions: string;
  roles: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AuditRecordsTable {
  id: string;
  logical_key: string;
  actor_id: string;
  actor_type: string;
  resource_type: string;
  resource_id: string;
  mutation_type: string;
  occurred_at: string;
  metadata: string;
}

export interface VoiceTrainingConsentsTable {
  id: string;
  user_id: string;
  data: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface BillingSnapshotsTable {
  id: string;
  data: unknown;
  updated_at: string;
}

export interface OutboxEventsTable {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: unknown;
  occurred_at: string;
  published_at: string | null;
}

export interface ExecutionIdempotencyTable {
  user_id: string;
  idempotency_key: string;
  fingerprint: string;
  execution_id: string;
  response: unknown;
  created_at: string;
}

export interface DatabaseTables {
  jobs: JobsTable;
  memories: MemoriesTable;
  content_types: ContentTypesTable;
  pipelines: PipelinesTable;
  voice_examples: VoiceExamplesTable;
  voice_profiles: VoiceProfilesTable;
  voice_profile_diagnostics: VoiceProfileDiagnosticsTable;
  voice_profile_snapshots: VoiceProfileSnapshotsTable;
  voice_example_batches: VoiceExampleBatchesTable;
  application_users: ApplicationUsersTable;
  operators: OperatorsTable;
  audit_records: AuditRecordsTable;
  voice_training_consents: VoiceTrainingConsentsTable;
  billing_snapshots: BillingSnapshotsTable;
  outbox_events: OutboxEventsTable;
  execution_idempotency: ExecutionIdempotencyTable;
}
