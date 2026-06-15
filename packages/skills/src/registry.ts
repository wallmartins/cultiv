import { Context, Effect, Layer } from "effect";
import type { DeclarativeSkillDefinition, SkillDefinition, SkillInfo, SkillRegistry } from "./types.js";
import { SkillAlreadyRegisteredError, SkillDefinitionInvalidError } from "./errors.js";
import { createDeclarativeSkillExecutor, describeSkill } from "./executor.js";
import { validateDeclarativeSkill, validateSkillDefinition } from "./validation.js";

export class SkillRegistryService extends Context.Tag("SkillRegistryService")<
  SkillRegistryService,
  SkillRegistry
>() {}

export function createSkillRegistry(): SkillRegistry {
  const skills = new Map<string, SkillDefinition>();
  const declarativeDefinitions = new Map<string, DeclarativeSkillDefinition>();

  return {
    register(skill: SkillDefinition) {
      if (skills.has(skill.name)) {
        return Effect.fail(new SkillAlreadyRegisteredError({ name: skill.name }));
      }

      return Effect.map(validateSkillDefinition(skill), (validated) => {
        skills.set(validated.name, validated);
      });
    },
    registerDeclarative(definition: DeclarativeSkillDefinition) {
      if (skills.has(definition.name)) {
        return Effect.fail(new SkillAlreadyRegisteredError({ name: definition.name }));
      }

      const validation = validateDeclarativeSkill(definition);
      if (!validation.valid) {
        return Effect.fail(
          new SkillDefinitionInvalidError({
            name: definition.name,
            message: `Invalid declarative skill: ${validation.errors.join("; ")}`
          })
        );
      }

      return Effect.map(createDeclarativeSkillExecutor(definition), (skill) => {
        skills.set(skill.name, skill);
        declarativeDefinitions.set(definition.name, definition);
      });
    },
    resolve(name: string) {
      return skills.get(name);
    },
    list() {
      return Array.from(skills.keys());
    },
    getDeclarative(name: string) {
      return declarativeDefinitions.get(name);
    }
  };
}

export function createSkillRegistryLayer(registry: SkillRegistry = createSkillRegistry()) {
  return Layer.succeed(SkillRegistryService, registry);
}

export function inspectRegistry(registry: SkillRegistry): SkillInfo[] {
  return registry.list().map((name) => {
    const skill = registry.resolve(name);
    const declarative = registry.getDeclarative(name);
    return skill
      ? describeSkill(skill)
      : declarative
        ? describeSkill(declarative)
        : { name, type: "native", hasContract: false };
  });
}
