import { describe, expect, it } from "vitest";
import {
  isWizardReviewStep,
  resolveDevelopmentReviewBody,
  shouldPollVoiceProfileOnReview
} from "../../apps/web/src/app/onboarding/lib/voice-calibration-review";

describe("voice calibration review helpers", () => {
  it("detects the review step from the UI index only", () => {
    expect(isWizardReviewStep(4)).toBe(true);
    expect(isWizardReviewStep(3)).toBe(false);
  });

  it("falls back to the argument development draft while extraction is pending", () => {
    expect(
      resolveDevelopmentReviewBody(
        {
          profile: {} as never,
          diagnostics: { updating: true } as never,
          materialBase: {} as never
        },
        {
          steps: [{ stepId: "argument_development", text: "Meu texto de desenvolvimento." } as never]
        } as never
      )
    ).toBeUndefined();

    expect(
      resolveDevelopmentReviewBody(
        {
          profile: {} as never,
          diagnostics: { updating: false } as never,
          materialBase: {} as never
        },
        {
          steps: [{ stepId: "argument_development", text: "Meu texto de desenvolvimento." } as never]
        } as never
      )
    ).toBe("Meu texto de desenvolvimento.");
  });

  it("prefers extracted development prose when available", () => {
    expect(
      resolveDevelopmentReviewBody(
        {
          profile: {} as never,
          diagnostics: { updating: false } as never,
          materialBase: {} as never,
          reasoning: {
            development: { developmentProse: "Abre pela observação." }
          } as never
        },
        {
          steps: [{ stepId: "argument_development", text: "Rascunho." } as never]
        } as never
      )
    ).toBe("Abre pela observação.");
  });

  it("keeps polling while the profile is updating or development prose is missing", () => {
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
            development: { developmentProse: "Pronto." }
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
