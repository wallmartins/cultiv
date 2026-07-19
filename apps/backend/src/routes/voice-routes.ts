import { Hono, type Context } from "hono";
import { Schema } from "effect";
import {
  type VoiceProfileScreenView,
  VoiceProfileScreenViewSchema,
  type VoiceProfileDiagnosticsView,
  VoiceProfileDiagnosticsViewSchema,
  type VoiceTrainingConsentStatusView,
  VoiceTrainingConsentStatusViewSchema,
  VoiceTrainingConsentInputSchema,
  decodeTraitConfirmationInput
} from "@my-ai-orchestrator/contracts";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import { BackendVoiceProfileNotFoundError } from "../http/errors.js";
import type { BackendProductServices } from "../product.js";
import { createPublicRouteHandler } from "../http/public-route.js";
import { readJsonBody, runEffectOrThrow, validateResponseBody } from "../http/http.js";
import { Routes } from "../app/route-definitions.js";

export interface VoiceRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerVoiceRoutes(app: Hono, options: VoiceRouteOptions): void {
  app.get("/me/voice-training-consent", async (c) => {
    const userId = await resolveActorUserId(c, options.config, Routes.GetMeVoiceTrainingConsent, options.services);
    const response = await runEffectOrThrow(options.services.voiceConsent.getConsentStatus(userId));
    const validated = await validateResponseBody(
      VoiceTrainingConsentStatusViewSchema,
      response satisfies VoiceTrainingConsentStatusView,
      "VoiceTrainingConsentStatusView"
    );
    return c.json(validated);
  });

  app.post("/me/voice-training-consent", async (c) => {
    const userId = await resolveActorUserId(c, options.config, Routes.PostMeVoiceTrainingConsent, options.services);
    const rawBody = await readJsonBody(c, Routes.PostMeVoiceTrainingConsent);
    const input = Schema.decodeUnknownSync(VoiceTrainingConsentInputSchema)(rawBody);
    const action = input.action ?? "grant";

    if (action === "revoke") {
      await runEffectOrThrow(options.services.voiceConsent.revokeConsent(userId));
    } else {
      await runEffectOrThrow(options.services.voiceConsent.grantConsent(userId));
    }

    const response = await runEffectOrThrow(options.services.voiceConsent.getConsentStatus(userId));
    const validated = await validateResponseBody(
      VoiceTrainingConsentStatusViewSchema,
      response satisfies VoiceTrainingConsentStatusView,
      "VoiceTrainingConsentStatusView"
    );
    return c.json(validated);
  });

  app.get(
    "/me/voice-profile",
    createPublicRouteHandler<VoiceProfileScreenView>({
      route: Routes.GetMeVoiceProfile,
      config: options.config,
      services: options.services,
      responseSchema: VoiceProfileScreenViewSchema as Schema.Schema<VoiceProfileScreenView, unknown, any>,
      responseSchemaName: "VoiceProfileScreenView",
      handler: async ({ actor }) => {
        const response = await runEffectOrThrow(options.services.voice.getProfileScreen(actor.userId));
        if (!response) {
          throw new BackendVoiceProfileNotFoundError({ userId: actor.userId });
        }

        return response satisfies VoiceProfileScreenView;
      }
    })
  );

  app.post("/me/voice-profile/trait-confirmations", async (c) => {
    const userId = await resolveActorUserId(c, options.config, Routes.PostMeVoiceProfileTraitConfirmations, options.services);
    const rawBody = await readJsonBody(c, Routes.PostMeVoiceProfileTraitConfirmations);
    const input = await runEffectOrThrow(decodeTraitConfirmationInput(rawBody));
    const response = await runEffectOrThrow(options.services.voice.recordTraitConfirmation(userId, input));

    if (!response) {
      throw new BackendVoiceProfileNotFoundError({ userId });
    }

    const validated = await validateResponseBody(
      VoiceProfileDiagnosticsViewSchema,
      response satisfies VoiceProfileDiagnosticsView,
      "VoiceProfileDiagnosticsView"
    );
    return c.json(validated);
  });

}

async function resolveActorUserId(
  c: Context,
  config: BackendConfig,
  route: string,
  services: BackendProductServices
): Promise<string> {
  const actor = await resolvePublicActor(c, config, route, services);
  return actor.userId;
}
