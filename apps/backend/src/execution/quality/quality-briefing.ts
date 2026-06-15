import { stripRuntimeMetadata } from "../pipeline/sanitized-generation-input.js";

export function resolveBriefingText(runtimeInputs: Readonly<Record<string, unknown>>): string {
  const payload = stripRuntimeMetadata(runtimeInputs);
  if (Object.prototype.hasOwnProperty.call(payload, "briefing")) {
    return stringifyBriefing(payload.briefing);
  }

  return stringifyBriefing(payload);
}

function stringifyBriefing(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value ?? "");
}
