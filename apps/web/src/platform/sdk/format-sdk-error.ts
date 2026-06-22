import { isClientSdkError, type ClientSdkHttpStatusError } from "@my-ai-orchestrator/client-sdk";
import type { AppMessages } from "~/i18n/app/types";
import { mapSdkErrorCode, type MappedSdkError } from "./map-sdk-error-code";

export function formatSdkError(error: unknown, messages: AppMessages): MappedSdkError {
  if (isClientSdkError(error, "ClientSdkHttpStatusError")) {
    const httpError = error as ClientSdkHttpStatusError;
    const mapped = mapSdkErrorCode(httpError.code, messages);
    if (httpError.responseMessage && mapped === messages.errors.default) {
      return {
        ...mapped,
        message: httpError.responseMessage
      };
    }
    return mapped;
  }

  if (isClientSdkError(error, "ClientSdkContractFailure")) {
    return {
      ...messages.errors.default,
      message: messages.errors.default.message
    };
  }

  if (isClientSdkError(error, "ClientSdkObservationFailure")) {
    return messages.errors.observationFailure;
  }

  return messages.errors.default;
}
