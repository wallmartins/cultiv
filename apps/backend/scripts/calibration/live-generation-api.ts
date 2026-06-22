import pg from "pg";

const { Client } = pg;

export interface LivePreviewResult {
  readonly status: number;
  readonly quoteId?: string;
  readonly planSignature?: string;
  readonly creditPrice?: number;
  readonly quotaCost?: number;
  readonly quotaRemaining?: number;
  readonly quotaLimit?: number;
  readonly canonicalCreditCost?: number;
  readonly projectedBalanceAfterGeneration?: number;
  readonly currentBalance?: number;
  readonly error?: string;
}

export interface LiveExecutionResult {
  readonly jobId?: string;
  readonly status: "done" | "failed" | "skipped";
  readonly usdCost?: number;
  readonly planSignature?: string;
  readonly planner?: {
    readonly patchCount: number;
    readonly ops: readonly string[];
    readonly basePlanSignature: string;
    readonly finalPlanSignature: string;
  };
  readonly error?: string;
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

export async function fetchJson(
  baseUrl: string,
  token: string,
  path: string,
  body: unknown
): Promise<{ status: number; json: unknown }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { status: response.status, json };
}

async function pollJobDone(
  databaseUrl: string,
  jobId: string,
  pollMs: number,
  timeoutMs: number
): Promise<{ status: "done" | "failed"; data?: Record<string, unknown>; errorMessage?: string }> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const started = Date.now();

  try {
    while (Date.now() - started < timeoutMs) {
      const result = await client.query<{ data: Record<string, unknown> | null }>(
        `SELECT data FROM jobs WHERE id = $1`,
        [jobId]
      );
      const data = result.rows[0]?.data ?? undefined;
      const status = typeof data?.status === "string" ? data.status : null;
      if (status === "done") {
        return { status: "done", data };
      }
      if (status === "failed") {
        return { status: "failed", data, errorMessage: readJobFailureMessage(data) };
      }
      await sleep(pollMs);
    }

    throw new Error(`Timed out waiting for job ${jobId} after ${timeoutMs}ms`);
  } finally {
    await client.end();
  }
}

