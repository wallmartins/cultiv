export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right)
    );
    return entries.reduce<Record<string, unknown>>((accumulator, [key, entry]) => {
      accumulator[key] = sortValue(entry);
      return accumulator;
    }, {});
  }

  return value;
}
