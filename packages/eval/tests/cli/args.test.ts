import { describe, expect, it } from "vitest";
import { CLIArgumentError, parseArgs, renderHelp, renderVersion } from "../../src/cli/args.js";

describe("parseArgs", () => {
  it("returns default config when no flags are provided", () => {
    const config = parseArgs(["node", "eval"]);

    expect(config.includeJudge).toBe(false);
    expect(config.generator).toBe("placeholder");
    expect(config.compare).toBe(false);
    expect(config.reportFormat).toBe("console");
    expect(config.saveBaseline).toBe(false);
    expect(config.threshold).toBe(5);
  });

  it("parses --suite", () => {
    const config = parseArgs(["node", "eval", "--suite", "voice-fidelity"]);

    expect(config.suite).toBe("voice-fidelity");
  });

  it("parses boolean flags", () => {
    const config = parseArgs(["node", "eval", "--include-judge", "--compare", "--save-baseline"]);

    expect(config.includeJudge).toBe(true);
    expect(config.compare).toBe(true);
    expect(config.saveBaseline).toBe(true);
  });

  it("parses --report", () => {
    const config = parseArgs(["node", "eval", "--report", "json"]);

    expect(config.reportFormat).toBe("json");
  });

  it("parses --case", () => {
    const config = parseArgs(["node", "eval", "--case", "case-01"]);

    expect(config.caseId).toBe("case-01");
  });

  it("parses --tags as a comma-separated list", () => {
    const config = parseArgs(["node", "eval", "--tags", "blog,formal"]);

    expect(config.tags).toEqual(["blog", "formal"]);
  });

  it("parses --threshold", () => {
    const config = parseArgs(["node", "eval", "--threshold", "3"]);

    expect(config.threshold).toBe(3);
  });

  it("throws for unknown flags", () => {
    expect(() => parseArgs(["node", "eval", "--unknown"])).toThrow(CLIArgumentError);
  });

  it("throws for missing flag values", () => {
    expect(() => parseArgs(["node", "eval", "--suite"])).toThrow(CLIArgumentError);
  });

  it("throws for invalid report format", () => {
    expect(() => parseArgs(["node", "eval", "--report", "xml"])).toThrow(CLIArgumentError);
  });

  it("parses --judge-provider and --judge-model", () => {
    const config = parseArgs(["node", "eval", "--judge-provider", "openai", "--judge-model", "gpt-4o"]);

    expect(config.judgeProvider).toBe("openai");
    expect(config.judgeModel).toBe("gpt-4o");
  });

  it("parses --generator", () => {
    const config = parseArgs(["node", "eval", "--generator", "orchestrator"]);

    expect(config.generator).toBe("orchestrator");
  });

  it("throws for invalid generator", () => {
    expect(() => parseArgs(["node", "eval", "--generator", "fake"])).toThrow(CLIArgumentError);
  });

  it("sets help flag", () => {
    const config = parseArgs(["node", "eval", "--help"]);

    expect(config.help).toBe(true);
  });

  it("sets version flag", () => {
    const config = parseArgs(["node", "eval", "--version"]);

    expect(config.version).toBe(true);
  });
});

describe("renderHelp", () => {
  it("includes usage and options", () => {
    const help = renderHelp();

    expect(help).toContain("Usage:");
    expect(help).toContain("--suite");
    expect(help).toContain("--include-judge");
  });
});

describe("renderVersion", () => {
  it("returns a version string", () => {
    const version = renderVersion();

    expect(version).toContain("eval");
  });
});
