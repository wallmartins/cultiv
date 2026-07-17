import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import type { Redis } from "ioredis";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import { curateLedger, type BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { AccountExportJobView } from "@my-ai-orchestrator/contracts";
import type { BackendApplicationUserRepository } from "../../auth/application-user.js";

// contract-08 §1/§8 — no cloud storage exists in this stack (coordinator default). The bundle is
// held in Redis, keyed by jobId, short-TTL and one-time: the download route deletes it on first
// read. ponytail: a real cloud signed-URL is a later infra swap; this meets the same
// secure/expiring/one-time/authenticated intent with what's already deployed.
const EXPORT_TTL_SECONDS = 15 * 60;
const EXPORT_HISTORY_LIMIT = 10_000;

function exportRedisKey(jobId: string): string {
  return `account-export:${jobId}`;
}

interface StoredExportEntry {
  readonly userId: string;
  readonly createdAt: string;
  readonly bundle: AccountExportBundle;
}

export interface AccountExportBundle {
  readonly account: {
    readonly id: string;
    readonly externalSubject: string;
    readonly createdAt: string;
  };
  readonly voiceProfile: unknown;
  readonly voiceExamples: readonly unknown[];
  readonly history: readonly unknown[];
  readonly billingSummary: {
    readonly planId: string | undefined;
    readonly ledger: readonly unknown[];
  };
  readonly generatedAt: string;
}

export interface AccountExportServiceDependencies {
  readonly database: DatabaseClient; // services.database — already decrypts voice examples on read
  readonly billing: BillingServiceContract;
  readonly users: BackendApplicationUserRepository;
  readonly redis: Redis;
  readonly now: () => Date;
}

export interface AccountExportService {
  readonly requestExport: (userId: string) => Effect.Effect<AccountExportJobView, Error>;
  readonly getExportStatus: (userId: string, jobId: string) => Effect.Effect<AccountExportJobView, Error>;
}

function buildBundle(
  deps: AccountExportServiceDependencies,
  userId: string
): Effect.Effect<AccountExportBundle, Error> {
  return Effect.gen(function* () {
    const user = yield* deps.users.findById(userId).pipe(Effect.mapError((e) => new Error(String(e))));
    if (!user) {
      return yield* Effect.fail(new Error(`Application user not found for export: ${userId}`));
    }

    // already decrypted — services.database is the protected wrapper (protected-voice-training-database.ts).
    const voiceProfile = yield* deps.database.voiceProfiles.getByUser(userId).pipe(Effect.mapError((e) => new Error(String(e))));
    const voiceExamples = yield* deps.database.voiceExamples.listByUser(userId).pipe(Effect.mapError((e) => new Error(String(e))));
    const history = yield* deps.database.jobs
      .listByUser(userId, EXPORT_HISTORY_LIMIT, 0)
      .pipe(Effect.mapError((e) => new Error(String(e))));

    const planId = deps.billing.getPrimarySubscriptionPlanId(userId);
    const ledger = curateLedger(deps.billing.listLedger(userId, planId));

    return {
      account: {
        id: user.id,
        externalSubject: user.externalSubject,
        createdAt: user.createdAt.toISOString()
      },
      voiceProfile: voiceProfile ?? null,
      voiceExamples,
      history,
      billingSummary: { planId, ledger },
      generatedAt: deps.now().toISOString()
    };
  });
}

export function createBackendAccountExportService(deps: AccountExportServiceDependencies): AccountExportService {
  function storeAndBuildView(jobId: string, userId: string, bundle: AccountExportBundle) {
    return Effect.gen(function* () {
      const entry: StoredExportEntry = { userId, createdAt: deps.now().toISOString(), bundle };
      yield* Effect.tryPromise({
        try: () => deps.redis.setex(exportRedisKey(jobId), EXPORT_TTL_SECONDS, JSON.stringify(entry)),
        catch: (e) => (e instanceof Error ? e : new Error(String(e)))
      });

      return {
        jobId,
        status: "ready" as const,
        downloadUrl: `/me/account/export/${jobId}/download`,
        expiresAt: new Date(deps.now().getTime() + EXPORT_TTL_SECONDS * 1000).toISOString()
      } satisfies AccountExportJobView;
    });
  }

  return {
    // ponytail: no generic background-job runner exists outside the BullMQ generation pipeline, and
    // the bundle has no LLM calls — fast enough to build synchronously despite the async-shaped
    // contract. Promote to a real background job if bundles grow slow (e.g. very large corpora).
    requestExport(userId) {
      return Effect.gen(function* () {
        const jobId = randomUUID();
        const bundle = yield* buildBundle(deps, userId);
        return yield* storeAndBuildView(jobId, userId, bundle);
      });
    },

    getExportStatus(userId, jobId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () => deps.redis.get(exportRedisKey(jobId)),
          catch: (e) => (e instanceof Error ? e : new Error(String(e)))
        });

        if (!raw) {
          return {
            jobId,
            status: "failed" as const,
            downloadUrl: null,
            expiresAt: null
          } satisfies AccountExportJobView;
        }

        const entry = JSON.parse(raw) as StoredExportEntry;
        if (entry.userId !== userId) {
          return yield* Effect.fail(new Error("Export job does not belong to this account"));
        }

        return {
          jobId,
          status: "ready" as const,
          downloadUrl: `/me/account/export/${jobId}/download`,
          expiresAt: new Date(deps.now().getTime() + EXPORT_TTL_SECONDS * 1000).toISOString()
        } satisfies AccountExportJobView;
      });
    }
  };
}

export interface AccountExportDownload {
  readonly bundle: AccountExportBundle;
}

// one-time: GETDEL semantics (get then unconditionally delete) so a leaked/replayed download URL
// only ever serves the corpus once.
export function consumeAccountExportDownload(
  redis: Redis,
  userId: string,
  jobId: string
): Effect.Effect<AccountExportDownload | undefined, Error> {
  return Effect.gen(function* () {
    const raw = yield* Effect.tryPromise({
      try: () => redis.get(exportRedisKey(jobId)),
      catch: (e) => (e instanceof Error ? e : new Error(String(e)))
    });

    if (!raw) {
      return undefined;
    }

    const entry = JSON.parse(raw) as StoredExportEntry;
    if (entry.userId !== userId) {
      // wrong-owner attempt must not destroy the real owner's still-pending download.
      return undefined;
    }

    yield* Effect.tryPromise({
      try: () => redis.del(exportRedisKey(jobId)),
      catch: (e) => (e instanceof Error ? e : new Error(String(e)))
    });

    return { bundle: entry.bundle };
  });
}
