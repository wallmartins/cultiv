import type { DatabaseSnapshot, DatabaseState } from "../types.js";

export type StateRef = { current: DatabaseState };

export function cloneState(state: DatabaseState): DatabaseSnapshot {
  return JSON.parse(JSON.stringify(state)) as DatabaseSnapshot;
}

export function cloneRecord<T>(record: T): T {
  return JSON.parse(JSON.stringify(record)) as T;
}

export function indexBy<T>(items: readonly T[], keyOf: (item: T) => string): Record<string, T> {
  const index: Record<string, T> = {};
  for (const item of items) {
    index[keyOf(item)] = cloneRecord(item);
  }
  return index;
}

export function memoryKey(userId: string, key: string): string {
  return `${userId}:${key}`;
}
