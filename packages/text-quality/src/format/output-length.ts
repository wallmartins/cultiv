import type { GenerationChannel, GenerationLengthTier, PipelineRequest } from "@my-ai-orchestrator/contracts";
import {
  describeOutputWordTarget,
  fromIntentWordTarget,
  resolveEffectiveWordTarget,
  resolveOutputWordTargetForFormatName,
  type IntentWordTarget,
  type OutputWordTarget
} from "./word-targets.js";

export type { OutputWordTarget, IntentWordTarget } from "./word-targets.js";
export {
  describeOutputWordTarget,
  formatIntentWordTargetLine,
  fromIntentWordTarget,
  resolveEffectiveWordTarget,
  resolveOutputWordTargetForFormatName,
  toIntentWordTarget
} from "./word-targets.js";

interface FormatResolvableRequest {
  readonly contentType?: string;
  readonly pipelineType?: string;
  readonly pipeline?: {
    readonly name?: string;
  };
  readonly context?: Readonly<Record<string, unknown>>;
  readonly inputs?: Readonly<Record<string, unknown>>;
}

export function resolveOutputWordTarget(
  request: PipelineRequest | FormatResolvableRequest
): OutputWordTarget {
  const explicit = readExplicitWordTarget(request);
  if (explicit) {
    return explicit;
  }

  const contentType = resolveFormatName(request);
  const lengthTier = readLengthTier(request);
  const channel = readChannel(request);

  if (contentType && lengthTier) {
    return resolveEffectiveWordTarget({
      contentType,
      lengthTier,
      channel
    });
  }

  return resolveOutputWordTargetForFormatName(contentType);
}

export function countWords(text: string): number {
  const normalized = text.trim();
  if (normalized.length === 0) {
    return 0;
  }

  return normalized.split(/\s+/u).length;
}

function readExplicitWordTarget(
  request: PipelineRequest | FormatResolvableRequest
): OutputWordTarget | undefined {
  const candidates = [
    readWordTargetRecord(request),
    readNestedWordTarget((request as FormatResolvableRequest).context),
    readNestedWordTarget((request as FormatResolvableRequest).inputs),
    readCompositorWordTarget((request as FormatResolvableRequest).context),
    readCompositorWordTarget((request as FormatResolvableRequest).inputs)
  ];

  for (const candidate of candidates) {
    if (candidate) {
      return candidate;
    }
  }

  return undefined;
}

function readWordTargetRecord(
  request: PipelineRequest | FormatResolvableRequest
): OutputWordTarget | undefined {
  const direct = (request as FormatResolvableRequest).context?.wordTarget
    ?? (request as FormatResolvableRequest).inputs?.wordTarget;

  return normalizeWordTarget(direct);
}

function readNestedWordTarget(source?: Readonly<Record<string, unknown>>): OutputWordTarget | undefined {
  if (!source) {
    return undefined;
  }

  return normalizeWordTarget(source.wordTarget);
}

function readCompositorWordTarget(source?: Readonly<Record<string, unknown>>): OutputWordTarget | undefined {
  if (!source || typeof source.compositor !== "object" || source.compositor === null) {
    return undefined;
  }

  return normalizeWordTarget((source.compositor as Record<string, unknown>).wordTarget);
}

function normalizeWordTarget(value: unknown): OutputWordTarget | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.min === "number" && typeof record.max === "number") {
    return fromIntentWordTarget({ min: record.min, max: record.max });
  }

  if (typeof record.minWords === "number" && typeof record.maxWords === "number") {
    const idealWords =
      typeof record.idealWords === "number"
        ? record.idealWords
        : Math.round((record.minWords + record.maxWords) / 2);
    return {
      minWords: record.minWords,
      maxWords: record.maxWords,
      idealWords
    };
  }

  return undefined;
}

function readLengthTier(
  request: PipelineRequest | FormatResolvableRequest
): GenerationLengthTier | undefined {
  const sources = [
    (request as FormatResolvableRequest).context,
    (request as FormatResolvableRequest).inputs
  ];

  for (const source of sources) {
    if (!source) {
      continue;
    }

    const direct = source.lengthTier;
    if (direct === "short" || direct === "medium" || direct === "long") {
      return direct;
    }

    if (typeof source.compositor === "object" && source.compositor !== null) {
      const tier = (source.compositor as Record<string, unknown>).lengthTier;
      if (tier === "short" || tier === "medium" || tier === "long") {
        return tier;
      }
    }
  }

  return undefined;
}

function readChannel(
  request: PipelineRequest | FormatResolvableRequest
): GenerationChannel | undefined {
  const sources = [
    (request as FormatResolvableRequest).context,
    (request as FormatResolvableRequest).inputs
  ];

  for (const source of sources) {
    if (!source) {
      continue;
    }

    const direct = source.generationChannel ?? source.channel;
    if (
      direct === "unspecified"
      || direct === "professional-network"
      || direct === "blog"
      || direct === "email"
      || direct === "social"
    ) {
      return direct;
    }
  }

  return undefined;
}

function resolveFormatName(request: PipelineRequest | FormatResolvableRequest): string {
  if ("pipeline" in request && request.pipeline && typeof request.pipeline.name === "string") {
    return request.pipeline.name;
  }

  if ("contentType" in request && typeof request.contentType === "string") {
    return request.contentType;
  }

  if ("pipelineType" in request && typeof request.pipelineType === "string") {
    return request.pipelineType;
  }

  const contextContentType =
    (request as FormatResolvableRequest).context?.contentType
    ?? (request as FormatResolvableRequest).inputs?.contentType;
  if (typeof contextContentType === "string") {
    return contextContentType;
  }

  return "";
}
