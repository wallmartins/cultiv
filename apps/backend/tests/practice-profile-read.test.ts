import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import { toPracticeProfileRecord } from "@my-ai-orchestrator/database";
import type { PracticeProfile as DomainPracticeProfile } from "@my-ai-orchestrator/domain";
import { resolvePracticeProfileDeclaredView } from "../src/product/practice-profile/practice-profile-read.js";

const DOMAIN_PROFILE: DomainPracticeProfile = {
  id: "practice-profile:user-1",
  userId: "user-1",
  version: 2,
  depth: "enriched",
  subject: "engenharia de plataforma",
  vantagePoint: "líder técnico",
  audiences: ["líderes de engenharia", "SREs"],
  dimensions: {
    point: "p",
    evidence: "e",
    readerAssumption: "r",
    resistance: "res",
    stake: "s",
    fieldCliche: "c",
    lexicon: ["monólito"]
  },
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z"
};

function databaseWith(record: unknown): DatabaseClient {
  return { practiceProfiles: { getByUser: () => Effect.succeed(record) } } as unknown as DatabaseClient;
}

describe("practice profile declared view (F4-2 read seam)", () => {
  it("projects the persisted profile down to its declared axes only", async () => {
    const record = toPracticeProfileRecord(DOMAIN_PROFILE, 2);
    const response = await Effect.runPromise(resolvePracticeProfileDeclaredView(databaseWith(record), "user-1"));

    expect(response.profile).toEqual({
      subject: "engenharia de plataforma",
      vantagePoint: "líder técnico",
      audiences: ["líderes de engenharia", "SREs"],
      depth: "enriched"
    });
    // The derived dimensions never leak to the client.
    expect(response.profile).not.toHaveProperty("dimensions");
  });

  it("returns a null profile when the author has none yet", async () => {
    const response = await Effect.runPromise(resolvePracticeProfileDeclaredView(databaseWith(undefined), "user-1"));

    expect(response.profile).toBeNull();
  });
});
