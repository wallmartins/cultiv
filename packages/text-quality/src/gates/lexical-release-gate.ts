import type { DomainProfile } from "../domain/domain-classifier.js";
import { evaluateLexicalQuality } from "../quality/lexical-quality.js";
import type { ContentTypeQualityProfile } from "../quality/content-type-quality-profile.js";

export type LexicalGateDecision = "pass" | "reject";

export interface LexicalReleaseGateResult {
  readonly decision: LexicalGateDecision;
  readonly reasons: readonly string[];
}

export function authorizeLexicalOutput(input: {
  readonly text: string;
  readonly domain: DomainProfile;
  readonly profile: ContentTypeQualityProfile;
  readonly hookText?: string;
  readonly lexicalQualityV2: boolean;
}): LexicalReleaseGateResult {
  if (!input.lexicalQualityV2 || input.profile.lexicalGateMode === "off") {
    return { decision: "pass", reasons: [] };
  }

  const evaluation = evaluateLexicalQuality(input.text, input.domain, input.hookText);
  if (evaluation.findings.length === 0) {
    return { decision: "pass", reasons: [] };
  }

  if (input.profile.lexicalGateMode === "penalize") {
    return { decision: "pass", reasons: evaluation.findings };
  }

  const hardReject =
    (input.domain.domain === "non-technical" && evaluation.metrics.techTermHits > 0)
    || evaluation.metrics.topTermConcentration > 0.14
    || evaluation.metrics.spacedLemmaRepeats >= 2
    || evaluation.metrics.emDashCount > 0;

  return {
    decision: hardReject ? "reject" : "pass",
    reasons: evaluation.findings
  };
}
