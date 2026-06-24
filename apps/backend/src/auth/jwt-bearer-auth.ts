import { Effect } from "effect";
import type { BackendConfig } from "../config/config.js";
import { BackendAuthenticationError } from "../http/errors.js";
import { resolveBackendAuthProfile } from "./jwt-profile.js";
import { parseBearerToken, verifyBackendJwt } from "./jwt-token.js";
import type { BackendJwtClaims, AuthenticatedBackendJwtClaims } from "./jwt-types.js";

export function authenticateBackendBearerJwt(args: {
  readonly config: BackendConfig;
  readonly route: string;
  readonly readHeader: (name: string) => string | undefined;
}): Effect.Effect<AuthenticatedBackendJwtClaims, BackendAuthenticationError> {
  return Effect.gen(function* () {
    const token = parseBearerToken(args.readHeader("authorization"));
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

    return { ...claims, sub: claims.sub };
  });
}
