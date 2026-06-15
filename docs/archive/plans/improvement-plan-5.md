# Plano de implementação — Melhorias incrementais no pipeline existente

Ajustes em prompts, campos de input e calibração de detectores. Nenhuma skill nova, nenhum step novo, nenhuma mudança arquitetural.

Ordenado por impacto decrescente. Cada item entrega valor isoladamente.

---

## Contexto

O pipeline atual produz consistentemente textos na faixa 3º-5º do ranking (Textos 20, 21 com Gemini Flash Lite). O gap para o 2º lugar (Texto ChatGPT, prompt artesanal de 400 palavras) e o 1º lugar (Texto 1, humano genuíno) se resume a:

1. **Falta de história concreta pessoal** — textos ficam no conceitual
2. **Oscilação pra tom prescritivo** — "A IA deveria ser", "O caminho é"
3. **Ausência de recursos retóricos positivos** — só proíbe tiques, não pede craft
4. **Outline estrutural em vez de progressão emocional** — organiza conteúdo, não tensão
5. **Saturação de "a gente"** e bugs pontuais de repetição

Todas essas lacunas são endereçáveis com o que já existe.

---

## Item 1 — Campo `storyPrompt` no briefing

### O que é

Campo novo no payload que instrui o draft a incluir história pessoal concreta com detalhe verificável. É o diferenciador nº1 da série: textos com história (Texto 20, ChatGPT) ranqueiam consistentemente acima de textos sem (Texto 21, 19, 18).

### Por que é o item 1

Nos 22 textos da série, a correlação entre "tem exemplo concreto pessoal" e "posição no top-5" é quase perfeita. Nenhum texto sem história concreta chegou ao 2º lugar. É o ajuste de maior ROI possível.

### Implementação

#### 1.1 — Adicionar campo ao schema do briefing

```ts
// src/types/briefing.ts (delta)

export interface Briefing {
  topic: string;
  keyPoints: string[];
  audience: string;
  intent: string;
  tone: string;
  format: string;
  minWords?: number;
  maxWords?: number;

  // NOVO
  storyPrompt?: string;
}
```

#### 1.2 — Injetar no template do draft

```handlebars
{{! src/skills/draft/prompt-template.hbs (delta) }}

{{#if $config.storyPrompt}}
  HISTÓRIA PESSOAL OBRIGATÓRIA:
  {{$config.storyPrompt}}

  REGRAS PRA HISTÓRIA: - Deve aparecer no primeiro terço do texto, não como
  ilustração tardia - Detalhe concreto obrigatório: nome de ferramenta, horário,
  reação específica, consequência real - Se o briefing não forneceu história
  específica, use uma observação pessoal real com data e contexto ("semana
  passada", "ontem num call") - A história deve GERAR o diagnóstico, não
  ILUSTRAR um diagnóstico já feito - Máximo 1 história por texto — não empilhe
  anedotas
{{/if}}
```

#### 1.3 — Adicionar ao pipeline template `validation-post`

```json
{
  "storyPrompt": "Inclua uma situação real e específica que você viveu recentemente com geração de conteúdo por IA. Detalhe: qual ferramenta usou, o que pediu, o que recebeu, por que o resultado te incomodou. Exemplo de nível de detalhe esperado: 'Pedi pro modelo escrever sobre um deploy que deu errado e ele transformou meu relato de pânico em um passo a passo de boas práticas — tirou tudo que era meu do texto.'"
}
```

#### 1.4 — Testes

```ts
describe("storyPrompt", () => {
  it("draft inclui história quando storyPrompt presente", async () => {
    const result = await draftSkill.run({
      ...baseBriefing,
      storyPrompt: "Conte sobre uma vez que a IA removeu sua voz de um texto",
    });

    // deve ter indicadores de narrativa pessoal
    expect(result.output).toMatch(
      /\b(semana passada|ontem|recentemente|outro dia)\b/i,
    );
    expect(result.output).toMatch(/\b(eu |meu |minha )\b/i);
  });

  it("draft funciona sem storyPrompt (campo opcional)", async () => {
    const result = await draftSkill.run(baseBriefing);
    expect(result.output).toBeTruthy();
  });
});
```

### Critério de pronto

- Campo aceito no payload sem quebrar runs existentes (retrocompatível)
- Draft produz texto com história concreta em >80% dos runs quando storyPrompt presente
- Textos com storyPrompt ranqueiam acima de textos sem em comparação A/B (5 runs cada)

### Esforço

0.25 sprint.

---

## Item 2 — Campo `craftInstructions` no briefing

### O que é

Array de recursos retóricos positivos que o draft deve usar. Contracts dizem o que evitar; craftInstructions dizem o que incluir.

### Por que funciona

O prompt artesanal do ChatGPT tinha instruções como "inclua uma repetição intencional", "use uma frase isolada curta pra impacto". Esses recursos são o que produz ritmo. O pipeline atual proíbe tiques mas não pede craft — resultado é texto limpo mas plano.

