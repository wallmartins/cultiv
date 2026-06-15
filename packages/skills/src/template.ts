import { Effect } from "effect";
import { SkillTemplateError } from "./errors.js";
import { getPath } from "./context-path.js";
import type { SkillMemory } from "./types.js";

export function resolveTemplate(
  template: string,
  context: {
    readonly state: Readonly<Record<string, unknown>>;
    readonly inputs: Readonly<Record<string, unknown>>;
    readonly config: Readonly<Record<string, unknown>>;
    readonly memory?: SkillMemory;
    readonly locals: Readonly<Record<string, unknown>>;
  }
): Effect.Effect<string, SkillTemplateError> {
  const escapedToken = "__SKILL_ESCAPED_OPEN__";
  let rendered = template.replaceAll("\\{{", escapedToken);
  let templateError: SkillTemplateError | undefined;

  rendered = rendered.replace(/\{\{#if\s+([\s\S]+?)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, condition: string, whenTrue: string, whenFalse = "") => {
    const value = resolveTemplateValue(condition.trim(), context, true);
    return value ? whenTrue : whenFalse;
  });

  rendered = rendered.replace(/\{\{([\s\S]*?)\}\}/g, (_, raw: string) => {
    const value = resolveTemplateValue(raw.trim(), context, false);
    if (value === undefined || value === null) {
      templateError = new SkillTemplateError({
        template,
        message: `Cannot resolve template tag "{{${raw.trim()}}}"`
      });
      return "";
    }
    return stringifyTemplateValue(value);
  });

  if (templateError) {
    return Effect.fail(templateError);
  }

  return Effect.succeed(rendered.replaceAll(escapedToken, "{{"));
}

function resolveTemplateValue(
  raw: string,
  context: {
    readonly state: Readonly<Record<string, unknown>>;
    readonly inputs: Readonly<Record<string, unknown>>;
    readonly config: Readonly<Record<string, unknown>>;
    readonly memory?: SkillMemory;
    readonly locals: Readonly<Record<string, unknown>>;
  },
  allowUndefined: boolean
): unknown {
  const defaultMatch = raw.match(/^(.+?)\s*\|\|\s*("((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\s*$/);
  if (defaultMatch) {
    const value = resolveTemplateValue(defaultMatch[1].trim(), context, true);
    if (value === undefined || value === null) {
      return value === undefined || value === null || value === "" ? unquote(defaultMatch[2]) : value;
    }
    return value === undefined || value === null || value === "" ? unquote(defaultMatch[2]) : value;
  }

  if (raw.startsWith("!")) {
    return !Boolean(resolveTemplateValue(raw.slice(1).trim(), context, true));
  }

  if (raw.startsWith("$state.")) return getPath(context.state, raw.slice(7));
  if (raw === "$state") return context.state;
  if (raw.startsWith("$inputs.")) return getPath(context.inputs, raw.slice(8));
  if (raw === "$inputs") return context.inputs;
  if (raw.startsWith("$config.")) return getPath(context.config, raw.slice(8));
  if (raw === "$config") return context.config;
  if (raw.startsWith("$locals.")) return getPath(context.locals, raw.slice(8));
  if (raw === "$locals") return context.locals;

  if (/^[\w$.-]+$/.test(raw)) {
    return getPath(context.locals, raw);
  }

  if (allowUndefined) {
    return undefined;
  }

  return undefined;
}

function stringifyTemplateValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  return JSON.stringify(value);
}

function unquote(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1).replaceAll("\\\"", "\"").replaceAll("\\'", "'");
  }
  return value;
}
