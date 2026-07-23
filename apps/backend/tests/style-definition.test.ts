import { describe, expect, it } from "vitest";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import {
  computeConsistencyScore,
  extractDeterministicFeatures,
  resolveDeterministicFeatures
} from "../src/product/voice/deterministic-extraction.js";

// The reference corpora the STYLE_DEFINITION_* bands in voice-rebuild-derivation.ts are calibrated
// against. Consistency is the signal we want — an author who writes the same way every time has a
// style. What must lower the score is incoherence: being a different writer in each example.
function styleDefinition(texts: readonly string[]): number {
  return computeConsistencyScore(texts.map((text) => extractDeterministicFeatures(text)));
}

const DEFINED_FIRST_PERSON = [
  "Trabalho remoto funciona quando a empresa escreve bem. Vi times inteiros travarem porque ninguém queria escrever a decisão. Reunião virou o único lugar onde algo acontecia, e isso custou meses.",
  "Otimizar cedo custa caro. Passei semanas afinando uma consulta que rodava duas vezes por dia, e o gargalo real estava num loop bobo no worker. Aprendi a medir antes de mexer, sempre.",
  "Previsibilidade vale mais que pico de performance. Já operei sistema que respondia em 50ms na média e travava 4 segundos de madrugada. O usuário sente a variância, não a média que ninguém vê.",
  "Índice de banco é o sumário de um livro. Sem ele você folheia página por página até achar o capítulo. Com ele você pula direto, mas paga a reimpressão toda vez que o livro muda."
];

const DEFINED_THIRD_PERSON = [
  "O gestor que não escreve deixa a decisão no ar. Ele fala numa reunião, ela some na semana seguinte, e o time inteiro paga por isso depois.",
  "O engenheiro sênior mede antes de mexer. Ele já perdeu semanas otimizando o lugar errado, e aprendeu que a intuição dele mente sobre onde está o gargalo.",
  "O usuário sente a variância, não a média. Ele não percebe os 50ms bons, mas lembra do travamento de quatro segundos, e é isso que ele conta pros outros.",
  "O leitor abre o livro pelo sumário. Ele não folheia página por página, ele pula direto pro capítulo, e por isso ela precisa manter o índice atualizado."
];

// The wizard's four writing steps at their real target lengths (60/150/250/180 words). Varying
// length between steps is by design and must not cost the author their confidence.
const WIZARD_TARGET_LENGTHS = [
  "Trabalho remoto funciona quando a empresa escreve bem. Sem escrita clara, vira reunião infinita e ninguém decide nada sozinho.",
  "Aprendi que otimizar cedo demais custa caro. Passei semanas afinando uma consulta que rodava duas vezes por dia, enquanto o gargalo real estava num loop bobo no worker. Desde então meço antes de mexer, e isso mudou como escolho onde gastar tempo.",
  "Defendo que previsibilidade vale mais que pico de performance. Um sistema que responde em 200ms sempre é melhor que um que responde em 50ms na média e 4s no percentil 99. O usuário sente a variância, não a média. Times que perseguem benchmark acabam entregando algo que ninguém consegue operar de madrugada.",
  "Índice de banco é como o sumário de um livro. Sem ele, para achar um capítulo você folheia página por página. Com ele, você olha uma lista curta e pula direto. O custo é que toda vez que o livro muda, o sumário precisa ser reimpresso."
];

// First person, then impersonal formal register, then personal anecdote, then generic filler.
const NO_SETTLED_FORM = [
  "Eu acho que trabalho remoto é bom pra mim, sabe, tipo, eu gosto de ficar em casa e não pegar trânsito, é muito melhor assim pra mim no dia a dia.",
  "A adoção de modelos híbridos de trabalho requer, portanto, análise criteriosa dos indicadores organizacionais, mediante avaliação consoante os parâmetros estabelecidos pela literatura especializada contemporânea.",
  "Ontem minha filha perguntou por que eu trabalho tanto. Fiquei sem resposta. Fui pra cozinha, fiz um café, e fiquei olhando a janela pensando em como cheguei aqui sem perceber o tempo passar.",
  "Produtividade é importante. Times devem ser eficientes. A comunicação é essencial para o sucesso. Processos bem definidos ajudam muito. É fundamental ter clareza nos objetivos."
];

