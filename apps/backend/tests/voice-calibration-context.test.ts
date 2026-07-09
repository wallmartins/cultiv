import { describe, expect, it } from "vitest";
import { CALIBRATION_WIZARD_STEPS } from "@my-ai-orchestrator/domain";
import {
  getCalibrationWizardStep,
  resolveTheme,
  THEMES_BY_DOMAIN,
  type WizardContext
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

  it("resolves domain-specific opinion themes for micro_opinion", () => {
    const step = getCalibrationWizardStep("micro_opinion");
    expect(step).toBeDefined();

    const context: WizardContext = { domain: "tecnologia", audience: "colegas" };
    expect(resolveTheme(step!, context)).toBe(THEMES_BY_DOMAIN.tecnologia.opinion);
  });

  it("resolves domain-specific argument themes for argument_development", () => {
    const step = getCalibrationWizardStep("argument_development");
    expect(step).toBeDefined();

    const context: WizardContext = { domain: "negocios" };
    expect(resolveTheme(step!, context)).toBe(THEMES_BY_DOMAIN.negocios.argument);
  });

  it("returns fixed prompts for reasoning and format adaptation steps", () => {
    const reasoning = getCalibrationWizardStep("reasoning_reflection");
    const adaptation = getCalibrationWizardStep("format_adaptation");

    expect(resolveTheme(reasoning!, { domain: "tecnologia" })).toBe(reasoning!.fixedPrompt);
    expect(resolveTheme(adaptation!, { domain: "educacao" })).toBe(adaptation!.fixedPrompt);
  });

  it("falls back to default theme when domain is missing", () => {
    const step = getCalibrationWizardStep("micro_opinion");
    expect(resolveTheme(step!)).toBe(step!.defaultTheme);
  });

  it("falls back to default theme for unknown domains", () => {
    const step = getCalibrationWizardStep("micro_opinion");
    expect(resolveTheme(step!, { domain: "desconhecido" })).toBe(step!.defaultTheme);
  });

  it("defines themes for all supported domains", () => {
    expect(Object.keys(THEMES_BY_DOMAIN).sort()).toEqual(
      ["criativo", "educacao", "negocios", "saude", "tecnologia"].sort()
    );
  });
});
