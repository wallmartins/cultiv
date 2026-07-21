import { useMessages } from "../i18n/index.js";
import { Mono, Panel } from "../primitives/index.js";
import type { CoverageItemVM } from "./types.js";

export interface MaterialBaseCoverageProps {
  readonly coverage: readonly CoverageItemVM[];
  readonly nextStep: string;
}

export function MaterialBaseCoverage({ coverage, nextStep }: MaterialBaseCoverageProps) {
  const t = useMessages();

  return (
    <Panel className="voice-material-card voice-coverage-card">
      <Mono as="div" className="voice-material-card-heading">
        {t.voice.coverage.heading}
      </Mono>
      {coverage.length === 0 ? (
        <div className="voice-coverage-empty">{t.voice.coverage.empty}</div>
      ) : (
        coverage.map((item) => (
          <div key={item.label} className="voice-coverage-row">
            <div className="voice-coverage-row-head">
              <span>{item.label}</span>
              <span className="voice-coverage-caption">{item.caption}</span>
            </div>
            <div className="voice-coverage-track">
              <div className="voice-coverage-fill" style={{ transform: `scaleX(${item.value})` }} />
            </div>
          </div>
        ))
      )}
      <div className="voice-coverage-next">
        <span className="voice-coverage-next-eyebrow">{t.voice.coverage.nextStepEyebrow}</span> {nextStep}
      </div>
    </Panel>
  );
}