// A real author's four wizard answers, kept verbatim because they are the only corpus here that
// was not written to make a point. They are also the case that falsified the perspective axes:
// the wizard asks for an opinion, then a decision the author made, then an argument, then an
// explanation to a layperson — so the answers move through impersonal, first person, first
// person and second person. That is each prompt being answered correctly, not a voice wandering.
const REAL_AUTHOR_WIZARD_ANSWERS = [
  "Microsserviços e arquitetura distribuída. Em uma startup que o foco é lençar um produto rápido e poder resolver os problemas dele também de forma rápida e segura. Desenvolver uma arquitetura distribuída é um tiro no pé e um investimento alto demais para o momento do projeto. Claro que é interessante pensar em escalabilidade e afins desse produto. Porém, nem sempre isso é necessário. Crie um monolito modular bem separadinho, cada módulo com a sua responsabilidade, arquitetura e dependências. Quando o time crescer e precisar escalar, é só separar cada um dos módulos em um microsserviço, simples e fácil e com custo absurdamente menor.",
  "Em muitos momentos, eu tinha um preciosismo com performance e clean architecture, que tudo precisava seguir como mandava a cartilha do mundo ideal dos softwares. Então iniciei uma migração completa de todo ecossistema frontend para criar uma biblioteca apartada, com todos os componentes sendo reutilizáveis e cada um dos microsserviços podendo instalá-lo e chamar separadamente só o que precisava. Algo que, quando se debate sobre engenharia de software e arquitetura, é a decisão mais correta a ser feita, você terá um ganho de performance, pois não precisará carregar todos os componentes e também estará com tudo muito melhor organizado enquanto olha aqueles projetos.\nNa prática, quando era necessário ajustar um componente, era preciso ir até esse componente no outro projeto, compreender onde ele era chamado em todos os projetos diferentes que nós tínhamos, perceber os comportamentos diferentes para cada um deles, para ver se a mudança não traria um a quebra em alguma parte do sistema. Tudo isso, completamente, distribuído. O ganho de performance no carregamento de cada parte do projeto foi mínimo, mas o aumento de trabalho para criar ou debuggar qualquer coisa foi altíssimo.",
  "Em uma fintech que eu trabalhei, estávamos tendo um problema de alta demanda para o time de suporte, por conta de clientes que precisavam saber algumas informações presentes nas suas contas, mas não conseguiam fazer isso sozinho no App, mesmo com as informações lá disponíveis.\nComo era algo que impactava, diretamente, a experiência do cliente e o planejamento dele no quesito das finanças, a tomada de decisão ali era de alta criticidade para não perder os usuários e também qualquer solução meia boca, poderia criar mais insatisfação ou trazer informações incorretas.\nSeguimos o debate para a criação de um assistente financeiro que responderia grande parte das perguntas dos usuários, com base nos nossos dados. O problema é que todos estavam seguindo diretamente para a ideia de usar IA generativa, querendo ser inovador, mostrar que é pioneiro na área de tecnologia. Porém, realizando vários testes, as respostas não eram precisas, em muitos momentos inventada respostas e, em cenários que envolvem dinheiro do usuário, isso não pode ocorrer.\nBusquei uma solução mais pragmática, encontrei a Amazon Lex na AWS, um sistema de IA conversativa em que a gente poderia definir todo o escopo de perguntas e respostas, definir quais os dados que teria acesso, manter os dados sempre confidenciais e dentro da empresa. E, para além disso, nós já tinhamos diversas soluções da AWS implementadas, era muito mais fácil seguir nesse fluxo do que implementar toda uma infraestrutura para implementar IA generativa.\nSendo assim, estruturei toda uma apresentação para demonstrar os prós e os contras, defendi tanto no quesito de viabilidade técnica quanto de custos, para poder demonstrar que uma solução conservadora, nesse momento, era bem mais válida e segura.",
  "Imagina que o seu carro não tem o painel frontal, tem somente o volante ali. Enquanto você anda com o carro, todos os dias, você estava ali, prestando atenção no trânsito, nas pessoas e, também, precisaria prestar atenção em todo e qualquer barulho diferente que ocorre no seu carro. A sua única fonte de informação para saber se está tudo bem ou tem algo de errado com o carro, seria o barulho, uma fumaça ou alguma outra instabilidade ou falha na direção, por exemplo, para perceber que temos um problema.\nMas concorda comigo que, dependendo do caso, você iria perceber o problema tarde demais? Por exemplo, se o carro estiver faltando óleo ou faltando água, você só perceberia quando o motor estiver soltando fumaça e isso poderia já estar ocasionando um defeito no motor que custaria um dinheiro alto para consertar.\nUm outro problema também é: digamos que seus filhos estão no banco de trás, uma das portas não está fechada corretamente. O painel consegue te avisar isso, mas se não existe o painel, você saberia só se alguém te falasse ou quando a porta acabasse abrindo e causasse um acidente.\nPercebe o quanto é perigoso? Essa é a importância da observabilidade, conseguir nos demonstrar onde podemos estar tendo problemas em tempo de causar um prejuízo alto e a gente conseguir solucionar esses problemas no início, mitigando qualquer problema maior ou custo elevado."
];

