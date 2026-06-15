import { Layer } from "effect";
import { type AuthTokenProvider, createAuthTokenLayer } from "./auth-layer";
import { createClientSdkLayer } from "./sdk-layer";

export function createAppLayer(input: { readonly getToken: AuthTokenProvider; readonly baseUrl: string }) {
  return createClientSdkLayer(input.baseUrl).pipe(Layer.provide(createAuthTokenLayer(input.getToken)));
}
