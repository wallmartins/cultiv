import type { gsap as GsapNamespace } from "gsap";
import type { ScrollTrigger as ScrollTriggerNamespace } from "gsap/ScrollTrigger";

export type GsapRuntime = {
  readonly gsap: typeof GsapNamespace;
  readonly ScrollTrigger: typeof ScrollTriggerNamespace;
};

let runtimePromise: Promise<GsapRuntime> | null = null;

function importGsapRuntime(): Promise<GsapRuntime> {
  return Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
    ([gsapModule, scrollTriggerModule]) => {
      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger };
    }
  );
}

function scheduleGsapImport(): Promise<GsapRuntime> {
  if (typeof window === "undefined") {
    return importGsapRuntime();
  }

  return new Promise((resolve, reject) => {
    const run = () => {
      void importGsapRuntime().then(resolve).catch(reject);
    };

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(run, { timeout: 1800 });
      return;
    }

    window.setTimeout(run, 1);
  });
}

export function loadGsapRuntime(): Promise<GsapRuntime> {
  runtimePromise ??= scheduleGsapImport();
  return runtimePromise;
}
