import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import type {
  BackendOperationalOverrideDependencies,
  BackendOperationalOverrideService,
  OperationalOverrideRequest
} from "./operational-override-types.js";
import { recordOperationalOverrideAttempt } from "./operational-override-audit.js";
import { evaluateOperationalOverrideRequest } from "./operational-override-policy.js";
import { consumeStoredOperationalOverride } from "./operational-override-store.js";
import { swallowWithDiagnostic } from "../effects/non-blocking-diagnostics.js";
import {
  createBackendOperationalOverrideGrantRepository,
  createPersistedOperationalOverrideGrant
} from "./operational-override-repository.js";

// ponytail: deliberate v1 stub — the request/grant/consume lifecycle and audit exist, but a
// consumed grant is not yet wired back into evaluateInput/evaluateOutput, so an approved
// override does not change any gate outcome. Wiring that seam is the roadmap follow-up.
export function createBackendOperationalOverrideService(
  deps: BackendOperationalOverrideDependencies
): BackendOperationalOverrideService {
  const overrideGrants = createBackendOperationalOverrideGrantRepository(deps.database);

  return {
    requestOverride: (request) =>
      Effect.gen(function* () {
        const requestedAt = deps.now().toISOString();
        const overrideId = `override_${randomUUID()}`;
        const decision = yield* evaluateOperationalOverrideRequest(request, requestedAt, overrideId, deps);

        yield* recordOperationalOverrideAttempt(decision, request, deps).pipe(
          Effect.orElse(swallowWithDiagnostic({
            operation: "Failed to record operational override attempt",
            context: {
              operatorId: request.operatorId,
              overrideId: decision.overrideId,
              status: decision.status
            }
          }))
        );

        if (decision.status === "approved") {
          yield* overrideGrants.put(createPersistedOperationalOverrideGrant({
            overrideId: decision.overrideId,
            operatorId: decision.operatorId,
            requestedAt: decision.requestedAt,
            justification: request.justification,
            scope: decision.scope,
            lifecycleMode: decision.lifecycleMode,
            expiresAt: decision.expiresAt,
            remainingUses: decision.remainingUses
          }));
        }

        return decision;
      }),
    consumeOverride: (overrideId) =>
      consumeStoredOperationalOverride({
        overrideId,
        deps
      })
  };
}
