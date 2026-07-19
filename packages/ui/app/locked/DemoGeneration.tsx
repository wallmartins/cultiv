import { Mono, Panel, Serif } from "../primitives/index.js";

export interface DemoGenerationProps {
  readonly topic?: string;
  readonly paragraphs?: readonly string[];
}

const DEFAULT_TOPIC = "por que times pequenos escrevem melhor";

const DEFAULT_PARAGRAPHS = [
  "Time grande não escreve pior por falta de talento — escreve pior porque ninguém assume a voz sozinho.",
  "Isso é o que sua voz calibrada resolve: um jeito de escrever que é seu, reconhecível, replicável a cada geração."
] as const;

// Conteúdo fixo e falso — nunca real (o usuário ainda não tem perfil de voz). Selo "exemplo"
// deixa isso explícito (breakdown-11 §1.3).
export function DemoGeneration({ topic = DEFAULT_TOPIC, paragraphs = DEFAULT_PARAGRAPHS }: DemoGenerationProps) {
  return (
    <Panel className="locked-demo-generation">
      <Mono eyebrow className="locked-demo-seal">
        exemplo
      </Mono>
      <Serif as="h2" size="1.3rem" lineHeight={1.3} className="locked-demo-topic">
        {topic}
      </Serif>
      {paragraphs.map((paragraph) => (
        <Serif key={paragraph} as="p" size="1rem" lineHeight={1.6} className="locked-demo-paragraph">
          {paragraph}
        </Serif>
      ))}
    </Panel>
  );
}
