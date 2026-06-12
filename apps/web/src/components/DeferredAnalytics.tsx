import { useEffect, useState, type ComponentType } from "react";

export function DeferredAnalytics() {
  const [Analytics, setAnalytics] = useState<ComponentType | null>(null);
  const [SpeedInsights, setSpeedInsights] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      void Promise.all([
        import("@vercel/analytics/react"),
        import("@vercel/speed-insights/react")
      ]).then(([analyticsModule, speedInsightsModule]) => {
        if (!cancelled) {
          setAnalytics(() => analyticsModule.Analytics);
          setSpeedInsights(() => speedInsightsModule.SpeedInsights);
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

  return (
    <>
      {Analytics ? <Analytics /> : null}
      {SpeedInsights ? <SpeedInsights /> : null}
    </>
  );
}
