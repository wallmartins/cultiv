import { Effect } from "effect";
import type { AuditRecord, AuditRepository } from "../types.js";
import { cloneRecord, type StateRef } from "./shared.js";

export function createAuditRepository(stateRef: StateRef): AuditRepository {
  return {
    putIfAbsent(record) {
      const existing = Object.values(stateRef.current.auditRecords)
        .find((current) => current.logicalKey === record.logicalKey);
      if (existing) {
        return Effect.succeed(cloneRecord(existing));
      }

      stateRef.current = {
        ...stateRef.current,
        auditRecords: {
          ...stateRef.current.auditRecords,
          [record.id]: cloneRecord(record)
        }
      };
      return Effect.succeed(cloneRecord(record));
    },
    getByLogicalKey(logicalKey) {
      const record = Object.values(stateRef.current.auditRecords)
        .find((current) => current.logicalKey === logicalKey);
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    },
    list() {
      return Effect.succeed(
        Object.values(stateRef.current.auditRecords)
          .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
          .map(cloneRecord)
      );
    }
  };
}