const HIGH_BAND = 0.85;
const MEDIUM_BAND = 0.7;

describe("style definition", () => {
  it("scores a settled voice into the high band, in either grammatical person", () => {
    expect(styleDefinition(DEFINED_FIRST_PERSON)).toBeGreaterThan(HIGH_BAND);
    // Symmetry: a third-person voice is a voice, not the mere absence of a first-person one.
    expect(styleDefinition(DEFINED_THIRD_PERSON)).toBeGreaterThan(HIGH_BAND);
  });

  it("does not punish the wizard's deliberate spread of target lengths", () => {
    expect(styleDefinition(WIZARD_TARGET_LENGTHS)).toBeGreaterThan(HIGH_BAND);
  });

  it("does not punish a real author for answering each wizard prompt in its own person", () => {
    // Scored 0.836 — below the high band — while the perspective axes were part of the measure.
    expect(styleDefinition(REAL_AUTHOR_WIZARD_ANSWERS)).toBeGreaterThan(HIGH_BAND);
  });

  it("survives a single off-key example", () => {
    const withOutlier = [...DEFINED_FIRST_PERSON.slice(0, 3), "Sim."];

    expect(styleDefinition(withOutlier)).toBeGreaterThan(HIGH_BAND);
  });

  it("drops below the medium band when the author has no settled form", () => {
    expect(styleDefinition(NO_SETTLED_FORM)).toBeLessThan(MEDIUM_BAND);
  });

  it("recomputes features persisted before an axis existed instead of averaging a hole", () => {
    // A row written before firstPersonRatio/thirdPersonRatio: the JSON column has the old shape,
    // the repository casts rather than decodes, so the fields are simply absent at runtime.
    const text = NO_SETTLED_FORM[0]!; // carries explicit "eu"/"mim" — see the pro-drop note below
    const legacyFeatures = { ...extractDeterministicFeatures(text) } as Record<string, number>;
    delete legacyFeatures.firstPersonRatio;
    delete legacyFeatures.thirdPersonRatio;

    const legacyExample = { text, deterministicFeatures: legacyFeatures } as unknown as VoiceExampleRecord;

    const resolved = resolveDeterministicFeatures(legacyExample);

    expect(resolved.firstPersonRatio).toBeGreaterThan(0);
    expect(Number.isFinite(resolved.thirdPersonRatio)).toBe(true);
    expect(Number.isFinite(computeConsistencyScore([resolved, resolved]))).toBe(true);
  });

  it("keeps a real margin between a defined voice and an undefined one", () => {
    // The bands sit in empty space between the two clusters rather than adjudicating a real case.
    expect(styleDefinition(DEFINED_FIRST_PERSON) - styleDefinition(NO_SETTLED_FORM)).toBeGreaterThan(0.25);
  });
});
