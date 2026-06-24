import { Effect } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";
import {
  buildActivatedPolicyPointer,
  loadActivePolicyPointer,
  loadPolicyDegradationRecommendation,
  recordPolicyDegradationSignal,
  saveActivePolicyPointer
} from "./ai-policy-pointer-store.js";
import { persistBackendAuditEvent } from "../core/audit-trail.js";
import type {
  ActivePolicyPointerRecord,
  BackendAIPolicyDegradationRecommendation,
  ResolvedAIPolicyVersion
} from "./ai-policy-types.js";

export interface ActivePolicyPointerController {
  readonly getCurrentPointer: () => ActivePolicyPointerRecord;
  readonly ensureFreshPointer: () => Effect.Effect<ActivePolicyPointerRecord, DatabaseError>;
  readonly reloadPointer: () => Effect.Effect<ActivePolicyPointerRecord, DatabaseError>;
  readonly activatePolicyVersion: (args: {
    readonly policyVersion: string;
    readonly actor: string;
    readonly approvedAt?: string;
  }) => Effect.Effect<ActivePolicyPointerRecord, never>;
  readonly recordDegradationSignal: (args: {
    readonly policyVersion: string;
    readonly provider: string;
    readonly occurredAt: string;
    readonly failureCount: number;
  }) => Effect.Effect<void, DatabaseError>;
  readonly recommendFuturePolicyVersion: (
    policyVersions: readonly ResolvedAIPolicyVersion[],
    activePolicyVersion: string
  ) => Effect.Effect<BackendAIPolicyDegradationRecommendation | undefined, DatabaseError>;
}

export function createActivePolicyPointerController(args: {
  readonly database: import("@my-ai-orchestrator/database").DatabaseClient;
  readonly namespace: string;
  readonly defaultPolicyVersion: string;
  readonly now: () => Date;
  readonly reloadIntervalMs: number;
}): Effect.Effect<ActivePolicyPointerController, DatabaseError> {
  return Effect.gen(function* () {
    let pointer = yield* loadActivePolicyPointer({
      database: args.database,
      namespace: args.namespace,
      defaultPolicyVersion: args.defaultPolicyVersion,
      now: args.now
    });
    let lastReloadAtMs = args.now().getTime();

    const reloadPointer = () =>
      Effect.gen(function* () {
        pointer = yield* loadActivePolicyPointer({
          database: args.database,
          namespace: args.namespace,
          defaultPolicyVersion: args.defaultPolicyVersion,
          now: args.now
        });
        lastReloadAtMs = args.now().getTime();
        return pointer;
      });

    const ensureFreshPointer = () =>
      Effect.gen(function* () {
        const nowMs = args.now().getTime();
        if (nowMs - lastReloadAtMs < args.reloadIntervalMs) {
          return pointer;
        }

        return yield* reloadPointer();
      });

    return {
      getCurrentPointer: () => pointer,
      ensureFreshPointer,
      reloadPointer,
      activatePolicyVersion: (activation) =>
        args.database.transaction((trxDatabase) =>
          Effect.gen(function* () {
            const currentPointer = yield* ensureFreshPointer();
            const updatedAt = activation.approvedAt ?? args.now().toISOString();
            const nextPointer = buildActivatedPolicyPointer({
              current: currentPointer,
              policyVersion: activation.policyVersion,
              updatedAt,
              updatedBy: activation.actor
            });
            yield* saveActivePolicyPointer({
              database: trxDatabase,
              namespace: args.namespace,
              pointer: nextPointer
            });
            yield* persistBackendAuditEvent(trxDatabase, {
              logicalKey: `ai-policy:${args.namespace}:activate:${activation.policyVersion}:${updatedAt}`,
              actorId: activation.actor,
              actorType: "operator",
              resourceType: "ai_policy_pointer",
              resourceId: args.namespace,
              mutationType: "ai_policy.activated",
              occurredAt: updatedAt,
              metadata: {
                namespace: args.namespace,
                previousPolicyVersion: currentPointer.activePolicyVersion,
                activePolicyVersion: nextPointer.activePolicyVersion
              }
            });
            pointer = nextPointer;
            lastReloadAtMs = args.now().getTime();
            return nextPointer;
          })
        ).pipe(Effect.orDie),
      recordDegradationSignal: (signal) =>
        recordPolicyDegradationSignal({
          database: args.database,
          namespace: args.namespace,
          signal: {
            provider: signal.provider,
            policyVersion: signal.policyVersion,
            occurredAt: signal.occurredAt,
            failureCount: signal.failureCount
          }
        }),
      recommendFuturePolicyVersion: (policyVersions, activePolicyVersion) =>
        loadPolicyDegradationRecommendation({
          database: args.database,
          namespace: args.namespace,
          activePolicyVersion,
          policyVersions
        })
    };
  });
}
