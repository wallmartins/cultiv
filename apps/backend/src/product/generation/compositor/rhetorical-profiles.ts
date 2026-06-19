import type { GenerationIntent } from "@my-ai-orchestrator/contracts";

export type RhetoricalGoalClass =
  | "share"
  | "explain"
  | "engage"
  | "story"
  | "update"
  | "document";

export interface RhetoricalProfile {
  readonly goalClass: RhetoricalGoalClass;
  readonly promptPackId: string;
  readonly structureStep?: "structure";
}

const RHETORICAL_PROFILES: Record<GenerationIntent, RhetoricalProfile> = {
  "share-idea": { goalClass: "share", promptPackId: "share-idea" },
  "explain-deeply": { goalClass: "explain", promptPackId: "explain-deeply" },
  "engage-audience": { goalClass: "engage", promptPackId: "engage-audience" },
  "tell-story": { goalClass: "story", promptPackId: "tell-story" },
  "update-subscribers": { goalClass: "update", promptPackId: "update-subscribers" },
  "document-decision": {
    goalClass: "document",
    promptPackId: "document-decision",
    structureStep: "structure"
  }
};

export function getRhetoricalProfile(intent: GenerationIntent): RhetoricalProfile {
  return RHETORICAL_PROFILES[intent];
}
