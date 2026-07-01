import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import type { VoiceDriftResult, VoiceProfile } from "../types.js";
import { countWords, resolveOutputWordTarget } from "../format/output-length.js";
import { evaluateReasoningDrift } from "./reasoning-drift.js";
import { evaluateArgumentDevelopmentDrift } from "./development-drift.js";

export function evaluateVoiceDrift(profile: VoiceProfile, candidate: string, request?: PipelineRequest, stepName?: string): VoiceDriftResult {
  const surface = scoreSurfaceDrift(profile, candidate, request);

  if (!profile.coreReasoningSignature && !profile.argumentDevelopmentSignature) {
    return surface;
  }

  const reasoning = profile.coreReasoningSignature
    ? evaluateReasoningDrift(profile.coreReasoningSignature, candidate, stepName)
    : { score: 100, notes: [] as string[] };
  const development = profile.argumentDevelopmentSignature
    ? evaluateArgumentDevelopmentDrift(
        profile.argumentDevelopmentSignature,
        candidate,
        stepName,
        profile.quantitativeSignals
      )
    : { score: 100, notes: [] as string[] };

  let score: number;
  if (profile.coreReasoningSignature && profile.argumentDevelopmentSignature) {
    score = Math.round(surface.score * 0.4 + reasoning.score * 0.3 + development.score * 0.3);
  } else if (profile.coreReasoningSignature) {
    score = Math.round(surface.score * 0.55 + reasoning.score * 0.45);
  } else {
    score = Math.round(surface.score * 0.55 + development.score * 0.45);
  }

  return {
    score,
    notes: [...surface.notes, ...reasoning.notes, ...development.notes],
    surfaceScore: surface.score,
    reasoningScore: reasoning.score,
    developmentScore: development.score
  };
}

function scoreSurfaceDrift(profile: VoiceProfile, candidate: string, request?: PipelineRequest): VoiceDriftResult {
  const score = scoreDrift(profile, candidate, request);
  const notes: string[] = [];

  if (score < 70) {
    notes.push("Voice drift is above acceptable threshold");
  }
  if (profile.styleMarkers.length > 0 && missingStyleMarkers(profile, candidate).length > 0) {
    notes.push(`Missing style markers: ${missingStyleMarkers(profile, candidate).join(", ")}`);
  }
  if (profile.antiPatterns.some((pattern) => candidate.toLowerCase().includes(pattern.toLowerCase()))) {
    notes.push("Candidate contains voice anti-patterns");
  }

  return {
    score,
    notes
  };
}

function scoreDrift(profile: VoiceProfile, candidate: string, request?: PipelineRequest): number {
  const lower = candidate.toLowerCase();
  let score = 100;

  if (profile.antiPatterns.some((pattern) => lower.includes(pattern.toLowerCase()))) {
    score -= 20;
  }

  if (profile.constraints.some((constraint) => lower.includes(constraint.toLowerCase()))) {
    score += 5;
  }

  if (request) {
    const target = resolveOutputWordTarget(request);
    const wordCount = countWords(candidate);
    if (wordCount < target.minWords) {
      score -= Math.min(25, Math.round(((target.minWords - wordCount) / target.minWords) * 30));
    } else if (wordCount > target.maxWords) {
      score -= Math.min(20, Math.round(((wordCount - target.maxWords) / target.maxWords) * 25));
    }
  }

  const markerMisses = missingStyleMarkers(profile, candidate).length;
  if (markerMisses > 0) {
    score -= Math.min(20, markerMisses * 5);
  }

  if (profile.quantitativeSignals && lacksQuantitativeCadence(profile, candidate)) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function missingStyleMarkers(profile: VoiceProfile, candidate: string): readonly string[] {
  const lower = candidate.toLowerCase();
  return profile.styleMarkers.filter((marker) => !lower.includes(marker.toLowerCase()));
}

function lacksQuantitativeCadence(profile: VoiceProfile, candidate: string): boolean {
  const target = profile.quantitativeSignals?.aggregate.avgSentenceLength;
  if (target === undefined || target <= 0) {
    return false;
  }

  const candidateLength = averageSentenceLength(candidate);
  return Math.abs(candidateLength - target) > target * 0.25;
}

function averageSentenceLength(text: string): number {
  const sentences = text
    .split(/[.!?]+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  if (sentences.length === 0) {
    return 0;
  }

  return sentences.reduce((total, sentence) => total + sentence.length, 0) / sentences.length;
}
