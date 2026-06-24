import { describe, expect, it } from "vitest";
import {
  getExecutionFormatLabel,
  getExecutionSubtitle,
  getExecutionTitle
} from "../../apps/web/src/app/history/lib/execution-presentation";

describe("execution presentation labels", () => {
  it("uses briefing topic as the primary title and intent plus format as subtitle", () => {
    const item = {
      briefingTopic: "Aprendizado contínuo na carreira",
      generationIntent: "share-idea" as const,
      contentType: "short-piece",
      lengthTier: "short" as const,
      channel: "professional-network" as const
    };

    expect(getExecutionTitle(item, "pt")).toBe("Aprendizado contínuo na carreira");
    expect(getExecutionSubtitle(item, "pt")).toBe("Compartilhar descoberta · Curta · Rede profissional");
    expect(getExecutionFormatLabel(item, "pt")).toBe("Curta · Rede profissional");
  });

  it("falls back to intent label when briefing topic is missing", () => {
    const item = {
      generationIntent: "engage-audience" as const,
      contentType: "validation-post",
      lengthTier: "short" as const
    };

    expect(getExecutionTitle(item, "pt")).toBe("Provocar conversa");
    expect(getExecutionSubtitle(item, "pt")).toBe("Curta");
  });
});
