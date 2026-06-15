export const inputFieldKeys = ["briefing", "context", "importedContext", "inputs"] as const;

export interface InspectableInputRequest {
  readonly briefing?: unknown;
  readonly context?: unknown;
  readonly importedContext?: unknown;
  readonly inputs?: unknown;
}

export function dedupeStrings<T extends string>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}
