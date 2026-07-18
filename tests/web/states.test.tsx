/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import {
  DegradedDeliveryBanner,
  DowngradeSurplus,
  LongTimeoutWatch,
  PaymentPendingZeroCredits,
  PostResetReturn,
  QueueAndTrialGate,
  ReconnectionReconcile,
  VoiceDriftNudge
} from "@my-ai-orchestrator/ui/app/states";
import { ExecutionDetail, type ExecutionDetailProps } from "@my-ai-orchestrator/ui/app/detail";

const noop = () => {};

function baseDetailProps(): ExecutionDetailProps {
  return {
    meta: "Longo · LinkedIn · agora · voz v3",
    usedFallbackVoiceProfile: false,
    topic: "A falácia de delegar o pensamento à IA",
    paragraphs: ["Parágrafo um.", "Parágrafo dois."],
    alignment: { confidenceValue: 0.8, traits: [], rules: [], antiPatterns: [] },
    alignmentOpen: false,
    onToggleAlignment: noop,
    onSeeVoiceProfile: noop,
    reaction: null,
    onReact: noop
  };
}

describe("edge states (S10a) — mount + no jargon", () => {
  it("LongTimeoutWatch — theme/progress/elapsed are props, no crash", () => {
    render(<LongTimeoutWatch theme="Por que abandonei o roadmap trimestral" progress={0.83} elapsed="há 5 min" onCancel={noop} onWait={noop} />);
    expect(screen.getByText("83%")).toBeInTheDocument();
    expect(screen.getByText(/Por que abandonei o roadmap trimestral/)).toBeInTheDocument();
    expect(screen.getByText("Continuar esperando →")).toBeInTheDocument();
  });

  it("PaymentPendingZeroCredits — plan name and cycle credits come from props", () => {
    render(<PaymentPendingZeroCredits planName="Criador" cycleCredits={30} onRegularize={noop} />);
    expect(screen.getByText(/Não conseguimos cobrar o Criador este mês/)).toBeInTheDocument();
    expect(screen.getByText(/os 30 créditos do ciclo/)).toBeInTheDocument();
    expect(screen.getByText("Regularizar pagamento →")).toBeInTheDocument();
  });

  it("PostResetReturn — name, resetDate, priorContext are props", () => {
    render(
      <PostResetReturn
        name="Rafael"
        resetDate="10/07"
        priorContext={{ topic: "engenharia de software e times", audience: "líderes técnicos" }}
        onResume={noop}
        onFresh={noop}
      />
    );
    expect(screen.getByText("De volta ao começo, Rafael.")).toBeInTheDocument();
    expect(screen.getByText("engenharia de software e times")).toBeInTheDocument();
  });

  it("ReconnectionReconcile — ready/resumed arrays drive the reconciliation copy", () => {
    render(
      <ReconnectionReconcile
        offlineMins={4}
        ready={[{ topic: "Por que abandonei o roadmap trimestral", meta: "pronto enquanto você estava offline · Médio" }]}
        resumed={[{ topic: "Contratar sênior vs. formar júnior", progress: 0.78 }]}
        onView={noop}
      />
    );
    expect(screen.getByText(/Você ficou offline por 4 minutos/)).toBeInTheDocument();
    expect(screen.getByText(/retomado · escrevendo… 78%/)).toBeInTheDocument();
  });

  it("QueueAndTrialGate — running count and queue ETA are props", () => {
    render(<QueueAndTrialGate runningCount={2} queueEta="~1 min" onUseLast={noop} onSaveForLater={noop} />);
    expect(screen.getByText(/2 gerações rodando agora — esta entra na fila e começa em ~1 min/)).toBeInTheDocument();
  });

  it("VoiceDriftNudge — confidence numbers are props, tone routes through Ring", () => {
    render(<VoiceDriftNudge confidenceFrom={78} confidenceTo={65} onRecalibrate={noop} onSnooze={noop} />);
    expect(screen.getByText("65")).toBeInTheDocument();
    expect(screen.getByText(/caiu de 78 pra 65/)).toBeInTheDocument();
  });

  it("DowngradeSurplus — balance/plans are props, no hardcoded plan names leak", () => {
    render(
      <DowngradeSurplus balance={38} keptCredits={15} surplusCredits={23} fromPlan="Criador" toPlan="Explorador" onConfirm={noop} onKeep={noop} />
    );
    expect(screen.getByText("38")).toBeInTheDocument();
    expect(screen.getByText("Manter o Criador")).toBeInTheDocument();
    expect(screen.getAllByText(/Explorador/).length).toBeGreaterThan(0);
  });

  // LowConfidenceReview and LongHistoryRail (S10a reference conversions) were deleted here —
  // both have real wired hosts now: packages/ui/app/onboarding/LowConfidenceReview.tsx (inside
  // ResultStep, tests/web/onboarding.test.tsx) and the enhanced RailHistoryList (packages/ui/app/
  // shell/RailHistoryList.tsx, tests/web/shell.test.tsx). See S10b's report for why the reference's
  // numeric confidence-%/per-trait Ring breakdown wasn't ported: confidence is a qualitative enum
  // (low/medium/high) with no per-trait score in the real contract, so porting it would have meant
  // inventing numbers.

  it("DegradedDeliveryBanner — length-tier enum never leaks raw, only the localized label", () => {
    render(<DegradedDeliveryBanner requestedTier="long" requestedWords={900} deliveredWords={340} onRedoFree={noop} />);
    expect(screen.getByText(/Você pediu Longo \(~900 palavras\); saíram 340/)).toBeInTheDocument();
    expect(screen.getByText("Refazer grátis →")).toBeInTheDocument();
    expect(screen.queryByText(/\blong\b/)).not.toBeInTheDocument();
  });

  it("ExecutionDetail — 1a banner only renders when delivered words fall short of requested", () => {
    const degraded = { requestedTier: "long" as const, requestedWords: 900, deliveredWords: 340, onRedoFree: noop };
    const { rerender } = render(<ExecutionDetail {...baseDetailProps()} degraded={degraded} />);
    expect(screen.getByText("Este texto saiu abaixo do combinado")).toBeInTheDocument();
    expect(screen.getByText(/340 de ~900 palavras/)).toBeInTheDocument();

    rerender(<ExecutionDetail {...baseDetailProps()} degraded={{ ...degraded, deliveredWords: 900 }} />);
    expect(screen.queryByText("Este texto saiu abaixo do combinado")).not.toBeInTheDocument();

    rerender(<ExecutionDetail {...baseDetailProps()} />);
    expect(screen.queryByText("Este texto saiu abaixo do combinado")).not.toBeInTheDocument();
  });
});
