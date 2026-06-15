import { Effect } from "effect";
import type { DatabaseClient, VoiceExampleRecord } from "@my-ai-orchestrator/database";
import type {
  ContributionCode,
  VoiceExampleCreateInput
} from "@my-ai-orchestrator/contracts";
import { VoiceExampleValidationError, VoicePinnedLimitExceededError, type VoiceExample, type VoiceExampleDraft } from "@my-ai-orchestrator/domain";

export function normalizeOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function buildExampleId(userId: string, nextIndex: number): string {
  return `voice-example:${userId}:${nextIndex}`;
}

export function validateVoiceExampleInput(input: VoiceExampleCreateInput) {
  if (input.text.trim().length === 0) {
    return Effect.fail(
      new VoiceExampleValidationError({
        reasonCode: "invalid_example_payload",
        field: "text",
        message: "Voice example text cannot be empty"
      })
    );
  }

  return Effect.succeed(undefined);
}

export function resolveContentTypeHints(
  explicitContentType?: string,
  channel?: string
): readonly string[] {
  const hints = new Set<string>();
  if (explicitContentType) {
    hints.add(explicitContentType);
  }
  if (channel === "linkedin") {
    hints.add("linkedin-post");
  }
  if (channel === "newsletter") {
    hints.add("newsletter");
  }
  if (channel === "blog") {
    hints.add("long-form-blog");
  }
  return [...hints];
}

export function buildInitialEvaluation(args: {
  readonly text: string;
  readonly explicitContentType?: string;
  readonly channel?: string;
  readonly pinned: boolean;
  readonly state?: "active" | "excluded";
}) {
  const tooShort = args.text.trim().length < 80;
  const state = args.state ?? "active";
  const contributionCode = resolveContributionCode(args);

  return {
    systemWeight: args.pinned ? 1 : tooShort ? 0.35 : 0.6,
    attentionLevel: resolveAttentionLevel(tooShort, state),
    attentionReasonCodes: [],
    contributionCode,
    contributionPreview: resolveContributionPreview(contributionCode),
    userPinned: args.pinned
  };
}

export function resolveAttentionLevel(
  tooShort: boolean,
  state: "active" | "excluded"
): "low" | "medium" | "high" {
  if (state === "excluded") {
    return "high";
  }

  if (tooShort) {
    return "medium";
  }

  return "low";
}

export function enforcePinnedLimits(
  examples: readonly VoiceExampleRecord[],
  userId: string,
  requestedPinned: boolean,
  explicitContentType?: string
) {
  if (!requestedPinned) {
    return Effect.succeed(undefined);
  }

  const activeExamples = examples.filter((example) => example.state === "active");
  const nextPinnedCount = activeExamples.filter((example) => example.pinned).length + 1;
  const pinnedLimit = resolvePinnedLimit(activeExamples.length + 1);

  if (nextPinnedCount > pinnedLimit) {
    return Effect.fail(
      new VoicePinnedLimitExceededError({
        userId,
        attemptedPinnedCount: nextPinnedCount,
        pinnedLimit
      })
    );
  }

  if ((activeExamples.length + 1) >= 15 && explicitContentType) {
    const sameContentTypePinnedCount = activeExamples.filter(
      (example) =>
        example.pinned &&
        (example.explicitContentType === explicitContentType ||
          example.effectiveContentTypeHints.includes(explicitContentType))
    ).length;

    if (sameContentTypePinnedCount >= 2) {
      return Effect.fail(
        new VoicePinnedLimitExceededError({
          userId,
          attemptedPinnedCount: sameContentTypePinnedCount + 1,
          pinnedLimit: 2
        })
      );
    }
  }

  return Effect.succeed(undefined);
}

export function resolvePinnedLimit(totalExamples: number): number {
  if (totalExamples >= 15) {
    return 5;
  }

  if (totalExamples >= 10) {
    return 4;
  }

  if (totalExamples >= 5) {
    return 2;
  }

  return 1;
}

export function resolveTargetProfileVersion(database: DatabaseClient, userId: string) {
  return Effect.gen(function* () {
    const diagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);
    if (diagnostics?.pendingVersion) {
      return diagnostics.pendingVersion;
    }

    if (diagnostics) {
      return diagnostics.activeVersion + 1;
    }

    const profile = yield* database.voiceProfiles.getByUser(userId);
    if (profile) {
      return profile.profileVersion + 1;
    }

    return 1;
  });
}

export function toVoiceExampleDraft(input: VoiceExampleCreateInput): VoiceExampleDraft {
  return {
    text: input.text,
    language: input.language,
    channel: input.channel,
    format: input.format,
    explicitContentType: input.explicitContentType,
    context: input.context,
    antiPatternsExplicit: input.antiPatternsExplicit,
    userLabels: input.userLabels,
    pinned: input.pinned,
    performance: input.performance
      ? {
          channel: input.performance.channel,
          publishedAt: input.performance.publishedAt,
          selfRating: input.performance.selfRating,
          likes: input.performance.likes,
          comments: input.performance.comments
        }
      : undefined
  };
}

function resolveContributionCode(example: {
  readonly explicitContentType?: string;
  readonly channel?: string;
  readonly text: string;
}): ContributionCode {
  if (example.explicitContentType === "linkedin-post" || example.channel === "linkedin") {
    return "useful_for_linkedin";
  }

  if (example.explicitContentType === "newsletter" || example.channel === "newsletter") {
    return "useful_for_newsletter";
  }

  if (example.explicitContentType === "long-form-blog" || example.channel === "blog") {
    return "useful_for_blog";
  }

  if (/\b(eu|minha|minhas|meu|meus)\b/i.test(example.text)) {
    return "supports_first_person_voice";
  }

  return "reinforces_informal_tone";
}

function resolveContributionPreview(code: ContributionCode): string {
  switch (code) {
    case "useful_for_linkedin":
      return "Útil para LinkedIn.";
    case "useful_for_newsletter":
      return "Útil para newsletter.";
    case "useful_for_blog":
      return "Útil para blog.";
    case "supports_first_person_voice":
      return "Sustenta escrita em primeira pessoa.";
    case "reinforces_formal_tone":
      return "Reforça um tom mais formal.";
    case "redundant_with_recent_examples":
      return "Redundante em relação a exemplos recentes.";
    case "signals_negative_pattern":
      return "Sinaliza um padrão a evitar.";
    default:
      return "Reforça um tom mais informal.";
  }
}
