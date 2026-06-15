import { Context } from "effect";
import type { VoiceProfile } from "../types.js";
import type { VoiceProfileResolutionInput } from "../types.js";
import type { TextQualityError } from "../errors.js";

export interface VoiceProfileResolverContract {
  readonly resolve: (input: VoiceProfileResolutionInput) => import("effect").Effect.Effect<VoiceProfile, TextQualityError>;
}

export class VoiceProfileResolver extends Context.Tag("VoiceProfileResolver")<
  VoiceProfileResolver,
  VoiceProfileResolverContract
>() {}
