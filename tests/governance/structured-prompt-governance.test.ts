import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { listTypeScriptFiles, ROOT } from "./shared.js";

const BACKEND_EXECUTION_SRC = resolve(ROOT, "apps", "backend", "src", "execution");
const ORCHESTRATOR_SRC = resolve(ROOT, "packages", "orchestrator", "src");
const CORE_SRC = resolve(ROOT, "packages", "core", "src");

describe("structured-prompt governance", () => {
  it("requires the core runtime to export StructuredPrompt", async () => {
    const runtimePath = resolve(CORE_SRC, "runtime.ts");
    const source = await readFile(runtimePath, "utf-8");

    expect(source).toMatch(/export\s+interface\s+StructuredPrompt/);
    expect(source).toMatch(/readonly\s+system:\s+string/);
    expect(source).toMatch(/readonly\s+user:\s+string/);
  });

  it("requires the backend skill templates to support structured prompts", async () => {
    const templatesPath = resolve(BACKEND_EXECUTION_SRC, "skill-templates.ts");
    const source = await readFile(templatesPath, "utf-8");

    expect(source).toMatch(/export\s+interface\s+StructuredStepTemplate/);
    expect(source).toMatch(/export\s+function\s+resolveStructuredStepTemplate/);
    expect(source).toMatch(/readonly\s+system:\s+string/);
    expect(source).toMatch(/readonly\s+user:\s+string/);
  });

  it("requires the backend skills to resolve structured templates", async () => {
    const skillsPath = resolve(BACKEND_EXECUTION_SRC, "skills.ts");
    const source = await readFile(skillsPath, "utf-8");

    expect(source).toMatch(/resolveStructuredStepTemplate/);
    expect(source).toMatch(/systemPrompt/);
    expect(source).toMatch(/userPrompt/);
  });

  it("requires the execution adapter to use system message for structured prompts", async () => {
    const adapterPath = resolve(BACKEND_EXECUTION_SRC, "pipeline/pipeline-execution-adapter.ts");
    const source = await readFile(adapterPath, "utf-8");

    expect(source).toMatch(/systemContent/);
    expect(source).toMatch(/userContent/);
    expect(source).toMatch(/role:\s*"system"/);
    expect(source).toMatch(/role:\s*"user"/);
    expect(source).toMatch(/typeof\s+instruction\s*===\s*"string"/);
  });

  it("requires the orchestrator to extract .user when adapter is absent", async () => {
    const executionPath = resolve(ORCHESTRATOR_SRC, "execution.ts");
    const source = await readFile(executionPath, "utf-8");

    expect(source).toMatch(/outputForState/);
    expect(source).toMatch(/\.user/);
    expect(source).toMatch(/StructuredPrompt/);
  });
});