### Implementação

#### 2.1 — Adicionar campo ao schema

```ts
// src/types/briefing.ts (delta)

export interface Briefing {
  // ... campos existentes + storyPrompt

  // NOVO
  craftInstructions?: string[];
}
```

#### 2.2 — Injetar no template do draft

```handlebars
{{! src/skills/draft/prompt-template.hbs (delta) }}

{{#if $config.craftInstructions}}
  RECURSOS DE ESCRITA A USAR (não são sugestões, são obrigatórios):
  {{#each $config.craftInstructions}}
    -
    {{this}}
  {{/each}}

  IMPORTANTE: use cada recurso UMA VEZ no texto. Não repita o mesmo recurso
  múltiplas vezes — vira tique.
{{/if}}
```

#### 2.3 — Adicionar ao pipeline template `validation-post`

```json
{
  "craftInstructions": [
    "Use uma frase de 2-4 palavras como eco de ideia anterior em outro momento do texto (ex: 'Responsabilidade diluída.' depois de ter falado sobre isso antes)",
    "Inclua uma autocorreção genuína que abre concessão (ex: 'Ah, não que prompt não importe. Importa. Mas...')",
    "Tenha pelo menos uma imagem sensorial concreta (cheiro, som, textura) pra descrever o problema — não use metáfora abstrata",
    "Feche com dúvida real ou confissão, não com conclusão ou CTA de venda"
  ]
}
```

#### 2.4 — Validação pelo critic

O critic verifica presença dos recursos. Não bloqueia se ausente, mas pontua na dimensão que faz mais sentido:

```
Ao avaliar, verifique se o texto contém os craftInstructions solicitados:
- Eco de ideia → afeta paragraphRhythm
- Autocorreção → afeta performativeAuthenticity (positivamente)
- Imagem sensorial → afeta freshness
- Fechamento com dúvida → afeta performativeAuthenticity (positivamente)

Se craftInstructions foram solicitados mas não aparecem, reduza
a dimensão correspondente em 10 pontos.
```

#### 2.5 — Testes

```ts
describe("craftInstructions", () => {
  it("draft inclui eco de ideia quando solicitado", async () => {
    const result = await draftSkill.run({
      ...baseBriefing,
      craftInstructions: [
        "Use uma frase de 2-4 palavras como eco de ideia anterior",
      ],
    });

    // verificação manual no output — eco é subjetivo demais pra regex
    // usar critic pra validar
    const critique = await criticSkill.run({ draft: result.output });
    expect(critique.dimensions.paragraphRhythm).toBeGreaterThan(70);
  });

  it("draft funciona sem craftInstructions", async () => {
    const result = await draftSkill.run(baseBriefing);
    expect(result.output).toBeTruthy();
  });
});
```

### Critério de pronto

- Campo aceito no payload, retrocompatível
- Critic detecta presença/ausência de craft solicitado
- Comparação A/B (5 runs com craft vs 5 sem): runs com craft têm rhythmScore médio > 5 pontos acima

### Esforço

0.25 sprint.

---

## Item 3 — `narrativeBeats` substituindo outline

### O que é

Trocar o campo `outline` (que organiza conteúdo em categorias) por `narrativeBeats` (que organiza tensão emocional em movimentos). O modelo passa a seguir progressão narrativa, não estrutura de artigo.

### Diferença concreta

**Outline atual:**

```json
[
  "Incômodo concreto",
  "Diagnóstico",
  "Por que prompt não resolve",
  "Pergunta de validação"
]
```

**Narrative beats:**

```json
[
  "Abra com algo que aconteceu — ação, não tese",
  "Mostre a frustração antes de nomear a causa",
  "Aponte que a maioria culpa X, mas você discorda — sem dizer 'eu discordo', mostre por que não faz sentido",
  "Admita que a alternativa óbvia ajuda parcialmente — conceda antes de refutar",
  "Termine com dúvida real, não com conclusão"
]
```

Outline diz O QUE. Beats dizem COMO o leitor deve sentir em cada momento.

### Implementação

#### 3.1 — Adicionar campo ao schema

```ts
// src/types/briefing.ts (delta)

export interface Briefing {
  // ... campos existentes

  // DEPRECAR (manter por retrocompatibilidade)
  outline?: string[];

  // NOVO (preferido sobre outline)
  narrativeBeats?: string[];
}
```

#### 3.2 — Injetar no template do draft

