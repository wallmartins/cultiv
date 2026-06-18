import { BillingGatewayError } from "../errors.js";
import type { BillingGatewayName } from "./types.js";
import type { BillingCurrency } from "./types.js";

export function resolveGatewayForCurrency(currency: BillingCurrency): BillingGatewayName {
  switch (currency) {
    case "BRL":
      return "asaas";
    case "USD":
      return "stripe";
    default: {
      const exhaustive: never = currency;
      throw new BillingGatewayError({
        gateway: "router",
        message: `Unsupported currency: ${String(exhaustive)}`
      });
    }
  }
}
