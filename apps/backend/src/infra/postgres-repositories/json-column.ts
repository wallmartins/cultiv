export function parseStoredJsonRecord<T extends object>(data: unknown): T {
  if (typeof data === "string") {
    return JSON.parse(data) as T;
  }

  if (typeof data === "object" && data !== null) {
    return data as T;
  }

  throw new Error("Expected a JSON column value");
}
