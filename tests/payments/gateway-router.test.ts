import { describe, expect, it } from "vitest";
import { resolveGatewayForCurrency } from "../../packages/payments/src/gateway/router.js";

describe("resolveGatewayForCurrency", () => {
  it("routes BRL to asaas", () => {
    expect(resolveGatewayForCurrency("BRL")).toBe("asaas");
  });

  it("routes USD to stripe", () => {
    expect(resolveGatewayForCurrency("USD")).toBe("stripe");
  });

  it("rejects unsupported currency", () => {
    expect(() => resolveGatewayForCurrency("EUR" as "BRL")).toThrow(/unsupported currency/i);
  });
});
