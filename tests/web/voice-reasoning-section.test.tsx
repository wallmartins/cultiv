import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { VoiceReasoningSection } from "../../apps/web/src/app/voice/components/VoiceReasoningSection";
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

const diagnosticsBase = {
  updating: false,
  activeVersion: 2,
  summary: "Profile ok",
  reasonCodes: [],
  nextActionCodes: [],
  bestCoveredContentTypes: [],
  underrepresentedContentTypes: [],
  materialBase: {
    totalExamples: 2,
    activeExamples: 2,
    excludedExamples: 0,
    pinnedExamples: 0,
    byClassification: {},
    byContentType: {},
    byLanguage: {}
  }
} as const;

describe("VoiceReasoningSection", () => {
  const messages = appMessagesPt.voice.reasoning;

  it("renders rebuilding and failed rebuild states", () => {
    const rebuilding = renderToStaticMarkup(
      <VoiceReasoningSection
        locale="pt-BR"
        messages={messages}
        reasoning={reasoning}
        diagnostics={{
          ...diagnosticsBase,
          pendingRebuild: {
            status: "in_progress",
            nextActionCodes: []
          }
        }}
      />
    );

    expect(rebuilding).toContain(messages.rebuilding);

    const failed = renderToStaticMarkup(
      <VoiceReasoningSection
        locale="pt-BR"
        messages={messages}
        reasoning={reasoning}
        diagnostics={{
          ...diagnosticsBase,
          pendingRebuild: {
            status: "failed",
            reasonCode: "reasoning_extraction_failed",
            nextActionCodes: ["wait_for_profile_update"]
          }
        }}
      />
    );

    expect(failed).toContain(messages.failedKeepLast);
  });

  it("renders partial format state when no format expressions exist", () => {
    const html = renderToStaticMarkup(
      <VoiceReasoningSection
        locale="pt-BR"
        messages={messages}
        reasoning={reasoning}
        diagnostics={{
          ...diagnosticsBase,
          pendingRebuild: {
            status: "idle",
            nextActionCodes: []
          }
        }}
      />
    );

    expect(html).toContain(messages.partialFormats);
    expect(html).toContain(reasoning.core.narrativeProse);
    expect(html).toContain("generic linkedin tone");
  });
});
