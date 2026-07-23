import type { AppMessages } from "./messages/index.js";

// Voice signals arrive as raw backend slugs (`first-person`, `prefer_first_person_when_relevant`)
// mixed with free text — antiPatterns have no closed set, since they come from the author's own
// examples and from the model's reasoning. Known slugs get a translated label; anything else is
// humanized so no raw enum reaches the DOM.
export function voiceSignalLabel(t: AppMessages, value: string): string {
  const known = (t.voiceSignals as Record<string, string | undefined>)[value.trim().toLowerCase()];
  if (known) return known;
  const spaced = value.includes(" ") ? value : value.replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
