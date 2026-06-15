import { Effect } from "effect";
import { BackendOutputReleaseGateFailureError } from "../http/errors.js";
import { swallowWithDiagnostic } from "../effects/non-blocking-diagnostics.js";
import type {
  BackendOutputReleaseGateDependencies,
  BackendOutputReleaseGateService,
  OutputReleaseDecision,
  OutputReleaseFinding
} from "./output-release-types.js";
import { determineOutputReleaseOutcome, requireAllowedOutputDecision } from "./output-release-verdict.js";
import {
  createHeuristicOutputReleaseScannerAdapter,
  type OutputReleaseScannerAdapter
} from "./output-release-scanner.js";
import type { BackendPolicyEvidenceService } from "./policy-evidence-types.js";

export function createBackendOutputReleaseGateService(
  deps: BackendOutputReleaseGateDependencies & {
    readonly scannerAdapter?: OutputReleaseScannerAdapter;
    readonly policyEvidence?: BackendPolicyEvidenceService;
  }
): BackendOutputReleaseGateService {
  const scanner = deps.scannerAdapter ?? createHeuristicOutputReleaseScannerAdapter();

  const evaluateOutput: BackendOutputReleaseGateService["evaluateOutput"] = (output, context) =>
    Effect.gen(function* () {
      const family = yield* deps.safetyPolicy.getPolicyFamily("output_release");

      const codeScan = scanner.scanForUnsafeCode(output, { contentType: context.contentType });
      const dataLeakScan = scanner.scanForSensitiveDataLeak(output);

      const findings: OutputReleaseFinding[] = [];

      if (codeScan.unsafe && codeScan.category) {
        findings.push({
          category: mapCodeCategoryToClassification(codeScan.category),
          field: "content",
          sanitized: false
        });
      }

      if (dataLeakScan.leaked && dataLeakScan.category) {
        findings.push({
          category: "operational_data",
          field: "content",
          sanitized: dataLeakScan.sanitized !== undefined
        });
      }

      const canSanitize = dataLeakScan.sanitized !== undefined && dataLeakScan.sanitized !== output;
      const outcome = determineOutputReleaseOutcome({
        findings,
        hasUnsafeCode: codeScan.unsafe,
        hasSensitiveLeak: dataLeakScan.leaked,
        canSanitize
      });

      if (!family.allowedOutcomes.includes(outcome)) {
        return yield* Effect.fail(
          new BackendOutputReleaseGateFailureError({
            boundary: "output",
            reason: "evaluation_failed",
            message: `Computed outcome "${outcome}" is not allowed for output_release family`
          })
        );
      }

      const decision: OutputReleaseDecision =
        outcome === "approve" || outcome === "sanitize"
          ? {
              outcome,
              sanitizedOutput: { content: canSanitize && dataLeakScan.sanitized ? dataLeakScan.sanitized : output },
              findings
            }
          : {
              outcome,
              findings
            };

      if (deps.policyEvidence) {
        const timestamp = new Date().toISOString();
        yield* deps.policyEvidence.recordOutputEvidence({
          actorId: "system",
          actorType: "system",
          resourceId: `${context.contentType}:${timestamp}`,
          outcome: decision.outcome,
          contentType: context.contentType,
          findings: decision.findings.map((f) => ({ category: f.category, field: f.field, sanitized: f.sanitized })),
          occurredAt: timestamp
        }).pipe(Effect.orElse(swallowWithDiagnostic({
          operation: "Failed to persist output policy evidence",
          context: {
            contentType: context.contentType,
            outcome: decision.outcome
          }
        })));
      }

      return decision;
    }).pipe(
      Effect.catchAll((error) => {
        if (error instanceof BackendOutputReleaseGateFailureError) {
          return Effect.fail(error);
        }
        return Effect.fail(
          new BackendOutputReleaseGateFailureError({
            boundary: "output",
            reason: "evaluation_failed",
            message: error instanceof Error ? error.message : "Unexpected output release evaluation failure"
          })
        );
      })
    );

  return {
    evaluateOutput,
    authorizeOutput: (output, context) =>
      Effect.gen(function* () {
        const decision = yield* evaluateOutput(output, context);
        return yield* requireAllowedOutputDecision(decision);
      })
  };
}

function mapCodeCategoryToClassification(
  category: "destructive" | "exfiltrative" | "out_of_scope"
): "security_sensitive_data" | "llm_prohibited_data" | "operational_data" {
  switch (category) {
    case "destructive":
      return "llm_prohibited_data";
    case "exfiltrative":
      return "security_sensitive_data";
    case "out_of_scope":
      return "operational_data";
  }
}
