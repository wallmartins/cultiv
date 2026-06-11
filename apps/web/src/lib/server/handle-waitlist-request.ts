import { Effect } from "effect";
import {
  WaitlistProviderError,
  WaitlistRateLimitedError,
  WaitlistValidationError
} from "~/lib/services/waitlist/errors";
import { submitWaitlist } from "~/lib/services/waitlist/waitlist-service";
import type { WaitlistErrorBody, WaitlistInput, WaitlistSuccess } from "~/lib/services/waitlist/types";

const rateLimitStore = new Map<string, { readonly count: number; readonly resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

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

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  if (current.count >= RATE_LIMIT_MAX) {
    throw new WaitlistRateLimitedError({ message: "Too many submissions" });
  }

  rateLimitStore.set(key, { count: current.count + 1, resetAt: current.resetAt });
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

  return { code: "provider_error", message: "Unexpected waitlist failure" };
}

export async function handleWaitlistRequest(
  payload: unknown,
  ip: string
): Promise<WaitlistSuccess | WaitlistErrorBody> {
  try {
    checkRateLimit(ip);
    const input = parseWaitlistInput(payload);
    return await Effect.runPromise(submitWaitlist(input));
  } catch (error) {
    return toWaitlistErrorBody(error);
  }
}

