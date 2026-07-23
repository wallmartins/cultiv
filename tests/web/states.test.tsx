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
  PastedThemeFormatted,
  PaymentPendingZeroCredits,
  PostResetReturn,
  QueueAndTrialGate,
  RecalibrateWithRunning,
  ReconnectionReconcile,
  VoiceDriftNudge
} from "@my-ai-orchestrator/ui/app/states";
import { ExecutionDetail, type ExecutionDetailProps } from "@my-ai-orchestrator/ui/app/detail";
import { DemoGeneration, LockedCenter, LockedCompanionEmpty } from "@my-ai-orchestrator/ui/app/locked";
import { I18nProvider } from "@my-ai-orchestrator/ui/app/i18n";

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

  it("LongTimeoutWatch — refundCredits absent falls back to the generic honest copy", () => {
    render(<LongTimeoutWatch theme="tema" progress={0.5} elapsed="há 3 min" onCancel={noop} onWait={noop} />);
    expect(screen.getByText("Cancelar e estornar os créditos reservados")).toBeInTheDocument();
  });

  it("LongTimeoutWatch — refundCredits present renders the real reserved amount", () => {
    render(<LongTimeoutWatch theme="tema" progress={0.5} elapsed="há 3 min" refundCredits={3} onCancel={noop} onWait={noop} />);
    expect(screen.getByText("Cancelar e estornar 3 créditos")).toBeInTheDocument();
    expect(screen.queryByText("Cancelar e estornar os créditos reservados")).not.toBeInTheDocument();
  });

  it("LongTimeoutWatch — refundCredits of 1 uses the singular", () => {
    render(<LongTimeoutWatch theme="tema" progress={0.5} elapsed="há 3 min" refundCredits={1} onCancel={noop} onWait={noop} />);
    expect(screen.getByText("Cancelar e estornar 1 crédito")).toBeInTheDocument();
  });

  it("PaymentPendingZeroCredits — plan name and cycle credits come from props", () => {
    render(<PaymentPendingZeroCredits planName="Criador" cycleCredits={30} onRegularize={noop} />);
    expect(screen.getByText(/Não conseguimos cobrar o Criador este mês/)).toBeInTheDocument();
    expect(screen.getByText(/os 30 créditos do ciclo/)).toBeInTheDocument();
    expect(screen.getByText("Regularizar pagamento →")).toBeInTheDocument();
  });

  it("PostResetReturn — name, resetDate, priorContext are props; resetDate renders through format.date", () => {
    render(
      <PostResetReturn
        name="Rafael"
        resetDate="2026-07-10T15:00:00.000Z"
        priorContext={{ topic: "engenharia de software e times", audience: "líderes técnicos" }}
        onResume={noop}
        onFresh={noop}
      />
    );
    expect(screen.getByText("De volta ao começo, Rafael.")).toBeInTheDocument();
    expect(screen.getByText("engenharia de software e times")).toBeInTheDocument();
    expect(screen.getByText(/10 de jul\. de 2026/)).toBeInTheDocument();
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

  it("RecalibrateWithRunning — gender-agreement plural (texto/textos, escrito/escritos)", () => {
    const { rerender } = render(
      <RecalibrateWithRunning
        running={[{ topic: "tema único", progress: 0.4 }]}
        fromVersion={2}
        toVersion={3}
        onProceed={noop}
        onWait={noop}
      />
    );
    expect(screen.getByText("Você tem 1 texto sendo escrito agora.")).toBeInTheDocument();

    rerender(
      <RecalibrateWithRunning
        running={[
          { topic: "tema um", progress: 0.4 },
          { topic: "tema dois", progress: 0.6 }
        ]}
        fromVersion={2}
        toVersion={3}
        onProceed={noop}
        onWait={noop}
      />
    );
    expect(screen.getByText("Você tem 2 textos sendo escritos agora.")).toBeInTheDocument();
  });

  it("PastedThemeFormatted — link count double-pluralization (link/links guardado/guardados)", () => {
    const { rerender } = render(
      <PastedThemeFormatted
        pasted="# título\ntexto colado"
        title="Um título claro"
        channel="Blog"
        angles={["ângulo um", "ângulo dois"]}
        linkCount={1}
        onUseAsPasted={noop}
        onConfirm={noop}
      />
    );
    expect(screen.getByText(/1 link guardado como referência/)).toBeInTheDocument();

    rerender(
      <PastedThemeFormatted
        pasted="# título\ntexto colado"
        title="Um título claro"
        channel="Blog"
        angles={["ângulo um", "ângulo dois"]}
        linkCount={3}
        onUseAsPasted={noop}
        onConfirm={noop}
      />
    );
    expect(screen.getByText(/3 links guardados como referência/)).toBeInTheDocument();
  });

  it("English locale — restructured pluralization sites read naturally, not word-by-word", () => {
    const { rerender } = render(
      <I18nProvider locale="en">
        <RecalibrateWithRunning running={[{ topic: "single topic", progress: 0.4 }]} fromVersion={2} toVersion={3} onProceed={noop} onWait={noop} />
      </I18nProvider>
    );
    expect(screen.getByText("You have 1 text being written right now.")).toBeInTheDocument();

    rerender(
      <I18nProvider locale="en">
        <PastedThemeFormatted
          pasted="pasted text"
          title="A clear title"
          channel="Blog"
          angles={["angle one"]}
          linkCount={2}
          onUseAsPasted={noop}
          onConfirm={noop}
        />
      </I18nProvider>
    );
    expect(screen.getByText(/2 links saved as reference/)).toBeInTheDocument();

    rerender(
      <I18nProvider locale="en">
        <LongTimeoutWatch theme="topic" progress={0.5} elapsed="3 min ago" refundCredits={1} onCancel={noop} onWait={noop} />
      </I18nProvider>
    );
    expect(screen.getByText("Cancel and refund 1 credit")).toBeInTheDocument();
  });

  it("locked/DemoGeneration — default demo prose renders (pt-BR)", () => {
    render(<DemoGeneration />);
    expect(screen.getByText("exemplo")).toBeInTheDocument();
    expect(screen.getByText("por que times pequenos escrevem melhor")).toBeInTheDocument();
  });

  it("locked/LockedCenter — notice + CTA + embedded demo render", () => {
    render(<LockedCenter onCalibrate={noop} />);
    expect(screen.getByText("nenhuma geração real ainda — o exemplo abaixo é ilustrativo")).toBeInTheDocument();
    expect(screen.getByText("Calibrar minha voz →")).toBeInTheDocument();
    expect(screen.getByText("exemplo")).toBeInTheDocument();
  });

  it("locked/LockedCompanionEmpty — reuses VoiceEmptyState with localized copy", () => {
    render(<LockedCompanionEmpty onCalibrate={noop} />);
    expect(screen.getByText("sua voz aparece aqui depois da calibração")).toBeInTheDocument();
    expect(screen.getByText("calibrar minha voz →")).toBeInTheDocument();
  });
});
