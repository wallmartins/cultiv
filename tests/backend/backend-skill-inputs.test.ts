import { describe, expect, it } from "vitest";
import { getBriefingText } from "../../apps/backend/src/execution/skill-inputs.js";

describe("backend skill inputs", () => {
  it("appends sanitized imported context to the runtime briefing text", () => {
    const briefingText = getBriefingText({
      briefing: {
        topic: "Rollout de policy",
        audience: "time interno"
      },
      importedContext: "Notas externas em texto puro"
    });

    expect(briefingText).toContain("Topic: Rollout de policy");
    expect(briefingText).toContain("Audience: time interno");
    expect(briefingText).toContain("Imported context: Notas externas em texto puro");
  });

  it("serializes the labeled Practice Profile slots (ADR 0010 §6)", () => {
    const briefingText = getBriefingText({
      briefing: {
        topic: "Migração pro Postgres",
        payload: "a migração incremental venceu o big-bang",
        anchor: "cortamos o downtime de 4h pra 12min em produção",
        resistance: "o time achava que dual-write era arriscado demais",
        stake: "o próximo deploy trava se a régua de rollback não existir"
      }
    });

    expect(briefingText).toBe(
      "Topic: Migração pro Postgres | Payload: a migração incremental venceu o big-bang | " +
        "Anchor: cortamos o downtime de 4h pra 12min em produção | " +
        "Resistance: o time achava que dual-write era arriscado demais | " +
        "Stake: o próximo deploy trava se a régua de rollback não existir"
    );
  });

  it("drops the retired goal/keyPoints fields — clean cut, no back-compat", () => {
    const briefingText = getBriefingText({
      briefing: {
        topic: "Voz autêntica",
        goal: "should not appear",
        keyPoints: ["should not appear either"]
      }
    });

    expect(briefingText).toBe("Topic: Voz autêntica");
  });

  it("keeps runtime metadata out of fallback briefing assembly for explicit inputs", () => {
    const briefingText = getBriefingText({
      topic: "Runtime minimization",
      importedContext: "Notas externas",
      language: "pt-BR",
      contentType: "custom-flow",
      qualityMode: "strict"
    });

    expect(briefingText).toContain("\"topic\":\"Runtime minimization\"");
    expect(briefingText).toContain("Imported context: Notas externas");
    expect(briefingText).not.toContain("contentType");
    expect(briefingText).not.toContain("qualityMode");
    expect(briefingText).not.toContain("language");
  });
});
