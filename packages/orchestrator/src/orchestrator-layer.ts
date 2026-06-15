import { Effect, Layer } from "effect";
import { DEFAULT_ORCHESTRATION_CATALOG } from "./defaults.js";
import { createJobCoordinator } from "./job-coordinator.js";
import { createOrchestrationPolicyService, selectExecutionStrategy } from "./orchestration-policy.js";
import { createOrchestrationPlanner } from "./planning.js";
import {
  OrchestrationCatalogService,
  OrchestrationJobCoordinatorService,
  OrchestrationPlannerService,
  OrchestrationPolicyServiceTag,
  OrchestrationStrategyService
} from "./orchestrator-services.js";
import type { OrchestratorLayerOptions } from "./orchestrator-types.js";

export function createOrchestratorLayer(options: OrchestratorLayerOptions = {}) {
  const catalog = options.catalog ?? DEFAULT_ORCHESTRATION_CATALOG;
  const policy = options.policy ?? {};
  const strategyService = { selectStrategy: selectExecutionStrategy };
  const jobCoordinator = createJobCoordinator();

  return Layer.succeed(OrchestrationCatalogService, catalog).pipe(
    Layer.provideMerge(Layer.succeed(OrchestrationPolicyServiceTag, createOrchestrationPolicyService())),
    Layer.provideMerge(Layer.succeed(OrchestrationPlannerService, createOrchestrationPlanner(catalog, policy))),
    Layer.provideMerge(Layer.succeed(OrchestrationStrategyService, strategyService)),
    Layer.provideMerge(Layer.succeed(OrchestrationJobCoordinatorService, jobCoordinator))
  );
}

export function withOrchestrator<T>(effect: Effect.Effect<T>, options: OrchestratorLayerOptions = {}) {
  return effect.pipe(Effect.provide(createOrchestratorLayer(options)));
}
