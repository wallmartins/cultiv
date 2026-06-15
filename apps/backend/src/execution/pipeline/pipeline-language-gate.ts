import { Effect } from "effect";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import { resolveLanguageProfile } from "@my-ai-orchestrator/skills";

export function evaluateLanguageGate(
  content: string,
  explicitLanguage: string | undefined,
  plan: OrchestrationPlan
) {
  return Effect.gen(function* () {
    const profile = yield* resolveLanguageProfile({
      explicit: explicitLanguage,
      contentType: plan.contentType.id,
      sample: content,
      defaultCode: plan.request.language
    });

    const normalizedContent = content.toLowerCase();
    const errors: Array<{ readonly type: string; readonly details?: Record<string, unknown> }> = [];
    const warnings: Array<{ readonly type: string; readonly details?: Record<string, unknown> }> = [];

    for (const forbiddenPattern of profile.contracts.forbiddenPatterns) {
      if (normalizedContent.includes(forbiddenPattern.toLowerCase())) {
        errors.push({
          type: "forbidden-pattern",
          details: { pattern: forbiddenPattern, language: profile.code }
        });
      }
    }

    for (const marker of profile.contracts.requiredMarkers) {
      if (!normalizedContent.includes(marker.toLowerCase())) {
        warnings.push({
          type: "required-marker-missing",
          details: { marker, language: profile.code }
        });
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings
    };
  });
}
