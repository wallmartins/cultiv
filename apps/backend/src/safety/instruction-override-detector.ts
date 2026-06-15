import { Effect } from "effect";
import { BackendInstructionOverrideDetectorFailureError } from "../http/errors.js";
import type {
  BackendInstructionOverrideDetector,
  InstructionOverrideAttemptConfidence,
  InstructionOverrideAttemptEvent,
  InstructionOverrideRationaleCategory
} from "./instruction-override-types.js";

interface HeuristicRule {
  readonly rationaleCategory: InstructionOverrideRationaleCategory;
  readonly confidence: InstructionOverrideAttemptConfidence;
  readonly blocking: boolean;
  readonly pattern: RegExp;
}

const detectorId = "instruction-override-classifier";

const heuristicRules: readonly HeuristicRule[] = [
  {
    rationaleCategory: "prompt_exfiltration",
    confidence: "high",
    blocking: true,
    pattern: /\b(reveal|show|print|dump|return|expose)\b[\s\S]{0,80}\b(system prompt|developer message|hidden instructions?)\b/i
  },
  {
    rationaleCategory: "role_escalation",
    confidence: "high",
    blocking: true,
    pattern: /\b(you are now|act as|switch to)\b[\s\S]{0,40}\b(system|developer|admin|root)\b/i
  },
  {
    rationaleCategory: "ignore_previous_instructions",
    confidence: "high",
    blocking: false,
    pattern: /\b(ignore|disregard|override|forget)\b[\s\S]{0,50}\b(previous|prior|above)\b[\s\S]{0,40}\b(instructions?|rules?)\b/i
  },
  {
    rationaleCategory: "ignore_previous_instructions",
    confidence: "high",
    blocking: false,
    pattern: /\b(ignor[ae]|esque[cç]a|desconsider[ae])\b[\s\S]{0,50}\b(instru[cç][oõ]es?|regras?)\b[\s\S]{0,40}\b(anteriores?|pr[eé]vias?|acima)\b/i
  },
  {
    rationaleCategory: "prompt_exfiltration",
    confidence: "high",
    blocking: true,
    pattern: /\b(revele?|mostre|exiba|imprima|retorne)\b[\s\S]{0,80}\b(prompt do sistema|instru[cç][oõ]es? ocultas?|mensagem do desenvolvedor)\b/i
  },
  {
    rationaleCategory: "role_escalation",
    confidence: "high",
    blocking: true,
    pattern: /\b(voc[eê] agora [eé]|aja como|mude para)\b[\s\S]{0,40}\b(sistema|desenvolvedor|admin|root)\b/i
  },
  {
    rationaleCategory: "policy_bypass_request",
    confidence: "high",
    blocking: false,
    pattern: /\b(bypass|disable|turn off)\b[\s\S]{0,40}\b(safety|guardrails?|policy|filters?)\b/i
  },
  {
    rationaleCategory: "system_prompt_reference",
    confidence: "low",
    blocking: false,
    pattern: /\bsystem prompt\b/i
  },
  {
    rationaleCategory: "developer_message_reference",
    confidence: "low",
    blocking: false,
    pattern: /\bdeveloper message\b/i
  }
] as const;

export function createHeuristicInstructionOverrideDetector(
  options: {
    readonly shouldFail?: boolean;
    readonly failureMessage?: string;
    readonly criticalFailure?: boolean;
  } = {}
): BackendInstructionOverrideDetector {
  return {
    detect(args) {
      if (options.shouldFail) {
        return Effect.fail(
          new BackendInstructionOverrideDetectorFailureError({
            boundary: args.boundary,
            detectorId,
            critical: options.criticalFailure ?? true,
            message: options.failureMessage ?? "Instruction override detector is unavailable"
          })
        );
      }

      return Effect.succeed(
        args.fields.flatMap((field) => detectField(field.field, field.value))
      );
    }
  };
}

function detectField(field: string, value: string): readonly InstructionOverrideAttemptEvent[] {
  return heuristicRules.flatMap((rule) =>
    rule.pattern.test(value)
      ? [
          {
            detectorId,
            field,
            confidence: rule.confidence,
            rationaleCategory: rule.rationaleCategory,
            blocking: rule.blocking
          } satisfies InstructionOverrideAttemptEvent
        ]
      : []
  );
}
