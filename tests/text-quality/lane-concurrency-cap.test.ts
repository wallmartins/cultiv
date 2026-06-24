import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  createTextQualityLiveLayer,
  DEFAULT_LANE_CONCURRENCY_CAP,
  runTextQualityPipeline,
  type QualityLane
} from "../../packages/text-quality/src/index.js";

const baseRequest = {
  request: {
    pipeline: {
      name: "validation-post",
      steps: [{ name: "draft", skill: "draft" }]
    },
    inputs: {
      briefing: "Crie um texto direto e humano"
    }
  },
  userId: "user-123",
  briefing: "Crie um texto direto e humano",
  voiceHints: {
    tone: "personal",
    styleMarkers: ["eu", "na prática", "direto"],
    rules: ["Prefer first-person observations"]
  },
  now: () => new Date("2026-05-13T10:00:00.000Z")
};

describe("text-quality lane concurrency cap", () => {
  it(`defaults lane concurrency cap to ${DEFAULT_LANE_CONCURRENCY_CAP}`, () => {
    expect(DEFAULT_LANE_CONCURRENCY_CAP).toBe(3);
  });

  it("does not start all lanes at once when lane count exceeds the cap", async () => {
    const laneCount = DEFAULT_LANE_CONCURRENCY_CAP + 2;
    const activeLanes = new Set<string>();
    let maxConcurrent = 0;
    let releaseBarrier!: () => void;
    const barrier = new Promise<void>((resolve) => {
      releaseBarrier = resolve;
    });

    const lanes: QualityLane[] = Array.from({ length: laneCount }, (_, index) => ({
      laneId: `lane-${index}`,
      adapter: "openai",
      model: "gpt-4o-mini",
      temperature: 0.5,
      strategy: "balanced" as const,
      generate: () =>
        Effect.gen(function* () {
          activeLanes.add(`lane-${index}`);
          maxConcurrent = Math.max(maxConcurrent, activeLanes.size);
          yield* Effect.promise(() => barrier);
          activeLanes.delete(`lane-${index}`);
          return "Eu testei isso na prática. O resultado ficou claro, direto e sem pose.";
        })
    }));

    const program = runTextQualityPipeline({
      ...baseRequest,
      lanes
    }).pipe(Effect.provide(createTextQualityLiveLayer()));

    const resultPromise = Effect.runPromise(program);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(maxConcurrent).toBe(DEFAULT_LANE_CONCURRENCY_CAP);
    expect(maxConcurrent).toBeLessThan(laneCount);

    releaseBarrier();
    const result = await resultPromise;

    expect(result.candidates).toHaveLength(laneCount);
    expect(activeLanes.size).toBe(0);
  });
});
