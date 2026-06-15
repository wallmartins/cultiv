import { Effect } from "effect";
import { BackendAuthorizationError } from "../http/errors.js";

export interface BackendAuthenticatedActor {
  readonly userId: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

export function requireBackendPermission(
  actor: BackendAuthenticatedActor,
  permission: string
): Effect.Effect<void, BackendAuthorizationError> {
  if (actor.permissions.includes(permission)) {
    return Effect.void;
  }

  return Effect.fail(
    new BackendAuthorizationError({
      userId: actor.userId,
      reason: "missing_permission",
      requiredPermission: permission,
      message: `Authenticated actor "${actor.userId}" is missing permission "${permission}"`
    })
  );
}

export function requireBackendRole(
  actor: BackendAuthenticatedActor,
  role: string
): Effect.Effect<void, BackendAuthorizationError> {
  if (actor.roles.includes(role)) {
    return Effect.void;
  }

  return Effect.fail(
    new BackendAuthorizationError({
      userId: actor.userId,
      reason: "missing_role",
      requiredRole: role,
      message: `Authenticated actor "${actor.userId}" is missing role "${role}"`
    })
  );
}


