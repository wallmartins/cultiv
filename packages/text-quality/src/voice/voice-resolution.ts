import { Effect } from "effect";
import { VoiceProfileNotFoundError } from "../errors.js";
import { createVoiceProfile, mergeVoiceProfile } from "./voice-profile.js";
import type { TextQualityContext, VoiceProfile, VoiceProfileResolutionInput } from "../types.js";

export function resolveVoiceProfile(
  input: VoiceProfileResolutionInput
): Effect.Effect<VoiceProfile, VoiceProfileNotFoundError> {
  if (input.userId.trim().length === 0) {
    return Effect.fail(new VoiceProfileNotFoundError({ userId: input.userId }));
  }

  const hints = input.voiceHints;

  if (!hints || Object.keys(hints).length === 0) {
    return Effect.fail(
      new VoiceProfileNotFoundError({
        userId: input.userId,
        cause: "No voice hints provided. Voice Profile must be resolved upstream before reaching text-quality."
      })
    );
  }

  const profile = mergeVoiceProfile(
    createVoiceProfile(input.userId),
    hints
  );

  return Effect.succeed(profile);
}

export function buildTextQualityContext(
  input: VoiceProfileResolutionInput & {
    readonly generationContext?: TextQualityContext["generationContext"];
    readonly lexicalQualityV2?: boolean;
  },
  voiceProfile: VoiceProfile,
  now: () => Date
): TextQualityContext {
  return {
    request: input.request,
    userId: input.userId,
    briefing: input.briefing,
    voiceProfile,
    now,
    generationContext: input.generationContext,
    lexicalQualityV2: input.lexicalQualityV2
  };
}
