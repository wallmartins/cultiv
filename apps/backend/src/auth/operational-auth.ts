import { Effect } from "effect";
import type { BackendConfig } from "../config/config.js";
import { BackendAuthenticationError } from "../http/errors.js";
import type { BackendAuthenticatedActor } from "./legacy-auth.js";
import { OperatorService } from "./operator-service.js";
import { authenticateBackendBearerJwt } from "./jwt-common.js";

export function resolveBackendOperationalActor(args: {
  readonly config: BackendConfig;
  readonly route: string;
  readonly readHeader: (name: string) => string | undefined;
}): Effect.Effect<
  BackendAuthenticatedActor,
  BackendAuthenticationError,
  OperatorService
> {
  return Effect.gen(function* () {
    const claims = yield* authenticateBackendBearerJwt(args);

    const operators = yield* OperatorService;
    const operator = yield* operators.findById(claims.sub);
    if (!operator) {
      return yield* Effect.fail(
        new BackendAuthenticationError({
          route: args.route,
          reason: "invalid_token",
          message: "Operator not recognized"
        })
      );
    }

    if (operator.status !== "active") {
      return yield* Effect.fail(
        new BackendAuthenticationError({
          route: args.route,
          reason: "invalid_token",
          message: "Operator access is suspended"
        })
      );
    }

    return {
      userId: operator.id,
      roles: [...operator.roles],
      permissions: [...operator.permissions]
    };
  });
}
