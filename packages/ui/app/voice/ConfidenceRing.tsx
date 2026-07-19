import { Mono, Ring, type RingTone } from "../primitives/index.js";

export interface ConfidenceRingProps {
  readonly value: number;
  readonly caption: string;
  readonly tone?: RingTone;
  readonly size?: number;
  /** Route-only "CONFIANÇA" sub-label under the number; omitted at companion size. */
  readonly eyebrow?: string;
}

// Miolo em Fraunces (var(--font-ui)), nunca Instrument Serif — Serif primitive é a fonte errada aqui.
export function ConfidenceRing({ value, caption, tone = "accent", size = 96, eyebrow }: ConfidenceRingProps) {
  return (
    <Ring value={value} size={size} width={size >= 80 ? 4 : 3} tone={tone}>
      <span className="confidence-ring-body">
        <span className="confidence-ring-value" style={{ fontSize: size >= 80 ? "1.6rem" : "0.98rem" }}>
          {caption}
        </span>
        {eyebrow ? (
          <Mono as="span" className="confidence-ring-eyebrow">
            {eyebrow}
          </Mono>
        ) : null}
      </span>
    </Ring>
  );
}
