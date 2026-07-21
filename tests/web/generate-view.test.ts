import { describe, expect, it } from "vitest";
import type { GuidedStep } from "~/routes/generate-view.js";
import { buildBriefing } from "~/routes/generate-view.js";

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
