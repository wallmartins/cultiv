import { describe, expect, it } from "vitest";
import { GENERATION_CHANNELS, type GenerationChannel } from "@my-ai-orchestrator/contracts";
import {
  CHANNEL_CONTENT_TYPES_TABLE,
  channelForContentType,
  channelPrimaryContentType
} from "../src/product/generation/channel-content-types.js";

const nonUnspecifiedChannels = GENERATION_CHANNELS.filter(
  (channel): channel is Exclude<GenerationChannel, "unspecified"> => channel !== "unspecified"
);

describe("channel ↔ content-type single source (FU-4)", () => {
  it("gives every non-unspecified channel a table entry, so a new channel can't be forgotten", () => {
    for (const channel of nonUnspecifiedChannels) {
      expect(CHANNEL_CONTENT_TYPES_TABLE[channel].length).toBeGreaterThan(0);
    }
  });

  it("round-trips: each channel's canonical format resolves back to that channel", () => {
    for (const channel of nonUnspecifiedChannels) {
      expect(channelForContentType(channelPrimaryContentType(channel))).toBe(channel);
    }
  });

  it("reverse-maps every table content-type (alias included) to its owning channel", () => {
    for (const channel of nonUnspecifiedChannels) {
      for (const contentType of CHANNEL_CONTENT_TYPES_TABLE[channel]) {
        expect(channelForContentType(contentType)).toBe(channel);
      }
    }
  });

  it("claims each content-type under exactly one channel (reverse map stays unambiguous)", () => {
    const all = nonUnspecifiedChannels.flatMap((channel) => [...CHANNEL_CONTENT_TYPES_TABLE[channel]]);
    expect(new Set(all).size).toBe(all.length);
  });

  it("treats unspecified / unknown content-types as the unspecified channel with no format", () => {
    expect(channelPrimaryContentType("unspecified")).toBe("");
    expect(channelForContentType(undefined)).toBe("unspecified");
    expect(channelForContentType("not-a-real-content-type")).toBe("unspecified");
  });

  it("keeps the correspondence the two former call-sites hard-coded", () => {
    expect(channelPrimaryContentType("professional-network")).toBe("linkedin-post");
    expect(channelPrimaryContentType("social")).toBe("twitter-thread");
    expect(channelPrimaryContentType("email")).toBe("newsletter");
    expect(channelPrimaryContentType("blog")).toBe("blog");
    expect(channelForContentType("long-form-blog")).toBe("blog");
    expect(channelForContentType("validation-post")).toBe("professional-network");
    expect(channelForContentType("architecture-post")).toBe("professional-network");
  });
});
