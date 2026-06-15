import { Effect } from "effect";
import type { BackendInstructionOverrideDetectorFailureError } from "../http/errors.js";

export type InstructionOverrideAttemptConfidence = "low" | "medium" | "high";

export type InstructionOverrideRationaleCategory =
  | "ignore_previous_instructions"
  | "system_prompt_reference"
  | "developer_message_reference"
  | "role_escalation"
  | "prompt_exfiltration"
  | "policy_bypass_request";

export type InstructionOverrideVerdictStatus = "clear" | "observe" | "quarantine" | "block";

export interface InstructionOverrideTextField {
  readonly field: string;
  readonly value: string;
}

export interface InstructionOverrideAttemptEvent {
  readonly detectorId: string;
  readonly field: string;
  readonly confidence: InstructionOverrideAttemptConfidence;
  readonly rationaleCategory: InstructionOverrideRationaleCategory;
  readonly blocking: boolean;
}

export interface InstructionOverrideAttemptVerdict {
  readonly status: InstructionOverrideVerdictStatus;
  readonly blocking: boolean;
  readonly confidence: InstructionOverrideAttemptConfidence | null;
  readonly rationaleCategories: readonly InstructionOverrideRationaleCategory[];
  readonly events: readonly InstructionOverrideAttemptEvent[];
}

export interface BackendInstructionOverrideDetector {
  readonly detect: (args: {
    readonly boundary: "preview" | "generation";
    readonly fields: readonly InstructionOverrideTextField[];
  }) => Effect.Effect<
    readonly InstructionOverrideAttemptEvent[],
    BackendInstructionOverrideDetectorFailureError
  >;
}
