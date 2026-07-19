import { Data, Effect } from "effect";

// contract-08 §5 task 5 — greenfield: JWT verification (jwt-jwks.ts) never needed a Management API
// client before. M2M creds are deploy-ops (config-env.ts AUTH0_MANAGEMENT_*).
export class Auth0ManagementError extends Data.TaggedError("Auth0ManagementError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export interface Auth0ManagementClient {
  readonly deleteUser: (externalSubject: string) => Effect.Effect<void, Auth0ManagementError>;
}

export interface Auth0ManagementClientOptions {
  readonly domain: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly audience?: string;
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => Date;
}

interface CachedToken {
  readonly accessToken: string;
  readonly expiresAt: number;
}

export function createAuth0ManagementClient(options: Auth0ManagementClientOptions): Auth0ManagementClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date());
  const audience = options.audience ?? `https://${options.domain}/api/v2/`;
  let cachedToken: CachedToken | undefined;

  function fetchAccessToken(): Effect.Effect<string, Auth0ManagementError> {
    return Effect.tryPromise({
      try: async () => {
        const response = await fetchImpl(`https://${options.domain}/oauth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: options.clientId,
            client_secret: options.clientSecret,
            audience
          })
        });
        if (!response.ok) {
          throw new Error(`Auth0 token request failed: ${response.status} ${await response.text()}`);
        }
        const body = (await response.json()) as { access_token: string; expires_in: number };
        // 60s safety margin so a token near expiry isn't handed to a slow-starting delete call.
        cachedToken = {
          accessToken: body.access_token,
          expiresAt: now().getTime() + Math.max(0, (body.expires_in - 60) * 1000)
        };
        return body.access_token;
      },
      catch: (cause) => new Auth0ManagementError({ message: "Failed to obtain Auth0 Management token", cause })
    });
  }

  function getAccessToken(): Effect.Effect<string, Auth0ManagementError> {
    if (cachedToken && cachedToken.expiresAt > now().getTime()) {
      return Effect.succeed(cachedToken.accessToken);
    }
    return fetchAccessToken();
  }

  return {
    deleteUser(externalSubject) {
      return Effect.gen(function* () {
        const token = yield* getAccessToken();
        yield* Effect.tryPromise({
          try: async () => {
            const response = await fetchImpl(
              `https://${options.domain}/api/v2/users/${encodeURIComponent(externalSubject)}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            // idempotent by design — a user already gone (404) is the goal state, not a failure;
            // any other failure leaves the outbox event unpublished, which is the retry mechanism.
            if (!response.ok && response.status !== 404) {
              throw new Error(`Auth0 delete user failed: ${response.status} ${await response.text()}`);
            }
          },
          catch: (cause) => new Auth0ManagementError({ message: "Failed to delete Auth0 user", cause })
        });
      });
    }
  };
}
