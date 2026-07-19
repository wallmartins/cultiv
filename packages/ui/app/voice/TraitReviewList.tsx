import { Mono, Serif } from "../primitives/index.js";
import { TraitRow } from "./TraitRow.js";
import type { TraitVM } from "./types.js";

export interface TraitReviewListProps {
  readonly traits: readonly TraitVM[];
  readonly onConfirm: (traitKey: string) => void;
  readonly onContest: (traitKey: string) => void;
  readonly pendingTraitKey?: string;
}

export function TraitReviewList({ traits, onConfirm, onContest, pendingTraitKey }: TraitReviewListProps) {
  return (
    <div className="voice-traits-section">
      <div className="voice-traits-heading-row">
        <Serif as="h2" size="24px" className="voice-traits-heading">
          Os 7 traços da sua voz
        </Serif>
        <Mono as="span" className="voice-traits-hint">
          confirmar ou contestar afina a voz
        </Mono>
      </div>
      <div className="voice-trait-list">
        {traits.map((trait) => (
          <TraitRow
            key={trait.traitKey}
            trait={trait}
            pending={trait.traitKey === pendingTraitKey}
            onConfirm={() => onConfirm(trait.traitKey)}
            onContest={() => onContest(trait.traitKey)}
          />
        ))}
      </div>
    </div>
  );
}