```handlebars
{{! src/skills/draft/prompt-template.hbs (delta) }}

{{#if $config.narrativeBeats}}
  PROGRESSÃO NARRATIVA (siga essa sequência emocional, não como headers):
  {{#each $config.narrativeBeats}}
    {{@index}}.
    {{this}}
  {{/each}}

  IMPORTANTE: - Beats são transições emocionais, NÃO seções com subtítulo - Cada
  beat flui pro próximo sem marcação visível - O leitor não deve perceber a
  estrutura — só sentir que o texto progride
{{else if $config.outline}}
  ESTRUTURA SUGERIDA:
  {{#each $config.outline}}
    -
    {{this}}
  {{/each}}
{{/if}}
```

#### 3.3 — Atualizar pipeline template `validation-post`

```json
{
  "narrativeBeats": [
    "Abra com algo que aconteceu — ação concreta, não tese ('testei', 'abri', 'li', 'recebi')",
    "Mostre o incômodo antes de diagnosticar — o leitor precisa sentir antes de entender",
    "Aponte que a explicação óbvia (culpa do modelo) não bate — sem dizer 'eu discordo', mostre por que não faz sentido com o que você observou",
    "Conceda que a alternativa popular (prompt melhor) ajuda parcialmente — nunca refute sem conceder primeiro",
    "Admita que você não tem resposta fechada — vulnerabilidade real, não performada",
    "Termine com dúvida ou confissão, não com conclusão nem CTA de venda"
  ]
}
```

#### 3.4 — Testes

```ts
describe("narrativeBeats", () => {
  it("draft abre com ação quando primeiro beat pede ação", async () => {
    const result = await draftSkill.run({
      ...baseBriefing,
      narrativeBeats: ["Abra com algo que aconteceu — ação concreta"],
    });

    const firstSentence = result.output.split(/[.!?]/)[0];
    // deve ter verbo de ação em primeira pessoa
    expect(firstSentence).toMatch(
      /\b(abri|testei|li|peguei|recebi|fui|tentei)\b/i,
    );
  });

  it("narrativeBeats tem prioridade sobre outline", async () => {
    const result = await draftSkill.run({
      ...baseBriefing,
      outline: ["Introdução formal"],
      narrativeBeats: ["Abra com ação concreta"],
    });

    const firstSentence = result.output.split(/[.!?]/)[0];
    // deve seguir beats, não outline
    expect(firstSentence).not.toMatch(
      /\b(neste texto|vamos discutir|o objetivo)\b/i,
    );
  });
});
```

### Critério de pronto

- Campo aceito, retrocompatível (outline continua funcionando se narrativeBeats ausente)
- Draft com narrativeBeats abre com ação em >80% dos runs
- Draft com narrativeBeats não tem subtítulos de seção em >90% dos runs

### Esforço

0.25 sprint.

---

## Item 4 — Proibir tom prescritivo no draft

### O que é

Adição ao system prompt do draft que proíbe construções prescritivas e manda converter pra narrativa pessoal.

### Por que importa

O Texto 21 oscilou pra "A IA deveria ser o rascunhador. A gente, o curador." — tom de manifesto que quebrau o registro casual. É tique recorrente em modelos que interpretam "tom analítico" como licença pra prescrever.

### Implementação

#### 4.1 — Adicionar ao system prompt do draft

```
// src/skills/draft/system-prompt.ts (delta)

// adicionar ao bloco de proibições existente:

Você NUNCA usa tom prescritivo. Especificamente:

9.  "A IA deveria ser/fazer X" → converter pra "Comecei a usar a IA pra X"
10. "O caminho é X" → converter pra "O que funcionou pra mim foi X"
11. "Precisamos de X" → converter pra "Tenho testado X"
12. "É nosso papel X" → converter pra "Eu tenho tentado X"

Prescrição assume autoridade sobre o leitor.
Narrativa pessoal compartilha experiência sem impor.
Em post de validação, prescrição é contraditória com o propósito
(você está pedindo input, não dando instrução).
```

#### 4.2 — Adicionar detecção no critic

```
Ao avaliar performativeAuthenticity, verifique:
- Construções prescritivas ("deveria ser", "precisamos", "o caminho é",
  "é nosso papel") reduzem score em 5 pontos cada
- Construções narrativas ("comecei a", "tenho testado", "na minha experiência")
  mantêm score
```

#### 4.3 — Adicionar regra no Contract

```ts
// src/contracts/library/validation-post.contract.ts (delta)

{
  id: "prescriptive-tone",
  detector: "regex",
  patterns: [
    /\b(deveria|deveríamos)\s+(ser|fazer|usar|criar|construir)/gi,
    /\bo caminho (é|seria)\b/gi,
    /\b(precisamos|devemos)\s+\w/gi,
    /\bé nosso (papel|dever|responsabilidade)\b/gi,
  ],
  description: "Tom prescritivo — converter pra narrativa pessoal",
  maxAllowed: 0,
  severity: "warn",
}
```

#### 4.4 — Adicionar instrução no humanizer

