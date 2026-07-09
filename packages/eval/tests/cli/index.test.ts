import { describe, expect, it } from "vitest";
import { main } from "../../src/cli/index.js";

describe("main", () => {
  it("returns 0 and prints help for --help", async () => {
    const exitCode = await main(["node", "eval", "--help"]);

    expect(exitCode).toBe(0);
  });

  it("returns 0 and prints version for --version", async () => {
    const exitCode = await main(["node", "eval", "--version"]);

    expect(exitCode).toBe(0);
  });

  it("returns 1 for invalid flags", async () => {
    const exitCode = await main(["node", "eval", "--unknown"]);

    expect(exitCode).toBe(1);
  });

  it("runs the critic-regression suite and exits 0", async () => {
    const exitCode = await main(["node", "eval", "--suite", "critic-regression"]);

    expect(exitCode).toBe(0);
  });

  it("outputs JSON when --report json is used", async () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (message: unknown) => logs.push(String(message));

    try {
      await main(["node", "eval", "--suite", "critic-regression", "--report", "json"]);
    } finally {
      console.log = originalLog;
    }

    const jsonOutput = logs.find((log) => log.trim().startsWith("{"));
    expect(jsonOutput).toBeDefined();

    const parsed = JSON.parse(jsonOutput ?? "{}");
    expect(parsed.suites).toBeDefined();
  });
});
