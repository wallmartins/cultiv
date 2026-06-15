import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import { Effect } from "effect";
import { swallowWithDiagnostic } from "../../effects/non-blocking-diagnostics.js";

export function persistContentType(
  database: DatabaseClient,
  plan: OrchestrationPlan,
  at: string
): Effect.Effect<void, never> {
  return database.contentTypes
    .put(
      {
        id: plan.contentType.id,
        label: plan.contentType.label,
        defaultLanguage: plan.contentType.defaultLanguage,
        steps: [...plan.contentType.steps],
        inputSchema: { ...plan.contentType.inputSchema }
      },
      1,
      at
    )
    .pipe(
      Effect.catchAll(swallowWithDiagnostic({
        operation: "Failed to persist content type snapshot",
        context: { contentTypeId: plan.contentType.id }
      })),
      Effect.map(() => undefined)
    );
}
