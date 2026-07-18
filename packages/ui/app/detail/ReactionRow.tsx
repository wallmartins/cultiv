import { Chip, Mono } from "../primitives/index.js";
import type { ExecutionReactionValue } from "./types.js";

export interface ReactionRowProps {
  readonly value: ExecutionReactionValue | null;
  readonly onReact: (value: ExecutionReactionValue) => void;
  readonly pending?: boolean;
}

// "soou como você?" — clicking the already-selected pill clears it (toggle), the other submits.
export function ReactionRow({ value, onReact, pending = false }: ReactionRowProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <Mono style={{ color: "var(--dim)" }}>soou como você?</Mono>
      <Chip
        tone={value === "up" ? "accent" : undefined}
        aria-pressed={value === "up"}
        disabled={pending}
        onClick={() => onReact("up")}
      >
        Confere
      </Chip>
      <Chip
        tone={value === "down" ? "danger" : undefined}
        aria-pressed={value === "down"}
        disabled={pending}
        onClick={() => onReact("down")}
      >
        Nem tanto
      </Chip>
      {value ? (
        <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontStyle: "italic" }}>obrigado — isso afina a sua voz</span>
      ) : null}
    </div>
  );
}
