export function resolveContentTypeVoicePreset(contentType: string): {
  readonly constraints: readonly string[];
  readonly lexicon: readonly string[];
} {
  switch (contentType) {
    case "linkedin-post":
      return {
        constraints: ["preserve user voice", "keep the full post between 130 and 220 words", "prefer 2-4 short paragraphs"],
        lexicon: []
      };
    case "twitter-thread":
      return {
        constraints: ["preserve user voice", "keep each tweet concise", "maintain thread momentum"],
        lexicon: []
      };
    case "newsletter":
      return {
        constraints: ["preserve user voice", "use clear section transitions"],
        lexicon: []
      };
    case "long-form-blog":
      return {
        constraints: ["preserve user voice", "allow longer explanations and sections"],
        lexicon: []
      };
    case "validation-post":
      return {
        constraints: ["preserve user voice", "keep claims tied to supplied evidence"],
        lexicon: []
      };
    case "architecture-post":
      return {
        constraints: ["preserve user voice", "surface explicit tradeoffs and constraints"],
        lexicon: []
      };
    default:
      return {
        constraints: ["preserve user voice"],
        lexicon: []
      };
  }
}

export const COGNITIVE_PRESET_RULE_MARKERS = [
  "progress through discovery",
  "derive benefits",
  "discovery-led"
] as const;
