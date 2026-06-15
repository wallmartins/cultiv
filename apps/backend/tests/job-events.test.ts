import { describe, expect, it } from "vitest";
import { formatSseComment, formatSseEvent, SSE_HEARTBEAT_INTERVAL_MS } from "../src/jobs/job-events.js";

describe("job event SSE formatting", () => {
  it("formats data events for execution watch", () => {
    const formatted = formatSseEvent("progress", { currentStep: "draft", percent: 40 }, "2026-06-14T12:00:00.000Z");
    expect(formatted).toContain('event: progress');
    expect(formatted).toContain('"currentStep":"draft"');
    expect(formatted.endsWith("\n\n")).toBe(true);
  });

  it("formats heartbeat comments ignored by the client SDK parser", () => {
    const formatted = formatSseComment("ping 2026-06-14T12:00:00.000Z");
    expect(formatted).toBe(": ping 2026-06-14T12:00:00.000Z\n\n");
    expect(formatted.startsWith(":")).toBe(true);
    expect(formatted).not.toContain("data:");
  });

  it("uses a heartbeat interval below common edge idle timeouts", () => {
    expect(SSE_HEARTBEAT_INTERVAL_MS).toBeLessThanOrEqual(30_000);
    expect(SSE_HEARTBEAT_INTERVAL_MS).toBeGreaterThan(10_000);
  });
});
