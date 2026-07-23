import type { GenerationChannel } from "@my-ai-orchestrator/contracts";

// Single source for the channel ↔ content-type-format correspondence (FU-4). Both directions derive
// from this one table, so adding a channel/format touches exactly one place and can't drift silently
// (TS never catches a 6th entry added to one map and forgotten in the other). Per channel the list is
// ordered: the FIRST entry is the canonical format whose word-count band the word-target uses; the
// remaining entries are legacy/alias formats that only feed the reverse (content-type → channel)
// lookup. `unspecified` carries no format — the word-target falls to its default band and the reverse
// lookup never yields it.
type NonUnspecifiedChannel = Exclude<GenerationChannel, "unspecified">;

const CHANNEL_CONTENT_TYPES: Record<NonUnspecifiedChannel, readonly [string, ...string[]]> = {
  "professional-network": ["linkedin-post", "validation-post", "architecture-post"],
  social: ["twitter-thread"],
  email: ["newsletter"],
  blog: ["blog", "long-form-blog"]
};

// channel → canonical content-type format (the first entry). `unspecified` → "" (default band).
export function channelPrimaryContentType(channel: GenerationChannel): string {
  return channel === "unspecified" ? "" : CHANNEL_CONTENT_TYPES[channel][0];
}

const CHANNEL_BY_CONTENT_TYPE: ReadonlyMap<string, GenerationChannel> = new Map(
  (Object.entries(CHANNEL_CONTENT_TYPES) as [NonUnspecifiedChannel, readonly string[]][]).flatMap(
    ([channel, contentTypes]) => contentTypes.map((contentType) => [contentType, channel] as const)
  )
);

// content-type → channel, derived from every (channel, content-type) pair. Unknown/undefined types →
// "unspecified" (never a specific-channel match).
export function channelForContentType(contentType: string | undefined): GenerationChannel {
  return (contentType ? CHANNEL_BY_CONTENT_TYPE.get(contentType) : undefined) ?? "unspecified";
}

// Exposed for the round-trip/consistency test.
export const CHANNEL_CONTENT_TYPES_TABLE = CHANNEL_CONTENT_TYPES;
