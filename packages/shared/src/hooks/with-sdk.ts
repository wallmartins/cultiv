import { Effect } from "effect";
import { ClientSdkService, type ClientSdk } from "@my-ai-orchestrator/client-sdk";

// Every subclient method returns an Effect already — flatMap into it.
export function withSdk<A, E>(f: (sdk: ClientSdk) => Effect.Effect<A, E>): Effect.Effect<A, E, ClientSdkService> {
  return Effect.flatMap(ClientSdkService, f);
}

// executions.watch() is synchronous (returns an ObservationHandle, not an Effect) — map instead.
export function withSdkSync<A>(f: (sdk: ClientSdk) => A): Effect.Effect<A, never, ClientSdkService> {
  return Effect.map(ClientSdkService, f);
}
