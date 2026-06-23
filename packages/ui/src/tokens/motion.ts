export const motionTokens = {
  instant: { duration: 0.1, ease: "power1.out" },
  fast: { duration: 0.18, ease: "power2.out" },
  base: { duration: 0.32, ease: "power2.out" },
  slow: { duration: 0.52, ease: "power2.out" },
  press: { duration: 0.4, ease: "power3.out" },
  reveal: { duration: 0.5, y: 12, ease: "power2.out" },
  hover: { duration: 0.18, ease: "power1.out" },
  stagger: { tight: 0.05, base: 0.085, wide: 0.14 }
} as const;
