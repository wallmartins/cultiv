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
