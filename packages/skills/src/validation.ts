import { Effect } from "effect";
import { SkillDefinitionInvalidError } from "./errors.js";
import type { DeclarativeSkillDefinition, SkillContract, SkillDefinition, ValidationResult } from "./types.js";

export function validateSkillDefinition(skill: SkillDefinition): Effect.Effect<SkillDefinition, SkillDefinitionInvalidError> {
  if (!skill || typeof skill !== "object") {
    return Effect.fail(new SkillDefinitionInvalidError({ message: "Skill is required" }));
  }
  if (typeof skill.name !== "string" || skill.name.trim().length === 0) {
    return Effect.fail(new SkillDefinitionInvalidError({ message: "Skill must have a non-empty string name" }));
  }
  if (typeof skill.execute !== "function") {
    return Effect.fail(
      new SkillDefinitionInvalidError({
        name: skill.name,
        message: `Skill "${skill.name}" must have an execute function`
      })
    );
  }

  return Effect.succeed(skill);
}

export function validateDeclarativeSkill(skill: unknown): ValidationResult {
  const errors: string[] = [];
  if (!skill || typeof skill !== "object") {
    return { valid: false, errors: ["Skill must be an object"] };
  }

  const definition = skill as Partial<DeclarativeSkillDefinition>;
  if (typeof definition.name !== "string" || definition.name.trim().length === 0) errors.push("Declarative skill must have a non-empty string name");
  if (typeof definition.description !== "string" || definition.description.trim().length === 0) errors.push(`Declarative skill "${definition.name ?? "<unknown>"}" must have a description`);
  if (typeof definition.promptTemplate !== "string" || definition.promptTemplate.trim().length === 0) errors.push(`Declarative skill "${definition.name ?? "<unknown>"}" must have a promptTemplate`);
  if (typeof definition.promptTemplate === "string") errors.push(...validateTemplateSyntax(definition.promptTemplate));
  if (typeof definition.llmPrompt === "string") errors.push(...validateTemplateSyntax(definition.llmPrompt));
  if (definition.inputMapping && typeof definition.inputMapping === "object") errors.push(...validateInputMapping(definition.inputMapping as Record<string, string>));
  if (definition.contract && typeof definition.contract === "object") errors.push(...validateContract(definition.contract as SkillContract));

  return { valid: errors.length === 0, errors };
}

function validateTemplateSyntax(template: string): string[] {
  const errors: string[] = [];
  const prohibitedPatterns = [
    { pattern: /eval\s*\(/i, message: 'Template contains prohibited "eval" call' },
    { pattern: /new\s+Function/i, message: 'Template contains prohibited "new Function"' },
    { pattern: /import\s*\(/i, message: 'Template contains prohibited dynamic import' },
    { pattern: /require\s*\(/i, message: 'Template contains prohibited "require" call' },
    { pattern: /{{{/, message: "Template contains raw HTML injection syntax ({{{)" },
    { pattern: /<script\b/i, message: "Template contains prohibited HTML script tag" }
  ];

  for (const { pattern, message } of prohibitedPatterns) {
    if (pattern.test(template)) errors.push(message);
  }

  const tagRegex = /\{\{([\s\S]*?)\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(template)) !== null) {
    const inner = match[1].trim();
    const prefix = template.slice(0, match.index);
    let backslashCount = 0;
    for (let index = prefix.length - 1; index >= 0 && prefix[index] === "\\"; index--) backslashCount++;
    if (backslashCount % 2 === 1) continue;
    if (inner.includes("{{") || inner.includes("}}")) {
      errors.push(`Malformed tag near position ${match.index}`);
      continue;
    }
    if (!isValidTagContent(inner)) {
      errors.push(`Invalid template tag "{{${inner}}}" at position ${match.index}`);
    }
  }

  const openIfs = (template.match(/\{\{\s*#if\s+/g) || []).length;
  const closeIfs = (template.match(/\{\{\s*\/if\s*\}\}/g) || []).length;
  if (openIfs !== closeIfs) errors.push(`Mismatched conditional blocks: ${openIfs} open, ${closeIfs} close`);
  return errors;
}

function isValidTagContent(inner: string): boolean {
  if (inner === "") return false;
  if (inner === "else" || inner === "/if") return true;
  if (inner.startsWith("#if ")) {
    const expr = inner.slice(4).trim();
    const condition = expr.startsWith("!") ? expr.slice(1).trim() : expr;
    return isValidVariablePath(condition);
  }
  const defaultMatch = inner.match(/^(.+?)\s*\|\|\s*("(?:[^"\\]|\\.)*")\s*$/);
  if (defaultMatch) return isValidVariablePath(defaultMatch[1].trim());
  return isValidVariablePath(inner);
}

function isValidVariablePath(path: string): boolean {
  return /^[\w$.-]+$/.test(path);
}

function validateInputMapping(mapping: Record<string, string>): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(mapping)) {
    if (!/^[\w-]+$/.test(key)) errors.push(`inputMapping key "${key}" must be a valid bare variable name`);
    if (!/^\$[\w]+(\.[\w-]+)*$/.test(value)) errors.push(`inputMapping value "${value}" for key "${key}" must be a valid context path`);
  }
  return errors;
}

function validateContract(contract: SkillContract): string[] {
  const errors: string[] = [];
  const validSkillTypes = new Set(["generate", "transform", "validate", "enrich"]);
  const validParsers = new Set(["text", "json", "auto"]);

  if (!validSkillTypes.has(contract.type)) {
    errors.push(`contract.type "${contract.type}" must be one of: generate, transform, validate, enrich`);
  }

  if (contract.input) {
    const required = contract.input.required ?? [];
    const optional = contract.input.optional ?? [];
    const requiredSet = new Set<string>();
    const optionalSet = new Set<string>();

    for (const path of required) {
      if (!isValidContextPath(path)) errors.push(`contract.input.required "${path}" must be a valid context path`);
      if (requiredSet.has(path)) errors.push(`contract.input.required contains duplicate path "${path}"`);
      requiredSet.add(path);
    }
    for (const path of optional) {
      if (!isValidContextPath(path)) errors.push(`contract.input.optional "${path}" must be a valid context path`);
      if (optionalSet.has(path)) errors.push(`contract.input.optional contains duplicate path "${path}"`);
      optionalSet.add(path);
    }
    for (const path of required) {
      if (optionalSet.has(path)) errors.push(`contract.input path "${path}" cannot be both required and optional`);
    }
  }

  if (contract.output && !validParsers.has(contract.output.parser)) {
    errors.push(`contract.output.parser "${contract.output.parser}" must be one of: text, json, auto`);
  }

  return errors;
}

function isValidContextPath(path: string): boolean {
  return /^\$[\w]+(\.[\w-]+)*$/.test(path);
}
