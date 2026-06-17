import { Effect } from "effect";

export function extractJsonObject(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

export function parseJsonFromLlmResponse(content: string): Effect.Effect<unknown, string> {
  return Effect.try({
    try: () => JSON.parse(extractJsonObject(content)),
    catch: (error) => (error instanceof Error ? error.message : "Failed to parse JSON")
  });
}
