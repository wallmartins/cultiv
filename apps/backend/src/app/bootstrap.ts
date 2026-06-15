import { serve } from "@hono/node-server";
import { Effect } from "effect";
import { createCoreLayer, LoggerService, RuntimeConfigService } from "@my-ai-orchestrator/core";
import { createBackendApp } from "./app.js";
import { bootstrapBackendConfig } from "../config/config.js";
import { createBackendProductServices } from "../product.js";

export function startBackendServer() {
  const config = bootstrapBackendConfig();

  return Effect.gen(function* () {
    const runtime = yield* RuntimeConfigService;
    const logger = yield* LoggerService;
    const services = yield* createBackendProductServices(config, {
      now: () => new Date(),
      logger
    });
    const app = createBackendApp(config, {
      startedAt: new Date(),
      logger,
      services
    });

    const server = serve(
      {
        fetch: app.fetch,
        port: config.port
      },
      (info) => {
        logger.info("Backend HTTP server started", {
          host: config.host,
          port: info.port,
          environment: runtime.environment
        });
      }
    );

    return server;
  }).pipe(
    Effect.provide(
      createCoreLayer({
        environment: config.environment,
        executionMode: config.executionMode,
        qualityMode: config.qualityMode,
        defaultLanguage: config.defaultLanguage,
        serviceName: config.serviceName
      })
    )
  );
}
