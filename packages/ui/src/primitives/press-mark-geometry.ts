/** Cultiv Press Mark — Mark of Authorship
 *  Fusion: Modernism (geometric base) + Arts & Crafts (organic stroke) + Minimalism (breathing space)
 */

export type PressMarkVariant = "compact" | "balanced" | "bold";

/** Geometric ring — the stamp pad as pure form (balanced/bold only) */
export const RING_PATH = "M32 6 A26 26 0 1 1 31.99 6";

export const RING_STROKE = {
  compact: 0,
  balanced: 0.9,
  bold: 1.1
} as const;

/** Signature stroke — flowing curve rising from the origin */
export const STROKE_PATH = "M17 48 C21 40 27 31 33 25 C39 19 45 14 51 11";

export const STROKE_COMPACT = "M16 49 C24 34 37 19 52 11";

export const STROKE_BOLD = "M16 47 C22 38 30 27 36 22 C42 17 48 13 53 10";

export const STROKE_BY_VARIANT: Record<PressMarkVariant, string> = {
  compact: STROKE_COMPACT,
  balanced: STROKE_PATH,
  bold: STROKE_BOLD
};

/** Ink drop — origin point of the stroke */
export const INK_DROP = {
  compact: { cx: 15, cy: 50, r: 4.2, halo: 6.5 },
  balanced: { cx: 16, cy: 49, r: 4.8, halo: 7.5 },
  bold: { cx: 15, cy: 48, r: 5.4, halo: 8.5 }
} as const;

export const STROKE_WIDTH = {
  compact: 3.8,
  balanced: 4.2,
  bold: 5
} as const;

/** Ghost — offset stroke for depth */
export const GHOST = {
  compact: { x: 1, y: 0.8, opacity: 0.22, width: 3.2 },
  balanced: { x: 1.2, y: 1, opacity: 0.24, width: 3.8 },
  bold: { x: 1.4, y: 1.1, opacity: 0.28, width: 4.5 }
} as const;

/** Echo — second lighter pass (bold only) */
export const ECHO = {
  compact: null,
  balanced: null,
  bold: { opacity: 0.1, width: 2, path: "M16 47 C23 37 32 26 38 21 C44 16 50 12 53 10" }
} as const;

export const SHOW_RING: Record<PressMarkVariant, boolean> = {
  compact: false,
  balanced: true,
  bold: true
};
