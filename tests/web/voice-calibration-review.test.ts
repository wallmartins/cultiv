import { describe, expect, it } from "vitest";
import {
  isWizardReviewStep,
  isReviewSectionPending,
  resolveDevelopmentReviewBody,
  resolveThinkingReviewBody,
  shouldPollVoiceProfileOnReview
} from "../../apps/web/src/app/onboarding/lib/voice-calibration-review";

describe("voice calibration review helpers", () => {
  it("detects the review step from the UI index only", () => {
    expect(isWizardReviewStep(4)).toBe(true);
    expect(isWizardReviewStep(3)).toBe(false);
  });

  it("never falls back to raw wizard step text", () => {
    expect(resolveThinkingReviewBody(null)).toBeUndefined();
    expect(resolveDevelopmentReviewBody(null)).toBeUndefined();
    expect(
      resolveDevelopmentReviewBody({
        profile: {} as never,
        diagnostics: { updating: false } as never,
        materialBase: {} as never
      })
    ).toBeUndefined();
  });

  it("returns extracted prose when available", () => {
    expect(
      resolveThinkingReviewBody({
        profile: {} as never,
        diagnostics: { updating: false } as never,
        materialBase: {} as never,
        reasoning: {
          core: { narrativeProse: "Observa antes de concluir." }
        } as never
      })
    ).toBe("Observa antes de concluir.");

    expect(
      resolveDevelopmentReviewBody({
        profile: {} as never,
        diagnostics: { updating: false } as never,
        materialBase: {} as never,
        reasoning: {
          development: { developmentProse: "Abre pela observação." }
        } as never
      })
    ).toBe("Abre pela observação.");
  });

  it("marks review sections as pending while profile is updating or prose is missing", () => {
    expect(isReviewSectionPending(null, undefined)).toBe(true);
    expect(
      isReviewSectionPending(
        {
          profile: {} as never,
          diagnostics: { updating: true } as never,
          materialBase: {} as never
        },
        "Pronto."
      )
    ).toBe(true);
    expect(
      isReviewSectionPending(
        {
          profile: {} as never,
          diagnostics: { updating: false } as never,
          materialBase: {} as never
        },
        undefined
      )
    ).toBe(true);
    expect(
      isReviewSectionPending(
        {
          profile: {} as never,
          diagnostics: { updating: false } as never,
          materialBase: {} as never
        },
        "Pronto."
      )
    ).toBe(false);
  });

  it("keeps polling while either review section is still missing", () => {
    expect(shouldPollVoiceProfileOnReview(undefined, 0, 30)).toBe(true);
    expect(
      shouldPollVoiceProfileOnReview(
        {
          profile: {} as never,
          diagnostics: { updating: true } as never,
          materialBase: {} as never
        },
        1,
        30
      )
    ).toBe(true);
    expect(
      shouldPollVoiceProfileOnReview(
        {
          profile: {} as never,
          diagnostics: { updating: false } as never,
          materialBase: {} as never,
          reasoning: {
            core: { narrativeProse: "Pensamento pronto." }
          } as never
        },
        1,
        30
      )
    ).toBe(true);
    expect(
      shouldPollVoiceProfileOnReview(
        {
          profile: {} as never,
          diagnostics: { updating: false } as never,
          materialBase: {} as never,
          reasoning: {
            core: { narrativeProse: "Pensamento pronto." },
            development: { developmentProse: "Desenvolvimento pronto." }
          } as never
        },
        1,
        30
      )
    ).toBe(false);
    expect(
      shouldPollVoiceProfileOnReview(
        {
          profile: {} as never,
          diagnostics: { updating: false } as never,
          materialBase: {} as never
        },
        30,
        30
      )
    ).toBe(false);
  });
});
