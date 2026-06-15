import { ClientSdkHttpStatusError, isClientSdkError } from "@my-ai-orchestrator/client-sdk";

export function isSdkResourceNotFound(error: unknown): boolean {
  if (!isClientSdkError(error, "ClientSdkHttpStatusError")) {
    return false;
  }

  const httpError = error as ClientSdkHttpStatusError;
  return httpError.status === 404 || httpError.code === "resource_not_found";
}
