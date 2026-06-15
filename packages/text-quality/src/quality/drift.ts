import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import type { VoiceDriftResult, VoiceProfile } from "../types.js";
import { countWords, resolveOutputWordTarget } from "../format/output-length.js";

export function evaluateVoiceDrift(profile: VoiceProfile, candidate: string, request?: PipelineRequest): VoiceDriftResult {
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

  if (profile.examples.length > 0 && lacksExampleCadence(profile, candidate)) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function missingStyleMarkers(profile: VoiceProfile, candidate: string): readonly string[] {
  const lower = candidate.toLowerCase();
  return profile.styleMarkers.filter((marker) => !lower.includes(marker.toLowerCase()));
}

function lacksExampleCadence(profile: VoiceProfile, candidate: string): boolean {
  const candidateLength = averageSentenceLength(candidate);
  const exampleLengths = profile.examples
    .map((example) => averageSentenceLength(example))
    .filter((value) => value > 0);

  if (exampleLengths.length === 0) {
    return false;
  }

  const averageExampleLength = exampleLengths.reduce((total, value) => total + value, 0) / exampleLengths.length;
  return Math.abs(candidateLength - averageExampleLength) > 18;
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
