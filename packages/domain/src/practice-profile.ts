import type {
  EnrichmentSuggestionRecord,
  PracticeDimensionKey,
  PracticeDimensions,
  PracticeProfileDepth
} from "@my-ai-orchestrator/contracts";
import type { Entity } from "./core.js";

export interface PracticeProfile extends Entity<string> {
  readonly userId: string;
  readonly version: number;
  readonly depth: PracticeProfileDepth;
  readonly subject: string;
  readonly vantagePoint: string;
  readonly audiences: readonly string[];
  readonly dimensions: PracticeDimensions;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PracticeProfileDiagnostics extends Entity<string> {
  readonly userId: string;
  readonly activeVersion: number;
  readonly pendingVersion?: number;
  readonly updating: boolean;
  readonly summary?: string;
  readonly enrichmentSuggestions?: Readonly<Partial<Record<PracticeDimensionKey, EnrichmentSuggestionRecord>>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function createPracticeProfile(profile: PracticeProfile): PracticeProfile {
  return profile;
}

export function createPracticeProfileDiagnostics(
  diagnostics: PracticeProfileDiagnostics
): PracticeProfileDiagnostics {
  return diagnostics;
}
