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

export interface BillingPlansTable {
  id: string;
  data: unknown;
}

export interface BillingSubscriptionsTable {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  renewed_at: string | null;
  expires_at: string | null;
}

export interface BillingUsageRecordsTable {
  id: string;
  user_id: string;
  plan_id: string;
  subscription_id: string;
  kind: string;
  amount: number;
  credits: number;
  created_at: string;
  metadata: unknown;
}

export interface BillingLedgerEntriesTable {
  id: number;
  subscription_id: string;
  account_id: string;
  entry_type: string;
  credits_delta: number;
  balance_after: number;
  reference_type: string;
  reference_id: string;
  idempotency_key: string;
  metadata: unknown;
  created_at: string;
}

export interface BillingReservationsTable {
  reservation_id: string;
  generation_cycle_id: string;
  subscription_id: string;
  account_id: string;
  quality_mode: string;
  retry_count: number;
  reserved_credits: number;
  status: string;
  idempotency_key: string;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

export interface BillingCycleStatesTable {
  account_id: string;
  cycle_id: string;
  subscription_id: string;
  opened_at: string;
  closed_at: string | null;
  rollover_credits: number;
  granted_credits: number;
  expired_credits: number;
}

export interface BillingTopUpPackagesTable {
  id: string;
  credits: number;
  price_cents: number;
  currency: string;
  description: string | null;
}

export interface BillingOperationIdempotencyTable {
  operation_key: string;
  result: unknown;
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
  billing_plans: BillingPlansTable;
  billing_subscriptions: BillingSubscriptionsTable;
  billing_usage_records: BillingUsageRecordsTable;
  billing_ledger_entries: BillingLedgerEntriesTable;
  billing_reservations: BillingReservationsTable;
  billing_cycle_states: BillingCycleStatesTable;
  billing_top_up_packages: BillingTopUpPackagesTable;
  billing_operation_idempotency: BillingOperationIdempotencyTable;
  outbox_events: OutboxEventsTable;
  execution_idempotency: ExecutionIdempotencyTable;
}
