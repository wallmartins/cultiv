import { ManagedRuntime } from "effect";
import { createClientSdkLayer, type ClientSdkConfig } from "@my-ai-orchestrator/client-sdk";

export interface AppRuntimeConfig {
  readonly baseUrl: string;
  readonly getToken: NonNullable<ClientSdkConfig["getToken"]>;
}

// baseUrl travels as a param (not read from import.meta.env here) so this package
// stays platform-agnostic — the Vite app owns env resolution.
export function makeAppRuntime(config: AppRuntimeConfig) {
  return ManagedRuntime.make(createClientSdkLayer(config));
}

export type AppRuntime = ReturnType<typeof makeAppRuntime>;
