import { Effect } from "effect";
import { WaitlistValidationError } from "./errors.js";
import { createLoopsContact } from "./loops-adapter.js";
import type { WaitlistInput, WaitlistSuccess } from "./types.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateWaitlistInput(input: WaitlistInput) {
  if (!input.consentAt) {
    return Effect.fail(
      new WaitlistValidationError({
        field: "consent",
        message: "Consent is required"
      })
    );
  }

  if (!EMAIL_PATTERN.test(input.email.trim())) {
    return Effect.fail(
      new WaitlistValidationError({
        field: "email",
        message: "Invalid email address"
      })
    );
  }

  if (input.name && input.name.length > 100) {
    return Effect.fail(
      new WaitlistValidationError({
        field: "name",
        message: "Name is too long"
      })
    );
  }

  return Effect.succeed(input);
}

export function submitWaitlist(input: WaitlistInput) {
  return Effect.gen(function* () {
    const validated = yield* validateWaitlistInput(input);
    yield* createLoopsContact(validated);
    return { ok: true } satisfies WaitlistSuccess;
  });
}
