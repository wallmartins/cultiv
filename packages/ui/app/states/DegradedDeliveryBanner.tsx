import { Banner, Pill, Ring } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

// Local mirror of the contract type — packages/ui is a zero-dependency leaf (ui: Set([])) and
// must not import @my-ai-orchestrator/contracts. Container passes the real contract value in.
export type GenerationLengthTier = "short" | "medium" | "long";

export interface DegradedDeliveryBannerProps {
  readonly requestedTier: GenerationLengthTier;
  readonly requestedWords: number;
  readonly deliveredWords: number;
  readonly onRedoFree: () => void;
}

// 1a (Apêndice A) — the delivery came in short; never withheld, always offered a free redo
// (credits are refunded server-side, not debited from here).
export function DegradedDeliveryBanner({ requestedTier, requestedWords, deliveredWords, onRedoFree }: DegradedDeliveryBannerProps) {
  const t = useMessages();
  return (
    <Banner
      tone="warning"
      icon={<Ring value={requestedWords > 0 ? deliveredWords / requestedWords : 0} size={20} width={2} tone="warning" />}
      action={
        <Pill variant="outline" tone="warning" onClick={onRedoFree} style={{ whiteSpace: "nowrap" }}>
          {t.states.degradedDelivery.redoFree}
        </Pill>
      }
    >
      <div style={{ fontWeight: 600 }}>{t.states.degradedDelivery.title}</div>
      <div style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.86rem", lineHeight: 1.5, marginTop: 3 }}>
        {t.states.degradedDelivery.body(t.common.length[requestedTier], requestedWords, deliveredWords)}
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
  const t = useMessages();
  return <span style={{ color: "var(--warning)" }}>{t.states.degradedDelivery.wordCount(deliveredWords, requestedWords)}</span>;
}
