import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildRefinementSkillContext,
  createDeclarativeSkillExecutor,
  createLanguageAwareDeclarativeSkillExecutor,
  createSkillRegistry,
  detectLanguageCode,
  getLanguageProfile,
  loadSkill,
  resolveTemplate,
  resolveLanguageProfile,
  validateDeclarativeSkill,
  SkillAlreadyRegisteredError,
  SkillTemplateError
} from "../../packages/skills/src/index.js";

describe("skills package", () => {
  it("validates declarative skills and resolves templates", () => {
    const validation = validateDeclarativeSkill({
      name: "summarize",
      description: "Summarize text",
      promptTemplate: "Draft: {{$state.draft}}"
    });

    expect(validation.valid).toBe(true);
    expect(Effect.runSync(resolveTemplate("Hello {{name}}", { state: {}, inputs: {}, config: {}, locals: { name: "world" } }))).toBe(
      "Hello world"
    );
  });

  it("executes declarative skills with mapping and context helpers", async () => {
    const skill = Effect.runSync(createDeclarativeSkillExecutor({
      name: "rewrite",
      description: "Rewrite text",
      promptTemplate: "Tone: {{tone}} | Topic: {{topic}} | Draft: {{$state.draft}}",
      inputMapping: {
        tone: "$config.tone",
        topic: "$inputs.topic"
      }
    }));

    const result = await Effect.runPromise(skill.execute({
      pipeline: { name: "demo", steps: [{ name: "rewrite", skill: "rewrite", config: { tone: "professional" } }] },
      stepIndex: 0,
      state: { draft: "Hello" },
      inputs: { topic: "Monorepo" }
    }));

    expect(result.output).toBe("Tone: professional | Topic: Monorepo | Draft: Hello");
    expect(result.metadata?.type).toBe("declarative");
  });

  it("resolves language profiles and builds refinement context", () => {
    const profile = Effect.runSync(resolveLanguageProfile({ explicit: "pt-BR" }));
    const fallback = Effect.runSync(resolveLanguageProfile({ contentType: "linkedin-post" }));
    const detected = detectLanguageCode("This is a small English sample for detection.");
    const refinement = Effect.runSync(buildRefinementSkillContext({
      explicit: "en-US",
      mode: "critic",
      previousScore: 72,
      focusDimensions: ["voice", "clarity"]
    }));

    expect(profile.code).toBe("pt-BR");
    expect(fallback.code).toBe("pt-BR");
    expect(detected).toBe("en-US");
    expect(refinement.languageCode).toBe("en-US");
    expect(refinement.retryInstruction).toContain("Evaluate");
    expect(getLanguageProfile("pt-BR")).toBeDefined();
  });

  it("creates language-aware declarative executors", async () => {
    const skill = Effect.runSync(createLanguageAwareDeclarativeSkillExecutor(
      {
        name: "refine-text",
        description: "Refine text with language hints",
        promptTemplate: "Lang: {{languageCode}} | Tone: {{languageTone}} | Draft: {{$state.draft}}"
      },
      {
        explicit: "pt-BR",
        mode: "refine"
      }
    ));

    const result = await Effect.runPromise(skill.execute({
      pipeline: {
        name: "validation-post",
        steps: [{ name: "refine-text", skill: "refine-text", config: {} }]
      },
      stepIndex: 0,
      state: { draft: "Hello monorepo" },
      inputs: {}
    }));

    expect(result.output).toContain("Lang: pt-BR");
    expect(result.output).toContain("Tone: professional");
  });

  it("loads skills from files and registers them", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "skills-loader-"));
    const skillPath = join(tempDir, "custom-skill.mjs");
    const registry = createSkillRegistry();

    try {
      writeFileSync(
        skillPath,
        [
          "export default {",
          "  name: 'custom-skill',",
          "  description: 'Custom skill',",
          "  execute: async () => ({ output: 'ok' })",
          "};",
          ""
        ].join("\n"),
        "utf-8"
      );

      const loaded = await Effect.runPromise(loadSkill(skillPath, { registry, baseDir: tempDir, allowedDirs: [tempDir] }));
      expect(loaded.name).toBe("custom-skill");
      expect(registry.resolve("custom-skill")).toBeDefined();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("throws typed errors for duplicate registrations and invalid template references", () => {
    const registry = createSkillRegistry();
    Effect.runSync(registry.register({
      name: "dup",
      description: "dup",
      execute: () => Effect.succeed({ output: "ok" })
    }));

    const duplicate = Effect.runSync(
      Effect.either(
        registry.register({
          name: "dup",
          description: "dup",
          execute: () => Effect.succeed({ output: "ok" })
        })
      )
    );
    expect(duplicate._tag).toBe("Left");
    expect(duplicate.left).toBeInstanceOf(SkillAlreadyRegisteredError);

    const invalidTemplate = Effect.runSync(
      Effect.either(resolveTemplate("Hello {{missing}}", { state: {}, inputs: {}, config: {}, locals: {} }))
    );
    expect(invalidTemplate._tag).toBe("Left");
    expect(invalidTemplate.left).toBeInstanceOf(SkillTemplateError);
  });
});
