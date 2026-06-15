import { Context, Layer } from "effect";

export type AuthTokenProvider = () => Promise<string | undefined>;

export class AuthTokenService extends Context.Tag("AuthTokenService")<AuthTokenService, AuthTokenProvider>() {}

export function createAuthTokenLayer(getToken: AuthTokenProvider) {
  return Layer.succeed(AuthTokenService, getToken);
}
