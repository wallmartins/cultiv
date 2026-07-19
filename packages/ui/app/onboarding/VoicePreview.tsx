import { ConfidenceRing, VoiceDescriptorChips, VoiceProseCard } from "../voice/index.js";
import { Serif } from "../primitives/index.js";
import type { VoicePreviewVM } from "./types.js";

export interface VoicePreviewProps {
  readonly preview: VoicePreviewVM;
}

export function VoicePreview({ preview }: VoicePreviewProps) {
  return (
    <div className="wizard-voice-preview">
      <div className="wizard-voice-preview-summary">
        <ConfidenceRing value={preview.ringValue} caption={preview.ringCaption} size={88} eyebrow="confiança" />
        <Serif as="h2" size="1.4rem" lineHeight={1.3} className="wizard-voice-preview-headline">
          {preview.headline}
        </Serif>
      </div>
      <div className="wizard-voice-preview-prose">
        <VoiceProseCard heading="Como você pensa" body={preview.proseCore} />
        {preview.proseDevelopment ? <VoiceProseCard heading="Como você constrói" body={preview.proseDevelopment} /> : null}
      </div>
      <VoiceDescriptorChips chips={preview.descriptorChips} />
    </div>
  );
}
