import { describe, expect, it } from "vitest";
import { isAuthSurfacePath } from "../../apps/web/src/app/auth/lib/is-auth-surface-path.js";

describe("isAuthSurfacePath", () => {
  it("matches app, login, and callback routes", () => {
    expect(isAuthSurfacePath("/app")).toBe(true);
    expect(isAuthSurfacePath("/app/generate")).toBe(true);
    expect(isAuthSurfacePath("/login")).toBe(true);
    expect(isAuthSurfacePath("/callback")).toBe(true);
  });

  it("does not match marketing routes", () => {
    expect(isAuthSurfacePath("/")).toBe(false);
    expect(isAuthSurfacePath("/blog")).toBe(false);
    expect(isAuthSurfacePath("/en/blog/welcome")).toBe(false);
  });
});
