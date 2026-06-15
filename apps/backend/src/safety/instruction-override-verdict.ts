import { Effect } from "effect";
import { BackendInputSafetyGatewayFailureError } from "../http/errors.js";
import type {
  BackendGenerationPreviewGatewayRequest,
  BackendPipelineGatewayRequest,
  BackendPublicGenerationGatewayRequest,
  BackendPublicInputSafetyGatewayDependencies
} from "./public-input-safety-types.js";
import type {
  InstructionOverrideAttemptConfidence,
  InstructionOverrideAttemptEvent,
  InstructionOverrideAttemptVerdict,
  InstructionOverrideTextField
} from "./instruction-override-types.js";
import { dedupeStrings, inputFieldKeys, type InspectableInputRequest } from "./public-input-safety-shared.js";

export function evaluateInstructionOverrideAttempt(args: {
  readonly boundary: "preview" | "generation";
  readonly request:
    | BackendGenerationPreviewGatewayRequest
    | BackendPublicGenerationGatewayRequest
    | BackendPipelineGatewayRequest;
  readonly detector: BackendPublicInputSafetyGatewayDependencies["instructionOverrideDetector"];
}): Effect.Effect<InstructionOverrideAttemptVerdict, BackendInputSafetyGatewayFailureError> {
  const fields = collectInstructionOverrideFields(args.request);

  return Effect.gen(function* () {
    const events = yield* args.detector.detect({
      boundary: args.boundary,
      fields
    }).pipe(
      Effect.catchTag("BackendInstructionOverrideDetectorFailureError", (error) =>
        error.critical
          ? Effect.fail(
              new BackendInputSafetyGatewayFailureError({
                boundary: args.boundary,
                reason: "override_detector_failed",
                message: "Input safety checks are temporarily unavailable. Try again later."
              })
            )
          : Effect.succeed([])
      )
    );

    return toInstructionOverrideVerdict(events);
  });
}

function collectInstructionOverrideFields(request: InspectableInputRequest): readonly InstructionOverrideTextField[] {
  return inputFieldKeys.flatMap((key) => collectTextFieldsForValue(key, request[key]));
}

function collectTextFieldsForValue(field: string, value: unknown): readonly InstructionOverrideTextField[] {
  if (typeof value === "string") {
    return value.trim().length > 0 ? [{ field, value }] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectTextFieldsForValue(`${field}[${index}]`, entry));
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, entryValue]) =>
      collectTextFieldsForValue(`${field}.${key}`, entryValue)
    );
  }

  return [];
}

function toInstructionOverrideVerdict(
  events: readonly InstructionOverrideAttemptEvent[]
): InstructionOverrideAttemptVerdict {
  if (events.length === 0) {
    return {
      status: "clear",
      blocking: false,
      confidence: null,
      rationaleCategories: [],
      events: []
    };
  }

  const highestConfidence = selectHighestConfidence(events.map((event) => event.confidence));
  const hasBlockingEvent = events.some((event) => event.blocking && event.confidence === "high");
  const hasHighConfidenceEvent = events.some((event) => event.confidence === "high");

  return {
    status: hasBlockingEvent
      ? "block"
      : hasHighConfidenceEvent
        ? "quarantine"
        : "observe",
    blocking: hasBlockingEvent || hasHighConfidenceEvent,
    confidence: highestConfidence,
    rationaleCategories: dedupeStrings(events.map((event) => event.rationaleCategory)),
    events
  };
}

function selectHighestConfidence(
  confidences: readonly InstructionOverrideAttemptConfidence[]
): InstructionOverrideAttemptConfidence {
  if (confidences.includes("high")) {
    return "high";
  }

  if (confidences.includes("medium")) {
    return "medium";
  }

  return "low";
}
