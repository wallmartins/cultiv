import { Effect } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";
import type { BackendJobStoreServiceContract } from "../../jobs/job-store.js";

// contract-08 decision 8 — pre-purge step shared by reset and delete: cancel-in-flight (N3) before
// touching any storage, so a worker never writes to a job row mid-purge.
// ponytail: bounded to the 500 most recent jobs (createdAt desc) — in-flight jobs are always recent,
// so this only misses in-flight work if a single user has >500 historical jobs newer than it, which
// the product's rate limits make implausible.
const IN_FLIGHT_SCAN_LIMIT = 500;

export function cancelInFlightExecutionsForUser(
  jobs: BackendJobStoreServiceContract,
  userId: string,
  reason: string
): Effect.Effect<number, DatabaseError> {
  return Effect.gen(function* () {
    const { items } = yield* jobs.listJobsForUser(userId, IN_FLIGHT_SCAN_LIMIT, 0);
    const inFlight = items.filter((job) => job.status === "queued" || job.status === "running");

    let cancelled = 0;
    for (const job of inFlight) {
      yield* jobs.cancelJob(job.jobId, reason);
      cancelled++;
    }

    return cancelled;
  });
}
