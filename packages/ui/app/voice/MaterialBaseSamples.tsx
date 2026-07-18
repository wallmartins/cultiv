import { Mono, Panel } from "../primitives/index.js";

export interface MaterialBaseSamplesProps {
  readonly heading: string;
  readonly totalExamples: number;
  readonly activeExamples: number;
  readonly excludedExamples: number;
  readonly pinnedExamples: number;
  readonly footnote: string;
}

// The screen view only exposes example counts, not the calibration prompts themselves — this
// reads the real breakdown (active/excluded/pinned) rather than fabricating sample quotes.
export function MaterialBaseSamples({
  heading,
  totalExamples,
  activeExamples,
  excludedExamples,
  pinnedExamples,
  footnote
}: MaterialBaseSamplesProps) {
  return (
    <Panel className="voice-material-card">
      <Mono as="div" className="voice-material-card-heading">
        {heading}
      </Mono>
      <div className="voice-material-stats">
        <Stat value={totalExamples} label="total" />
        <Stat value={activeExamples} label="ativos" />
        <Stat value={excludedExamples} label="excluídos" />
        <Stat value={pinnedExamples} label="fixados" />
      </div>
      <div className="voice-material-footnote">{footnote}</div>
    </Panel>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="voice-material-stat">
      <span className="voice-material-stat-value">{value}</span>
      <span className="voice-material-stat-label">{label}</span>
    </div>
  );
}
