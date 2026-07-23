import type { ArgumentDevelopmentSignature, EpistemicPosture } from "@my-ai-orchestrator/contracts";
import type { CriticFinding } from "../types.js";

const THESIS_MARKERS = [
  /\bem conclusão\b/iu,
  /\bportanto\b/iu,
  /\ba conclusão é\b/iu,
  /\bin conclusion\b/iu,
  /\bthe takeaway\b/iu
];

const ADVOCACY_MARKERS = [
  /\bvocê deve\b/iu,
  /\bo certo é\b/iu,
  /\ba única forma\b/iu,
  /\byou should\b/iu,
  /\bthe only way\b/iu
];

interface PostureCriticContext {
  readonly normalized: string;
  readonly firstThird: string;
  readonly structuralStep: boolean;
}

interface PostureCriticGuard {
  readonly matches: (context: PostureCriticContext) => boolean;
  readonly finding: CriticFinding;
}

// Keyed by development.epistemicPosture. A posture without an entry raises zero findings (neutral,
// same as today's unhandled postures) — add a posture by adding a row here, nothing else.
const POSTURE_CRITIC_GUARDS: Partial<Record<EpistemicPosture, readonly PostureCriticGuard[]>> = {
  exploratory: [
    {
      matches: ({ structuralStep, firstThird }) => structuralStep && THESIS_MARKERS.some((pattern) => pattern.test(firstThird)),
      finding: {
        type: "structural_premature_thesis",
        severity: "high",
        message: "Text defends a conclusion too early for exploratory development"
      }
    },
    {
      matches: ({ normalized }) => ADVOCACY_MARKERS.some((pattern) => pattern.test(normalized)),
      finding: {
        type: "structural_advocacy_arc",
        severity: "medium",
        message: "Text uses advocacy framing inconsistent with exploratory development"
      }
    }
  ]
};

export function collectDevelopmentFindings(
  development: ArgumentDevelopmentSignature | undefined,
  text: string,
  stepName?: string
): readonly CriticFinding[] {
  if (!development) {
    return [];
  }

  const findings: CriticFinding[] = [];
  const normalized = text.toLowerCase();
  const structuralStep = stepName === "draft" || stepName === "expand" || stepName === undefined;
  const firstThird = text.slice(0, Math.max(1, Math.floor(text.length / 3)));

  const postureContext: PostureCriticContext = { normalized, firstThird, structuralStep };
  for (const guard of POSTURE_CRITIC_GUARDS[development.epistemicPosture] ?? []) {
    if (guard.matches(postureContext)) {
      findings.push(guard.finding);
    }
  }

  for (const antiPattern of development.structuralAntiPatterns) {
    if (/premature|tese_prematura|early_thesis/.test(antiPattern) && THESIS_MARKERS.some((pattern) => pattern.test(firstThird))) {
      findings.push({
        type: "structural_anti_pattern_hit",
        severity: "high",
        message: `Structural anti-pattern detected: ${antiPattern}`
      });
    }
  }

  return findings;
}
