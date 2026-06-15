import type { DatabaseClient } from "@my-ai-orchestrator/database";
import { Effect } from "effect";
import { swallowWithDiagnostic } from "../../effects/non-blocking-diagnostics.js";

export function persistMemoryWrite(
  database: DatabaseClient,
  args: {
    readonly key: string;
    readonly value: unknown;
    readonly at: string;
  }
): Effect.Effect<void, never> {
  const namespace = "backend";

  return database.memories.put(
    {
      id: `${namespace}:${args.key}`,
      userId: namespace,
      key: args.key,
      value: args.value,
      createdAt: args.at,
      updatedAt: args.at
    },
    1
  ).pipe(
    Effect.catchAll(swallowWithDiagnostic({
      operation: "Failed to persist backend memory write",
      context: { key: args.key }
    })),
    Effect.map(() => undefined)
  );
}
