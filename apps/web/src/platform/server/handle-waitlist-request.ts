import { Effect } from "effect";
import {
  WaitlistProviderError,
  WaitlistRateLimitedError,
  WaitlistValidationError
} from "~/platform/services/waitlist/errors";
import { submitWaitlist } from "~/platform/services/waitlist/waitlist-service";
import type { WaitlistErrorBody, WaitlistInput, WaitlistSuccess } from "~/platform/services/waitlist/types";
import { assertWaitlistRateLimit } from "~/platform/server/waitlist-rate-limit";

export function parseWaitlistInput(payload: unknown): WaitlistInput {
  if (payload === null || typeof payload !== "object") {
    throw new WaitlistValidationError({ field: "body", message: "Invalid request body" });
  }

  const record = payload as Record<string, unknown>;
  const locale = record.locale === "en" ? "en" : record.locale === "pt" ? "pt" : null;

  if (!locale) {
    throw new WaitlistValidationError({ field: "locale", message: "Invalid locale" });
  }

  return {
    email: String(record.email ?? ""),
    name: record.name ? String(record.name) : undefined,
    locale,
    consentAt: String(record.consentAt ?? "")
  };
}

export function toWaitlistErrorBody(error: unknown): WaitlistErrorBody {
  if (error instanceof WaitlistValidationError) {
    return { code: "validation_error", field: error.field, message: error.message };
  }

  if (error instanceof WaitlistRateLimitedError) {
    return { code: "rate_limited", message: error.message };
  }

  if (error instanceof WaitlistProviderError) {
    return { code: "provider_error", message: error.message };
  }

  if (error instanceof Error && error.message === "rate_limited") {
    return { code: "rate_limited", message: "Too many submissions" };
  }

  return { code: "provider_error", message: "Unexpected waitlist failure" };
}

export async function handleWaitlistRequest(
  payload: unknown,
  ip: string
): Promise<WaitlistSuccess | WaitlistErrorBody> {
  try {
    await assertWaitlistRateLimit(ip);
    const input = parseWaitlistInput(payload);
    return await Effect.runPromise(submitWaitlist(input));
  } catch (error) {
    if (error instanceof Error && error.message === "rate_limited") {
      return toWaitlistErrorBody(new WaitlistRateLimitedError({ message: "Too many submissions" }));
    }

    return toWaitlistErrorBody(error);
  }
}
