import { Effect } from "effect";
import { BackendInputSafetyPolicyError } from "../http/errors.js";
import type {
  InputSafetyGatewayDecision,
  InputSafetyGatewayFinding,
  SanitizedGenerationInputEnvelope
} from "./public-input-safety-types.js";
import type { InstructionOverrideAttemptVerdict } from "./instruction-override-types.js";
import { dedupeStrings } from "./public-input-safety-shared.js";

export function requireAllowedDecision(
  decision: InputSafetyGatewayDecision
): Effect.Effect<
  SanitizedGenerationInputEnvelope,
  BackendInputSafetyPolicyError
> {
  if (decision.outcome === "approve" || decision.outcome === "sanitize") {
    return Effect.succeed(decision.sanitizedInput);
  }

  const categories = dedupeStrings(decision.findings.map((finding) => finding.category));
  const fields = dedupeStrings(decision.findings.map((finding) => finding.field));
  const message = decision.outcome === "quarantine"
    ? "Input requires manual review before preview or generation can continue."
    : "Input includes restricted or sensitive material and cannot be used for generation.";

  return Effect.fail(
    new BackendInputSafetyPolicyError({
      boundary: decision.boundary,
      outcome: decision.outcome,
      message,
      categories,
      fields
    })
  );
}

export function determineDecisionOutcome(args: {
  readonly findings: readonly InputSafetyGatewayFinding[];
  readonly classifications: ReadonlyMap<
    string,
    {
      readonly category: string;
      readonly defaultOutcome: "approve" | "sanitize" | "quarantine" | "block" | "require_override" | "revoke";
    }
  >;
  readonly hasImportedContext: boolean;
  readonly importedContextFamily: {
    readonly allowedOutcomes: readonly ("approve" | "sanitize" | "quarantine" | "block" | "require_override" | "revoke")[];
  } | null;
  readonly overrideAttempt: InstructionOverrideAttemptVerdict;
}): "approve" | "sanitize" | "quarantine" | "block" {
  const classificationOutcomes = args.findings.map((finding) => {
    const classification = args.classifications.get(finding.category);
    if (!classification) {
      return "block" as const;
    }

    if (!finding.field.startsWith("importedContext")) {
      return classification.defaultOutcome;
    }

    if (finding.category === "imported_context_out_of_scope") {
      return "block" as const;
    }

    if (classification.defaultOutcome === "sanitize") {
      return "quarantine" as const;
    }

    return classification.defaultOutcome;
  });

  if (args.overrideAttempt.status === "block") {
    return "block";
  }

  if (args.overrideAttempt.status === "quarantine") {
    return "quarantine";
  }

  if (classificationOutcomes.some((outcome) => outcome === "block")) {
    return "block";
  }

  if (classificationOutcomes.some((outcome) => outcome === "quarantine")) {
    return "quarantine";
  }

  if (
    args.findings.some((finding) => finding.sanitized) ||
    classificationOutcomes.some((outcome) => outcome === "sanitize")
  ) {
    return "sanitize";
  }

  if (
    args.hasImportedContext &&
    args.importedContextFamily &&
    !args.importedContextFamily.allowedOutcomes.includes("approve")
  ) {
    return "block";
  }

  return "approve";
}
