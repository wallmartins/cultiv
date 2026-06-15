import { Queue, Worker, type Job } from "bullmq";
import type { BackendConfig } from "../config/config.js";

export const EXECUTION_QUEUE_NAME = "executions";

export interface ExecutionQueuePayload {
  readonly executionId: string;
}

export interface ExecutionQueue {
  readonly enqueue: (payload: ExecutionQueuePayload) => Promise<void>;
  readonly getJob: (executionId: string) => Promise<ExecutionQueuePayload | undefined>;
  readonly createWorker: (
    processor: (payload: ExecutionQueuePayload) => Promise<void>
  ) => Worker<ExecutionQueuePayload>;
  readonly close: () => Promise<void>;
}

function createQueueConnection(config: BackendConfig) {
  if (!config.redisUrl) {
    throw new Error("REDIS_URL is required for execution queue");
  }

  return {
    url: config.redisUrl,
    maxRetriesPerRequest: null
  };
}

export function createExecutionQueue(config: BackendConfig): ExecutionQueue {
  const connection = createQueueConnection(config);
  const queue = new Queue<ExecutionQueuePayload>(EXECUTION_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 5000,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000
      }
    }
  });

  return {
    async enqueue(payload) {
      await queue.add(payload.executionId, payload, {
        jobId: payload.executionId
      });
    },
    async getJob(executionId) {
      const job = await queue.getJob(executionId);
      return job?.data;
    },
    createWorker(processor) {
      return new Worker<ExecutionQueuePayload>(
        EXECUTION_QUEUE_NAME,
        async (job: Job<ExecutionQueuePayload>) => {
          await processor(job.data);
        },
        {
          connection: createQueueConnection(config),
          concurrency: config.executionWorkerConcurrency ?? 2
        }
      );
    },
    async close() {
      await queue.close();
    }
  };
}
