import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { BackendPersistence } from "../core/types.js";
import { persistContentType } from "../catalog/persistence-content-types.js";
import {
  persistJobCompletion,
  persistJobFailure,
  persistJobProgress,
  persistQueuedJob
} from "./persistence-jobs.js";
import { persistMemoryWrite } from "./persistence-memory.js";

export function createBackendPersistence(
  database: DatabaseClient,
  now: () => Date
): BackendPersistence {
  return {
    recordExecutionPlan(plan) {
      return persistContentType(database, plan, now().toISOString());
    },
    recordQueuedJob(args) {
      return persistQueuedJob(database, args);
    },
    recordJobProgress(args) {
      return persistJobProgress(database, args);
    },
    recordJobCompletion(args) {
      return persistJobCompletion(database, args);
    },
    recordJobFailure(args) {
      return persistJobFailure(database, args);
    },
    recordMemoryWrite(args) {
      return persistMemoryWrite(database, args);
    }
  };
}
