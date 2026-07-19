import { Mono, Pill, Serif } from "../primitives/index.js";

export interface WelcomeBridgeProps {
  readonly onContinue: () => void;
  readonly onSkipTour: () => void;
}

const TOUR_HIGHLIGHTS = [
  "sua voz já está ativa — cada texto gerado passa por ela",
  "acompanhe a confiança e recalibre quando quiser em \"sua voz\"",
  "seu teste começou — dá pra gerar direto na próxima tela"
] as const;

export function WelcomeBridge({ onContinue, onSkipTour }: WelcomeBridgeProps) {
  return (
    <div className="wizard-welcome-bridge">
      <Mono eyebrow className="wizard-step-eyebrow">
        pronto
      </Mono>
      <Serif as="h1" size="2rem" lineHeight={1.2} className="wizard-welcome-headline">
        sua voz está pronta
      </Serif>
      <ul className="wizard-welcome-highlights">
        {TOUR_HIGHLIGHTS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="wizard-step-footer">
        <Pill variant="secondary" onClick={onSkipTour}>
          Pular tour
        </Pill>
        <Pill variant="primary" onClick={onContinue}>
          Começar a escrever →
        </Pill>
      </div>
    </div>
  );
}
