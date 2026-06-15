import { Effect } from "effect";
import { WaitlistProviderError } from "./errors.js";
import type { WaitlistInput } from "./types.js";

const LOOPS_API_URL = "https://app.loops.so/api/v1/contacts/create";

export function createLoopsContact(input: WaitlistInput) {
  return Effect.tryPromise({
    try: async () => {
      const apiKey = process.env.LOOPS_API_KEY;
      if (!apiKey) {
        throw new Error("LOOPS_API_KEY is not configured");
      }

      const listId = process.env.LOOPS_MAILING_LIST_ID;
      const body: Record<string, unknown> = {
        email: input.email,
        source: `waitlist-${input.locale}`,
        userGroup: input.locale
      };

      if (input.name) {
        body.firstName = input.name;
      }

      if (listId) {
        body.mailingLists = { [listId]: true };
      }

      const response = await fetch(LOOPS_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Loops responded with HTTP ${response.status}`);
      }
    },
    catch: (error) =>
      new WaitlistProviderError({
        message: error instanceof Error ? error.message : "Failed to contact Loops"
      })
  });
}
