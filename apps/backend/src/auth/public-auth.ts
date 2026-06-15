import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import type { BackendConfig } from "../config/config.js";
import { BackendAuthenticationError, BackendUserSuspendedError } from "../http/errors.js";
import { dedupeStrings } from "../internal/utils.js";
import type { BackendAuthenticatedActor } from "./legacy-auth.js";
import { ApplicationUserService } from "./application-user-service.js";
import {
  parseBearerToken,
  resolveBackendAuthProfile,
  verifyBackendJwt,
  readStringArrayClaim
} from "./jwt-common.js";

export function resolveBackendPublicAuthenticatedActor(args: {
  readonly config: BackendConfig;
  readonly route: string;
  readonly readHeader: (name: string) => string | undefined;
}): Effect.Effect<
  BackendAuthenticatedActor,
  BackendAuthenticationError | BackendUserSuspendedError,
  ApplicationUserService
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

    const users = yield* ApplicationUserService;
    const user = yield* resolveOrProvisionApplicationUser(users, claims.sub);

    if (user.status === "suspended") {
      return yield* Effect.fail(
        new BackendUserSuspendedError({
          userId: user.id,
          externalSubject: user.externalSubject,
          message: "User access is suspended"
        })
      );
    }

    return {
      userId: user.id,
      roles: dedupeStrings(readStringArrayClaim(claims, "roles")),
      permissions: dedupeStrings(readStringArrayClaim(claims, "permissions"))
    };
  });
}

function resolveOrProvisionApplicationUser(
  users: import("./application-user.js").BackendApplicationUserRepository,
  externalSubject: string
): Effect.Effect<import("./application-user.js").BackendApplicationUser, never> {
  return Effect.gen(function* () {
    const existing = yield* users.findByExternalSubject(externalSubject);
    if (existing) {
      return existing;
    }

    return yield* users.create({
      id: randomUUID(),
      externalSubject,
      status: "active"
    });
  });
}


