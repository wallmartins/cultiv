import { Mono, Pill } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface CostPreviewBandProps {
  readonly costLabel: string;
  readonly onGenerate: () => void;
  readonly showSkipGenerate?: boolean;
  readonly blockedReason?: string;
}

// Always visible in the thread (design L229–237) — "Gerar agora" here is the skip-remaining-
// questions escape hatch, on by default per breakdown §3 state 4/7. blockedReason (GAP #8's
// canGenerate) replaces the persuasive nudge with the actual reason and disables the CTA.
export function CostPreviewBand({ costLabel, onGenerate, showSkipGenerate = true, blockedReason }: CostPreviewBandProps) {
  const t = useMessages();
  return (
    <div className="generate-cost-row">
      <div className="generate-cost-col">
        <Mono style={{ color: "var(--muted)" }}>{costLabel}</Mono>
        <Mono style={{ color: "var(--dim)" }}>{blockedReason ?? t.generate.costHint}</Mono>
      </div>
      {showSkipGenerate ? (
        <Pill variant="outline" onClick={onGenerate} disabled={Boolean(blockedReason)}>
          {t.generate.generateNow}
        </Pill>
      ) : null}
    </div>
  );
}
