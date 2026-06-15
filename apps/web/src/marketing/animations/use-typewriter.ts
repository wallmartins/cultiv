import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export function useTypewriter(text: string, speedMs = 70) {
  const [value, setValue] = useState(prefersReducedMotion() ? text : "");

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(text);
      return;
    }

    setValue("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setValue(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speedMs);

    return () => window.clearInterval(timer);
  }, [text, speedMs]);

  return value;
}
