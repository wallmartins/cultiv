import { useEffect, useState, type ComponentType } from "react";

export function DeferredAnalytics() {
  const [Analytics, setAnalytics] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      void import("@vercel/analytics/react").then((module) => {
        if (!cancelled) {
          setAnalytics(() => module.Analytics);
        }
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(load, { timeout: 3000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(load, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!Analytics) {
    return null;
  }

  return <Analytics />;
}
