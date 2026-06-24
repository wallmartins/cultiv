import { Hono, type Context } from "hono";
import {
  type VoiceExampleBatchCommitResultView,
  VoiceExampleBatchCommitResultViewSchema,
  type VoiceExampleBatchView,
  VoiceExampleBatchViewSchema,
  type VoiceExampleListItemView,
  VoiceExampleListItemViewSchema,
  type VoiceExamplesPageView,
  VoiceExamplesPageViewSchema,
  type VoiceProfileScreenView,
  VoiceProfileScreenViewSchema,
  type VoiceProfileDiagnosticsView,
  VoiceProfileDiagnosticsViewSchema,
  type VoiceTrainingConsentStatusView,
  VoiceTrainingConsentStatusViewSchema,
  decodeTraitConfirmationInput,
  decodeVoiceExampleBatchCreateInput,
  decodeVoiceExampleBatchItemsInput,
  decodeVoiceExampleCreateInput,
  decodeVoiceExampleUpdateInput
} from "@my-ai-orchestrator/contracts";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import {
  BackendRequestBodyParseError,
  BackendVoiceExampleNotFoundError,
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
    createPublicRouteHandler({
      route: Routes.GetMeVoiceProfile,
      config: options.config,
      services: options.services,
      responseSchema: VoiceProfileScreenViewSchema,
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

  app.post("/me/voice-profile/examples", async (c) => {
    const userId = await resolveActorUserId(c, options.config, Routes.PostMeVoiceProfileExamples, options.services);
    const rawBody = await readJsonBody(c, Routes.PostMeVoiceProfileExamples);
    const input = await runEffectOrThrow(decodeVoiceExampleCreateInput(rawBody));
    const response = await runEffectOrThrow(options.services.voice.createExample(userId, input));
    const validated = await validateResponseBody(
      VoiceExampleListItemViewSchema,
      response satisfies VoiceExampleListItemView,
      "VoiceExampleListItemView"
    );
    return c.json(validated, 201);
  });

  app.patch("/me/voice-profile/examples/:exampleId", async (c) => {
    const userId = await resolveActorUserId(c, options.config, Routes.PatchMeVoiceProfileExample, options.services);
    const exampleId = c.req.param("exampleId");
    if (!exampleId || exampleId.trim().length === 0) {
      throw new BackendVoiceExampleNotFoundError({ userId, exampleId: exampleId ?? "" });
    }

    const rawBody = await readJsonBody(c, Routes.PatchMeVoiceProfileExample);
    const input = await runEffectOrThrow(decodeVoiceExampleUpdateInput(rawBody));
    const response = await runEffectOrThrow(options.services.voice.updateExample(userId, exampleId, input));

    if (!response) {
      throw new BackendVoiceExampleNotFoundError({ userId, exampleId });
    }

    const validated = await validateResponseBody(
      VoiceExampleListItemViewSchema,
      response satisfies VoiceExampleListItemView,
      "VoiceExampleListItemView"
    );
    return c.json(validated);
  });

  app.post("/me/voice-profile/example-batches", async (c) => {
    const userId = await resolveActorUserId(c, options.config, Routes.PostMeVoiceProfileBatches, options.services);
    const rawBody = await readJsonBody(c, Routes.PostMeVoiceProfileBatches);
    const input = await runEffectOrThrow(decodeVoiceExampleBatchCreateInput(rawBody));
    const response = await runEffectOrThrow(options.services.voice.createBatch(userId, input));
    const validated = await validateResponseBody(
      VoiceExampleBatchViewSchema,
      response satisfies VoiceExampleBatchView,
      "VoiceExampleBatchView"
    );
    return c.json(validated, 201);
  });

  app.post("/me/voice-profile/example-batches/:batchId/items", async (c) => {
    const userId = await resolveActorUserId(c, options.config, Routes.PostMeVoiceProfileBatchItems, options.services);
    const batchId = requireRouteParam(c, "batchId");
    const rawBody = await readJsonBody(c, Routes.PostMeVoiceProfileBatchItems);
    const input = await runEffectOrThrow(decodeVoiceExampleBatchItemsInput(rawBody));
    const response = await runEffectOrThrow(options.services.voice.addBatchItems(userId, batchId, input.items));
    const validated = await validateResponseBody(
      VoiceExampleBatchViewSchema,
      response satisfies VoiceExampleBatchView,
      "VoiceExampleBatchView"
    );
    return c.json(validated);
  });

  app.post("/me/voice-profile/example-batches/:batchId/commit", async (c) => {
    const userId = await resolveActorUserId(c, options.config, Routes.PostMeVoiceProfileBatchCommit, options.services);
    const batchId = requireRouteParam(c, "batchId");
    const response = await runEffectOrThrow(options.services.voice.commitBatch(userId, batchId));
    const validated = await validateResponseBody(
      VoiceExampleBatchCommitResultViewSchema,
      response satisfies VoiceExampleBatchCommitResultView,
      "VoiceExampleBatchCommitResultView"
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

function requireRouteParam(c: Context, name: string): string {
  const value = c.req.param(name);
  if (!value || value.trim().length === 0) {
    throw new BackendRequestBodyParseError({
      route: c.req.path,
      message: `Route parameter ${name} is required`
    });
  }

  return value;
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
