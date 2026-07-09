import type { EvalReport } from "../types.js";

export interface JSONReporterOptions {
  readonly compact?: boolean;
}

export function reportJSON(report: EvalReport, options: JSONReporterOptions = {}): string {
  const serialized = JSON.stringify(report, null, options.compact ? undefined : 2);
  return `${serialized}\n`;
}
