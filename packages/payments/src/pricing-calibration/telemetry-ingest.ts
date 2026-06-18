import type { ExecutionTelemetry, QualityMode } from "@my-ai-orchestrator/contracts";
import type { CalibrationTelemetryRow } from "./types.js";

interface JobRecordShape {
  readonly id?: string;
  readonly status?: string;
  readonly contentType?: string;
  readonly result?: {
    readonly metadata?: {
      readonly qualityMode?: QualityMode;
      readonly telemetry?: ExecutionTelemetry;
    };
  } | null;
}

export function parseJobTelemetryRow(job: unknown): CalibrationTelemetryRow | null {
  const record = job as JobRecordShape;
  if (record.status !== "done" || !record.result?.metadata?.telemetry?.cost) {
    return null;
  }

  const telemetry = record.result.metadata.telemetry;
  const cost = telemetry.cost!;
  const qualityMode =
    telemetry.preview?.finalQualityMode ??
    record.result.metadata.qualityMode ??
    "balanced";

  return {
    jobId: record.id ?? "unknown",
    contentType: telemetry.pricing?.contentType ?? record.contentType ?? "unknown",
    qualityMode,
    inputTokensTotal: cost.inputTokensTotal,
    outputTokensTotal: cost.outputTokensTotal,
    observedUsdCost: cost.estimatedUsdCost,
    debitedCredits: cost.debitedCredits,
    plannedCreditPrice: telemetry.pricing?.plannedCreditPrice ?? null,
    policyVersion: telemetry.pricing?.policyVersion ?? null
  };
}

export function parseJobTelemetryRows(raw: unknown): CalibrationTelemetryRow[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((entry) => {
    const job = (entry as { data?: unknown }).data ?? entry;
    const row = parseJobTelemetryRow(job);
    return row ? [row] : [];
  });
}
