import { Effect } from "effect";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import { swallowWithDiagnostic } from "../../effects/non-blocking-diagnostics.js";
import type {
  ActivePolicyPointerRecord,
  BackendAIPolicyDegradationRecommendation,
  ResolvedAIPolicyVersion
} from "./ai-policy-types.js";

const POLICY_POINTER_USER_ID = "backend";

interface DegradationSignalRecord {
  readonly provider: string;
  readonly policyVersion: string;
  readonly failureCount: number;
  readonly occurredAt: string;
}

export function loadActivePolicyPointer(args: {
  readonly database: DatabaseClient;
  readonly namespace: string;
  readonly defaultPolicyVersion: string;
  readonly now: () => Date;
}): Effect.Effect<ActivePolicyPointerRecord, never> {
  return Effect.gen(function* () {
    const existing = yield* args.database.memories.get(POLICY_POINTER_USER_ID, pointerKey(args.namespace));
    const parsed = toActivePolicyPointerRecord(existing?.value);
    if (parsed) {
      return parsed;
    }

    const created = createInitialPolicyPointer(args.defaultPolicyVersion, args.now().toISOString());
    yield* persistMemoryValue(args.database, pointerKey(args.namespace), created, created.updatedAt);
    return created;
  });
}

export function saveActivePolicyPointer(args: {
  readonly database: DatabaseClient;
  readonly namespace: string;
  readonly pointer: ActivePolicyPointerRecord;
}): Effect.Effect<ActivePolicyPointerRecord, never> {
  return persistMemoryValue(
    args.database,
    pointerKey(args.namespace),
    args.pointer,
    args.pointer.updatedAt
  ).pipe(Effect.as(args.pointer));
}

export function recordPolicyDegradationSignal(args: {
  readonly database: DatabaseClient;
  readonly namespace: string;
  readonly signal: DegradationSignalRecord;
}): Effect.Effect<void, never> {
  return Effect.gen(function* () {
    const existing = yield* args.database.memories.get(POLICY_POINTER_USER_ID, degradationKey(args.namespace));
    const current = toDegradationSignals(existing?.value);
    const nextSignals = [
      ...current.filter((signal) => signal.provider !== args.signal.provider),
      args.signal
    ];
    yield* persistMemoryValue(args.database, degradationKey(args.namespace), nextSignals, args.signal.occurredAt);
  });
}

export function loadPolicyDegradationRecommendation(args: {
  readonly database: DatabaseClient;
  readonly namespace: string;
  readonly activePolicyVersion: string;
  readonly policyVersions: readonly ResolvedAIPolicyVersion[];
}): Effect.Effect<BackendAIPolicyDegradationRecommendation | undefined, never> {
  return Effect.gen(function* () {
    const existing = yield* args.database.memories.get(POLICY_POINTER_USER_ID, degradationKey(args.namespace));
    const signals = toDegradationSignals(existing?.value);
    const latestSignal = [...signals].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))[0];

    if (!latestSignal || latestSignal.failureCount <= 0) {
      return undefined;
    }

    const activePolicy = args.policyVersions.find((version) => version.version === args.activePolicyVersion);
    const alternative = args.policyVersions.find((version) => {
      if (version.version === args.activePolicyVersion) {
        return false;
      }

      return Object.values(version.routingProfiles).some(
        (profile) => profile.preferredAttempts[0]?.provider !== latestSignal.provider
      );
    });

    if (!activePolicy || !alternative) {
      return undefined;
    }

    return {
      recommendedPolicyVersion: alternative.version,
      reason: `Observed degradation on provider "${latestSignal.provider}" under active policy "${activePolicy.version}"`,
      evidence: {
        degradedProvider: latestSignal.provider,
        failureCount: latestSignal.failureCount,
        observedAt: latestSignal.occurredAt
      }
    };
  });
}

export function buildActivatedPolicyPointer(args: {
  readonly current: ActivePolicyPointerRecord;
  readonly policyVersion: string;
  readonly updatedAt: string;
  readonly updatedBy: string;
}): ActivePolicyPointerRecord {
  const historyEntry = {
    policyVersion: args.policyVersion,
    updatedAt: args.updatedAt,
    updatedBy: args.updatedBy
  };

  return {
    activePolicyVersion: args.policyVersion,
    updatedAt: args.updatedAt,
    updatedBy: args.updatedBy,
    history: [...args.current.history, historyEntry]
  };
}

function createInitialPolicyPointer(policyVersion: string, updatedAt: string): ActivePolicyPointerRecord {
  return {
    activePolicyVersion: policyVersion,
    updatedAt,
    updatedBy: "system-bootstrap",
    history: [
      {
        policyVersion,
        updatedAt,
        updatedBy: "system-bootstrap"
      }
    ]
  };
}

function persistMemoryValue(
  database: DatabaseClient,
  key: string,
  value: unknown,
  at: string
): Effect.Effect<void, never> {
  return database.memories.put(
    {
      id: `${POLICY_POINTER_USER_ID}:${key}`,
      userId: POLICY_POINTER_USER_ID,
      key,
      value,
      createdAt: at,
      updatedAt: at
    },
    1
  ).pipe(
    Effect.catchAll(swallowWithDiagnostic({
      operation: "Failed to persist AI policy pointer memory value",
      context: { key }
    })),
    Effect.asVoid
  );
}

function pointerKey(namespace: string): string {
  return `ai-policy-pointer:${namespace}`;
}

function degradationKey(namespace: string): string {
  return `ai-policy-degradation:${namespace}`;
}

function toActivePolicyPointerRecord(value: unknown): ActivePolicyPointerRecord | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const activePolicyVersion = typeof record.activePolicyVersion === "string" ? record.activePolicyVersion : undefined;
  const updatedAt = typeof record.updatedAt === "string" ? record.updatedAt : undefined;
  const updatedBy = typeof record.updatedBy === "string" ? record.updatedBy : undefined;
  const history = Array.isArray(record.history)
    ? record.history.flatMap((entry) => {
        if (!entry || typeof entry !== "object") {
          return [];
        }

        const typedEntry = entry as Record<string, unknown>;
        return typeof typedEntry.policyVersion === "string" &&
          typeof typedEntry.updatedAt === "string" &&
          typeof typedEntry.updatedBy === "string"
          ? [
              {
                policyVersion: typedEntry.policyVersion,
                updatedAt: typedEntry.updatedAt,
                updatedBy: typedEntry.updatedBy
              }
            ]
          : [];
      })
    : [];

  if (!activePolicyVersion || !updatedAt || !updatedBy) {
    return undefined;
  }

  return {
    activePolicyVersion,
    updatedAt,
    updatedBy,
    history
  };
}

function toDegradationSignals(value: unknown): readonly DegradationSignalRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const typedEntry = entry as Record<string, unknown>;
    return typeof typedEntry.provider === "string" &&
      typeof typedEntry.policyVersion === "string" &&
      typeof typedEntry.failureCount === "number" &&
      typeof typedEntry.occurredAt === "string"
      ? [
          {
            provider: typedEntry.provider,
            policyVersion: typedEntry.policyVersion,
            failureCount: typedEntry.failureCount,
            occurredAt: typedEntry.occurredAt
          }
        ]
      : [];
  });
}
