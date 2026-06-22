export const motionTokens = {
  instant: { duration: 0.1, ease: "power1.out" },
  fast: { duration: 0.2, ease: "power2.out" },
  base: { duration: 0.35, ease: "power2.out" },
  slow: { duration: 0.6, ease: "power2.out" },
  press: { duration: 0.45, ease: "power3.out" },
  reveal: { duration: 0.6, y: 12, ease: "power2.out" },
  hover: { duration: 0.1, ease: "power1.out" },
  stagger: { tight: 0.06, base: 0.1, wide: 0.15 }
} as const;
