import { describe, expect, it } from "vitest";
import { isAuthSessionExpiredError } from "../../apps/web/src/app/auth/lib/is-auth-session-expired.js";

describe("isAuthSessionExpiredError", () => {
  it("detects auth0 login_required errors", () => {
    expect(isAuthSessionExpiredError({ error: "login_required" })).toBe(true);
  });

  it("detects missing refresh token errors", () => {
    expect(isAuthSessionExpiredError({ error: "missing_refresh_token" })).toBe(true);
    expect(isAuthSessionExpiredError({ message: "Missing refresh token" })).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isAuthSessionExpiredError(new Error("network down"))).toBe(false);
    expect(isAuthSessionExpiredError(null)).toBe(false);
  });
});
