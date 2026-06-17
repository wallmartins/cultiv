import { evaluateReasoningDrift } from "./reasoning-drift.js";
import type { CoreReasoningSignature } from "@my-ai-orchestrator/contracts";
import type { CriticFinding } from "../types.js";

export function collectReasoningFindings(
  core: CoreReasoningSignature,
  text: string,
  stepName?: string
): readonly CriticFinding[] {
  const drift = evaluateReasoningDrift(core, text, stepName);
  const findings: CriticFinding[] = [];

  for (const note of drift.notes) {
    findings.push(mapReasoningDriftNoteToFinding(note));
  }

  if (drift.score < 70 && drift.notes.length === 0) {
    findings.push({
      type: "generic",
      severity: "medium",
      message: "Reasoning drift detected"
    });
  }

  return findings;
}

function mapReasoningDriftNoteToFinding(note: string): CriticFinding {
  const normalized = note.toLowerCase();

  if (normalized.includes("conclusion")) {
    return {
      type: "premature_conclusion",
      severity: "high",
      message: note
    };
  }

  if (
    normalized.includes("absolutist")
    || normalized.includes("hedges excessively")
    || normalized.includes("guru-style")
  ) {
    return {
      type: "excess_certainty",
      severity: "medium",
      message: note
    };
  }

  if (normalized.includes("rhetorical inflation")) {
    return {
      type: "rhetorical_inflation",
      severity: "medium",
      message: note
    };
  }

  return {
    type: "generic",
    severity: "medium",
    message: note
  };
}