```
// src/skills/humanizer/system-prompt.ts (delta)

Se o texto contém frases prescritivas:
- "A IA deveria ser o rascunhador" → "Comecei a usar a IA só pro rascunho"
- "O caminho é mudar nosso papel" → "O que tenho testado é mudar meu papel"
- "Precisamos repensar" → "Tenho repensado"

Prescrição → experiência pessoal. Sempre.
Mantenha o conteúdo da afirmação, mude apenas o enquadramento
de "declaração universal" pra "relato pessoal".
```

#### 4.5 — Testes

```ts
describe("prescriptive tone", () => {
  it("contract detecta tom prescritivo", () => {
    const text = "A IA deveria ser usada apenas como rascunhador.";
    const result = contractEngine.validate(text, "validation-post");

    expect(result.violations).toContainEqual(
      expect.objectContaining({ rule: "prescriptive-tone" }),
    );
  });

  it("contract aceita narrativa pessoal equivalente", () => {
    const text = "Comecei a usar a IA só pro rascunho.";
    const result = contractEngine.validate(text, "validation-post");

    const prescriptiveViolations = result.violations.filter(
      (v) => v.rule === "prescriptive-tone",
    );
    expect(prescriptiveViolations).toHaveLength(0);
  });

  it("humanizer converte prescrição pra narrativa", async () => {
    const input = "A IA deveria ser o rascunhador. A gente, o curador.";
    const result = await humanizerSkill.run({
      draft: input,
      critique: { issues: [{ type: "prescriptive-tone", excerpt: input }] },
    });

    expect(result.output).not.toMatch(/deveria ser/);
    expect(result.output).toMatch(/\b(comecei|tenho|passei)\b/i);
  });
});
```

### Critério de pronto

- Contract detecta 100% das construções prescritivas listadas
- Humanizer converte prescrição → narrativa em >80% dos casos
- Zero ocorrência de "deveria ser/fazer" em 10 runs de teste

### Esforço

0.25 sprint.

---

## Item 5 — Limitar "a gente" e marcadores saturados

### O que é

Regras contáveis no draft e no Contract pra evitar saturação de pronomes e marcadores específicos.

### Implementação

#### 5.1 — Adicionar ao system prompt do draft

```
// src/skills/draft/system-prompt.ts (delta)

LIMITES DE REPETIÇÃO POR TEXTO:
- "a gente" → máximo 4 ocorrências. Alterne com "eu" e "você".
- "cara" (vocativo) → máximo 2 ocorrências
- "né" → máximo 2 ocorrências
- "tá/tô" → máximo 4 ocorrências combinadas
- Qualquer marcador de oralidade → máximo 1 por bloco de 100 palavras

Se atingir o limite, use variação:
- "a gente" → "eu" (quando é opinião pessoal) ou "você" (quando dirige ao leitor)
- "cara" → omitir (a frase funciona sem vocativo na maioria dos casos)
```

#### 5.2 — Adicionar regras no Contract

```ts
// src/contracts/library/generic.contract.ts (delta)

{
  id: "a-gente-saturation",
  detector: "regex",
  pattern: /\ba gente\b/gi,
  description: "'a gente' saturado — máximo 4 por texto",
  maxAllowed: 4,
  severity: "warn",
},
{
  id: "cara-saturation",
  detector: "regex",
  pattern: /\bcara\b/gi,
  description: "'cara' saturado — máximo 2 por texto",
  maxAllowed: 2,
  severity: "warn",
},
{
  id: "marker-density",
  detector: "custom",
  description: "Densidade de marcadores de oralidade > 1 por 100 palavras",
  // implementação: contar ocorrências de (cara|né|tá|tô|aí|tipo|sabe|manja)
  // dividir por (wordCount / 100)
  // se > 1.0, warn
  maxDensity: 1.0,
  severity: "warn",
}
```

#### 5.3 — Testes

```ts
describe("marker saturation", () => {
  it("contract detecta 'a gente' saturado", () => {
    const text =
      "A gente sabe que a gente precisa. A gente faz. A gente tenta. A gente erra.";
    const result = contractEngine.validate(text, "generic");

    expect(result.violations).toContainEqual(
      expect.objectContaining({ rule: "a-gente-saturation" }),
    );
  });

  it("contract aceita 'a gente' dentro do limite", () => {
    const text =
      "A gente sabe disso. Eu também percebo. Você provavelmente já viu. A gente tenta.";
    const result = contractEngine.validate(text, "generic");

    const saturationViolations = result.violations.filter(
      (v) => v.rule === "a-gente-saturation",
    );
    expect(saturationViolations).toHaveLength(0);
  });
});
```

### Critério de pronto

- Contract detecta saturação de todos os marcadores listados
- 10 runs de teste: nenhum com >4 "a gente" ou >2 "cara"
- Densidade de marcadores < 1.0 por 100 palavras em >90% dos runs

### Esforço

0.15 sprint.

---

## Item 6 — Novo exemplo no Memory com história concreta

### O que é

