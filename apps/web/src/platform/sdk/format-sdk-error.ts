import { isClientSdkError, type ClientSdkHttpStatusError } from "@my-ai-orchestrator/client-sdk";
import type { AppMessages } from "~/i18n/app/types";
import { mapSdkErrorCode, type MappedSdkError } from "./map-sdk-error-code";

export function formatSdkError(error: unknown, messages: AppMessages): MappedSdkError {
  if (isClientSdkError(error, "ClientSdkHttpStatusError")) {
    return mapSdkErrorCode((error as ClientSdkHttpStatusError).code, messages);
  }

  if (isClientSdkError(error, "ClientSdkObservationFailure")) {
    return messages.errors.observationFailure;
  }

  return messages.errors.default;
}
