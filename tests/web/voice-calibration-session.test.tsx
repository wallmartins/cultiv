/**
 * @vitest-environment jsdom
 */
import React from "react";
import { Effect } from "effect";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WizardStep, wizardStepCanAdvance } from "../../apps/web/src/app/onboarding/components/WizardStep";
import { VoiceCalibrationSession } from "../../apps/web/src/app/onboarding/screens/VoiceCalibrationSession";
import { canAdvance, countWords } from "../../apps/web/src/app/onboarding/lib/voice-calibration-word-count";
import { appMessagesPt } from "../../apps/web/src/i18n/app/messages/pt";

const toPromise = vi.fn();
const startSession = vi.fn();
const setContext = vi.fn();
const getStepPrompt = vi.fn();
const submitStep = vi.fn();
const skipStep = vi.fn();
const completeReview = vi.fn();
const getProfile = vi.fn();

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({ user: { sub: "user-1" } })
}));

vi.mock("../../apps/web/src/platform/runtime/client-sdk-context", () => ({
  useClientSdk: () => ({
    toPromise,
    voiceCalibration: {
      startSession,
      setContext,
      getStepPrompt,
      submitStep,
      skipStep,
      completeReview
    },
    voice: {
      getProfile
    }
  })
}));

vi.mock("../../apps/web/src/i18n/app/use-app-locale", () => ({
  useAppLocale: () => ({
    locale: "pt" as const,
    messages: appMessagesPt,
    setLocale: vi.fn()
  })
}));

vi.mock("../../apps/web/src/app/voice/lib/voice-consent-storage", () => ({
  hasVoiceConsent: () => true,
  grantVoiceConsent: vi.fn()
}));

describe("voice calibration word count", () => {
  it("counts words and enforces 50% target threshold", () => {
    expect(countWords("um dois tres quatro cinco")).toBe(5);
    expect(canAdvance(60, 29)).toBe(false);
    expect(canAdvance(60, 30)).toBe(true);
    expect(wizardStepCanAdvance(60, "palavra ".repeat(30))).toBe(true);
  });
});

describe("WizardStep", () => {
  it("renders word counter and min hint below threshold", () => {
    render(
      <WizardStep
        label="Opinião curta"
        prompt="Qual é a sua opinião?"
        text="curto texto"
        onTextChange={() => undefined}
        targetWords={60}
        maxWords={100}
        wordCountLabel={appMessagesPt.onboarding.voiceCalibration.wordCount}
        minWordsHint={appMessagesPt.onboarding.voiceCalibration.wordCountMin}
      />
    );

    expect(screen.getByText(/2 \/ 60 palavras/)).toBeInTheDocument();
    expect(
      screen.getByText(appMessagesPt.onboarding.voiceCalibration.wordCountMin.replace("{min}", "30"))
    ).toBeInTheDocument();
  });
});

describe("VoiceCalibrationSession", () => {
  beforeEach(() => {
    toPromise.mockReset();
    startSession.mockReset();
    setContext.mockReset();
    getStepPrompt.mockReset();
    submitStep.mockReset();
    skipStep.mockReset();
    completeReview.mockReset();
    getProfile.mockReset();
  });

  it("renders pre-wizard context questions", () => {
    render(<VoiceCalibrationSession onComplete={vi.fn()} />);

    expect(screen.getByText(appMessagesPt.onboarding.voiceCalibration.preTitle)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: appMessagesPt.onboarding.voiceCalibration.domainOptions.tecnologia })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: appMessagesPt.onboarding.voiceCalibration.audienceOptions.colegas })).toBeInTheDocument();
  });

  it("disables continue until domain and audience are selected", () => {
    render(<VoiceCalibrationSession onComplete={vi.fn()} />);

    const continueButton = screen.getByRole("button", { name: appMessagesPt.onboarding.continue });
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByText(appMessagesPt.onboarding.voiceCalibration.domainOptions.tecnologia));
    fireEvent.click(screen.getByText(appMessagesPt.onboarding.voiceCalibration.audienceOptions.colegas));

    expect(continueButton).not.toBeDisabled();
  });

  it("returns to the previous writable step when back is pressed on review", async () => {
    const sessionAtReview = {
      sessionId: "voice-calibration:test",
      userId: "user-1",
      status: "in_progress",
      currentStepId: "review_confirm",
      completedStepCount: 4,
      steps: [
        { stepId: "micro_opinion", text: "Opinião salva." },
        { stepId: "reasoning_reflection", text: "Reflexão salva." },
        { stepId: "argument_development", text: "Desenvolvimento salvo." },
        { stepId: "format_adaptation", text: "Formato salvo." },
        { stepId: "review_confirm" }
      ]
    };

    startSession.mockReturnValue(Effect.succeed({ sessionId: "voice-calibration:test" }));
    setContext.mockReturnValue(Effect.succeed(sessionAtReview));
    getStepPrompt.mockReturnValue(
      Effect.succeed({
        stepId: "format_adaptation",
        prompt: "Adapte o formato.",
        theme: "linkedin",
        targetWords: 80,
        maxWords: 120,
        minWords: 40
      })
    );
    toPromise.mockImplementation((effect) => Effect.runPromise(effect));

    render(<VoiceCalibrationSession onComplete={vi.fn()} />);

    fireEvent.click(screen.getByText(appMessagesPt.onboarding.voiceCalibration.domainOptions.tecnologia));
    fireEvent.click(screen.getByText(appMessagesPt.onboarding.voiceCalibration.audienceOptions.colegas));
    fireEvent.click(screen.getByRole("button", { name: appMessagesPt.onboarding.continue }));

    await screen.findByText(appMessagesPt.onboarding.voiceCalibration.wizardTitle);

    getProfile.mockReturnValue(
      Effect.succeed({
        profile: { userId: "user-1" },
        diagnostics: { updating: false },
        materialBase: {},
        reasoning: {
          core: { narrativeProse: "Como você pensa." },
          development: { developmentProse: "Como você desenvolve." }
        }
      })
    );
    submitStep.mockImplementation(() =>
      Effect.succeed({
        ...sessionAtReview,
        currentStepId: "review_confirm"
      })
    );

    for (let index = 0; index < 4; index += 1) {
      const textarea = await screen.findByRole("textbox");
      fireEvent.change(textarea, { target: { value: "palavra ".repeat(40) } });
      fireEvent.click(screen.getByRole("button", { name: appMessagesPt.onboarding.continue }));
    }

    expect(
      await screen.findByText(appMessagesPt.onboarding.voiceCalibration.reviewThinking)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: appMessagesPt.onboarding.voiceCalibration.back }));

    expect(await screen.findByDisplayValue("Formato salvo.")).toBeInTheDocument();
    expect(screen.queryByText(appMessagesPt.onboarding.voiceCalibration.reviewThinking)).not.toBeInTheDocument();
  });
});
