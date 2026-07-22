import { describe, expect, it } from "vitest";
import { buildVoiceProfileSnapshotId } from "../../apps/backend/src/product/voice/voice-resolution-helpers.js";

describe("voice profile snapshot ids", () => {
  it("builds snapshot ids that fit postgres varchar(64) primary keys", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const snapshotId = buildVoiceProfileSnapshotId(
      userId,
      12,
      "email",
      new Date("2026-06-24T12:00:00.000Z")
    );

    expect(snapshotId.length).toBeLessThanOrEqual(64);
    expect(snapshotId).toMatch(/^vps:[a-f0-9]{32}$/);
  });
});