Adicionar ao Memory um sexto exemplo que demonstra integração de história pessoal com argumento. Ground truth pra quando o draft precisa gerar narrativa concreta.

### Implementação

#### 6.1 — Curl de inserção

```bash
curl -X POST http://localhost:3000/users/user-123/examples \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Semana passada tentei usar a engine pra escrever sobre um incidente em produção que tive. O deploy quebrou o banco em horário de pico, eu tava em pânico, o CTO me ligou, resolvi na marra com rollback manual e um hotfix que eu escrevi no celular no meio do trânsito.\n\nPassei esse contexto todo pro sistema e o que voltou foi um passo a passo de como evitar falhas em deploy. Limpo, organizado, com bullet points. Tirou o pânico, tirou o celular no trânsito, tirou o CTO ligando. Ficou um texto que qualquer pessoa poderia ter escrito sobre qualquer deploy.\n\nAí fui eu mesmo e escrevi do zero. Saiu torto, longo demais, com parenteses no meio das frases. Mas tinha eu ali dentro. O leitor ia sentir que alguém viveu aquilo, não que alguém pesquisou sobre aquilo.\n\nIsso me fez perceber que talvez o valor do que a gente escreve não tá na estrutura nem na gramática. Tá no atrito. No detalhe que não cabe em template.",
    "format": "linkedin-post",
    "source": "manual",
    "topicTags": ["content-creation", "ai-writing", "personal-experience", "failure-story", "production-incident"],
    "toneTags": ["narrative", "vulnerable", "concrete", "casual-br", "thinking-out-loud"],
    "performanceMetrics": { "selfRating": 5 },
    "extractedMarkers": [
      "historia-concreta-com-detalhes-verificaveis",
      "contraste-ia-vs-humano-vivido",
      "parenteses-conversacional",
      "fechamento-com-insight-emergente",
      "detalhe-sensorial-celular-transito",
      "expressao-limpo-mas-morto-equivalente"
    ]
  }'
```

#### 6.2 — Verificar seleção contextual

Após inserir, verificar que `Memory.selectExamples` retorna esse exemplo quando toneTags incluem `["narrative", "vulnerable"]`:

```bash
$ engine memory select --user user-123 --format linkedin-post --tone narrative,vulnerable

# esperado: novo exemplo aparece no top-3 de resultados
```

#### 6.3 — Considerar remoção do Exemplo 3 (DataLoader)

O Exemplo 3 é didático-técnico, sem narrativa pessoal. Se Memory tem limite de examples por query (3-5), ele pode "empurrar" o novo exemplo pra fora do resultado quando topic não é explicitamente técnico. Avaliar se vale manter 6 exemplos ou substituir o 3 pelo novo.

Recomendação: manter os 6 por agora. Se `selectExamples` retorna máximo 3 por query, o scoring contextual deveria priorizar o novo exemplo pra posts de validação (que batem em `narrative` + `vulnerable`) e o DataLoader pra posts didáticos (que batem em `didactic` + `technical`). Testar antes de remover.

### Critério de pronto

- Exemplo inserido com sucesso
- `selectExamples` retorna esse exemplo no top-3 pra queries com toneTags narrative/vulnerable
- 5 runs de validation-post após inserção: >60% incluem história concreta com detalhe verificável

### Esforço

0.1 sprint (é um curl + verificação).

---

## Item 7 — Três regras novas nos Contracts

### O que é

Detectores pra bugs pontuais que apareceram nos últimos textos e que não têm cobertura nos Contracts atuais.

### Implementação

#### 7.1 — Repetição adjacente

Bug do Texto 19: "responsabilidade é mais diluída" em dois parágrafos seguidos.

```ts
// src/contracts/validators/adjacent-repetition.ts

export function detectAdjacentRepetition(text: string): ContractViolation[] {
  const violations: ContractViolation[] = [];
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (let i = 0; i < paragraphs.length - 1; i++) {
    const current = paragraphs[i].toLowerCase();
    const next = paragraphs[i + 1].toLowerCase();

    // extrair fragmentos de 5+ palavras do parágrafo atual
    const words = current.split(/\s+/);
    for (let j = 0; j <= words.length - 5; j++) {
      const fragment = words.slice(j, j + 5).join(" ");
      if (next.includes(fragment)) {
        violations.push({
          contractId: "adjacent-repetition",
          rule: "adjacent-repetition",
          severity: "error",
          excerpt: fragment,
          position: {
            start: text.indexOf(fragment),
            end: text.indexOf(fragment) + fragment.length,
          },
        });
        break; // um match por par de parágrafos é suficiente
      }
    }
  }

  return violations;
}
```

```ts
// contract entry
{
  id: "adjacent-repetition",
  detector: "custom",
  validator: detectAdjacentRepetition,
  description: "Mesmo fragmento (5+ palavras) em parágrafos consecutivos",
  maxAllowed: 0,
  severity: "error",
}
```

