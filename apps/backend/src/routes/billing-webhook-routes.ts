import { Hono } from "hono";
import type { BackendConfig } from "../config/config.js";
import { BackendBillingNotConfiguredError } from "../http/errors.js";
import { runEffectOrThrow } from "../http/http.js";
import type { BackendProductServices } from "../product.js";

export interface BillingWebhookRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerBillingWebhookRoutes(app: Hono, options: BillingWebhookRouteOptions): void {
  app.post("/webhooks/stripe", async (c) => {
    if (!options.services.billingWebhook) {
      throw new BackendBillingNotConfiguredError({ route: "POST /webhooks/stripe" });
    }
    const rawBody = await c.req.text();
    const signature = c.req.header("stripe-signature") ?? "";
    await runEffectOrThrow(options.services.billingWebhook.handleStripeWebhook(rawBody, signature));
    return c.json({ received: true });
  });

  app.post("/webhooks/asaas", async (c) => {
    if (!options.services.billingWebhook) {
      throw new BackendBillingNotConfiguredError({ route: "POST /webhooks/asaas" });
    }
    const rawBody = await c.req.text();
    const token = c.req.header("asaas-access-token") ?? "";
    await runEffectOrThrow(options.services.billingWebhook.handleAsaasWebhook(rawBody, token));
    return c.json({ received: true });
  });
}
