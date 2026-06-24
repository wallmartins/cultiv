/** Cultiv Compass Mark — Cartography signature
 *  Fusion: Modernism (precise ring) + Pen strokes (organic cardinals) + Minimalism (16px legibility)
 */

export type CompassMarkVariant = "symbol" | "horizontal" | "vertical";
export type CompassMarkColor = "deep-blue" | "ochre" | "white";

export const VIEWBOX = "0 0 64 64";

/** Modernist compass ring — precise, minimal */
export const RING_PATH = "M32 10 A22 22 0 1 1 31.99 10";

/** Pen-like cardinal strokes — organic curves with round caps */
export const CARDINAL_PATHS = {
  north: "M31.2 8.5 C31.8 12 32.4 16.5 32 21.5",
  east: "M55.5 31.2 C51 31.8 46.5 32.4 42.5 32",
  south: "M32.8 55.5 C32.2 51 31.6 46.5 32 41.5",
  west: "M8.5 32.8 C12 32.2 16.5 31.6 21.5 32"
} as const;

export const CARDINAL_ORDER = ["north", "east", "south", "west"] as const;
export type CardinalDirection = (typeof CARDINAL_ORDER)[number];

/** Center location mark — concentric ring + cross */
export const CENTER_RING = "M32 28 A4 4 0 1 1 31.99 28";
export const CENTER_CROSS = "M32 29.5 V34.5 M29.5 32 H34.5";

export const STROKE_WIDTH = 1.5;
export const RING_STROKE_WIDTH = 1;

export const COLOR_VALUES: Record<CompassMarkColor, string> = {
  "deep-blue": "var(--color-deep-blue)",
  ochre: "var(--color-ochre)",
  white: "#ffffff"
};