#### 7.2 — Micro-parágrafos em sequência

```ts
// contract entry
{
  id: "micro-paragraph-sequence",
  detector: "custom",
  validator: (text: string) => {
    const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    const violations: ContractViolation[] = [];

    for (let i = 0; i <= paragraphs.length - 3; i++) {
      const three = paragraphs.slice(i, i + 3);
      const allMicro = three.every(p => p.split(/\s+/).length < 15);

      if (allMicro) {
        violations.push({
          contractId: "micro-paragraph-sequence",
          rule: "micro-paragraph-sequence",
          severity: "warn",
          excerpt: three.map(p => p.slice(0, 40)).join(" | "),
        });
      }
    }

    return violations;
  },
  description: "3+ parágrafos consecutivos com menos de 15 palavras",
  maxAllowed: 0,
  severity: "warn",
}
```

#### 7.3 — Concordância "a gente" + adjetivo

Bug de concordância que apareceu em vários textos: "a gente" seguido de adjetivo feminino quando deveria ser masculino/neutro ("intacta" quando referente é masculino).

```ts
// contract entry (simples, não cobre todos os casos)
{
  id: "a-gente-concordance",
  detector: "regex",
  pattern: /\ba gente\b[^.]{0,30}\b(intacta|pronta|satisfeita|frustrada|perdida)\b/gi,
  description: "'a gente' com concordância ambígua — verificar se adjetivo bate",
  maxAllowed: 0,
  severity: "warn",
}
```

#### 7.4 — Testes

```ts
describe("new contract rules", () => {
  it("detecta repetição adjacente", () => {
    const text =
      "A causa está no processo.\n\nA causa está no processo e não no modelo.";
    const violations = detectAdjacentRepetition(text);
    expect(violations.length).toBeGreaterThan(0);
  });

  it("detecta micro-parágrafos em sequência", () => {
    const text = "O modelo segue.\n\nÉ simples.\n\nSó isso.";
    const result = contractEngine.validate(text, "generic");
    expect(result.violations).toContainEqual(
      expect.objectContaining({ rule: "micro-paragraph-sequence" }),
    );
  });

  it("não falso-positiva em texto normal", () => {
    const text = CALIBRATION_CORPUS["texto-10"].text;
    const result = contractEngine.validate(text, "generic");
    const newRuleViolations = result.violations.filter((v) =>
      [
        "adjacent-repetition",
        "micro-paragraph-sequence",
        "a-gente-concordance",
      ].includes(v.rule),
    );
    expect(newRuleViolations).toHaveLength(0);
  });
});
```

### Critério de pronto

- 3 regras implementadas e integradas no ContractEngine
- Zero falso positivo contra Textos 1, 10, 20 (textos bons)
- Detecta bugs nos Textos 19, 21 onde o problema apareceu

### Esforço

0.25 sprint.

---

## Item 8 — Dimensão `concreteDetail` no critic

### O que é

Nova dimensão de avaliação que mede presença de exemplo concreto pessoal no texto. É a variável mais correlacionada com posição alta no ranking.

### Implementação

#### 8.1 — Adicionar ao prompt do critic

```
// src/skills/critic/system-prompt.ts (delta)

// adicionar às dimensões existentes:

concreteDetail (0-100): o texto tem história, exemplo ou situação concreta
que só o autor poderia ter vivido?

ESCALA DE CALIBRAÇÃO:
90-100: história com detalhes verificáveis — nome de ferramenta, horário,
        reação física/emocional específica, consequência real
        Ex: "O deploy quebrou o banco em horário de pico, eu tava em pânico,
        o CTO me ligou"
70-89:  exemplo concreto mas que qualquer pessoa na área poderia ter vivido
        Ex: "Já gerei textos com IA e percebi que ficam genéricos"
40-69:  menção vaga a experiência sem detalhe
        Ex: "Tenho observado isso no mercado"
0-39:   puramente conceitual, sem nenhuma referência a vivência real
        Ex: "O problema está no processo de produção"

PESO: concreteDetail deve ter o MESMO peso que voiceMarkers e rigidity
no cálculo do naturalnessScore.
```

#### 8.2 — Atualizar cálculo do naturalnessScore

```ts
// src/skills/critic/score-calculator.ts (delta)

const DIMENSION_WEIGHTS = {
  sentenceVariation: 0.1,
  paragraphRhythm: 0.08,
  voiceMarkers: 0.12, // reduzido de ~0.18 (anti-Goodhart)
  cliches: 0.1,
  rigidity: 0.15, // aumentado (tique mais persistente)
  fidelityToVoice: 0.1,
  performativeAuthenticity: 0.15, // aumentado
  freshness: 0.08,
  concreteDetail: 0.12, // NOVO — mesmo peso que voiceMarkers
};
```

#### 8.3 — Testes

