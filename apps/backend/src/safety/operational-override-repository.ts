import { Effect } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";
import type { DatabaseClient, MemoryEntryRecord } from "@my-ai-orchestrator/database";
import type {
  PersistedOperationalOverrideGrant,
  StoredOperationalOverrideGrant
} from "./operational-override-types.js";

const overrideMemoryNamespace = "safety_override_grants";

export interface BackendOperationalOverrideGrantRepository {
  readonly put: (grant: PersistedOperationalOverrideGrant) => Effect.Effect<PersistedOperationalOverrideGrant, DatabaseError>;
  readonly get: (overrideId: string) => Effect.Effect<PersistedOperationalOverrideGrant | undefined, DatabaseError>;
}

export function createBackendOperationalOverrideGrantRepository(
  database: DatabaseClient
): BackendOperationalOverrideGrantRepository {
  return {
    put: (grant) =>
      database.memories.put(toMemoryRecord(grant)).pipe(
        Effect.map(() => clonePersistedGrant(grant))
      ),
    get: (overrideId) =>
      database.memories.get(overrideMemoryNamespace, overrideId).pipe(
        Effect.map((record) => record ? parsePersistedGrantRecord(record) : undefined)
      )
  };
}

export function createPersistedOperationalOverrideGrant(
  grant: StoredOperationalOverrideGrant
): PersistedOperationalOverrideGrant {
  return {
    ...grant,
    status: "active"
  };
}

function toMemoryRecord(grant: PersistedOperationalOverrideGrant) {
  return {
    id: `safety-override:${grant.overrideId}`,
    userId: overrideMemoryNamespace,
    key: grant.overrideId,
    value: grant,
    createdAt: grant.requestedAt,
    updatedAt: grant.consumedAt ?? grant.expiredAt ?? grant.requestedAt
  };
}

function parsePersistedGrantRecord(record: MemoryEntryRecord): PersistedOperationalOverrideGrant {
  return clonePersistedGrant(record.value as PersistedOperationalOverrideGrant);
}

function clonePersistedGrant(grant: PersistedOperationalOverrideGrant): PersistedOperationalOverrideGrant {
  return {
    ...grant,
    scope: {
      ...grant.scope,
      categories: [...grant.scope.categories],
      fields: [...grant.scope.fields]
    }
  };
}
