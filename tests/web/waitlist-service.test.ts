import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { WaitlistValidationError } from "../../apps/web/src/platform/services/waitlist/errors.js";
import { createLoopsContact } from "../../apps/web/src/platform/services/waitlist/loops-adapter.js";
import { submitWaitlist, validateWaitlistInput } from "../../apps/web/src/platform/services/waitlist/waitlist-service.js";

describe("waitlist service", () => {
  it("rejects missing consent", async () => {
    const result = await Effect.runPromise(
      validateWaitlistInput({
        email: "user@example.com",
        locale: "pt",
        consentAt: ""
      }).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(WaitlistValidationError);
  });

  it("rejects invalid email", async () => {
    const result = await Effect.runPromise(
      validateWaitlistInput({
        email: "not-an-email",
        locale: "pt",
        consentAt: new Date().toISOString()
      }).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(WaitlistValidationError);
  });

  it("accepts valid input", async () => {
    const result = await Effect.runPromise(
      validateWaitlistInput({
        email: "user@example.com",
        locale: "en",
        consentAt: new Date().toISOString(),
        name: "Alex"
      })
    );

    expect(result.email).toBe("user@example.com");
    expect(result.locale).toBe("en");
  });

  it("creates a Loops contact with locale metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    process.env.LOOPS_API_KEY = "test-key";
    process.env.LOOPS_MAILING_LIST_ID = "list-123";

    await Effect.runPromise(
      createLoopsContact({
        email: "user@example.com",
        locale: "en",
        consentAt: new Date().toISOString(),
        name: "Alex"
      })
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://app.loops.so/api/v1/contacts/create",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          source: "waitlist-en",
          userGroup: "en",
          firstName: "Alex",
          mailingLists: { "list-123": true }
        })
      })
    );

    vi.unstubAllGlobals();
  });

  it("fails submit when Loops is not configured", async () => {
    const original = process.env.LOOPS_API_KEY;
    delete process.env.LOOPS_API_KEY;

    const result = await Effect.runPromise(
      submitWaitlist({
        email: "user@example.com",
        locale: "pt",
        consentAt: new Date().toISOString()
      }).pipe(Effect.flip)
    );

    if (original) {
      process.env.LOOPS_API_KEY = original;
    }

    expect(result._tag).toBe("WaitlistProviderError");
  });
});
