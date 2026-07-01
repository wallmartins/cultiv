import { Hono, type Context } from "hono";
import {
  type VoiceCalibrationEntitlementView,
  VoiceCalibrationEntitlementViewSchema,
  type VoiceCalibrationSessionView,
  VoiceCalibrationSessionViewSchema,
  type VoiceCalibrationStepPromptView,
  VoiceCalibrationStepPromptViewSchema,
  decodeConfirmWizardReviewInput,
  decodeSetWizardContextInput,
  decodeSubmitWizardStepInput
} from "@my-ai-orchestrator/contracts";
import type { WizardStepId } from "@my-ai-orchestrator/domain";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import {
  BackendRequestBodyParseError
} from "../http/errors.js";
import type { BackendProductServices } from "../product.js";
import { readJsonBody, runEffectOrThrow, validateResponseBody } from "../http/http.js";
import { Routes } from "../app/route-definitions.js";

export interface VoiceCalibrationRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerVoiceCalibrationRoutes(
  app: Hono,
  options: VoiceCalibrationRouteOptions
): void {
  app.post("/me/voice-calibration/sessions", async (c) => {
    const userId = await resolveActorUserId(
      c,
      options.config,
      Routes.PostMeVoiceCalibrationSessions,
      options.services
    );
    const response = await runEffectOrThrow(options.services.voiceCalibration.startSession(userId));
    const validated = await validateResponseBody(
      VoiceCalibrationSessionViewSchema,
      response satisfies VoiceCalibrationSessionView,
      "VoiceCalibrationSessionView"
    );
    return c.json(validated, 201);
  });

  app.get("/me/voice-calibration/sessions/:sessionId", async (c) => {
    const userId = await resolveActorUserId(
      c,
      options.config,
      Routes.GetMeVoiceCalibrationSession,
      options.services
    );
    const sessionId = requireRouteParam(c, "sessionId");
    const response = await runEffectOrThrow(
      options.services.voiceCalibration.getSession(sessionId, userId)
    );
    const validated = await validateResponseBody(
      VoiceCalibrationSessionViewSchema,
      response satisfies VoiceCalibrationSessionView,
      "VoiceCalibrationSessionView"
    );
    return c.json(validated);
  });

  app.post("/me/voice-calibration/sessions/:sessionId/context", async (c) => {
    const userId = await resolveActorUserId(
      c,
      options.config,
      Routes.PostMeVoiceCalibrationSessionContext,
      options.services
    );
    const sessionId = requireRouteParam(c, "sessionId");
    const rawBody = await readJsonBody(c, Routes.PostMeVoiceCalibrationSessionContext);
    const input = await runEffectOrThrow(decodeSetWizardContextInput(rawBody));
    const response = await runEffectOrThrow(
      options.services.voiceCalibration.setContext(sessionId, userId, input)
    );
    const validated = await validateResponseBody(
      VoiceCalibrationSessionViewSchema,
      response satisfies VoiceCalibrationSessionView,
      "VoiceCalibrationSessionView"
    );
    return c.json(validated);
  });

  app.get("/me/voice-calibration/sessions/:sessionId/steps/:stepId", async (c) => {
    const userId = await resolveActorUserId(
      c,
      options.config,
      Routes.GetMeVoiceCalibrationSessionStep,
      options.services
    );
    const sessionId = requireRouteParam(c, "sessionId");
    const stepId = requireWizardStepId(c);
    const response = await runEffectOrThrow(
      options.services.voiceCalibration.getStepPrompt(sessionId, userId, stepId)
    );
    const validated = await validateResponseBody(
      VoiceCalibrationStepPromptViewSchema,
      response satisfies VoiceCalibrationStepPromptView,
      "VoiceCalibrationStepPromptView"
    );
    return c.json(validated);
  });

  app.post("/me/voice-calibration/sessions/:sessionId/steps/:stepId/submit", async (c) => {
    const userId = await resolveActorUserId(
      c,
      options.config,
      Routes.PostMeVoiceCalibrationSessionStepSubmit,
      options.services
    );
    const sessionId = requireRouteParam(c, "sessionId");
    const stepId = requireWizardStepId(c);
    const rawBody = await readJsonBody(c, Routes.PostMeVoiceCalibrationSessionStepSubmit);
    const decoded = await runEffectOrThrow(decodeSubmitWizardStepInput(rawBody));
    const input = { ...decoded, stepId };
    const response = await runEffectOrThrow(
      options.services.voiceCalibration.submitStep(sessionId, userId, input)
    );
    const validated = await validateResponseBody(
      VoiceCalibrationSessionViewSchema,
      response satisfies VoiceCalibrationSessionView,
      "VoiceCalibrationSessionView"
    );
    return c.json(validated);
  });

  app.post("/me/voice-calibration/sessions/:sessionId/steps/:stepId/skip", async (c) => {
    const userId = await resolveActorUserId(
      c,
      options.config,
      Routes.PostMeVoiceCalibrationSessionStepSkip,
      options.services
    );
    const sessionId = requireRouteParam(c, "sessionId");
    const stepId = requireWizardStepId(c);
    const response = await runEffectOrThrow(
      options.services.voiceCalibration.skipStep(sessionId, userId, stepId)
    );
    const validated = await validateResponseBody(
      VoiceCalibrationSessionViewSchema,
      response satisfies VoiceCalibrationSessionView,
      "VoiceCalibrationSessionView"
    );
    return c.json(validated);
  });

  app.post("/me/voice-calibration/sessions/:sessionId/complete", async (c) => {
    const userId = await resolveActorUserId(
      c,
      options.config,
      Routes.PostMeVoiceCalibrationSessionComplete,
      options.services
    );
    const sessionId = requireRouteParam(c, "sessionId");
    const rawBody = await readJsonBody(c, Routes.PostMeVoiceCalibrationSessionComplete);
    const input = await runEffectOrThrow(decodeConfirmWizardReviewInput(rawBody));
    const response = await runEffectOrThrow(
      options.services.voiceCalibration.completeReview(sessionId, userId, input)
    );
    const validated = await validateResponseBody(
      VoiceCalibrationSessionViewSchema,
      response satisfies VoiceCalibrationSessionView,
      "VoiceCalibrationSessionView"
    );
    return c.json(validated);
  });

  app.get("/me/voice-calibration/entitlement", async (c) => {
    const userId = await resolveActorUserId(
      c,
      options.config,
      Routes.GetMeVoiceCalibrationEntitlement,
      options.services
    );
    const response = await runEffectOrThrow(options.services.voiceCalibration.getEntitlement(userId));
    const validated = await validateResponseBody(
      VoiceCalibrationEntitlementViewSchema,
      response satisfies VoiceCalibrationEntitlementView,
      "VoiceCalibrationEntitlementView"
    );
    return c.json(validated);
  });
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

function requireWizardStepId(c: Context): WizardStepId {
  const stepId = c.req.param("stepId");
  if (!stepId || stepId.trim().length === 0) {
    throw new BackendRequestBodyParseError({
      route: c.req.path,
      message: "Route parameter stepId is required"
    });
  }

  return stepId as WizardStepId;
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
