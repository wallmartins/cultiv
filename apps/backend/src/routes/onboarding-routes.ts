import { Hono } from "hono";
import { Schema } from "effect";
import {
  OnboardingStatusViewSchema,
  type OnboardingStatusView
} from "@my-ai-orchestrator/contracts";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import { createPublicRouteHandler } from "../http/public-route.js";
import { runEffectOrThrow, validateResponseBody } from "../http/http.js";
import { Routes } from "../app/route-definitions.js";

export interface OnboardingRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerOnboardingRoutes(app: Hono, options: OnboardingRouteOptions): void {
  app.post("/me/onboarding/complete", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.PostMeOnboardingComplete, options.services);
    const user = await runEffectOrThrow(
      options.services.users.updateOnboardingStatus(actor.userId, new Date())
    );

    const response = {
      completed: true,
      completedAt: user.onboardingCompletedAt!.toISOString()
    } satisfies OnboardingStatusView;

    const validated = await validateResponseBody(
      OnboardingStatusViewSchema,
      response,
      "OnboardingStatusView"
    );

    return c.json(validated);
  });

  app.get(
    "/me/onboarding/status",
    createPublicRouteHandler<OnboardingStatusView>({
      route: Routes.GetMeOnboardingStatus,
      config: options.config,
      services: options.services,
      responseSchema: OnboardingStatusViewSchema as Schema.Schema<OnboardingStatusView, unknown, any>,
      responseSchemaName: "OnboardingStatusView",
      handler: async ({ actor }) => {
        const user = await runEffectOrThrow(options.services.users.findById(actor.userId));
        const completed = user?.onboardingCompletedAt !== undefined;

        const response = {
          completed,
          ...(user?.onboardingCompletedAt
            ? { completedAt: user.onboardingCompletedAt.toISOString() }
            : {})
        };

        const validated = await validateResponseBody(
          OnboardingStatusViewSchema,
          response satisfies OnboardingStatusView,
          "OnboardingStatusView"
        );

        return validated;
      }
    })
  );
}
