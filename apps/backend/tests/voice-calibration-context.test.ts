import { describe, expect, it } from "vitest";
import { CALIBRATION_WIZARD_STEPS } from "@my-ai-orchestrator/domain";
import {
  getCalibrationWizardStep,
  resolveTheme
} from "../src/product/voice/voice-calibration-context.js";

describe("voice calibration context", () => {
  it("exposes six wizard steps from domain constants", () => {
    expect(CALIBRATION_WIZARD_STEPS).toHaveLength(6);
    expect(CALIBRATION_WIZARD_STEPS.map((step) => step.id)).toEqual([
      "context_setup",
      "micro_opinion",
      "reasoning_reflection",
      "argument_development",
      "format_adaptation",
      "review_confirm"
    ]);
  });

  it("returns fixed prompts for reasoning and format adaptation steps", () => {
    const reasoning = getCalibrationWizardStep("reasoning_reflection");
    const adaptation = getCalibrationWizardStep("format_adaptation");

    expect(resolveTheme(reasoning!)).toBe(reasoning!.fixedPrompt);
    expect(resolveTheme(adaptation!)).toBe(adaptation!.fixedPrompt);
  });

  // F3-4 removed THEMES_BY_DOMAIN: the generated calibration anchor (G3) is the real per-subject prompt.
  // resolveTheme is now only the anchor-less fallback (default/fixed text).
  it("falls back to default theme for writable steps without a generated anchor", () => {
    const micro = getCalibrationWizardStep("micro_opinion");
    const argument = getCalibrationWizardStep("argument_development");

    expect(resolveTheme(micro!)).toBe(micro!.defaultTheme);
    expect(resolveTheme(argument!)).toBe(argument!.defaultTheme);
  });

  it("returns empty theme for context_setup and default for review_confirm", () => {
    const contextStep = getCalibrationWizardStep("context_setup");
    const review = getCalibrationWizardStep("review_confirm");

    expect(resolveTheme(contextStep!)).toBe("");
    expect(resolveTheme(review!)).toBe(review!.defaultTheme);
  });
});
