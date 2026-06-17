import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { VoiceRebuildStatusBanner } from "../../apps/web/src/app/voice/components/VoiceRebuildStatusBanner";
import { appMessagesPt } from "../../apps/web/src/i18n/app/messages/pt";

describe("VoiceRebuildStatusBanner", () => {
  const messages = appMessagesPt.voice;

  it("renders failed rebuild message", () => {
    const html = renderToStaticMarkup(
      <VoiceRebuildStatusBanner
        status="failed"
        updatingMessage={messages.updatingBanner}
        failedMessage={messages.rebuildFailed}
      />
    );

    expect(html).toContain(messages.rebuildFailed);
    expect(html).toContain("text-red-800");
  });

  it("renders updating banner for in-progress rebuild", () => {
    const html = renderToStaticMarkup(
      <VoiceRebuildStatusBanner
        status="in_progress"
        updatingMessage={messages.updatingBanner}
        failedMessage={messages.rebuildFailed}
      />
    );

    expect(html).toContain(messages.updatingBanner);
  });

  it("renders nothing when rebuild is idle", () => {
    const html = renderToStaticMarkup(
      <VoiceRebuildStatusBanner
        status="idle"
        updatingMessage={messages.updatingBanner}
        failedMessage={messages.rebuildFailed}
      />
    );

    expect(html).toBe("");
  });
});
