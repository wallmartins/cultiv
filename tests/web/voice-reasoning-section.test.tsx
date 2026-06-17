import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildReasoningDetailItems,
  VoiceReasoningMirror
} from "../../apps/web/src/app/voice/components/VoiceReasoningSection";
import { appMessagesPt } from "../../apps/web/src/i18n/app/messages/pt";
import type { VoiceReasoningPresentationView } from "@my-ai-orchestrator/contracts";

const reasoning: VoiceReasoningPresentationView = {
  core: {
    narrativeProse: "Observa antes de concluir.",
    certaintyLevel: "moderate",
    judgmentFrequency: "low",
    conclusionPace: "slow",
    readerRelationship: "peer",
    authoritySource: "personal_observation",
    derivedAntiPatterns: ["generic linkedin tone"]
  },
  formatExpressions: [],
  reasoningVersion: 2
};

describe("VoiceReasoningMirror", () => {
  const messages = appMessagesPt.voice.reasoning;

  it("renders mirror prose and anti-patterns in detail items", () => {
    const html = renderToStaticMarkup(
      <VoiceReasoningMirror
        messages={messages}
        reasoning={reasoning}
        confidenceLevel="high"
        confidenceLabel="Alta"
        dialEyebrow="Confiança"
        dialSubline="raízes firmes"
      />
    );

    expect(html).toContain(messages.title);
    expect(html).toContain(reasoning.core.narrativeProse);

    const detailHtml = renderToStaticMarkup(
      <>
        {buildReasoningDetailItems({
          locale: "pt-BR",
          messages: appMessagesPt.voice,
          reasoning
        }).map((item) => (
          <div key={item.id}>{item.children}</div>
        ))}
      </>
    );

    expect(detailHtml).toContain(messages.partialFormats);
    expect(detailHtml).toContain("generic linkedin tone");
  });
});
