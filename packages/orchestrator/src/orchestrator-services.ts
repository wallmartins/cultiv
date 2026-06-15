import { Context } from "effect";
import type {
  JobCoordinator,
  OrchestrationCatalog,
  OrchestrationExecutionStrategy,
  OrchestrationPlan,
  OrchestrationPlanner,
  OrchestrationPolicy,
  OrchestrationPolicyService,
  OrchestrationRequest
} from "./orchestrator-types.js";

export class OrchestrationCatalogService extends Context.Tag("OrchestrationCatalogService")<
  OrchestrationCatalogService,
  OrchestrationCatalog
>() {}

export class OrchestrationPlannerService extends Context.Tag("OrchestrationPlannerService")<
  OrchestrationPlannerService,
  OrchestrationPlanner
>() {}

export class OrchestrationPolicyServiceTag extends Context.Tag("OrchestrationPolicyService")<
  OrchestrationPolicyServiceTag,
  OrchestrationPolicyService
>() {}

export class OrchestrationStrategyService extends Context.Tag("OrchestrationStrategyService")<
  OrchestrationStrategyService,
  {
    readonly selectStrategy: (
      requestOrPlan: OrchestrationRequest | OrchestrationPlan,
      policy?: Partial<OrchestrationPolicy>
    ) => OrchestrationExecutionStrategy;
  }
>() {}

export class OrchestrationJobCoordinatorService extends Context.Tag("OrchestrationJobCoordinatorService")<
  OrchestrationJobCoordinatorService,
  JobCoordinator
>() {}