```ts
describe("concreteDetail dimension", () => {
  it("texto com história concreta pontua >80", async () => {
    const textWithStory = CALIBRATION_CORPUS["texto-20"].text; // tem deploy story
    const critique = await criticSkill.run({ draft: textWithStory });
    expect(critique.dimensions.concreteDetail).toBeGreaterThan(80);
  });

  it("texto puramente conceitual pontua <50", async () => {
    const conceptualText = CALIBRATION_CORPUS["texto-05"].text;
    const critique = await criticSkill.run({ draft: conceptualText });
    expect(critique.dimensions.concreteDetail).toBeLessThan(50);
  });
});
```

### Critério de pronto

- Dimensão retornada pelo critic em todos os runs
- Calibração: Texto 20 (deploy) > 80, Texto 5 (conceitual) < 50, Texto 1 (humano) > 85
- naturalnessScore incorpora concreteDetail com peso 0.12

### Esforço

0.25 sprint.

---

## Item 9 — Recalibrar pesos do critic

### O que é

Ajustar ponderação das dimensões no cálculo do naturalnessScore baseado no aprendizado de 22 textos.

### Implementação

#### 9.1 — Novos pesos (já detalhados no Item 8)

```ts
const DIMENSION_WEIGHTS_V2 = {
  sentenceVariation: 0.1, // era ~0.12
  paragraphRhythm: 0.08, // era ~0.12
  voiceMarkers: 0.12, // era ~0.18 — REDUZIDO (anti-Goodhart)
  cliches: 0.1, // mantido
  rigidity: 0.15, // era ~0.10 — AUMENTADO (tique mais persistente)
  fidelityToVoice: 0.1, // era ~0.15 — REDUZIDO (não forçar marcadores)
  performativeAuthenticity: 0.15, // era ~0.10 — AUMENTADO
  freshness: 0.08, // era ~0.10
  concreteDetail: 0.12, // NOVO
};
```

#### 9.2 — Validar com corpus de calibração

Rodar critic nos 5 textos do corpus de calibração (Fase 0 do plano anterior) e verificar que os scores ficam dentro das faixas esperadas com os novos pesos.

#### 9.3 — Versionar pesos

```ts
// src/skills/critic/weights.ts

export const WEIGHT_VERSIONS = {
  v1: {
    /* pesos originais */
  },
  v2: {
    /* pesos recalibrados */
  },
};

export const CURRENT_WEIGHT_VERSION = "v2";
```

Trace deve registrar qual versão de pesos foi usada em cada run.

### Critério de pronto

- 5/5 fixtures do corpus de calibração passam com novos pesos
- Spread entre melhor e pior fixture > 40 pontos
- Texto 1 (humano) score > 85. Texto 5 (pré-pipeline) score < 45.

### Esforço

0.15 sprint.

---

## Item 10 — Instrução "não prescrever" no humanizer

### O que é

Extensão do system prompt do humanizer pra converter prescrições em narrativa pessoal quando detectadas pelo critic.

### Implementação

#### 10.1 — Adicionar ao system prompt

```
// src/skills/humanizer/system-prompt.ts (delta)

REGRA DE CONVERSÃO: PRESCRIÇÃO → EXPERIÊNCIA

Se o texto contém frases que prescrevem ao leitor o que fazer:

PADRÃO: "A IA deveria ser X. A gente, Y."
CORREÇÃO: "Comecei a usar a IA pra X e eu faço Y. Tem funcionado."

PADRÃO: "O caminho é mudar nosso papel na cadeia."
CORREÇÃO: "O que tenho testado é mudar meu papel na cadeia."

PADRÃO: "Precisamos repensar como usamos IA."
CORREÇÃO: "Tenho repensado como eu uso IA."

PRINCÍPIO:
- Declaração universal → relato pessoal
- "nós devemos" → "eu tenho feito"
- Imperativo → passado/presente contínuo
- Mantenha o conteúdo da afirmação, mude apenas o enquadramento
```

### Critério de pronto

- Humanizer converte prescrição → narrativa em >80% dos casos de teste
- Conteúdo da afirmação preservado (fidelity check passa)

### Esforço

0.1 sprint.

---

## Cronograma consolidado

| Item | Descrição                           | Esforço     | Acumulado | Impacto     |
| ---- | ----------------------------------- | ----------- | --------- | ----------- |
| 1    | storyPrompt no briefing             | 0.25 sprint | 0.25      | Alto        |
| 2    | craftInstructions no briefing       | 0.25 sprint | 0.50      | Médio-alto  |
| 3    | narrativeBeats substituindo outline | 0.25 sprint | 0.75      | Médio       |
| 4    | Proibir tom prescritivo no draft    | 0.25 sprint | 1.00      | Médio       |
| 5    | Limitar "a gente" e marcadores      | 0.15 sprint | 1.15      | Baixo-médio |
| 6    | Novo exemplo no Memory              | 0.10 sprint | 1.25      | Alto        |
| 7    | Três regras novas nos Contracts     | 0.25 sprint | 1.50      | Médio       |
| 8    | Dimensão concreteDetail no critic   | 0.25 sprint | 1.75      | Alto        |
| 9    | Recalibrar pesos do critic          | 0.15 sprint | 1.90      | Médio       |
| 10   | "Não prescrever" no humanizer       | 0.10 sprint | 2.00      | Médio       |

