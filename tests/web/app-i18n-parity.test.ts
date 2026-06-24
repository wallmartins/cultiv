import { describe, expect, it } from "vitest";
import { appMessagesEn } from "../../apps/web/src/i18n/app/messages/en";
import { appMessagesPt } from "../../apps/web/src/i18n/app/messages/pt";

function collectKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    collectKeys(nested, prefix ? `${prefix}.${key}` : key)
  );
}

describe("app i18n parity", () => {
  it("keeps pt and en message trees aligned", () => {
    const ptKeys = collectKeys(appMessagesPt).sort();
    const enKeys = collectKeys(appMessagesEn).sort();
    expect(ptKeys).toEqual(enKeys);
  });

  it("includes auth flow and notification dismiss keys", () => {
    const authKeys = [
      "auth.signingIn",
      "auth.redirectingToLogin",
      "auth.preparingSession",
      "auth.sessionPrepareFailed",
      "auth.logoutAndSignInAgain",
      "auth.sessionPrepareFailedLogin",
      "auth.openingLogin",
      "auth.loginFailed",
      "auth.sessionPrepareFailedCallback",
      "auth.finishingLogin",
      "notifications.dismiss"
    ];

    for (const key of authKeys) {
      expect(collectKeys(appMessagesPt)).toContain(key);
      expect(collectKeys(appMessagesEn)).toContain(key);
    }
  });
});
