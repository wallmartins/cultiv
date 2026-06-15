import type { Context } from "hono";
import { describe, expect, it } from "vitest";
import { resolveTrustedClientIp } from "../../apps/backend/src/production/trusted-client-ip.js";

describe("resolveTrustedClientIp", () => {
  it("prefers cf-connecting-ip over forwarded headers", () => {
    const clientIp = resolveTrustedClientIp(createMockContext({
      "cf-connecting-ip": "198.51.100.20",
      "x-forwarded-for": "203.0.113.10, 10.0.0.1"
    }), { trustProxy: true });

    expect(clientIp).toBe("198.51.100.20");
  });

  it("uses x-forwarded-for when trust proxy is enabled", () => {
    const clientIp = resolveTrustedClientIp(createMockContext({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1"
    }), { trustProxy: true });

    expect(clientIp).toBe("203.0.113.10");
  });

  it("ignores forwarded headers when trust proxy is disabled", () => {
    const clientIp = resolveTrustedClientIp(createMockContext({
      "x-forwarded-for": "203.0.113.10"
    }), { trustProxy: false });

    expect(clientIp).toBe("local");
  });
});

function createMockContext(headers: Record<string, string>): Context {
  return {
    req: {
      header(name: string) {
        const normalized = name.toLowerCase();
        return headers[normalized] ?? headers[name];
      }
    }
  } as Context;
}
