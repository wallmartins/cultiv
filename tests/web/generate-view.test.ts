import { describe, expect, it } from "vitest";
import type { GuidedStep } from "~/routes/generate-view.js";
import {
  buildBriefing,
  commonDenominatorAudience,
  detectedPlatformChannel,
  mergeAudienceOptions,
  platformOptions,
  resolveNarrowingBuffer
} from "~/routes/generate-view.js";
import { messagesFor } from "@my-ai-orchestrator/ui/app/i18n";

const t = messagesFor("pt-BR");

const STEPS: readonly GuidedStep[] = [
  { kind: "question", id: "thesis", angle: "thesis", prompt: "qual a tese?" },
  { kind: "question", id: "experience", angle: "experience", prompt: "qual experiência?" },
  { kind: "question", id: "tension", angle: "tension", prompt: "qual tensão?" },
  { kind: "question", id: "motivation", angle: "motivation", prompt: "por que agora?" },
  { kind: "question", id: "extra-1", angle: "extra", prompt: "algo mais?" },
  { kind: "channel", id: "channel", prompt: "qual canal?" }
];

describe("buildBriefing", () => {
  it("maps the backbone angles onto labeled slots (ADR 0010 §6)", () => {
    const briefing = buildBriefing("voz autêntica", STEPS, [
      { questionId: "thesis", text: "escrever todo dia muda a voz", skipped: false },
      { questionId: "experience", text: "publiquei 200 posts em 2 anos", skipped: false },
      { questionId: "tension", text: "todo mundo acha que precisa de talento", skipped: false },
      { questionId: "motivation", text: "quero provar que é hábito, não dom", skipped: false }
    ]);

    expect(briefing).toEqual({
      topic: "voz autêntica",
      payload: "escrever todo dia muda a voz",
      anchor: "publiquei 200 posts em 2 anos",
      resistance: "todo mundo acha que precisa de talento",
      stake: "quero provar que é hábito, não dom"
    });
  });

  it("omits skipped and blank answers entirely — never a placeholder", () => {
    const briefing = buildBriefing("voz autêntica", STEPS, [
      { questionId: "thesis", text: "", skipped: false },
      { questionId: "experience", text: "  ", skipped: false },
      { questionId: "tension", text: "seria bom", skipped: true }
    ]);

    expect(briefing).toEqual({ topic: "voz autêntica" });
  });

  it("passes audience through only when the caller has one", () => {
    const withAudience = buildBriefing("voz autêntica", STEPS, [], "gestores de produto");
    const withoutAudience = buildBriefing("voz autêntica", STEPS, []);

    expect(withAudience).toEqual({ topic: "voz autêntica", audience: "gestores de produto" });
    expect(withoutAudience).toEqual({ topic: "voz autêntica" });
  });

  it("folds thesis and extra answers into payload without dropping content", () => {
    const briefing = buildBriefing("migração pro Postgres", STEPS, [
      { questionId: "thesis", text: "big-bang perde pra incremental", skipped: false },
      { questionId: "extra-1", text: "rolou em produção sem downtime visível", skipped: false }
    ]);

    expect(briefing.payload).toBe("big-bang perde pra incremental rolou em produção sem downtime visível");
    expect(briefing).not.toHaveProperty("keyPoints");
    expect(briefing).not.toHaveProperty("goal");
  });

  it("ignores answers for the channel step", () => {
    const briefing = buildBriefing("voz autêntica", STEPS, [
      { questionId: "channel", text: "LinkedIn", skipped: false }
    ]);

    expect(briefing).toEqual({ topic: "voz autêntica" });
  });
});

describe("resolveNarrowingBuffer (F4-2, ADR 0010 §6)", () => {
  it("auto-skips with no audience declared", () => {
    expect(resolveNarrowingBuffer([])).toEqual({ kind: "skip", audience: undefined });
  });

  it("auto-skips straight to the single declared audience", () => {
    expect(resolveNarrowingBuffer(["gestores de produto"])).toEqual({
      kind: "skip",
      audience: "gestores de produto"
    });
  });

  it("renders the narrowing step for 2+ declared audiences", () => {
    expect(resolveNarrowingBuffer(["gestores de produto", "devs"])).toEqual({
      kind: "narrow",
      audiences: ["gestores de produto", "devs"]
    });
  });
});

describe("commonDenominatorAudience", () => {
  it("folds every declared audience into one descriptor when the author declines to narrow", () => {
    expect(commonDenominatorAudience(["gestores de produto", "devs", "fundadores"])).toBe(
      "gestores de produto, devs, fundadores"
    );
  });
});

describe("mergeAudienceOptions", () => {
  it("dedupes declared + ephemeral audiences, preserving order", () => {
    expect(mergeAudienceOptions(["devs", "gestores de produto"], ["devs", "recrutadores"])).toEqual([
      "devs",
      "gestores de produto",
      "recrutadores"
    ]);
  });

  it("is a no-op with no ephemeral additions", () => {
    expect(mergeAudienceOptions(["devs"], [])).toEqual(["devs"]);
  });
});

describe("platformOptions / detectedPlatformChannel (F4-6)", () => {
  it("offers the 4 functional channel buckets, not platform brand names", () => {
    expect(platformOptions(t).map((option) => option.id)).toEqual(["professional-network", "social", "blog", "email"]);
  });

  it("maps every raw detected platform onto its bucket, preserving the preselect", () => {
    expect(detectedPlatformChannel("linkedin")).toBe("professional-network");
    expect(detectedPlatformChannel("x")).toBe("social");
    expect(detectedPlatformChannel("instagram")).toBe("social");
    expect(detectedPlatformChannel("medium")).toBe("blog");
    expect(detectedPlatformChannel("substack")).toBe("blog");
    expect(detectedPlatformChannel("blog")).toBe("blog");
    expect(detectedPlatformChannel("newsletter")).toBe("email");
  });

  it("is undefined when nothing was detected", () => {
    expect(detectedPlatformChannel(undefined)).toBeUndefined();
  });
});
