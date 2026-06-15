import { Effect } from "effect";
import type { SkillExecutionContext } from "./types.js";

export function resolveContextPath(path: string, context: SkillExecutionContext): Effect.Effect<unknown> {
  if (!path.startsWith("$")) {
    return Effect.succeed(undefined);
  }

  const dotIndex = path.indexOf(".");
  const namespace = dotIndex === -1 ? path.slice(1) : path.slice(1, dotIndex);
  const remainder = dotIndex === -1 ? "" : path.slice(dotIndex + 1);

  switch (namespace) {
    case "state":
      return Effect.succeed(remainder ? getPath(context.state, remainder) : context.state);
    case "inputs":
      return Effect.succeed(remainder ? getPath(context.inputs, remainder) : context.inputs);
    case "config":
      return Effect.succeed(remainder ? getPath(getEffectiveConfig(context), remainder) : getEffectiveConfig(context));
    case "memory": {
      if (!context.memory || !remainder) {
        return Effect.succeed(undefined);
      }
      const firstDot = remainder.indexOf(".");
      const key = firstDot === -1 ? remainder : remainder.slice(0, firstDot);
      return Effect.map(context.memory.read(key), (value) => {
        if (firstDot === -1) {
          return value;
        }
        return value && typeof value === "object"
          ? getPath(value as Record<string, unknown>, remainder.slice(firstDot + 1))
          : undefined;
      });
    }
    default:
      return Effect.succeed(undefined);
  }
}

export function getPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = Number(part);
      if (Number.isNaN(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
      continue;
    }

    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
      continue;
    }

    return undefined;
  }

  return current;
}

export function getEffectiveConfig(context: SkillExecutionContext): Readonly<Record<string, unknown>> {
  return context.config ?? (context.pipeline.steps[context.stepIndex]?.config as Readonly<Record<string, unknown>> | undefined) ?? {};
}
