import { Effect } from "effect";
import type { BackendConfig } from "../config/config.js";
import { BackendAuthenticationError } from "../http/errors.js";
import type { BackendAuthenticatedActor } from "./legacy-auth.js";
import { OperatorService } from "./operator-service.js";
import {
  parseBearerToken,
  resolveBackendAuthProfile,
  verifyBackendJwt
} from "./jwt-common.js";

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
    const authHeader = args.readHeader("authorization");
    const token = parseBearerToken(authHeader);
    if (!token) {
      return yield* Effect.fail(
        new BackendAuthenticationError({
          route: args.route,
          reason: "missing_token",
          message: "Authorization bearer token is required"
        })
      );
    }

    const profile = resolveBackendAuthProfile(args.config);
    const claims = yield* verifyBackendJwt(token, profile, args.route);

    if (!claims.sub || claims.sub.trim().length === 0) {
      return yield* Effect.fail(
        new BackendAuthenticationError({
          route: args.route,
          reason: "invalid_token",
          message: "JWT is missing a subject claim"
        })
      );
    }

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
