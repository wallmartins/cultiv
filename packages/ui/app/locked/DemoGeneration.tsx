import { Mono, Panel, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface DemoGenerationProps {
  readonly topic?: string;
  readonly paragraphs?: readonly string[];
}

// Conteúdo fixo e falso — nunca real (o usuário ainda não tem perfil de voz). Selo "exemplo"
// deixa isso explícito (breakdown-11 §1.3). Defaults come from the dictionary so the demo prose
// is translated, not just the chrome around it.
export function DemoGeneration({ topic, paragraphs }: DemoGenerationProps) {
  const t = useMessages();
  const resolvedTopic = topic ?? t.states.locked.demoGeneration.defaultTopic;
  const resolvedParagraphs = paragraphs ?? t.states.locked.demoGeneration.defaultParagraphs;
  return (
    <Panel className="locked-demo-generation">
      <Mono eyebrow className="locked-demo-seal">
        {t.states.locked.demoGeneration.seal}
      </Mono>
      <Serif as="h2" size="1.3rem" lineHeight={1.3} className="locked-demo-topic">
        {resolvedTopic}
      </Serif>
      {resolvedParagraphs.map((paragraph) => (
        <Serif key={paragraph} as="p" size="1rem" lineHeight={1.6} className="locked-demo-paragraph">
          {paragraph}
        </Serif>
      ))}
    </Panel>
  );
}
