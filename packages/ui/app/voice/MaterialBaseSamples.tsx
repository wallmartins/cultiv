import { Mono, Panel, Serif } from "../primitives/index.js";

export interface MaterialBaseSampleVM {
  readonly q: string;
  readonly meta: string;
}

export interface MaterialBaseSamplesProps {
  readonly heading: string;
  readonly totalExamples: number;
  readonly activeExamples: number;
  readonly excludedExamples: number;
  readonly pinnedExamples: number;
  readonly footnote: string;
  readonly samples?: readonly MaterialBaseSampleVM[];
}

// Prefers real calibration quotes — the author's own stored examples, truncated and labeled by
// the backend — over the count tiles (GAP #13). Falls back to the counts when there's nothing to
// quote yet (e.g. every example excluded), so this card never renders empty.
export function MaterialBaseSamples({
  heading,
  totalExamples,
  activeExamples,
  excludedExamples,
  pinnedExamples,
  footnote,
  samples
}: MaterialBaseSamplesProps) {
  return (
    <Panel className="voice-material-card">
      <Mono as="div" className="voice-material-card-heading">
        {heading}
      </Mono>
      {samples && samples.length > 0 ? (
        <div className="voice-material-samples">
          {samples.map((sample, index) => (
            <div className="voice-sample" key={`${sample.meta}-${index}`}>
              <Serif as="p" size="0.92rem" lineHeight="1.5" className="voice-sample-quote">
                “{sample.q}”
              </Serif>
              <div className="voice-sample-meta">{sample.meta}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="voice-material-stats">
          <Stat value={totalExamples} label="total" />
          <Stat value={activeExamples} label="ativos" />
          <Stat value={excludedExamples} label="excluídos" />
          <Stat value={pinnedExamples} label="fixados" />
        </div>
      )}
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
