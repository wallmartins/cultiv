import type { Context } from "hono";
import { Effect, type Schema } from "effect";
import type { BackendConfig } from "../config/config.js";
import type { BackendAuthenticatedActor } from "../auth/legacy-auth.js";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendProductServices } from "../product.js";
import { readJsonBody, runEffectOrThrow, validateResponseBody } from "./http.js";

export interface PublicRouteHandlerContext {
  readonly c: Context;
  readonly actor: BackendAuthenticatedActor;
}

type DecodeInput<TInput> = (raw: unknown) => Effect.Effect<TInput, unknown>;

interface PublicRouteBaseOptions<TResponse> {
  readonly route: string;
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
  readonly responseSchema: Schema.Schema<TResponse, unknown>;
  readonly responseSchemaName: string;
  readonly status?: number;
}

interface PublicRouteWithoutBodyOptions<TResponse> extends PublicRouteBaseOptions<TResponse> {
  readonly handler: (
    ctx: PublicRouteHandlerContext
  ) => Promise<TResponse> | Effect.Effect<TResponse, unknown>;
}

interface PublicRouteWithBodyOptions<TInput, TResponse> extends PublicRouteBaseOptions<TResponse> {
  readonly decodeInput: DecodeInput<TInput>;
  readonly handler: (
    ctx: PublicRouteHandlerContext & { readonly input: TInput }
  ) => Promise<TResponse> | Effect.Effect<TResponse, unknown>;
}

/**
 * Encapsulates the public Hono handler pipeline: auth → optional JSON decode → handler → response validation.
 *
 * @example
 * app.get("/me/billing/entitlement", createPublicRouteHandler({
 *   route: Routes.GetMeBillingEntitlement,
 *   config: options.config,
 *   services: options.services,
 *   responseSchema: BillingEntitlementViewSchema,
 *   responseSchemaName: "BillingEntitlementView",
 *   handler: ({ actor }) => options.services.billing.getEntitlement(actor.userId, "free")
 * }));
 */
export function createPublicRouteHandler<TResponse>(
  options: PublicRouteWithoutBodyOptions<TResponse>
): (c: Context) => Promise<Response>;
export function createPublicRouteHandler<TInput, TResponse>(
  options: PublicRouteWithBodyOptions<TInput, TResponse>
): (c: Context) => Promise<Response>;
export function createPublicRouteHandler<TInput, TResponse>(
  options: PublicRouteWithoutBodyOptions<TResponse> | PublicRouteWithBodyOptions<TInput, TResponse>
): (c: Context) => Promise<Response> {
  return async (c) => {
    const actor = await resolvePublicActor(c, options.config, options.route, options.services);
    const ctx: PublicRouteHandlerContext = { c, actor };

    const response =
      "decodeInput" in options && options.decodeInput
        ? await runPublicRouteHandlerWithBody(options as PublicRouteWithBodyOptions<TInput, TResponse>, ctx, c)
        : await runPublicRouteHandler(options as PublicRouteWithoutBodyOptions<TResponse>, ctx);

    const validated = await validateResponseBody(options.responseSchema, response, options.responseSchemaName);
    return c.json(validated, (options.status ?? 200) as 200);
  };
}

async function runPublicRouteHandler<TResponse>(
  options: PublicRouteWithoutBodyOptions<TResponse>,
  ctx: PublicRouteHandlerContext
): Promise<TResponse> {
  return runHandlerResult(options.handler(ctx));
}

async function runPublicRouteHandlerWithBody<TInput, TResponse>(
  options: PublicRouteWithBodyOptions<TInput, TResponse>,
  ctx: PublicRouteHandlerContext,
  c: Context
): Promise<TResponse> {
  const rawBody = await readJsonBody(c, options.route);
  const input = await runEffectOrThrow(options.decodeInput(rawBody));
  return runHandlerResult(options.handler({ ...ctx, input }));
}

async function runHandlerResult<T>(result: Promise<T> | Effect.Effect<T, unknown>): Promise<T> {
  if (Effect.isEffect(result)) {
    return runEffectOrThrow(result);
  }

  return result;
}
