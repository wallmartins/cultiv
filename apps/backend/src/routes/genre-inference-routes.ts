import { Hono } from "hono";
import {
  decodeGenreInferenceRequest,
  type GenreInferenceResponse,
  GenreInferenceResponseSchema
} from "@my-ai-orchestrator/contracts";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import { readJsonBody, runEffectOrThrow, validateResponseBody } from "../http/http.js";
import { Routes } from "../app/route-definitions.js";

export interface GenreInferenceRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

// F4-7 — the genre producer endpoint. The web fires this once at the end of the generation questions;
// the resulting dominant rhetorical mode is threaded into both preview (to price the right plan) and
// generate (so the pipeline matches the quote). Always 200 with a genre — inference degrades to the
// default (expository prose) rather than blocking generation.
export function registerGenreInferenceRoutes(app: Hono, options: GenreInferenceRouteOptions): void {
  app.post("/me/genre-inference", async (c) => {
    await resolvePublicActor(c, options.config, Routes.PostMeGenreInference, options.services);
    const rawBody = await readJsonBody(c, Routes.PostMeGenreInference);
    const input = await runEffectOrThrow(decodeGenreInferenceRequest(rawBody));
    const response = await runEffectOrThrow(options.services.genreInference.infer(input));
    const validated = await validateResponseBody(
      GenreInferenceResponseSchema,
      response satisfies GenreInferenceResponse,
      "GenreInferenceResponse"
    );

    return c.json(validated);
  });
}
