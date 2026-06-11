export interface WaveformScriptProps {
  readonly className?: string;
  readonly script?: string;
}

export function WaveformScript({
  className,
  script = "voz · tom · cadência · você · voz · tom · cadência · você ·"
}: WaveformScriptProps) {
  return (
    <svg viewBox="0 0 480 80" fill="none" className={className} aria-hidden>
      <defs>
        <path
          id="wave-path"
          d="M0 40 C40 20 80 60 120 40 C160 20 200 60 240 40 C280 20 320 60 360 40 C400 20 440 60 480 40"
        />
      </defs>
      <path
        data-draw-stroke
        d="M0 40 C40 20 80 60 120 40 C160 20 200 60 240 40 C280 20 320 60 360 40 C400 20 440 60 480 40"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
      />
      <text fontFamily="Caveat, cursive" fontSize="14" fill="currentColor" opacity="0.55">
        <textPath href="#wave-path" startOffset="2%">
          {script}
        </textPath>
      </text>
      <circle cx="120" cy="40" r="2" fill="currentColor" className="text-golden" opacity="0.9" />
      <circle cx="360" cy="40" r="2" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
