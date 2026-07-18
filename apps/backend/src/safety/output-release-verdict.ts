import { Effect } from "effect";
import { BackendOutputReleasePolicyError } from "../http/errors.js";
import type { OutputReleaseDecision, OutputReleaseFinding, SanitizedGenerationOutput } from "./output-release-types.js";

export function requireAllowedOutputDecision(
  decision: OutputReleaseDecision
): Effect.Effect<SanitizedGenerationOutput, BackendOutputReleasePolicyError> {
  if (decision.outcome === "approve" || decision.outcome === "sanitize") {
    return Effect.succeed(decision.sanitizedOutput);
  }

  const categories = dedupeStrings(decision.findings.map((finding) => finding.category));
  const fields = dedupeStrings(decision.findings.map((finding) => finding.field));
  const message = decision.outcome === "block"
    ? "Output includes restricted or sensitive material and cannot be released."
    : "Output requires manual review before release.";

  return Effect.fail(
    new BackendOutputReleasePolicyError({
      boundary: "output",
      outcome: decision.outcome,
      message,
      categories,
      fields
    })
  );
}

// ponytail: `require_override` stays in this return union as a reserved output-release
// outcome; the runtime never produces it yet — a consumed operator-override grant is not
// wired back into this gate decision. See createBackendOperationalOverrideService.
export function determineOutputReleaseOutcome(args: {
  readonly findings: readonly OutputReleaseFinding[];
  readonly hasUnsafeCode: boolean;
  readonly hasSensitiveLeak: boolean;
  readonly canSanitize: boolean;
}): "approve" | "sanitize" | "block" | "require_override" {
  if (args.hasUnsafeCode) {
    return "block";
  }

  const unsanitizedBlockFindings = args.findings.filter(
    (f) =>
      !f.sanitized &&
      (f.category === "operational_data" || f.category === "security_sensitive_data" || f.category === "llm_prohibited_data")
  );
  if (unsanitizedBlockFindings.length > 0) {
    return "block";
  }

  if (args.hasSensitiveLeak && !args.canSanitize) {
    return "block";
  }

  if (args.findings.some((f) => f.sanitized) || (args.hasSensitiveLeak && args.canSanitize)) {
    return "sanitize";
  }

  return "approve";
}

function dedupeStrings(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values));
}
