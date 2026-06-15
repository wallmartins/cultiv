import { useEffect, type RefObject } from "react";
import type { BotanicalLeafVariant } from "~/marketing/visual/illustrations/BotanicalLeaf";
import { loadGsapRuntime, type GsapRuntime } from "./gsap-runtime";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export type FallingLeavesDensity = "hero" | "sparse" | "whisper";

export type LeafPreset = {
  readonly left: string;
  readonly sizeDesktop: number;
  readonly sizeMobile: number;
  readonly variant: BotanicalLeafVariant;
  readonly delay: number;
  readonly duration: number;
  readonly drift: number;
  readonly spin: number;
  readonly maxOpacity: number;
};

export const FALLING_LEAF_PRESETS: Record<FallingLeavesDensity, readonly LeafPreset[]> = {
  hero: [
    { left: "8%", sizeDesktop: 46, sizeMobile: 30, variant: "ovate", delay: 0, duration: 13, drift: 28, spin: 42, maxOpacity: 0.52 },
    { left: "84%", sizeDesktop: 28, sizeMobile: 22, variant: "lanceolate", delay: 1.2, duration: 14, drift: -26, spin: -38, maxOpacity: 0.48 },
    { left: "26%", sizeDesktop: 38, sizeMobile: 28, variant: "elliptical", delay: 2.8, duration: 12, drift: 20, spin: 50, maxOpacity: 0.5 },
    { left: "68%", sizeDesktop: 42, sizeMobile: 30, variant: "ovate", delay: 0.6, duration: 13.5, drift: -30, spin: -46, maxOpacity: 0.54 },
    { left: "44%", sizeDesktop: 24, sizeMobile: 20, variant: "lanceolate", delay: 4, duration: 15, drift: 12, spin: 34, maxOpacity: 0.46 },
    { left: "18%", sizeDesktop: 34, sizeMobile: 26, variant: "elliptical", delay: 5.5, duration: 12.5, drift: 24, spin: -32, maxOpacity: 0.47 },
    { left: "56%", sizeDesktop: 40, sizeMobile: 28, variant: "ovate", delay: 3.2, duration: 14.5, drift: -18, spin: 40, maxOpacity: 0.51 },
    { left: "36%", sizeDesktop: 26, sizeMobile: 21, variant: "lanceolate", delay: 6.8, duration: 13, drift: 16, spin: -28, maxOpacity: 0.44 },
    { left: "74%", sizeDesktop: 36, sizeMobile: 27, variant: "elliptical", delay: 7.5, duration: 12, drift: 22, spin: 36, maxOpacity: 0.49 },
    { left: "92%", sizeDesktop: 30, sizeMobile: 23, variant: "lanceolate", delay: 2, duration: 14, drift: -20, spin: -42, maxOpacity: 0.45 }
  ],
  sparse: [
    { left: "5%", sizeDesktop: 34, sizeMobile: 26, variant: "ovate", delay: 0, duration: 16, drift: 20, spin: 36, maxOpacity: 0.34 },
    { left: "92%", sizeDesktop: 28, sizeMobile: 22, variant: "lanceolate", delay: 3, duration: 17, drift: -18, spin: -30, maxOpacity: 0.32 },
    { left: "52%", sizeDesktop: 24, sizeMobile: 20, variant: "elliptical", delay: 6, duration: 15, drift: 10, spin: 24, maxOpacity: 0.3 },
    { left: "28%", sizeDesktop: 32, sizeMobile: 24, variant: "ovate", delay: 8.5, duration: 16.5, drift: 14, spin: -26, maxOpacity: 0.31 },
    { left: "76%", sizeDesktop: 22, sizeMobile: 19, variant: "lanceolate", delay: 10, duration: 14, drift: -12, spin: 28, maxOpacity: 0.28 }
  ],
  whisper: [
    { left: "90%", sizeDesktop: 26, sizeMobile: 20, variant: "lanceolate", delay: 2, duration: 18, drift: -14, spin: -20, maxOpacity: 0.26 },
    { left: "12%", sizeDesktop: 22, sizeMobile: 18, variant: "elliptical", delay: 7, duration: 19, drift: 12, spin: 22, maxOpacity: 0.24 }
  ]
};

