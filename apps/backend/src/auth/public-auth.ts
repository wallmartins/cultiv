import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import { ensureDefaultFreeSubscription, type BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { BackendConfig } from "../config/config.js";
import { BackendAuthenticationError, BackendUserSuspendedError } from "../http/errors.js";
import { dedupeStrings } from "../internal/utils.js";
import type { BackendAuthenticatedActor } from "./legacy-auth.js";
import { ApplicationUserService } from "./application-user-service.js";
import { authenticateBackendBearerJwt, readStringArrayClaim } from "./jwt-common.js";

export function resolveBackendPublicAuthenticatedActor(args: {
  readonly config: BackendConfig;
  readonly route: string;
  readonly readHeader: (name: string) => string | undefined;
  readonly billing?: BillingServiceContract;
}): Effect.Effect<
  BackendAuthenticatedActor,
  BackendAuthenticationError | BackendUserSuspendedError,
  ApplicationUserService
> {
  return Effect.gen(function* () {
    const claims = yield* authenticateBackendBearerJwt(args);

    const users = yield* ApplicationUserService;
    const { user, provisioned } = yield* resolveOrProvisionApplicationUser(users, claims.sub);

    if (provisioned && args.billing) {
      yield* ensureDefaultFreeSubscription(args.billing, user.id, {
        now: () => new Date(),
        idempotencyNamespace: args.config.serviceName
      });
    }

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
): Effect.Effect<
  { readonly user: import("./application-user.js").BackendApplicationUser; readonly provisioned: boolean },
  never
> {
  return Effect.gen(function* () {
    const existing = yield* users.findByExternalSubject(externalSubject);
    if (existing) {
      return { user: existing, provisioned: false };
    }

    const user = yield* users.create({
      id: randomUUID(),
      externalSubject,
      status: "active"
    });
    return { user, provisioned: true };
  });
}