**Total: ~2 sprints.**

### Ordem de implementação sugerida

**Semana 1 (maior impacto, menor risco):**

- Item 6 (Memory example) — é um curl, faz primeiro
- Item 1 (storyPrompt) — campo novo no briefing + template
- Item 2 (craftInstructions) — campo novo no briefing + template
- Item 3 (narrativeBeats) — campo novo no briefing + template

Após semana 1: rodar 5 runs e comparar com baseline.

**Semana 2 (calibração e detecção):**

- Item 4 (proibir prescrição no draft)
- Item 5 (limitar marcadores)
- Item 7 (3 regras nos Contracts)
- Item 8 (concreteDetail no critic)
- Item 9 (recalibrar pesos)
- Item 10 (humanizer não prescrever)

Após semana 2: rodar 5 runs e comparar com pós-semana-1.

### Ponto de decisão

Após as duas semanas, rodar 10 runs do mesmo briefing (validation-post) e medir:

| Métrica                         | Alvo                                            |
| ------------------------------- | ----------------------------------------------- |
| Posição média no ranking        | 2º-4º (hoje: 3º-5º)                             |
| % de runs com história concreta | > 70% (hoje: ~30%)                              |
| % de runs com tom prescritivo   | < 10% (hoje: ~40%)                              |
| % de runs com "a gente" > 4x    | 0% (hoje: ~30%)                                 |
| Variância run-to-run            | < 2 posições de ranking entre melhor e pior run |

Se atingir esses alvos, o gap pro Texto ChatGPT (2º) vira marginal e o pipeline entrega qualidade competitiva em 30 segundos por post.

---

## Payload final sugerido após implementação

Com todos os 10 itens implementados, o briefing do curl fica:

```json
{
  "userId": "wallace",
  "pipelineType": "validation-post",
  "briefing": {
    "topic": "Validar se textos gerados por IA soam iguais por causa do processo, não do modelo",
    "keyPoints": [
      "Textos de IA têm assinatura reconhecível mesmo quando tecnicamente corretos",
      "A causa raiz está no processo de produção, não no modelo",
      "Melhorar prompt resolve sintoma, não causa",
      "Estou na fase de validação, não de revelação"
    ],
    "audience": "criadores de conteúdo, gestores de marketing e devs que escalam com IA",
    "intent": "validate-pain",
    "tone": "casual-analitico-pensativo",
    "format": "linkedin-post",
    "minWords": 350,
    "maxWords": 550,
    "storyPrompt": "Conte sobre uma situação real recente onde você usou IA pra gerar texto e o resultado não tinha sua voz. Detalhe: o que pediu, o que recebeu, por que te incomodou.",
    "craftInstructions": [
      "Use uma frase de 2-4 palavras como eco de ideia anterior em outro momento do texto",
      "Inclua uma autocorreção genuína que abre concessão",
      "Tenha pelo menos uma imagem sensorial concreta pra descrever o problema",
      "Feche com dúvida real ou confissão, não com conclusão"
    ],
    "narrativeBeats": [
      "Abra com algo que aconteceu — ação concreta, não tese",
      "Mostre o incômodo antes de diagnosticar",
      "Aponte que a explicação óbvia não bate — sem dizer 'discordo', mostre",
      "Conceda que a alternativa popular ajuda parcialmente",
      "Admita que não tem resposta fechada",
      "Termine com dúvida ou confissão"
    ]
  },
  "context": {
    "forbiddenTerms": [
      "Orchestrator",
      "Contract System",
      "Trace Recorder",
      "Skill Registry",
      "Memory System",
      "Adapter Layer",
      "composable",
      "agent-agnostic",
      "thought leadership",
      "alma da marca",
      "DNA da marca",
      "fora da curva"
    ]
  },
  "model": "google:gemini-3.1-flash-lite"
}
```

O que mudou em relação ao payload anterior:

- `storyPrompt` (Item 1) — força história concreta
- `craftInstructions` (Item 2) — pede recursos retóricos positivos
- `narrativeBeats` substituindo `outline` (Item 3) — progressão emocional
- `forbiddenTerms` mantidos (já funcionavam)
- Modelo Gemini Flash Lite (confirmado pelos Textos 20-21 como melhor opção free)
- Tudo o mais (voiceExamples, profile, thresholds, loop config) resolvido internamente pela engine via Memory + Pipeline Template + Contracts
