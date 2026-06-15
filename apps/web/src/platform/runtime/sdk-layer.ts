import { Effect, Layer } from "effect";
import { ClientSdkService, createClientSdk, type ClientSdk } from "@my-ai-orchestrator/client-sdk";
import { AuthTokenService } from "./auth-layer";

export function createClientSdkLayer(baseUrl: string) {
  return Layer.effect(
    ClientSdkService,
    Effect.gen(function* () {
      const getToken = yield* AuthTokenService;
      return createClientSdk({ baseUrl, getToken });
    })
  );
}

export function provideClientSdk<A, E, R>(effect: Effect.Effect<A, E, R>, sdk: ClientSdk) {
  return effect.pipe(Effect.provide(Layer.succeed(ClientSdkService, sdk)));
}
