import { Banner, Pill, Ring } from "../primitives/index.js";

// Local mirror of the contract type — packages/ui is a zero-dependency leaf (ui: Set([])) and
// must not import @my-ai-orchestrator/contracts. Container passes the real contract value in.
export type GenerationLengthTier = "short" | "medium" | "long";

const LENGTH_LABEL: Record<GenerationLengthTier, string> = { short: "Curto", medium: "Médio", long: "Longo" };

export interface DegradedDeliveryBannerProps {
  readonly requestedTier: GenerationLengthTier;
  readonly requestedWords: number;
  readonly deliveredWords: number;
  readonly onRedoFree: () => void;
}

// 1a (Apêndice A) — the delivery came in short; never withheld, always offered a free redo
// (credits are refunded server-side, not debited from here).
export function DegradedDeliveryBanner({ requestedTier, requestedWords, deliveredWords, onRedoFree }: DegradedDeliveryBannerProps) {
  return (
    <Banner
      tone="warning"
      icon={<Ring value={requestedWords > 0 ? deliveredWords / requestedWords : 0} size={20} width={2} tone="warning" />}
      action={
        <Pill variant="outline" tone="warning" onClick={onRedoFree} style={{ whiteSpace: "nowrap" }}>
          Refazer grátis →
        </Pill>
      }
    >
      <div style={{ fontWeight: 600 }}>Este texto saiu abaixo do combinado</div>
      <div style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.86rem", lineHeight: 1.5, marginTop: 3 }}>
        Você pediu {LENGTH_LABEL[requestedTier]} (~{requestedWords} palavras); saíram {deliveredWords}.
        Entregamos mesmo assim — pode servir. Refazer não custa créditos.
      </div>
    </Banner>
  );
}

export interface DegradedWordCountProps {
  readonly requestedWords: number;
  readonly deliveredWords: number;
}

// Meta-line fragment ("340 de ~900 palavras") for ExecutionDetail's existing Mono line — kept
// here so the --warning literal stays inside a filename the fidelity allowlist recognizes.
export function DegradedWordCount({ requestedWords, deliveredWords }: DegradedWordCountProps) {
  return (
    <span style={{ color: "var(--warning)" }}>
      {deliveredWords} de ~{requestedWords} palavras
    </span>
  );
}
