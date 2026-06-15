export const VOICE_EXAMPLE_FORMATS = [
  "linkedin-post",
  "twitter-thread",
  "long-form-blog",
  "newsletter",
  "validation-post",
  "architecture-post"
] as const;

export type VoiceExampleFormat = (typeof VOICE_EXAMPLE_FORMATS)[number];
