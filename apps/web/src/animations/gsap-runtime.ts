import type { gsap as GsapNamespace } from "gsap";
import type { ScrollTrigger as ScrollTriggerNamespace } from "gsap/ScrollTrigger";

export type GsapRuntime = {
  readonly gsap: typeof GsapNamespace;
  readonly ScrollTrigger: typeof ScrollTriggerNamespace;
};

let runtimePromise: Promise<GsapRuntime> | null = null;

export function loadGsapRuntime(): Promise<GsapRuntime> {
  runtimePromise ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
    ([gsapModule, scrollTriggerModule]) => {
      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger };
    }
  );

  return runtimePromise;
}
