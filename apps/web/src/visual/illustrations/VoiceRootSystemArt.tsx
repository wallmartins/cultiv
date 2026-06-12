import { VOICE_ROOT_SILHOUETTE_PATH } from "./voice-root-silhouette-path";

/**
 * Traced from the reference taproot silhouette (potrace).
 * Timeline anchors follow the primary axis: step 01 at the root tip, step 05
 * near the crown, output label at the top.
 */
export const VOICE_ROOT_VIEWBOX = {
  width: 600,
  height: 600
} as const;

export const VOICE_ROOT_OUTPUT_ANCHOR = {
  x: 300,
  y: 46
} as const;

export const VOICE_ROOT_NODE_POSITIONS = [
  { x: 286, y: 552, side: "right" as const },
  { x: 294, y: 458, side: "left" as const },
  { x: 300, y: 364, side: "right" as const },
  { x: 302, y: 270, side: "left" as const },
  { x: 304, y: 176, side: "right" as const }
] as const;

export interface VoiceRootSystemArtProps {
  readonly className?: string;
  readonly variant?: "desktop" | "compact";
}

export function VoiceRootSystemArt({ className, variant = "desktop" }: VoiceRootSystemArtProps) {
  if (variant === "compact") {
    return (
      <svg
        viewBox={`0 0 ${VOICE_ROOT_VIEWBOX.width} ${VOICE_ROOT_VIEWBOX.height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d={VOICE_ROOT_SILHOUETTE_PATH}
          fill="currentColor"
          fillRule="evenodd"
          opacity="0.9"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${VOICE_ROOT_VIEWBOX.width} ${VOICE_ROOT_VIEWBOX.height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d={VOICE_ROOT_SILHOUETTE_PATH}
        className="voice-root-timeline__silhouette"
        fill="currentColor"
        fillRule="evenodd"
        opacity="0.97"
      />
    </svg>
  );
}
