import { Hono } from "hono";
import { Schema } from "effect";
import {
  type MePracticeProfileResponse,
  MePracticeProfileResponseSchema
} from "@my-ai-orchestrator/contracts";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import { createPublicRouteHandler } from "../http/public-route.js";
import { resolvePracticeProfileDeclaredView } from "../product/practice-profile/practice-profile-read.js";
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
}
