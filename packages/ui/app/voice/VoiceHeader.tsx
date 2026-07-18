import { Mono, Serif } from "../primitives/index.js";

export interface VoiceHeaderProps {
  readonly headline: string;
  readonly versionLabel: string;
}

export function VoiceHeader({ headline, versionLabel }: VoiceHeaderProps) {
  return (
    <div className="voice-header-text">
      <Serif as="h1" size="34px" lineHeight="1.12" className="voice-header-headline">
        {headline}
      </Serif>
      <Mono as="div" className="voice-header-meta">
        {versionLabel}
      </Mono>
    </div>
  );
}
