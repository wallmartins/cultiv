import { Context, Effect, Layer } from "effect";
import { TemplateError } from "./errors.js";

export class TemplateService extends Context.Tag("TemplateService")<TemplateService, {
  readonly resolve: (
    template: string,
    context: TemplateContext
  ) => Effect.Effect<string, TemplateError>;
}>() {}

export interface TemplateContext {
  readonly state: Readonly<Record<string, unknown>>;
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly config: Readonly<Record<string, unknown>>;
  readonly memory?: {
    readonly read: (key: string) => Effect.Effect<unknown>;
  };
  readonly locals: Readonly<Record<string, unknown>>;
}

function getPath(obj: Readonly<Record<string, unknown>>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
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

function resolveTemplateValue(
  raw: string,
  context: TemplateContext,
  allowUndefined: boolean
): unknown {
  const defaultMatch = raw.match(/^(.+?)\s*\|\|\s*("((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\s*$/);
  if (defaultMatch) {
    const value = resolveTemplateValue(defaultMatch[1].trim(), context, true);
    if (value === undefined || value === null || value === "") {
      return unquote(defaultMatch[2]);
    }
    return value;
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

  return allowUndefined ? undefined : undefined;
}

function resolveTemplateEffectInternal(
  template: string,
  context: TemplateContext
): Effect.Effect<string, TemplateError> {
  const escapedToken = "__SKILL_ESCAPED_OPEN__";
  let rendered = template.replaceAll("\\{{", escapedToken);
  let templateError: TemplateError | undefined;

  rendered = rendered.replace(/\{\{#if\s+([\s\S]+?)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_: string, condition: string, whenTrue: string, whenFalse = "") => {
    const value = resolveTemplateValue(condition.trim(), context, true);
    return value ? whenTrue : whenFalse;
  });

  rendered = rendered.replace(/\{\{([\s\S]*?)\}\}/g, (_: string, raw: string) => {
    const value = resolveTemplateValue(raw.trim(), context, false);
    if (value === undefined || value === null) {
      templateError = new TemplateError({
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

interface TemplateServiceImpl {
  readonly resolve: (
    template: string,
    context: TemplateContext
  ) => Effect.Effect<string, TemplateError>;
}

export function createTemplateService(): TemplateServiceImpl {
  return {
    resolve: resolveTemplateEffectInternal
  };
}

export function createTemplateServiceLayer() {
  return Layer.succeed(TemplateService, createTemplateService());
}