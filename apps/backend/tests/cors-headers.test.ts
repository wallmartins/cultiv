import { describe, expect, it } from "vitest";
import { getCorsHeaders, isCorsOriginAllowed } from "../src/production/headers.js";
import type { BackendConfig } from "../src/config/config.js";

const baseConfig = {
  environment: "development",
  corsAllowedOrigins: undefined
} as BackendConfig;

describe("CORS headers", () => {
  it("allows localhost web origins in development without explicit config", () => {
    expect(isCorsOriginAllowed(baseConfig, "http://localhost:3000", false)).toBe(true);
    expect(getCorsHeaders(false, baseConfig, "http://localhost:3000")).toMatchObject({
      "access-control-allow-origin": "http://localhost:3000"
    });
  });

  it("rejects unknown origins in development when not configured", () => {
    expect(isCorsOriginAllowed(baseConfig, "http://evil.example", false)).toBe(false);
    expect(getCorsHeaders(false, baseConfig, "http://evil.example")).toEqual({});
  });

  it("uses configured origins in production", () => {
    const config = {
      ...baseConfig,
      environment: "production",
      corsAllowedOrigins: ["https://www.cultiv.app"]
    } as BackendConfig;

    expect(isCorsOriginAllowed(config, "https://www.cultiv.app", true)).toBe(true);
    expect(isCorsOriginAllowed(config, "http://localhost:3000", true)).toBe(false);
  });
});
