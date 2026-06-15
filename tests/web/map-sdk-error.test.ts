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
});