export function leafWidthStyle(preset: LeafPreset): string {
  return `clamp(${preset.sizeMobile}px, ${(preset.sizeDesktop * 0.11).toFixed(2)}vw, ${preset.sizeDesktop}px)`;
}

function getFallTargetY(container: HTMLElement): number {
  return container.clientHeight + 48;
}

type LeafSpawn = {
  readonly left: string;
  readonly y: number;
};

function randomHeroSpawn(container: HTMLElement): LeafSpawn {
  const height = container.clientHeight;
  const topInset = 28;

  return {
    left: `${4 + Math.random() * 92}%`,
    y: -topInset + Math.random() * (height * 0.72 + topInset)
  };
}

function presetSpawn(preset: LeafPreset): LeafSpawn {
  return { left: preset.left, y: -40 };
}

function resetLeaf(
  gsap: GsapRuntime["gsap"],
  leaf: HTMLElement,
  preset: LeafPreset,
  container: HTMLElement,
  randomSpawn: boolean
): void {
  const spawn = randomSpawn ? randomHeroSpawn(container) : presetSpawn(preset);

  gsap.set(leaf, {
    left: spawn.left,
    y: spawn.y,
    x: 0,
    opacity: 0,
    rotate: preset.spin * -0.2,
    force3D: true
  });
}

function animateLeaf(
  gsap: GsapRuntime["gsap"],
  leaf: HTMLElement,
  preset: LeafPreset,
  container: HTMLElement,
  delay: number,
  randomSpawn: boolean
) {
  const timeline = gsap.timeline({ repeat: -1, delay });

  timeline.call(() => resetLeaf(gsap, leaf, preset, container, randomSpawn));
  timeline.to(leaf, { opacity: preset.maxOpacity, duration: 0.9, ease: "power1.in" });
  timeline.to(leaf, {
    y: () => getFallTargetY(container),
    x: preset.drift,
    rotate: preset.spin,
    duration: preset.duration,
    ease: "none"
  });
  timeline.to(leaf, { opacity: 0, duration: 1.2, ease: "power1.out" }, `-=${1.2}`);

  return timeline;
}

export function useFallingLeaves(
  containerRef: RefObject<HTMLElement | null>,
  density: FallingLeavesDensity
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const leaves = container.querySelectorAll<HTMLElement>("[data-falling-leaf]");
    if (leaves.length === 0) {
      return;
    }

    const presets = FALLING_LEAF_PRESETS[density];
    const randomSpawn = density === "hero";
    let cancelled = false;
    let contextRevert: (() => void) | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let frame = 0;

    const mountAnimations = (gsap: GsapRuntime["gsap"]) => {
      if (cancelled || container.clientHeight < 80) {
        return;
      }

      contextRevert?.();
      const context = gsap.context(() => {
        if (prefersReducedMotion()) {
          leaves.forEach((leaf, index) => {
            const preset = presets[index];
            if (!preset) {
              return;
            }

            const spawn = randomSpawn ? randomHeroSpawn(container) : presetSpawn(preset);

            gsap.set(leaf, {
              left: spawn.left,
              opacity: preset.maxOpacity * 0.75,
              y: spawn.y,
              rotate: preset.spin * 0.15
            });
          });
          return;
        }

        leaves.forEach((leaf, index) => {
          const preset = presets[index];
          if (!preset) {
            return;
          }

          gsap.set(leaf, { opacity: 0 });
          animateLeaf(gsap, leaf, preset, container, preset.delay, randomSpawn);
        });
      }, container);

      contextRevert = () => context.revert();
    };

    void loadGsapRuntime().then(({ gsap }) => {
      if (cancelled) {
        return;
      }

      frame = requestAnimationFrame(() => {
        mountAnimations(gsap);
      });

      resizeObserver = new ResizeObserver(() => {
        mountAnimations(gsap);
      });
      resizeObserver.observe(container);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      contextRevert?.();
    };
  }, [containerRef, density]);
}
