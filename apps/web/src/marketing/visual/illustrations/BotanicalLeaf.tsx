import { cn } from "@my-ai-orchestrator/ui";

/** Botanically inspired silhouettes: ovate, lanceolate, elliptical (deciduous tree leaves). */
export type BotanicalLeafVariant = "ovate" | "lanceolate" | "elliptical";

export interface BotanicalLeafProps {
  readonly className?: string;
  readonly variant?: BotanicalLeafVariant;
}

type LeafArt = {
  readonly viewBox: string;
  readonly petiole: string;
  readonly blade: string;
  readonly veins: readonly string[];
  readonly aspect: number;
};

/**
 * Ovate, egg-shaped, widest toward the base (typical deciduous leaf).
 * Lanceolate, long and narrow, widest in the basal third (willow-like).
 * Elliptical, narrow oval, widest near the middle (beech-like).
 */
const LEAF_ART: Record<BotanicalLeafVariant, LeafArt> = {
  ovate: {
    viewBox: "0 0 24 36",
    petiole: "M12 36 V30.5",
    blade: "M12 30.5 C5.5 28.5 3.5 19.5 12 4.5 C20.5 19.5 18.5 28.5 12 30.5 Z",
    veins: [
      "M12 30.5 V6",
      "M12 23 C9.5 21.5 7 20 5.5 19",
      "M12 19 C14.5 17.5 17 16 18.5 15"
    ],
    aspect: 1.5
  },
  lanceolate: {
    viewBox: "0 0 18 44",
    petiole: "M9 44 V39",
    blade: "M9 39 C6.5 37.5 5.5 24 9 3.5 C12.5 24 11.5 37.5 9 39 Z",
    veins: [
      "M9 39 V5.5",
      "M9 28 C7.5 27 6 25.5 5 24.5",
      "M9 22 C10.5 21 12 19.5 13 18.5"
    ],
    aspect: 2.44
  },
  elliptical: {
    viewBox: "0 0 22 34",
    petiole: "M11 34 V29.5",
    blade: "M11 29.5 C4.5 29.5 3 17.5 11 5 C19 17.5 17.5 29.5 11 29.5 Z",
    veins: [
      "M11 29.5 V6.5",
      "M11 21 C8.5 19.5 6 18 4.5 17",
      "M11 17 C13.5 15.5 16 14 17.5 13"
    ],
    aspect: 1.55
  }
};

export function BotanicalLeaf({ className, variant = "ovate" }: BotanicalLeafProps) {
  const leaf = LEAF_ART[variant];

  return (
    <svg
      viewBox={leaf.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden
      style={{ aspectRatio: `1 / ${leaf.aspect}` }}
    >
      <path
        d={leaf.petiole}
        stroke="currentColor"
        strokeWidth="0.65"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d={leaf.blade}
        stroke="currentColor"
        strokeWidth="0.95"
        strokeLinejoin="round"
        fill="none"
      />
      {leaf.veins.map((vein) => (
        <path
          key={vein}
          d={vein}
          stroke="currentColor"
          strokeWidth="0.45"
          strokeLinecap="round"
          opacity="0.42"
        />
      ))}
    </svg>
  );
}
