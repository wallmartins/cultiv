import { useCallback } from "react";
import type { Effect } from "effect";
import type { ClientSdkService } from "@my-ai-orchestrator/client-sdk";
import { useAppRuntime } from "./RuntimeProvider.js";

export type Run = <A, E>(effect: Effect.Effect<A, E, ClientSdkService>) => Promise<A>;

// The only door hooks use to reach the SDK — components never call this directly.
export function useRun(): Run {
  const runtime = useAppRuntime();
  return useCallback(<A, E>(effect: Effect.Effect<A, E, ClientSdkService>) => runtime.runPromise(effect), [runtime]);
}
