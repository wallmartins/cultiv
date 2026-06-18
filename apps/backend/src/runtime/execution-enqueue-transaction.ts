import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import { createBillingService, type BillingRepository, type BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { Kysely } from "kysely";
import type {
  ExecutionVoiceMetadataView,
  JobCreatedResponse,
  JobProgress,
  PipelineRequest
} from "@my-ai-orchestrator/contracts";
import type { JobRecord } from "@my-ai-orchestrator/database";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import type { BackendConfig } from "../config/config.js";
import type { ResolvedPricingEnvelope } from "../product/ai-policy/ai-policy-types.js";
import type { BackendJobEvent } from "../jobs/job-store.js";
import type { DatabaseTables } from "../infra/postgres-tables.js";
import { insertOutboxEvent, saveBillingRepositoryInTransaction } from "../infra/durable-store.js";
import {
  reserveBackendExecutionCredits,
  resolveBackendBillingIdentity,
  type BackendBillingIdentity
} from "../execution/billing.js";
import { resolveUsagePolicyModel } from "../product/usage/resolve-usage-policy-model.js";

export interface ExecutionRuntimePayload {
  readonly userId: string;
  readonly request: PipelineRequest;
  readonly plan?: OrchestrationPlan;
  readonly estimatedSteps: number;
  readonly voice?: ExecutionVoiceMetadataView;
  readonly pricingEnvelope?: ResolvedPricingEnvelope;
  readonly simulateCredits?: boolean;
  readonly creditReservationId?: string;
}

export interface ExecutionJobDocument {
  readonly runtime: ExecutionRuntimePayload;
  readonly estimatedSteps: number;
}

export function resolveEnqueueUserId(request: PipelineRequest): string {
  return "userId" in request && typeof request.userId === "string" ? request.userId : "anonymous";
}

export function resolveEnqueueEstimatedSteps(plan: OrchestrationPlan): number {
  return Math.max(1, plan.pipeline.steps.length);
}

export function buildRuntimeBase(input: {
  readonly userId: string;
  readonly request: PipelineRequest;
  readonly plan: OrchestrationPlan;
  readonly estimatedSteps: number;
  readonly voice?: ExecutionVoiceMetadataView;
  readonly pricingEnvelope?: ResolvedPricingEnvelope;
  readonly simulateCredits?: boolean;
}): Omit<ExecutionRuntimePayload, "creditReservationId"> {
  return {
    userId: input.userId,
    request: input.request,
    plan: input.plan,
    estimatedSteps: input.estimatedSteps,
    voice: input.voice,
    pricingEnvelope: input.pricingEnvelope,
    simulateCredits: input.simulateCredits
  };
}

export function buildQueuedJobProgress(estimatedSteps: number): JobProgress {
  return {
    currentStep: "queued",
    stepIndex: 0,
    totalSteps: estimatedSteps,
    percent: 0
  };
}

export function buildExecutionJobRecord(input: {
  readonly jobId: string;
  readonly plan: OrchestrationPlan;
  readonly runtime: ExecutionRuntimePayload;
  readonly estimatedSteps: number;
  readonly createdAt: string;
}): JobRecord {
  const queuedProgress = buildQueuedJobProgress(input.estimatedSteps);

  return {
    id: input.jobId,
    status: "queued",
    executionMode: input.plan.request.executionMode,
    contentType: input.plan.contentType.id,
    createdAt: input.createdAt,
    completedAt: null,
    pipelineId: input.plan.pipeline.name,
    version: 1,
    progress: queuedProgress,
    progressHistory: [],
    result: null,
    error: null,
    updatedAt: input.createdAt,
    history: [
      {
        type: "created",
        at: input.createdAt,
        payload: {
          runtime: input.runtime,
          contentType: input.plan.contentType.id,
          executionMode: input.plan.request.executionMode,
          pipelineName: input.plan.pipeline.name
        }
      }
    ]
  };
}

export function buildEnqueueCreatedResponse(input: {
  readonly jobId: string;
  readonly plan: OrchestrationPlan;
  readonly estimatedSteps: number;
  readonly createdAt: string;
}): JobCreatedResponse {
  return {
    jobId: input.jobId,
    status: "queued",
    contentType: input.plan.contentType.id,
    estimatedSteps: input.estimatedSteps,
    createdAt: input.createdAt
  };
}

export function buildEnqueueProgressEvent(
  jobId: string,
  estimatedSteps: number,
  occurredAt: string
): BackendJobEvent {
  return {
    type: "progress",
    jobId,
    payload: buildQueuedJobProgress(estimatedSteps),
    occurredAt
  };
}

export interface ExecutionEnqueueTransactionDeps {
  readonly postgres: Kysely<DatabaseTables>;
  readonly billingRepository: BillingRepository;
  readonly billing: BillingServiceContract;
  readonly config: BackendConfig;
}

export interface ExecutionEnqueueTransactionInput {
  readonly request: PipelineRequest;
  readonly plan: OrchestrationPlan;
  readonly voice?: ExecutionVoiceMetadataView;
  readonly pricingEnvelope?: ResolvedPricingEnvelope;
  readonly simulateCredits?: boolean;
  readonly jobId: string;
  readonly createdAt: string;
  readonly billingIdentity: BackendBillingIdentity;
}

export async function runExecutionEnqueueTransaction(
  deps: ExecutionEnqueueTransactionDeps,
  input: ExecutionEnqueueTransactionInput
): Promise<void> {
  const estimatedSteps = resolveEnqueueEstimatedSteps(input.plan);
  const userId = resolveEnqueueUserId(input.request);
  const runtimeBase = buildRuntimeBase({
    userId,
    request: input.request,
    plan: input.plan,
    estimatedSteps,
    voice: input.voice,
    pricingEnvelope: input.pricingEnvelope,
    simulateCredits: input.simulateCredits
  });

  await deps.postgres.transaction().execute(async (trx) => {
    let creditReservationId: string | undefined;

    if (!input.simulateCredits) {
      const txnBilling = createBillingService({ repository: deps.billingRepository });
      const reservation = await Effect.runPromise(
        reserveBackendExecutionCredits(
          txnBilling,
          input.billingIdentity,
          input.plan.request.qualityMode,
          Math.max(0, input.plan.pipeline.steps.length - 1),
          input.pricingEnvelope?.creditPrice,
          {
            pipelineName: input.plan.pipeline.name,
            contentType: input.plan.contentType.id,
            adapter: input.request.adapter ?? deps.config.serviceName,
            model: resolveUsagePolicyModel(
              input.request,
              input.plan.request.qualityMode ?? deps.config.qualityMode
            )
          }
        )
      );
      creditReservationId = reservation.reservationId;
      await Effect.runPromise(
        saveBillingRepositoryInTransaction(trx, deps.billingRepository, input.createdAt)
      );
    }

    const runtime: ExecutionRuntimePayload = {
      ...runtimeBase,
      creditReservationId
    };

    const record = buildExecutionJobRecord({
      jobId: input.jobId,
      plan: input.plan,
      runtime,
      estimatedSteps,
      createdAt: input.createdAt
    });

    await trx
      .insertInto("jobs")
      .values({
        id: input.jobId,
        user_id: userId,
        data: JSON.stringify(record),
        version: 1,
        created_at: input.createdAt,
        updated_at: input.createdAt
      })
      .execute();

    await Effect.runPromise(
      insertOutboxEvent(trx, {
        id: randomUUID(),
        aggregateType: "execution",
        aggregateId: input.jobId,
        eventType: "ExecutionEnqueued",
        payload: { executionId: input.jobId, userId },
        occurredAt: input.createdAt
      })
    );
  });
}
