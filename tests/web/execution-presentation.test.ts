import { describe, expect, it } from "vitest";
import {
  getExecutionFormatLabel,
  getExecutionSubtitle,
  getExecutionTitle
} from "../../apps/web/src/app/history/lib/execution-presentation";

describe("execution presentation labels", () => {
  it("uses briefing topic as the primary title and intent as subtitle without repeating format", () => {
    const item = {
      briefingTopic: "Aprendizado contínuo na carreira",
      generationIntent: "share-idea" as const,
      contentType: "short-piece",
      lengthTier: "short" as const,
      channel: "professional-network" as const
    };

    expect(getExecutionTitle(item, "pt")).toBe("Aprendizado contínuo na carreira");
    expect(getExecutionSubtitle(item, "pt")).toBe("Compartilhar descoberta");
    expect(getExecutionFormatLabel(item, "pt")).toBe("Curta · Rede profissional");
  });

  it("shows format as subtitle when the title is the expedition intent", () => {
    const item = {
      generationIntent: "engage-audience" as const,
      contentType: "validation-post",
      lengthTier: "short" as const,
      channel: "social" as const
    };

    expect(getExecutionTitle(item, "pt")).toBe("Provocar conversa");
    expect(getExecutionSubtitle(item, "pt")).toBe("Curta · Rede social");
  });
});
