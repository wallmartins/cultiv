import { Mono, Serif } from "../primitives/index.js";
import type { ExecutionReactionValue, GenerationLengthTier } from "./types.js";
import { DegradedDeliveryBanner, DegradedWordCount } from "../states/index.js";
import { ReactionRow } from "./ReactionRow.js";
import { VoiceAlignmentBand } from "./VoiceAlignmentBand.js";

export interface ExecutionDetailAlignment {
  readonly confidenceValue: number;
  readonly traits: readonly string[];
  readonly rules: readonly string[];
  readonly antiPatterns: readonly string[];
}

// 1a (Apêndice A) — present only when the delivery came in short; ExecutionDetail gates the
// banner itself on deliveredWords < requestedWords so callers just pass the numbers.
export interface ExecutionDetailDegraded {
  readonly requestedTier: GenerationLengthTier;
  readonly requestedWords: number;
  readonly deliveredWords: number;
  readonly onRedoFree: () => void;
}

export interface ExecutionDetailProps {
  readonly meta: string;
  readonly usedFallbackVoiceProfile: boolean;
  readonly topic: string;
  readonly paragraphs: readonly string[];
  readonly alignment: ExecutionDetailAlignment;
  readonly alignmentOpen: boolean;
  readonly onToggleAlignment: () => void;
  readonly onSeeVoiceProfile: () => void;
  readonly reaction: ExecutionReactionValue | null;
  readonly onReact: (value: ExecutionReactionValue) => void;
  readonly reactionPending?: boolean;
  readonly degraded?: ExecutionDetailDegraded;
}

// dDone (design L~980+) — the generated text is the hero; the topic (never the format) is the h1.
export function ExecutionDetail({
  meta,
  usedFallbackVoiceProfile,
  topic,
  paragraphs,
  alignment,
  alignmentOpen,
  onToggleAlignment,
  onSeeVoiceProfile,
  reaction,
  onReact,
  reactionPending,
  degraded
}: ExecutionDetailProps) {
  const isDegraded = degraded !== undefined && degraded.deliveredWords < degraded.requestedWords;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 48px 48px" }}>
      <div style={{ width: "100%", maxWidth: 680, display: "flex", flexDirection: "column", gap: 20 }}>
        {isDegraded && degraded ? (
          <DegradedDeliveryBanner
            requestedTier={degraded.requestedTier}
            requestedWords={degraded.requestedWords}
            deliveredWords={degraded.deliveredWords}
            onRedoFree={degraded.onRedoFree}
          />
        ) : null}
        <Mono style={{ color: "var(--muted)" }}>
          {meta}
          {isDegraded && degraded ? (
            <>
              {" · "}
              <DegradedWordCount requestedWords={degraded.requestedWords} deliveredWords={degraded.deliveredWords} />
            </>
          ) : null}
        </Mono>
        {usedFallbackVoiceProfile ? <Mono style={{ color: "var(--dim)" }}>voz de demonstração</Mono> : null}
        <Serif as="h1" size="34px" lineHeight={1.15} style={{ letterSpacing: "-0.01em", margin: 0 }}>
          {topic}
        </Serif>
        <div style={{ borderTop: "1px solid var(--line)" }} />
        <div style={{ maxWidth: 620 }}>
          {paragraphs.map((text, index) => (
            <Serif key={index} as="p" size="1.18rem" lineHeight={1.7} style={{ margin: "0 0 1.1em", color: "var(--ink)" }}>
              {text}
            </Serif>
          ))}
        </div>
        <VoiceAlignmentBand
          open={alignmentOpen}
          onToggle={onToggleAlignment}
          confidenceValue={alignment.confidenceValue}
          traits={alignment.traits}
          rules={alignment.rules}
          antiPatterns={alignment.antiPatterns}
          onSeeProfile={onSeeVoiceProfile}
        />
        <ReactionRow value={reaction} onReact={onReact} pending={reactionPending} />
      </div>
    </div>
  );
}
