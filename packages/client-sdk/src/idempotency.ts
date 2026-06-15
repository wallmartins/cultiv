export function createIdempotencyKey(): string {
  return globalThis.crypto.randomUUID();
}

export function withIdempotencyKey<T extends Record<string, unknown>>(body: T, idempotencyKey: string): T {
  return { ...body, idempotencyKey };
}
