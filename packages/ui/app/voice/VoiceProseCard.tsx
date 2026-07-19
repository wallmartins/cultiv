import { Mono, Panel, Serif } from "../primitives/index.js";

export interface VoiceProseCardProps {
  readonly heading: string;
  readonly body: string;
}

const FALLBACK_BODY = "prosa ainda não disponível — recalibrar gera uma nova leitura.";

export function VoiceProseCard({ heading, body }: VoiceProseCardProps) {
  return (
    <Panel dialog className="voice-prose-card">
      <Mono as="div" className="voice-prose-card-heading">
        {heading}
      </Mono>
      <Serif as="p" size="1.08rem" lineHeight="1.6">
        {body || FALLBACK_BODY}
      </Serif>
    </Panel>
  );
}
