import { describe, expect, it } from "vitest";
import { appMessagesEn } from "../../apps/web/src/i18n/app/messages/en";
import { appMessagesPt } from "../../apps/web/src/i18n/app/messages/pt";

describe("generation preview quota i18n", () => {
  it("defines preview quota copy with placeholders in both locales", () => {
    for (const messages of [appMessagesPt, appMessagesEn]) {
      expect(messages.generate.previewQuota).toContain("{cost}");
      expect(messages.generate.previewQuota).toContain("{remaining}");
      expect(messages.generate.previewQuota).toContain("{limit}");
    }
  });
});
