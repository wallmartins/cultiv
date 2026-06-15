import { describe, expect, it } from "vitest";
import { appMessagesEn } from "../../apps/web/src/i18n/app/messages/en";
import { appMessagesPt } from "../../apps/web/src/i18n/app/messages/pt";
import { getExecutionStepPresentation } from "../../apps/web/src/app/execution/lib/execution-step-messages.js";

describe("execution step presentation", () => {
  it("maps known pipeline steps to localized label and summary", () => {
    const draft = getExecutionStepPresentation("pt", "draft", appMessagesPt);
    expect(draft.label).toBe("Rascunho");
    expect(draft.summary).toContain("perfil de voz");

    const refine = getExecutionStepPresentation("en", "refine", appMessagesEn);
    expect(refine.label).toBe("Refinement");
    expect(refine.summary).toContain("tone");
  });

  it("falls back for unknown step ids", () => {
    const unknown = getExecutionStepPresentation("en", "custom-step", appMessagesEn);
    expect(unknown.label).toBe("custom-step");
    expect(unknown.summary).toBe(appMessagesEn.executionSteps.fallback.summary);
  });
});
