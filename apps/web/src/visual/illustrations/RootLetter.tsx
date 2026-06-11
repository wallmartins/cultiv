export interface RootLetterProps {
  readonly letter?: string;
  readonly className?: string;
}

export function RootLetter({ letter = "C", className }: RootLetterProps) {
  return (
    <svg
      viewBox="0 0 160 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        data-draw-stroke
        d="M48 170 C32 158 20 142 12 124 C8 114 6 102 8 90 C12 68 28 52 50 46 C72 40 94 48 108 64 C118 76 122 92 118 108"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        data-draw-stroke
        d="M12 124 C4 118 2 108 6 98 M20 142 C14 136 10 128 12 118"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.45"
      />
      <circle cx="6" cy="98" r="1.8" fill="currentColor" opacity="0.65" />
      <text
        x="72"
        y="108"
        fill="currentColor"
        fontFamily="Playfair Display, serif"
        fontSize="72"
        fontStyle="italic"
        opacity="0.92"
      >
        {letter}
      </text>
      <path
        d="M108 64 C114 58 120 52 128 48"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <path
        data-botanical-upright
        d="M128 48 C126 40 128 34 132 28 C136 34 138 40 136 48 C132 52 128 52 128 48 Z"
        stroke="currentColor"
        strokeWidth="0.9"
        fill="none"
        style={{ transformOrigin: "132px 38px" }}
      />
    </svg>
  );
}
