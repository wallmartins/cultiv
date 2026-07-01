import { Hono, type Context } from "hono";
import { Schema } from "effect";
import {
  type VoiceExamplesPageView,
  VoiceExamplesPageViewSchema,
  type VoiceProfileScreenView,
  VoiceProfileScreenViewSchema,
  type VoiceProfileDiagnosticsView,
  VoiceProfileDiagnosticsViewSchema,
  type VoiceTrainingConsentStatusView,
  VoiceTrainingConsentStatusViewSchema,
  decodeTraitConfirmationInput
} from "@my-ai-orchestrator/contracts";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import {
  BackendRequestBodyParseError,
  BackendVoiceProfileNotFoundError
} from "../http/errors.js";
import type { BackendProductServices } from "../product.js";
import type { ListVoiceExamplesOptions } from "../product/voice/voice-types.js";
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
    await runEffectOrThrow(options.services.voiceConsent.grantConsent(userId));
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

  app.get("/me/voice-profile/examples", async (c) => {
    const userId = await resolveActorUserId(c, options.config, Routes.GetMeVoiceProfileExamples, options.services);
    const response = await runEffectOrThrow(options.services.voice.listExamples(userId, parseListOptions(c)));
    const validated = await validateResponseBody(
      VoiceExamplesPageViewSchema,
      response satisfies VoiceExamplesPageView,
      "VoiceExamplesPageView"
    );
    return c.json(validated);
  });
}

function parseListOptions(c: Context): ListVoiceExamplesOptions {
  const route = Routes.GetMeVoiceProfileExamples;
  const query = c.req.query();

  return {
    limit: parseOptionalInteger(query.limit, "limit", route),
    offset: parseOptionalInteger(query.offset, "offset", route),
    state: parseVoiceExampleState(query.state, route),
    pinned: parseOptionalBoolean(query.pinned, "pinned", route),
    contentType: normalizeQueryValue(query.contentType)
  };
}

function parseOptionalInteger(value: string | undefined, field: string, route: string): number | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new BackendRequestBodyParseError({
      route,
      message: `Query parameter ${field} must be a non-negative integer`
    });
  }

  return parsed;
}

function parseOptionalBoolean(value: string | undefined, field: string, route: string): boolean | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new BackendRequestBodyParseError({
    route,
    message: `Query parameter ${field} must be true or false`
  });
}

function parseVoiceExampleState(value: string | undefined, route: string): "active" | "excluded" | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  if (value === "active" || value === "excluded") {
    return value;
  }

  throw new BackendRequestBodyParseError({
    route,
    message: "Query parameter state must be active or excluded"
  });
}

function normalizeQueryValue(value: string | undefined): string | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  return value.trim();
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
