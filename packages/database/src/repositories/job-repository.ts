import { Effect } from "effect";
import { matchesExecutionsListFilters, resolveExecutionPresentation } from "@my-ai-orchestrator/contracts";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import {
  DatabaseJobAlreadyExistsError,
  DatabaseJobNotFoundError
} from "../errors.js";
import { createDefaultProgress, toJobRecord } from "../converters.js";
import type {
  DatabaseHistoryEntry,
  DatabaseState,
  JobCreateOptions,
  JobProgressEntry,
  JobRecord,
  JobRepository
} from "../types.js";
import { cloneRecord, type StateRef } from "./shared.js";

export function createJobRepository(stateRef: StateRef): JobRepository {
  return {
    create(job, options = {}) {
      if (stateRef.current.jobs[job.id]) {
        return Effect.fail(new DatabaseJobAlreadyExistsError({ jobId: job.id }));
      }

      const record = toJobRecord(job, options);
      stateRef.current = {
        ...stateRef.current,
        jobs: {
          ...stateRef.current.jobs,
          [record.id]: record
        }
      };
      return Effect.succeed(cloneRecord(record));
    },
    save(record) {
      return Effect.gen(function* () {
        const current = yield* requireJob(stateRef.current, record.id);
        const next = {
          ...record,
          version: current.version + 1,
          history: record.history.length > 0 ? record.history : current.history
        };
        stateRef.current = {
          ...stateRef.current,
          jobs: {
            ...stateRef.current.jobs,
            [next.id]: next
          }
        };
        return cloneRecord(next);
      });
    },
    findById(id) {
      const record = stateRef.current.jobs[id];
      return Effect.succeed(record ? cloneRecord(record) : undefined);
    },
    list() {
      return Effect.succeed(Object.values(stateRef.current.jobs).map(cloneRecord));
    },
    listByUser(userId, limit, offset, filters) {
      const records = Object.values(stateRef.current.jobs)
        .filter((record) => jobUserId(record) === userId)
        .filter((record) => {
          if (!filters) {
            return true;
          }

          const presentation = resolveExecutionPresentation(readRuntimeRequest(record), record.contentType);
          return matchesExecutionsListFilters(
            {
              createdAt: record.createdAt,
              status: record.status,
              contentType: record.contentType,
              ...presentation
            },
            filters
          );
        })
        .map(cloneRecord)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      return Effect.succeed(records.slice(offset, offset + limit));
    },
    countByUser(userId, filters) {
      const count = Object.values(stateRef.current.jobs).filter((record) => {
        if (jobUserId(record) !== userId) {
          return false;
        }

        if (!filters) {
          return true;
        }

        const presentation = resolveExecutionPresentation(readRuntimeRequest(record), record.contentType);
        return matchesExecutionsListFilters(
          {
            createdAt: record.createdAt,
            status: record.status,
            contentType: record.contentType,
            ...presentation
          },
          filters
        );
      }).length;
      return Effect.succeed(count);
    },
    remove(id) {
      if (!stateRef.current.jobs[id]) {
        return Effect.succeed(false);
      }
      const { [id]: _removed, ...jobs } = stateRef.current.jobs;
      stateRef.current = {
        ...stateRef.current,
        jobs
      };
      return Effect.succeed(true);
    },
    appendHistory(id, entry) {
      return Effect.gen(function* () {
        const current = yield* requireJob(stateRef.current, id);
        return yield* updateJob(stateRef, id, {
          history: [...current.history, entry],
          updatedAt: entry.at
        });
      });
    },
    recordProgress(id, progress, at = new Date().toISOString()) {
      return Effect.gen(function* () {
        const current = yield* requireJob(stateRef.current, id);
        return yield* updateJob(stateRef, id, {
          status: "running",
          progress,
          updatedAt: at,
          progressHistory: [...current.progressHistory, { at, progress }],
          historyEntry: {
            type: "progress",
            at,
            payload: { progress }
          }
        });
      });
    },
    complete(id, result, at = new Date().toISOString()) {
      return Effect.gen(function* () {
        const current = yield* requireJob(stateRef.current, id);
        return yield* updateJob(stateRef, id, {
          status: "done",
          completedAt: at,
          result,
          error: null,
          progress: {
            ...current.progress,
            currentStep: current.progress.currentStep,
            percent: 100
          },
          progressHistory: [
            ...current.progressHistory,
            {
              at,
              progress: {
                ...current.progress,
                currentStep: current.progress.currentStep,
                percent: 100
              }
            }
          ],
          updatedAt: at,
          historyEntry: {
            type: "completed",
            at,
            payload: { result }
          }
        });
      });
    },
    fail(id, error, at = new Date().toISOString()) {
      return Effect.gen(function* () {
        const current = yield* requireJob(stateRef.current, id);
        return yield* updateJob(stateRef, id, {
          status: "failed",
          completedAt: at,
          result: null,
          error,
          progressHistory: [...current.progressHistory],
          updatedAt: at,
          historyEntry: {
            type: "failed",
            at,
            payload: { error }
          }
        });
      });
    }
  };
}

function updateJob(
  stateRef: StateRef,
  id: string,
  patch: Partial<Omit<JobRecord, "history" | "progressHistory">> & {
    readonly historyEntry?: DatabaseHistoryEntry;
    readonly history?: readonly DatabaseHistoryEntry[];
    readonly progressHistory?: readonly JobProgressEntry[];
  }
): Effect.Effect<JobRecord, DatabaseJobNotFoundError> {
  return Effect.gen(function* () {
    const current = yield* requireJob(stateRef.current, id);
    const { historyEntry, history: patchHistory, progressHistory: patchProgressHistory, ...jobPatch } = patch;
    const history = historyEntry ? [...current.history, historyEntry] : patchHistory ?? current.history;
    const progressHistory = patchProgressHistory ?? current.progressHistory;
    const next: JobRecord = {
      ...current,
      ...jobPatch,
      version: current.version + 1,
      history,
      progressHistory
    };

    stateRef.current = {
      ...stateRef.current,
      jobs: {
        ...stateRef.current.jobs,
        [id]: next
      }
    };

    return cloneRecord(next);
  });
}

function readRuntimeRequest(record: JobRecord): PipelineRequest | undefined {
  const created = record.history.find((entry) => entry.type === "created");
  const payload = created?.payload;
  if (payload && typeof payload === "object" && "runtime" in payload) {
    const runtime = (payload as { runtime?: { request?: PipelineRequest } }).runtime;
    return runtime?.request;
  }

  return undefined;
}

function jobUserId(record: JobRecord): string | undefined {
  const direct = (record as JobRecord & { userId?: string }).userId;
  if (typeof direct === "string") {
    return direct;
  }

  const created = record.history.find((entry) => entry.type === "created");
  const payload = created?.payload;
  if (payload && typeof payload === "object" && "runtime" in payload) {
    const runtime = (payload as { runtime?: { userId?: unknown } }).runtime;
    if (runtime && typeof runtime === "object" && typeof runtime.userId === "string") {
      return runtime.userId;
    }
  }

  return undefined;
}

function requireJob(state: DatabaseState, id: string): Effect.Effect<JobRecord, DatabaseJobNotFoundError> {
  const record = state.jobs[id];
  if (!record) {
    return Effect.fail(new DatabaseJobNotFoundError({ jobId: id }));
  }
  return Effect.succeed(record);
}
