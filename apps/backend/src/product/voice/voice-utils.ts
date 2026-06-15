export function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}

export function normalizeLanguage(value: string): string {
  return value.trim().toLowerCase();
}
