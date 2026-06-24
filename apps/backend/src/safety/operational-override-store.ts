import type { DatabaseError } from "@my-ai-orchestrator/database";
import { Effect } from "effect";
import { DatabaseTransactionInvariantError } from "@my-ai-orchestrator/database";
import { BackendOperationalOverrideStateError } from "../http/errors.js";
import { swallowWithDiagnostic } from "../effects/non-blocking-diagnostics.js";
import type {
  BackendOperationalOverrideDependencies,
  OperationalOverrideConsumptionResult
} from "./operational-override-types.js";
import { recordOperationalOverrideLifecycleEvent } from "./operational-override-audit.js";
import { createBackendOperationalOverrideGrantRepository } from "./operational-override-repository.js";

export function consumeStoredOperationalOverride(args: {
  readonly overrideId: string;
  readonly deps: BackendOperationalOverrideDependencies;
}): Effect.Effect<OperationalOverrideConsumptionResult, BackendOperationalOverrideStateError | DatabaseError> {
  return Effect.gen(function* () {
    const consumedAt = args.deps.now().toISOString();
    const transition = yield* args.deps.database.transaction((database) =>
      Effect.gen(function* () {
        const grants = createBackendOperationalOverrideGrantRepository(database);
        const grant = yield* grants.get(args.overrideId);

        if (!grant) {
          return {
            status: "error" as const,
            reason: "override_not_found" as const
          };
        }

        if (grant.status === "consumed") {
          return {
            status: "error" as const,
            reason: "override_already_consumed" as const
          };
        }

        if (grant.status === "expired") {
          return {
            status: "error" as const,
            reason: "override_expired" as const
          };
        }

        if (grant.expiresAt && grant.expiresAt <= consumedAt) {
          const expiredGrant = {
            ...grant,
            status: "expired" as const,
            expiredAt: consumedAt
          };
          yield* grants.put(expiredGrant);

          return {
            status: "expired" as const,
            grant: expiredGrant
          };
        }

        const nextRemainingUses = grant.lifecycleMode === "one_shot"
          ? grant.remainingUses - 1
          : grant.remainingUses;
        const nextGrant = {
          ...grant,
          remainingUses: nextRemainingUses,
          status: grant.lifecycleMode === "one_shot" ? "consumed" as const : "active" as const,
          consumedAt
        };
        yield* grants.put(nextGrant);

        return {
          status: "consumed" as const,
          grant: nextGrant
        };
      })
    );

    if (transition.status === "error") {
      return yield* Effect.fail(createOverrideStateError(args.overrideId, transition.reason));
    }

    if (transition.status === "expired") {
      yield* recordOperationalOverrideLifecycleEvent("expired", transition.grant, consumedAt, args.deps).pipe(
        Effect.orElse(swallowWithDiagnostic({
          operation: "Failed to record expired operational override lifecycle event",
          context: { overrideId: args.overrideId }
        }))
      );
      return yield* Effect.fail(createOverrideStateError(args.overrideId, "override_expired"));
    }

    yield* recordOperationalOverrideLifecycleEvent("consumed", transition.grant, consumedAt, args.deps).pipe(
      Effect.orElse(swallowWithDiagnostic({
        operation: "Failed to record consumed operational override lifecycle event",
        context: { overrideId: args.overrideId }
      }))
    );

    return {
      overrideId: args.overrideId,
      status: transition.grant.lifecycleMode === "one_shot" ? "consumed" : "active",
      operatorId: transition.grant.operatorId,
      consumedAt,
      scope: transition.grant.scope,
      lifecycleMode: transition.grant.lifecycleMode,
      expiresAt: transition.grant.expiresAt,
      remainingUses: transition.grant.remainingUses
    } satisfies OperationalOverrideConsumptionResult;
  }).pipe(
    Effect.catchTag("DatabaseTransactionInvariantError", (error: DatabaseTransactionInvariantError) =>
      Effect.fail(
        new BackendOperationalOverrideStateError({
          overrideId: args.overrideId,
          reason: "override_not_found",
          message: `Operational override "${args.overrideId}" could not be consumed because the database transaction failed: ${error.message}`
        })
      )
    )
  );
}

function createOverrideStateError(
  overrideId: string,
  reason: BackendOperationalOverrideStateError["reason"]
): BackendOperationalOverrideStateError {
  if (reason === "override_expired") {
    return new BackendOperationalOverrideStateError({
      overrideId,
      reason,
      message: `Operational override "${overrideId}" has expired`
    });
  }

  if (reason === "override_already_consumed") {
    return new BackendOperationalOverrideStateError({
      overrideId,
      reason,
      message: `Operational override "${overrideId}" has already been consumed`
    });
  }

  return new BackendOperationalOverrideStateError({
    overrideId,
    reason: "override_not_found",
    message: `Operational override "${overrideId}" was not found`
  });
}
