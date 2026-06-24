import type { Context } from "hono";
import { Effect } from "effect";
import type { BackendConfig } from "../config/config.js";
import { resolveBackendPublicAuthenticatedActor } from "./index.js";
import { createApplicationUserServiceLayer } from "./application-user-service.js";
import { resolveBackendOperationalActor } from "./operational-auth.js";
import { createOperatorServiceLayer } from "./operator-service.js";
import type { BackendProductServices } from "../product.js";
import { runEffectOrThrow } from "../http/http.js";

export async function resolvePublicActor(
  c: Context,
  config: BackendConfig,
  route: string,
  services: BackendProductServices
) {
  return runEffectOrThrow(
    resolveBackendPublicAuthenticatedActor({
      config,
      route,
      readHeader: (name: string) => c.req.header(name),
      billing: services.billing
    }).pipe(
      Effect.provide(createApplicationUserServiceLayer(services.users))
    )
  );
}

export async function resolveOperationalActor(
  c: Context,
  config: BackendConfig,
  route: string,
  services: BackendProductServices
) {
  return runEffectOrThrow(
    resolveBackendOperationalActor({
      config,
      route,
      readHeader: (name: string) => c.req.header(name)
    }).pipe(
      Effect.provide(createOperatorServiceLayer(services.operators))
    )
  );
}
