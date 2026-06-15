import { Effect } from "effect";
import type { DeclarativeSkillDefinition, SkillDefinition, SkillExecutionContext, SkillInfo } from "./types.js";
import { getEffectiveConfig, resolveContextPath } from "./context-path.js";
import { resolveTemplate } from "./template.js";
import { buildRefinementSkillContext } from "./language.js";
import { SkillDefinitionInvalidError } from "./errors.js";
import { validateDeclarativeSkill } from "./validation.js";

export function createDeclarativeSkillExecutor(
  definition: DeclarativeSkillDefinition
): Effect.Effect<SkillDefinition, SkillDefinitionInvalidError> {
  return createLanguageAwareDeclarativeSkillExecutor(definition);
}

export function createLanguageAwareDeclarativeSkillExecutor(
  definition: DeclarativeSkillDefinition,
  options: import("./types.js").LanguageProfileResolutionOptions = {}
): Effect.Effect<SkillDefinition, SkillDefinitionInvalidError> {
  const validation = validateDeclarativeSkill(definition);
  if (!validation.valid) {
    return Effect.fail(
      new SkillDefinitionInvalidError({
        name: definition.name,
        message: `Invalid declarative skill: ${validation.errors.join("; ")}`
      })
    );
  }

  return Effect.succeed({
    name: definition.name,
    description: definition.description,
    contract: definition.contract,
    execute: (context) =>
      Effect.gen(function* () {
        const voiceProfile = context.state?.voiceProfile as { tone?: string } | undefined;
        const refinement = yield* buildRefinementSkillContext({
          mode: "refine",
          voiceTone: voiceProfile?.tone,
          ...options
        });
        const locals: Record<string, unknown> = {};

        if (definition.inputMapping) {
          for (const [key, path] of Object.entries(definition.inputMapping)) {
            locals[key] = yield* resolveContextPath(path, context);
          }
        }

        const templateContext = {
          state: context.state,
          inputs: context.inputs,
          config: getEffectiveConfig(context),
          memory: context.memory,
          locals: {
            ...locals,
            languageCode: refinement.languageCode,
            languageName: refinement.languageName,
            languageTone: refinement.tone,
            languageConstraints: refinement.constraints.join(", "),
            refinementMode: refinement.mode,
            refinementRetryInstruction: refinement.retryInstruction
          }
        };

        const templateToUse = definition.llmPrompt ?? definition.promptTemplate;
        const output = yield* resolveTemplate(templateToUse, templateContext);

        return {
          output,
          metadata: {
            skill: definition.name,
            type: "declarative",
            promptType: definition.llmPrompt ? "llmPrompt" : "promptTemplate"
          }
        };
      })
  });
}

export function describeSkill(skill: SkillDefinition | DeclarativeSkillDefinition): SkillInfo {
  return "execute" in skill
    ? { name: skill.name, type: "native", description: skill.description, hasContract: Boolean(skill.contract) }
    : { name: skill.name, type: "declarative", description: skill.description, hasContract: Boolean(skill.contract) };
}
