import { describe, expect, it } from "vitest";
import { VoicePinnedLimitExceededError } from "@my-ai-orchestrator/domain";
import { mapVoiceError } from "../src/error-mappers/error-map-voice.js";

describe("mapVoiceError", () => {
  it("maps pinned limit errors to invalid_request", () => {
    const result = mapVoiceError(
      new VoicePinnedLimitExceededError({
        userId: "user-1",
        attemptedPinnedCount: 2,
        pinnedLimit: 1
      }),
      "/me/voice-profile/example-batches/batch/commit"
    );

    expect(result?.status).toBe(400);
    expect(result?.body.code).toBe("invalid_request");
    expect(result?.body.message).toContain("Pinned example limit exceeded");
  });
});
