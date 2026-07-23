import { ConfidenceRing, VoiceDescriptorChips, VoiceProseCard } from "../voice/index.js";
import { Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import type { VoicePreviewVM } from "./types.js";

export interface VoicePreviewProps {
  readonly preview: VoicePreviewVM;
}

export function VoicePreview({ preview }: VoicePreviewProps) {
  const t = useMessages();
  return (
    <div className="wizard-voice-preview">
      <div className="wizard-voice-preview-summary">
        <ConfidenceRing
          value={preview.ringValue}
          caption={preview.ringCaption}
          size={88}
          eyebrow={t.onboarding.voicePreview.confidenceEyebrow}
        />
        <Serif as="h2" size="1.4rem" lineHeight={1.3} className="wizard-voice-preview-headline">
          {preview.headline}
        </Serif>
      </div>
      <div className="wizard-voice-preview-prose">
        <VoiceProseCard heading={t.onboarding.voicePreview.core} body={preview.proseCore} />
        {preview.proseDevelopment ? (
          <VoiceProseCard heading={t.onboarding.voicePreview.development} body={preview.proseDevelopment} />
        ) : null}
      </div>
      <VoiceDescriptorChips chips={preview.descriptorChips} />
    </div>
  );
}
