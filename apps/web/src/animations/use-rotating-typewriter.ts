import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./prefers-reduced-motion";

const DEFAULT_TYPE_MS = 65;
const DEFAULT_DELETE_MS = 35;
const DEFAULT_HOLD_MS = 2200;

type RotatingTypewriterPhase = "typing" | "deleting";

export interface RotatingTypewriterOptions {
  readonly typeMs?: number;
  readonly deleteMs?: number;
  readonly holdMs?: number;
}

export function useRotatingTypewriter(
  keywords: readonly string[],
  options: RotatingTypewriterOptions = {}
) {
  const { typeMs = DEFAULT_TYPE_MS, deleteMs = DEFAULT_DELETE_MS, holdMs = DEFAULT_HOLD_MS } = options;
  const staticMode = prefersReducedMotion() || keywords.length <= 1;
  const firstKeyword = keywords[0] ?? "";

  const [keywordIndex, setKeywordIndex] = useState(0);
  const [displayed, setDisplayed] = useState(staticMode ? firstKeyword : "");
  const [phase, setPhase] = useState<RotatingTypewriterPhase>("typing");

  useEffect(() => {
    if (staticMode) {
      setDisplayed(keywords[0] ?? "");
      return;
    }

    const target = keywords[keywordIndex] ?? "";

    if (phase === "typing") {
      if (displayed === target) {
        const holdTimer = window.setTimeout(() => setPhase("deleting"), holdMs);
        return () => window.clearTimeout(holdTimer);
      }

      const typeTimer = window.setTimeout(() => {
        setDisplayed(target.slice(0, displayed.length + 1));
      }, typeMs);

      return () => window.clearTimeout(typeTimer);
    }

    if (displayed === "") {
      setKeywordIndex((current) => (current + 1) % keywords.length);
      setPhase("typing");
      return;
    }

    const deleteTimer = window.setTimeout(() => {
      setDisplayed((current) => current.slice(0, -1));
    }, deleteMs);

    return () => window.clearTimeout(deleteTimer);
  }, [staticMode, keywords, keywordIndex, displayed, phase, typeMs, deleteMs, holdMs]);

  return {
    displayed,
    showCaret: !staticMode
  };
}
