import { Mono, Pill, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface WelcomeBridgeProps {
  readonly onContinue: () => void;
  readonly onSkipTour: () => void;
}

export function WelcomeBridge({ onContinue, onSkipTour }: WelcomeBridgeProps) {
  const t = useMessages();
  return (
    <div className="wizard-welcome-bridge">
      <Mono eyebrow className="wizard-step-eyebrow">
        {t.onboarding.bridge.eyebrow}
      </Mono>
      <Serif as="h1" size="2rem" lineHeight={1.2} className="wizard-welcome-headline">
        {t.onboarding.voiceReady}
      </Serif>
      <ul className="wizard-welcome-highlights">
        {t.onboarding.bridge.highlights.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="wizard-step-footer">
        <Pill variant="secondary" onClick={onSkipTour}>
          {t.onboarding.bridge.skipTour}
        </Pill>
        <Pill variant="primary" onClick={onContinue}>
          {t.onboarding.bridge.startWriting}
        </Pill>
      </div>
    </div>
  );
}
