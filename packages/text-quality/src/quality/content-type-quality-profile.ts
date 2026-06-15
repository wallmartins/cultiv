import type { PipelineRequest } from "@my-ai-orchestrator/contracts";

export interface ContentTypeQualityProfile {
  readonly criticWeight: number;
  readonly fidelityWeight: number;
  readonly driftWeight: number;
  readonly lexicalGateMode: "off" | "penalize" | "reroll" | "strict";
}

const DEFAULT_PROFILE: ContentTypeQualityProfile = {
  criticWeight: 0.3,
  fidelityWeight: 0.4,
  driftWeight: 0.25,
  lexicalGateMode: "penalize"
};

const PROFILES: ReadonlyArray<{
  readonly match: (formatName: string) => boolean;
  readonly profile: ContentTypeQualityProfile;
}> = [
  {
    match: (name) => name.includes("linkedin"),
    profile: {
      criticWeight: 0.45,
      fidelityWeight: 0.25,
      driftWeight: 0.25,
      lexicalGateMode: "reroll"
    }
  },
  {
    match: (name) => name.includes("thread") || name.includes("twitter"),
    profile: {
      criticWeight: 0.45,
      fidelityWeight: 0.25,
      driftWeight: 0.25,
      lexicalGateMode: "reroll"
    }
  },
  {
    match: (name) => name.includes("newsletter"),
    profile: {
      criticWeight: 0.35,
      fidelityWeight: 0.35,
      driftWeight: 0.25,
      lexicalGateMode: "reroll"
    }
  },
  {
    match: (name) => name.includes("architecture") || name.includes("validation"),
    profile: {
      criticWeight: 0.3,
      fidelityWeight: 0.45,
      driftWeight: 0.2,
      lexicalGateMode: "penalize"
    }
  },
  {
    match: (name) => name.includes("blog"),
    profile: {
      criticWeight: 0.32,
      fidelityWeight: 0.4,
      driftWeight: 0.23,
      lexicalGateMode: "penalize"
    }
  }
];

export function resolveContentTypeQualityProfile(
  request: PipelineRequest | { readonly pipeline?: { readonly name?: string }; readonly contentType?: string }
): ContentTypeQualityProfile {
  const formatName = resolveFormatName(request).toLowerCase();
  const match = PROFILES.find((entry) => entry.match(formatName));
  return match?.profile ?? DEFAULT_PROFILE;
}

function resolveFormatName(
  request: PipelineRequest | { readonly pipeline?: { readonly name?: string }; readonly contentType?: string }
): string {
  if ("pipeline" in request && request.pipeline && typeof request.pipeline.name === "string") {
    return request.pipeline.name;
  }

  if ("contentType" in request && typeof request.contentType === "string") {
    return request.contentType;
  }

  return "";
}
