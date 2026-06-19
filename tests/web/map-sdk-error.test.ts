import { describe, expect, it } from "vitest";
import { ClientSdkHttpStatusError } from "@my-ai-orchestrator/client-sdk";
import { appMessagesPt } from "../../apps/web/src/i18n/app/messages/pt";
import { formatSdkError } from "../../apps/web/src/platform/sdk/format-sdk-error.js";

describe("formatSdkError", () => {
  it("maps safety errors to localized copy", () => {
    const mapped = formatSdkError(
      new ClientSdkHttpStatusError({
        label: "generation preview",
        status: 422,
        code: "safety_input_blocked",
        retryable: false
      }),
      appMessagesPt
    );

    expect(mapped.title).toBe(appMessagesPt.errors.safetyInputBlocked.title);
  });

  it("falls back to default copy", () => {
    const mapped = formatSdkError(new Error("boom"), appMessagesPt);
    expect(mapped.title).toBe(appMessagesPt.errors.default.title);
  });

  it("surfaces backend response message for unknown http errors", () => {
    const mapped = formatSdkError(
      new ClientSdkHttpStatusError({
        label: "execution create",
        status: 500,
        retryable: true,
        responseMessage: "Pipeline edition-piece is not available in policy version 2026-05-16"
      }),
      appMessagesPt
    );

    expect(mapped.message).toBe(
      "Pipeline edition-piece is not available in policy version 2026-05-16"
    );
  });
});
