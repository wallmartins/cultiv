import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { prefersReducedMotion } from "./prefers-reduced-motion";

type LenisProviderComponent = ComponentType<{ readonly children: ReactNode }>;

export interface DeferredLenisProviderProps {
  readonly children: ReactNode;
}

export function DeferredLenisProvider({ children }: DeferredLenisProviderProps) {
  const [LenisProvider, setLenisProvider] = useState<LenisProviderComponent | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    let cancelled = false;

    const loadLenis = () => {
      if (cancelled) {
        return;
      }

      void import("./lenis-provider").then((module) => {
        if (!cancelled) {
          setLenisProvider(() => module.LenisProvider);
        }
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(loadLenis);
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(loadLenis, 1);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!LenisProvider) {
    return children;
  }

  return <LenisProvider>{children}</LenisProvider>;
}
