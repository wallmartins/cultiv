import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import type { CriticFinding, CriticResult, VoiceProfile } from "../types.js";
import { countWords, resolveOutputWordTarget } from "../format/output-length.js";
import {
  collectReadabilityFindings,
  resolveReadabilityLimits
} from "./readability-guardrails.js";
import {
  collectReasoningFindings
} from "./reasoning-critic.js";
import { collectDevelopmentFindings } from "./development-critic.js";
import { collectMetaphorFindings } from "./metaphor-critic.js";
import { containsEmDash } from "./em-dash.js";
import { evaluateLexicalQuality } from "./lexical-quality.js";

export interface CriticEvaluationOptions {
  readonly hookText?: string;
  readonly lexicalQualityV2?: boolean;
  readonly stepName?: string;
}

export function criticizeText(
  text: string,
  voiceProfile?: VoiceProfile,
  request?: PipelineRequest,
  options?: CriticEvaluationOptions
): CriticResult {
  const normalized = text.trim().toLowerCase();
  const findings: CriticFinding[] = [];

  if (normalized.length === 0) {
    findings.push({
      type: "generic",
      severity: "high",
      message: "Empty candidate text"
    });
  }

  if (looksPerformative(normalized)) {
    findings.push({
      type: "performative",
      severity: "medium",
      message: "Text sounds like a generic LLM response"
    });
  }

  if (hasClicheLanguage(normalized)) {
    findings.push({
      type: "cliche",
      severity: "medium",
      message: "Text contains obvious cliches"
    });
  }

  if (hasAdjacentRedundantRepetition(normalized)) {
    findings.push({
      type: "redundant",
      severity: "medium",
      message: "Text repeats the same word in adjacent positions"
    });
  }

  if (options?.lexicalQualityV2) {
    const lexical = evaluateLexicalQuality(text, options.hookText);
    for (const message of lexical.findings) {
      findings.push({
        type: "redundant",
        severity: "medium",
        message
      });
    }
  } else if (hasLegacyRedundantRepetition(normalized)) {
    findings.push({
      type: "redundant",
      severity: "low",
      message: "Text repeats the same pattern too often"
    });
  }

  if (hasLegacyLlmTics(normalized)) {
    findings.push({
      type: "llmish",
      severity: "high",
      message: "Text contains legacy LLM tics the new flow should avoid"
    });
  }

  if (hasMetaCommentary(normalized)) {
    findings.push({
      type: "llmish",
      severity: "high",
      message: "Text talks about the writing process instead of being the final content"
    });
  }

  if (voiceProfile?.coreReasoningSignature) {
    findings.push(
      ...collectReasoningFindings(voiceProfile.coreReasoningSignature, text, options?.stepName)
    );
  }

  if (voiceProfile?.argumentDevelopmentSignature) {
    findings.push(
      ...collectDevelopmentFindings(voiceProfile.argumentDevelopmentSignature, text, options?.stepName)
    );
  }

  if (voiceProfile?.metaphorSignature) {
    findings.push(...collectMetaphorFindings(voiceProfile.metaphorSignature, text));
  }

  if (containsEmDash(text)) {
    findings.push({
      type: "llmish",
      severity: "medium",
      message: "Text uses em dashes instead of commas or periods"
    });
  }

  if (request) {
    const target = resolveOutputWordTarget(request);
    const wordCount = countWords(text);
    if (wordCount < target.minWords) {
      findings.push({
        type: "generic",
        severity: wordCount < Math.round(target.minWords * 0.6) ? "high" : "medium",
        message: `Text is too short for the requested format (${wordCount} words, expected at least ${target.minWords})`
      });
    } else if (wordCount > target.maxWords) {
      findings.push({
        type: "redundant",
        severity: wordCount > Math.round(target.maxWords * 1.1) ? "high" : "medium",
        message: `Text is too long for the requested format (${wordCount} words, expected at most ${target.maxWords})`
      });
    }

    if (voiceProfile) {
      for (const finding of collectReadabilityFindings(
        text,
        resolveReadabilityLimits({
          target,
          quantitativeSignals: voiceProfile.quantitativeSignals
        })
      )) {
        findings.push({
          type: "redundant",
          severity: finding.severity,
          message: finding.message
        });
      }
    }
  }

  if (voiceProfile && driftsFromVoiceMarkers(normalized, voiceProfile)) {
    findings.push({
      type: "generic",
      severity: "medium",
      message: "Text ignores the user's voice markers and examples"
    });
  }

  if (voiceProfile && containsExplicitAntiPatterns(normalized, voiceProfile)) {
    findings.push({
      type: "llmish",
      severity: "high",
      message: "Text contains patterns the user explicitly rejected"
    });
  }

  const score = Math.max(0, 100 - findings.reduce((total, finding) => total + severityPenalty(finding.severity), 0));

  return {
    findings,
    score
  };
}