function readJobFailureMessage(jobData: Record<string, unknown> | undefined): string | undefined {
  const error = jobData?.error;
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  const result = jobData?.result;
  if (result && typeof result === "object") {
    const message = (result as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return undefined;
}

function readJobMetadata(jobData: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  const result = jobData?.result;
  if (!result || typeof result !== "object") {
    return undefined;
  }

  const metadata = (result as { metadata?: Record<string, unknown> }).metadata;
  return metadata && typeof metadata === "object" ? metadata : undefined;
}

function readTelemetry(jobData: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  const metadata = readJobMetadata(jobData);
  const telemetry = metadata?.telemetry;
  return telemetry && typeof telemetry === "object" ? telemetry : undefined;
}

export function readUsdCost(jobData: Record<string, unknown> | undefined): number | undefined {
  const cost = (readTelemetry(jobData) as { cost?: { estimatedUsdCost?: number } } | undefined)?.cost
    ?.estimatedUsdCost;
  return typeof cost === "number" ? cost : undefined;
}

export function readPlanSignature(jobData: Record<string, unknown> | undefined): string | undefined {
  const metadata = readJobMetadata(jobData);
  if (!metadata) {
    return undefined;
  }

  const direct = metadata.planSignature;
  if (typeof direct === "string") {
    return direct;
  }

  const pricing = (readTelemetry(jobData) as { pricing?: { planSignature?: string } } | undefined)?.pricing
    ?.planSignature;
  return typeof pricing === "string" ? pricing : undefined;
}

export function readPlannerTelemetry(
  jobData: Record<string, unknown> | undefined
): LiveExecutionResult["planner"] {
  const planner = (readTelemetry(jobData) as { planner?: Record<string, unknown> } | undefined)?.planner;
  if (!planner || typeof planner !== "object") {
    return undefined;
  }

  const patchCount = planner.patchCount;
  const ops = planner.ops;
  const basePlanSignature = planner.basePlanSignature;
  const finalPlanSignature = planner.finalPlanSignature;

  if (
    typeof patchCount !== "number" ||
    !Array.isArray(ops) ||
    ops.some((entry) => typeof entry !== "string") ||
    typeof basePlanSignature !== "string" ||
    typeof finalPlanSignature !== "string"
  ) {
    return undefined;
  }

  return {
    patchCount,
    ops: [...ops],
    basePlanSignature,
    finalPlanSignature
  };
}

export async function runGenerationPreview(args: {
  readonly baseUrl: string;
  readonly token: string;
  readonly body: Record<string, unknown>;
}): Promise<LivePreviewResult> {
  const preview = await fetchJson(args.baseUrl, args.token, "/api/generation-preview", args.body);
  if (preview.status !== 200) {
    return {
      status: preview.status,
      error: `preview ${preview.status}: ${JSON.stringify(preview.json)}`
    };
  }

  const previewJson = preview.json as {
    compositor?: { planSignature?: string };
    pricingSnapshot?: { quoteId?: string; contentType?: string; creditPrice?: number; planSignature?: string };
    currentBalance?: number;
    projectedBalanceAfterGeneration?: number;
    quotaCost?: number;
    quotaRemaining?: number;
    quotaLimit?: number;
    canonicalCreditCost?: number;
  };

  const quoteId = previewJson.pricingSnapshot?.quoteId;
  if (!quoteId) {
    return { status: preview.status, error: "preview missing quoteId" };
  }

  if (
    typeof previewJson.projectedBalanceAfterGeneration === "number" &&
    previewJson.projectedBalanceAfterGeneration < 0
  ) {
    return {
      status: preview.status,
      quoteId,
      error: `insufficient credits: price=${previewJson.pricingSnapshot?.creditPrice ?? "?"} balance=${previewJson.currentBalance ?? "?"} projected=${previewJson.projectedBalanceAfterGeneration}`
    };
  }

  return {
    status: preview.status,
    quoteId,
    planSignature:
      previewJson.compositor?.planSignature ?? previewJson.pricingSnapshot?.planSignature ?? previewJson.pricingSnapshot?.contentType,
    creditPrice: previewJson.pricingSnapshot?.creditPrice,
    quotaCost: previewJson.quotaCost,
    quotaRemaining: previewJson.quotaRemaining,
    quotaLimit: previewJson.quotaLimit,
    canonicalCreditCost: previewJson.canonicalCreditCost,
    projectedBalanceAfterGeneration: previewJson.projectedBalanceAfterGeneration,
    currentBalance: previewJson.currentBalance
  };
}

export async function runGenerationExecute(args: {
  readonly baseUrl: string;
  readonly token: string;
  readonly databaseUrl: string;
  readonly previewBody: Record<string, unknown>;
  readonly quoteId: string;
  readonly idempotencyKey: string;
  readonly pollMs: number;
  readonly timeoutMs: number;
}): Promise<LiveExecutionResult> {
  const executeBody = {
    ...args.previewBody,
    quoteId: args.quoteId,
    idempotencyKey: args.idempotencyKey
  };

  const execute = await fetchJson(args.baseUrl, args.token, "/me/executions/run", executeBody);
  if (execute.status !== 200 && execute.status !== 202) {
    return {
      status: "failed",
      error: `execute ${execute.status}: ${JSON.stringify(execute.json)}`
    };
  }

  const executeJson = execute.json as { jobId?: string; status?: string };
  const jobId = executeJson.jobId;
  if (!jobId) {
    return { status: "failed", error: "execute missing jobId" };
  }

  if (executeJson.status !== "queued" && execute.status !== 202) {
    return {
      jobId,
      status: "done",
      planSignature: undefined
    };
  }

  const final = await pollJobDone(args.databaseUrl, jobId, args.pollMs, args.timeoutMs);

  return {
    jobId,
    status: final.status,
    usdCost: readUsdCost(final.data),
    planSignature: readPlanSignature(final.data),
    planner: readPlannerTelemetry(final.data),
    error: final.status === "failed" ? (final.errorMessage ?? "job failed") : undefined
  };
}
