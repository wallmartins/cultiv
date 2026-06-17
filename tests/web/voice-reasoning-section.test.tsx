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
  development: {
    developmentProse: "Parte da experiência vivida e tolera dúvida antes de concluir.",
    moveLabels: ["experiencia_vivida", "duvida"],
    transitionTendencies: [{ from: "experiencia_vivida", to: "duvida", frequency: "common" }],
    epistemicPosture: "exploratory",
    structuralAntiPatterns: ["tese_prematura"]
  },
  developmentImmature: true,
  traitProfile: {
    traits: {
      openingMode: "observation",
      insightTiming: "late",
      closingMode: "open_question"
    },
    records: {
      openingMode: {
        value: "observation",
        confidence: "medium",
        status: "inferred",
        evidenceExampleIds: ["ex-1"]
      },
      perspectiveShiftDensity: {
        confidence: "low",
        status: "unknown",
        evidenceExampleIds: []
      },
      usesCounterexamples: {
        value: "occasional",
        confidence: "low",
        status: "inferred",
        evidenceExampleIds: ["ex-2"]
      },
      selfQuestioning: {
        value: "high",
        confidence: "high",
        status: "inferred",
        evidenceExampleIds: ["ex-1", "ex-2"]
      },
      insightTiming: {
        value: "late",
        confidence: "high",
        status: "inferred",
        evidenceExampleIds: ["ex-1"]
      },
      usesAnalogies: {
        confidence: "low",
        status: "unknown",
        evidenceExampleIds: []
      },
      closingMode: {
        value: "open_question",
        confidence: "medium",
        status: "inferred",
        evidenceExampleIds: ["ex-2"]
      }
    }
  },
  formatExpressions: [],
  reasoningVersion: 2
};

describe("VoiceReasoningMirror", () => {
  const messages = appMessagesPt.voice.reasoning;

  it("renders mirror prose and anti-patterns in detail items", () => {
    const html = renderToStaticMarkup(
      <VoiceReasoningMirror
        locale="pt"
        messages={messages}
        reasoning={reasoning}
        confidenceLevel="high"
        dialSubline="raízes firmes"
        dialAccessibleLabel="Confiança: Alta. raízes firmes"
      />
    );

    expect(html).toContain(messages.title);
    expect(html).toContain(messages.coreTitle);
    expect(html).toContain(reasoning.core.narrativeProse);
    expect(html).toContain(messages.developmentTitle);
    expect(html).toContain(reasoning.development?.developmentProse);
    expect(html).toContain(messages.developmentImmature);
    expect(html).toContain(messages.developmentTraits.labels.openingMode);
    expect(html).toContain(messages.developmentTraits.enums.openingMode.observation);
    expect(html).toContain(messages.typicalMoves);
    expect(html).toContain("Experiência vivida");

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
