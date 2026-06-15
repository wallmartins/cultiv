import { Effect } from "effect";
import { swallowWithDiagnostic } from "../effects/non-blocking-diagnostics.js";
import {
  BackendInputSafetyGatewayFailureError
} from "../http/errors.js";
import type {
  BackendPublicInputSafetyGatewayDependencies,
  InputSafetyGatewayDecision,
  BackendGenerationPreviewGatewayRequest,
  BackendPipelineGatewayRequest,
  BackendPublicGenerationGatewayRequest,
  BackendPublicInputSafetyGatewayService
} from "./public-input-safety-types.js";
import { createHeuristicInstructionOverrideDetector } from "./instruction-override-detector.js";
import { determineDecisionOutcome, requireAllowedDecision } from "./public-input-safety-decision.js";
import { inspectRequestInput } from "./public-input-safety-inspection.js";
import { dedupeStrings, type InspectableInputRequest } from "./public-input-safety-shared.js";
import { evaluateInstructionOverrideAttempt } from "./instruction-override-verdict.js";
import type { BackendPolicyEvidenceService } from "./policy-evidence-types.js";

export function createBackendPublicInputSafetyGatewayService(args: {
  readonly safetyPolicy: BackendPublicInputSafetyGatewayDependencies["safetyPolicy"];
  readonly instructionOverrideDetector?: BackendPublicInputSafetyGatewayDependencies["instructionOverrideDetector"];
  readonly policyEvidence?: BackendPolicyEvidenceService;
}): BackendPublicInputSafetyGatewayService {
  const instructionOverrideDetector =
    args.instructionOverrideDetector ?? createHeuristicInstructionOverrideDetector();

  return {
    evaluatePreviewInput(request) {
      return evaluateInput({
        boundary: "preview",
        request,
        safetyPolicy: args.safetyPolicy,
        instructionOverrideDetector,
        policyEvidence: args.policyEvidence
      });
    },
    evaluateGenerationInput(request) {
      return evaluateInput({
        boundary: "generation",
        request,
        safetyPolicy: args.safetyPolicy,
        instructionOverrideDetector,
        policyEvidence: args.policyEvidence
      });
    },
    authorizePreviewInput(request) {
      return Effect.flatMap(
        evaluateInput({
          boundary: "preview",
          request,
          safetyPolicy: args.safetyPolicy,
          instructionOverrideDetector,
          policyEvidence: args.policyEvidence
        }),
        (decision) => Effect.map(requireAllowedDecision(decision), (sanitizedInput) => ({
          ...request,
          ...sanitizedInput
        }))
      );
    },
    authorizeGenerationInput(request) {
      return Effect.flatMap(
        evaluateInput({
          boundary: "generation",
          request,
          safetyPolicy: args.safetyPolicy,
          instructionOverrideDetector,
          policyEvidence: args.policyEvidence
        }),
        (decision) => Effect.map(requireAllowedDecision(decision), (sanitizedInput) => ({
          ...request,
          ...sanitizedInput
        }))
      );
    }
  };
}

function evaluateInput(args: {
  readonly boundary: "preview" | "generation";
  readonly request:
    | BackendGenerationPreviewGatewayRequest
    | BackendPublicGenerationGatewayRequest
    | BackendPipelineGatewayRequest;
  readonly safetyPolicy: BackendPublicInputSafetyGatewayDependencies["safetyPolicy"];
  readonly instructionOverrideDetector: BackendPublicInputSafetyGatewayDependencies["instructionOverrideDetector"];
  readonly policyEvidence?: BackendPolicyEvidenceService;
}): Effect.Effect<
  InputSafetyGatewayDecision,
  import("../http/errors.js").BackendSafetyPolicyDefinitionError | BackendInputSafetyGatewayFailureError
> {
  return Effect.gen(function* () {
    const inputFamily = yield* args.safetyPolicy.getPolicyFamily("input");
    const hasImportedContext = args.request.importedContext !== undefined;
    const importedContextFamily = hasImportedContext
      ? yield* args.safetyPolicy.getPolicyFamily("imported_context")
      : null;
    const sanitizedInput = yield* inspectRequestInput(args.request as InspectableInputRequest).pipe(
      Effect.mapError(() =>
        new BackendInputSafetyGatewayFailureError({
          boundary: args.boundary,
          reason: "sanitization_failed",
          message: "Input safety checks are temporarily unavailable. Try again later."
        })
      )
    );

    const categories = dedupeStrings(sanitizedInput.findings.map((finding) => finding.category));
    const classifications = yield* Effect.all(
      categories.map((category) => args.safetyPolicy.getClassification(category).pipe(Effect.map((definition) => [category, definition] as const)))
    );
    const classificationMap = new Map(classifications);
    const overrideAttempt = yield* evaluateInstructionOverrideAttempt({
      boundary: args.boundary,
      request: args.request,
      detector: args.instructionOverrideDetector
    });

    const decisionOutcome = determineDecisionOutcome({
      findings: sanitizedInput.findings,
      classifications: classificationMap,
      hasImportedContext,
      importedContextFamily,
      overrideAttempt
    });

    const applicableFamilies = [inputFamily, ...(importedContextFamily ? [importedContextFamily] : [])];
    if (applicableFamilies.some((family) => !family.allowedOutcomes.includes(decisionOutcome))) {
      return yield* Effect.fail(
        new BackendInputSafetyGatewayFailureError({
          boundary: args.boundary,
          reason: "decision_failed",
          message: "Input safety checks are temporarily unavailable. Try again later."
        })
      );
    }

    const decision: InputSafetyGatewayDecision =
      decisionOutcome === "approve" || decisionOutcome === "sanitize"
        ? {
            outcome: decisionOutcome,
            boundary: args.boundary,
            findings: sanitizedInput.findings,
            sanitizedInput: sanitizedInput.sanitizedInput,
            overrideAttempt
          }
        : {
            outcome: decisionOutcome,
            boundary: args.boundary,
            findings: sanitizedInput.findings,
            overrideAttempt
          };

    if (args.policyEvidence) {
      const timestamp = new Date().toISOString();
        yield* args.policyEvidence.recordInputEvidence({
          actorId: "system",
          actorType: "system",
          resourceId: `${args.boundary}:${timestamp}`,
          outcome: decision.outcome,
          boundary: args.boundary,
          findings: decision.findings.map((f) => ({ category: f.category, field: f.field })),
          overrideAttempt: decision.overrideAttempt
            ? { verdict: decision.overrideAttempt.status, confidence: decision.overrideAttempt.confidence ?? null }
            : null,
          occurredAt: timestamp
        }).pipe(Effect.orElse(swallowWithDiagnostic({
          operation: "Failed to persist input policy evidence",
          context: {
            boundary: args.boundary,
            outcome: decision.outcome
          }
        })));
    }

    return decision;
  });
}
