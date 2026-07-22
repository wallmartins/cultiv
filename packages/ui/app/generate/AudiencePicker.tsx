import type { KeyboardEvent } from "react";
import { Chip, Mono, Panel, Pill, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface AudiencePickerProps {
  readonly eyebrow: string;
  readonly prompt: string;
  readonly options: readonly string[];
  readonly onSelect: (audience: string) => void;
  readonly onUseCommonDenominator: () => void;
  readonly addValue: string;
  readonly onAddChange: (value: string) => void;
  readonly onAddSubmit: () => void;
}

// F4-2 (ADR 0010 §6) — narrows to one of the author's OWN declared audiences, one step before the
// questions; picking a chip advances immediately (there's nothing else to confirm). Declining
// (the skip link) folds every declared audience into one common-denominator descriptor instead of
// narrowing. "+ adicionar público" is ephemeral — this generation only, never persisted.
export function AudiencePicker({
  eyebrow,
  prompt,
  options,
  onSelect,
  onUseCommonDenominator,
  addValue,
  onAddChange,
  onAddSubmit
}: AudiencePickerProps) {
  const t = useMessages();
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onAddSubmit();
  }

  return (
    <Panel className="generate-audience-panel">
      <Mono eyebrow style={{ color: "var(--dim)", marginBottom: 5 }}>
        {eyebrow}
      </Mono>
      <Serif size="1.15rem" lineHeight={1.35} style={{ display: "block", marginBottom: 12 }}>
        {prompt}
      </Serif>
      <div className="generate-audience-chips">
        {options.map((audience) => (
          <Chip key={audience} onClick={() => onSelect(audience)}>
            {audience}
          </Chip>
        ))}
      </div>
      <div className="generate-audience-add">
        <input
          value={addValue}
          onChange={(event) => onAddChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.generate.audienceAddPlaceholder}
        />
        <Pill variant="secondary" onClick={onAddSubmit} disabled={!addValue.trim()}>
          {t.generate.audienceAddAction}
        </Pill>
      </div>
      <div style={{ marginTop: 10 }}>
        <button type="button" onClick={onUseCommonDenominator} className="mono generate-skip-link">
          {t.generate.audienceSkipLink}
        </button>
      </div>
    </Panel>
  );
}
