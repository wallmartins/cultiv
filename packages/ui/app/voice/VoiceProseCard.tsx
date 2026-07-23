import { useMessages } from "../i18n/index.js";
import { Mono, Panel, Serif } from "../primitives/index.js";

export interface VoiceProseCardProps {
  readonly heading: string;
  readonly body: string;
}

export function VoiceProseCard({ heading, body }: VoiceProseCardProps) {
  const t = useMessages();
  return (
    <Panel dialog className="voice-prose-card">
      <Mono as="div" className="voice-prose-card-heading">
        {heading}
      </Mono>
      <Serif as="p" size="1.08rem" lineHeight="1.6">
        {body || t.voice.proseFallback}
      </Serif>
    </Panel>
  );
}
