import { Chip, Mono, Panel, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import type { ChannelOptionData } from "./types.js";

export interface ChannelPickerProps {
  readonly eyebrow: string;
  readonly prompt: string;
  readonly options: readonly ChannelOptionData[];
  readonly onSelect: (id: string) => void;
  readonly onSkip: () => void;
}

// showChannels (design L208–219) — rich platform vocabulary, mapped to the 4 GenerationChannel
// buckets upstream (container); this only renders the chips + skip. Only explicit input in ADR 0004 §2.
export function ChannelPicker({ eyebrow, prompt, options, onSelect, onSkip }: ChannelPickerProps) {
  const t = useMessages();
  return (
    <Panel className="generate-channel-panel">
      <Mono eyebrow style={{ color: "var(--dim)", marginBottom: 5 }}>
        {eyebrow}
      </Mono>
      <Serif size="1.15rem" lineHeight={1.35} style={{ display: "block", marginBottom: 12 }}>
        {prompt}
      </Serif>
      <div className="generate-channel-chips">
        {options.map((option) => (
          <Chip key={option.id} active={option.active} onClick={() => onSelect(option.id)}>
            {option.label}
          </Chip>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <button type="button" onClick={onSkip} className="mono generate-skip-link">
          {t.generate.channelSkipLink}
        </button>
      </div>
    </Panel>
  );
}
