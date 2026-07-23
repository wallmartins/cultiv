import { Hono } from "hono";
import { Schema } from "effect";
import {
  type MePracticeIdentityResponse,
  MePracticeIdentityResponseSchema,
  type MePracticeProfileResponse,
  MePracticeProfileResponseSchema,
  type NicheAskResponseInput,
  type UpdateDeclaredAxesInput,
  decodeNicheAskResponseInput,
  decodeUpdateDeclaredAxesInput
} from "@my-ai-orchestrator/contracts";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import { createPublicRouteHandler } from "../http/public-route.js";
import { resolvePracticeProfileDeclaredView } from "../product/practice-profile/practice-profile-read.js";
import { resolvePracticeProfileLocale } from "../product/practice-profile/practice-profile-generation-core.js";
import { BackendPracticeProfileNotFoundError } from "../http/errors.js";
import { runEffectOrThrow } from "../http/http.js";
import { Routes } from "../app/route-definitions.js";

export interface PracticeProfileRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerPracticeProfileRoutes(app: Hono, options: PracticeProfileRouteOptions): void {
  app.get(
    "/me/practice-profile",
    createPublicRouteHandler<MePracticeProfileResponse>({
      route: Routes.GetMePracticeProfile,
      config: options.config,
      services: options.services,
      responseSchema: MePracticeProfileResponseSchema as Schema.Schema<MePracticeProfileResponse, unknown, any>,
      responseSchemaName: "MePracticeProfileResponse",
      handler: ({ actor }) =>
        resolvePracticeProfileDeclaredView(options.services.database, actor.userId)
    })
  );

  app.get(
    "/me/practice-identity",
    createPublicRouteHandler<MePracticeIdentityResponse>({
      route: Routes.GetMePracticeIdentity,
      config: options.config,
      services: options.services,
      responseSchema: MePracticeIdentityResponseSchema as Schema.Schema<MePracticeIdentityResponse, unknown, any>,
      responseSchemaName: "MePracticeIdentityResponse",
      handler: ({ c, actor }) => {
        const locale = resolvePracticeProfileLocale(c.req.query("locale"));
        return options.services.practiceProfile.resolveIdentity(actor.userId, locale);
      }
    })
  );

  app.post(
    "/me/practice-profile/declaration",
    createPublicRouteHandler<UpdateDeclaredAxesInput, MePracticeIdentityResponse>({
      route: Routes.PostMePracticeDeclaration,
      config: options.config,
      services: options.services,
      decodeInput: decodeUpdateDeclaredAxesInput,
      responseSchema: MePracticeIdentityResponseSchema as Schema.Schema<MePracticeIdentityResponse, unknown, any>,
      responseSchemaName: "MePracticeIdentityResponse",
      handler: async ({ c, actor, input }) => {
        const locale = resolvePracticeProfileLocale(c.req.query("locale"));
        const response = await runEffectOrThrow(
          options.services.practiceProfile.updateDeclaredAxes(actor.userId, input, locale)
        );
        if (!response) {
          throw new BackendPracticeProfileNotFoundError({ userId: actor.userId });
        }
        return response satisfies MePracticeIdentityResponse;
      }
    })
  );

  app.post(
    "/me/practice-profile/niche-ask",
    createPublicRouteHandler<NicheAskResponseInput, MePracticeIdentityResponse>({
      route: Routes.PostMePracticeNicheAsk,
      config: options.config,
      services: options.services,
      decodeInput: decodeNicheAskResponseInput,
      responseSchema: MePracticeIdentityResponseSchema as Schema.Schema<MePracticeIdentityResponse, unknown, any>,
      responseSchemaName: "MePracticeIdentityResponse",
      handler: ({ c, actor, input }) => {
        const locale = resolvePracticeProfileLocale(c.req.query("locale"));
        return options.services.practiceProfile.respondToNicheAsk(actor.userId, input, locale);
      }
    })
  );
}
