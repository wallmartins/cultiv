import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { loadFixtures, loadFixturesIndex, FixtureValidationError } from "../../src/fixtures/loader.js";

const testFixtureRoot = resolve(import.meta.dirname, ".");
const actualFixtureRoot = resolve(import.meta.dirname, "../../src/fixtures");

describe("loadFixtures", () => {
  it("loads all fixtures from the default fixture root", () => {
    const cases = loadFixtures({}, testFixtureRoot);

    expect(cases.length).toBeGreaterThan(0);
    expect(cases.some((c) => c.suite === "voice-fidelity")).toBe(true);
    expect(cases.some((c) => c.suite === "drift-regression")).toBe(true);
    expect(cases.some((c) => c.suite === "critic-regression")).toBe(true);
  });

  it("filters fixtures by suite", () => {
    const cases = loadFixtures({ suite: "critic-regression" }, testFixtureRoot);

    expect(cases.every((c) => c.suite === "critic-regression")).toBe(true);
  });

  it("filters fixtures by caseId substring", () => {
    const cases = loadFixtures({ caseId: "llm-tic" }, testFixtureRoot);

    expect(cases).toHaveLength(1);
    expect(cases[0]?.id).toBe("critic-llm-tic-01");
  });

  it("filters fixtures by tags", () => {
    const cases = loadFixtures({ tags: ["drift", "absolute"] }, testFixtureRoot);

    expect(cases).toHaveLength(1);
    expect(cases[0]?.id).toBe("drift-formal-architect-01");
  });

  it("returns an empty array when no fixtures match", () => {
    const cases = loadFixtures({ suite: "voice-fidelity", tags: ["nonexistent"] }, testFixtureRoot);

    expect(cases).toHaveLength(0);
  });

  it("throws a clear validation error for invalid fixtures", () => {
    const tempDir = mkdtempSync(resolve(tmpdir(), "eval-loader-test-"));
    const suiteDir = resolve(tempDir, "voice-fidelity");
    mkdirSync(suiteDir);
    writeFileSync(resolve(suiteDir, "invalid.json"), JSON.stringify({ id: "invalid" }));

    expect(() => loadFixtures({}, tempDir)).toThrow(FixtureValidationError);

    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns an empty array when fixture directories do not exist", () => {
    const emptyDir = mkdtempSync(resolve(tmpdir(), "eval-loader-empty-"));

    const cases = loadFixtures({}, emptyDir);

    expect(cases).toHaveLength(0);
    rmSync(emptyDir, { recursive: true, force: true });
  });

  it("loads all committed voice-fidelity fixtures without validation errors", () => {
    const cases = loadFixtures({ suite: "voice-fidelity" }, actualFixtureRoot);

    expect(cases).toHaveLength(10);
    expect(cases.every((c) => c.suite === "voice-fidelity")).toBe(true);
  });

  it("loads all committed drift-regression fixtures without validation errors", () => {
    const cases = loadFixtures({ suite: "drift-regression" }, actualFixtureRoot);

    expect(cases.length).toBeGreaterThanOrEqual(15);
    expect(cases.every((c) => c.suite === "drift-regression")).toBe(true);
  });

  it("loads all committed critic-regression fixtures without validation errors", () => {
    const cases = loadFixtures({ suite: "critic-regression" }, actualFixtureRoot);

    expect(cases.length).toBeGreaterThanOrEqual(10);
    expect(cases.every((c) => c.suite === "critic-regression")).toBe(true);
  });
});

describe("loadFixturesIndex", () => {
  it("returns case counts per suite", () => {
    const index = loadFixturesIndex(testFixtureRoot);

    expect(index.find((entry) => entry.suite === "voice-fidelity")?.count).toBe(1);
    expect(index.find((entry) => entry.suite === "drift-regression")?.count).toBe(1);
    expect(index.find((entry) => entry.suite === "critic-regression")?.count).toBe(1);
  });
});