function looksPerformative(text: string): boolean {
  return /as an ai|como uma ia|i cannot|nao posso|sou um modelo/u.test(text);
}

function hasClicheLanguage(text: string): boolean {
  return /revolutionary|game changer|revolucionario|inovador demais/u.test(text);
}

function hasAdjacentRedundantRepetition(text: string): boolean {
  return /(\b\w+\b)(?:\s+\1){2,}/u.test(text);
}

function hasLegacyRedundantRepetition(text: string): boolean {
  return hasAdjacentRedundantRepetition(text);
}

function hasLegacyLlmTics(text: string): boolean {
  return [
    /n[aã]o\s+[ée]\s+.+\s*[ée]\s+/u,
    /\?\s+[A-ZÀ-Ýa-zà-ý]/u,
    /\b(o problema|a solu[cç][aã]o|onde estamos)\b/u,
    /\bn[aã]o estou vendendo\b/u
  ].some((pattern) => pattern.test(text));
}

function hasMetaCommentary(text: string): boolean {
  return [
    /\b(aqui est[aá]|segue|abaixo est[aá])\b/u,
    /\b(vers[aã]o refinada|vers[aã]o revisada|texto refinado|texto revisado)\b/u,
    /\b(mantendo o rigor|mantendo a naturalidade|eliminando o ru[ií]do)\b/u,
    /\b(para o linkedin|para a newsletter|para o post|para o artigo)\b/u,
    /\b(reescrevi|refinei|ajustei|editei)\b/u,
    /\b(como post|como artigo|como newsletter),?\s+(?:segue|aqui est[aá])\b/u
  ].some((pattern) => pattern.test(text));
}

function driftsFromVoiceMarkers(text: string, voiceProfile: VoiceProfile): boolean {
  if (voiceProfile.styleMarkers.length === 0) {
    return false;
  }

  const misses = voiceProfile.styleMarkers.filter((marker) => !matchesStyleMarker(text, marker)).length;
  const antiPatternHits = voiceProfile.antiPatterns.filter((pattern) => text.includes(pattern.toLowerCase())).length;

  return misses >= Math.max(2, Math.ceil(voiceProfile.styleMarkers.length * 0.6)) || antiPatternHits > 0;
}

function matchesStyleMarker(text: string, marker: string): boolean {
  const normalized = marker.toLowerCase();
  if (normalized.includes("first-person") || normalized.includes("first person")) {
    return /\b(eu|minha|minhas|meu|meus|i|my|mine)\b/u.test(text);
  }
  if (normalized.includes("short paragraph")) {
    return text.includes("\n\n") || countSentences(text) >= 2;
  }
  if (normalized.includes("direct opening")) {
    return text.trim().length > 0 && !/^(hoje|today|neste|in this)/u.test(text.trim());
  }
  return text.includes(normalized);
}

function countSentences(text: string): number {
  return text.split(/[.!?]+/u).filter((sentence) => sentence.trim().length > 0).length;
}

function containsExplicitAntiPatterns(text: string, voiceProfile: VoiceProfile): boolean {
  if (voiceProfile.antiPatternsExplicit.length === 0) {
    return false;
  }

  return voiceProfile.antiPatternsExplicit.some((pattern) => text.includes(pattern.toLowerCase()));
}

function severityPenalty(severity: CriticFinding["severity"]): number {
  if (severity === "high") return 40;
  if (severity === "medium") return 20;
  return 8;
}
