# Plano de implementação — Fase 4+

Ciclo iterativo de crítica e reescrita, com skills complementares para fechar o loop sem introduzir novos modos de falha.

## Contexto

As fases 1-3 do plano anterior estão implementadas:

- ContractEngine como gate de validação pós-`refine`
- Analyze em modo `audit` retroalimentando o pipeline
- Memory System com VoiceExamples per-user

A Fase 4 endereça uma melhoria via loop crítica → reescrita, com skills auxiliares pra prevenir os modos de falha próprios do loop (Goodhart, drift de fidelidade, performatividade).

## Visão de arquitetura

```
analyze(input, mode=extract)
  → draft
  → analyze(draft, mode=audit)
  → voice-match
  → refine                             ← stack atual termina aqui

  ↓ NOVO: LOOP DE REFINAMENTO ITERATIVO

  → critic(text)
  → score >= threshold? → SIM: sai do loop
                       → NÃO: humanizer(text, critique) → critic novamente
  → max iterations atingido? → sai com warning

  ↓ NOVO: GATES FINAIS

  → fidelity-check(text, briefing_original)
  → voice-drift-check(text, user_profile)  [opcional, se Memory disponível]
  → contractEngine.validate                 [já existe]
  → output + trace consolidado
```

O loop é onde mora o ganho. Os gates finais são o que impede o ganho virar perda em outro eixo.

## Skill: critic

### Objetivo

Avaliar texto produzido com score multidimensional e issues acionáveis. Não corrige — só diagnostica.

### Schema

```ts
// src/skills/critic/types.ts

export interface CritiqueResult {
  // score agregado pra threshold check
  naturalnessScore: number; // 0-100

  // dimensões avaliadas separadamente — útil pra debug e métrica
  dimensions: {
    sentenceVariation: number; // 0-100, quanto mais alto, mais variação de tamanho/estrutura
    paragraphRhythm: number; // 0-100, alternância e quebra natural
    voiceMarkers: number; // 0-100, presença de marcadores de oralidade
    cliches: number; // 0-100 INVERSO — alto = poucos clichês
    rigidity: number; // 0-100 INVERSO — alto = pouca rigidez sintática
    fidelityToVoice: number; // 0-100, alinhamento com voice profile (se disponível)
  };

  // issues acionáveis com posição
  issues: CritiqueIssue[];

  // decisão derivada
  shouldRewrite: boolean;
  rewriteFocus?: (
    | "variation"
    | "markers"
    | "cliches"
    | "rigidity"
    | "rhythm"
  )[];
}

export interface CritiqueIssue {
  type: CritiqueIssueType;
  excerpt: string;
  position: { start: number; end: number };
  severity: number; // 0-1
  suggestedFix?: string; // sugestão textual, não obrigatória
}

export type CritiqueIssueType =
  | "triple-parallel-list"
  | "x-not-y-repeated"
  | "rhetorical-question-cluster"
  | "uniform-paragraph-block"
  | "missing-oral-markers"
  | "calculated-imperfection" // hesitação que parece performática
  | "convenient-number" // "15 profissionais", "4 anos"
  | "cliche-phrase"
  | "rigid-sentence-rhythm";
```

### System prompt

```
Você é um detector especializado em texto produzido por LLM em português brasileiro. Você avalia texto contra padrões de naturalidade humana e atribui score por dimensão.

Você NÃO corrige texto. Você diagnostica.

Suas dimensões de avaliação:
- sentenceVariation: tamanho e estrutura de frases — humano alterna, LLM padroniza
- paragraphRhythm: tamanhos de parágrafo — humano usa irregularidade, LLM produz blocos uniformes
- voiceMarkers: oralidade ativa, não decorativa — "cara, está sendo bem interessante" é ativo, "...anyway" é decorativo
- cliches: frases de transição vazias — "vamos por partes", "a verdade é simples"
- rigidity: paralelismo sintático perfeito — listas de três itens com mesma estrutura, "Não é X, é Y" repetido
- fidelityToVoice: se profile fornecido, quanto o texto se aproxima dos exemplos de voz reais do autor

Você reconhece imperfeição CALCULADA — quando hesitação ou marcador parece colado, não orgânico. Imperfeição calculada é tique avançado de LLM, não sinal de humanidade. Seja rigoroso com isso: hesitação só conta como genuína se aparece em ponto de transição cognitiva real (mudança de raciocínio, autocorreção factual), não como ornamento de tom.

Você atribui scores de forma calibrada — não inflaciona. Texto humano genuíno tipicamente fica em 75-90 nas dimensões. LLM bem-prompted fica em 50-70. LLM cru fica em 20-40. Reserve 90+ pra texto demonstravelmente humano com voz forte.
```

### User prompt template

```
Avalie o texto abaixo segundo as dimensões e retorne JSON.

TEXTO:
{{$config.draft}}

{{#if $config.userVoiceProfile}}
PERFIL DE VOZ DO AUTOR (use pra dimensão fidelityToVoice):
{{$config.userVoiceProfile}}

EXEMPLOS DE VOZ REAL:
{{$config.voiceExamples}}
{{/if}}

{{#if $config.previousScore}}
SCORE DA ITERAÇÃO ANTERIOR: {{$config.previousScore}}
DIMENSÕES ANTERIORES: {{$config.previousDimensions}}
(use pra avaliar se houve melhora real ou apenas movimento lateral)
{{/if}}

Retorne JSON com:
- naturalnessScore: 0-100, média ponderada das dimensões
- dimensions: objeto com scores por dimensão
- issues: array de issues detectados com excerpt, position, severity, suggestedFix opcional
- shouldRewrite: boolean — true se score agregado < 70 OU se há issue com severity > 0.7
- rewriteFocus: array com 1-3 dimensões prioritárias pra próxima reescrita

JSON apenas, sem prefácio.
```

### Por que duas iterações como mínimo

O critic precisa ver não só o estado atual, mas a comparação com a iteração anterior. Sem isso, perde detecção de **movimento lateral** — humanizer trocou um tique por outro mas score parece similar. Com previousScore e previousDimensions no contexto, o critic pode emitir issue tipo "trocou paralelismo por cluster de perguntas — sem ganho real".

## Skill: humanizer

### Objetivo

Reescrita cirúrgica que aplica feedback do critic. Diferente de `refine` (que remove tiques), o humanizer **insere variação e marcadores baseados em padrões reais do user**.

### Princípio crítico — sem fonte real, não insere

Humanizer só insere marcadores que tem ground truth pra justificar. Sem `userVoiceProfile` ou `voiceExamples` disponíveis no config, humanizer **não inventa imperfeições** — ele se restringe a operações de variação estrutural (quebrar parágrafo uniforme, encurtar frase longa, fundir frases curtas paralelas).

Isso é o que separa humanizer de gerador-de-tiques. Sem essa restrição, ele vira o problema que critica.

### Schema do config

```ts
// src/skills/humanizer/types.ts

export interface HumanizerConfig {
  draft: string; // texto a humanizar
  critique: CritiqueResult; // feedback do critic

  // ground truth obrigatório pra inserção de marcadores
  userVoiceProfile?: UserVoiceProfile;
  voiceExamples?: VoiceExample[]; // do Memory System

  // restrições
  preserveFacts: true; // sempre true — fato é imutável
  maxStructuralChanges: number; // default 5, evita reescrita disfarçada

  // dimensões priorizadas (vem do rewriteFocus do critic)
  focusDimensions: (
    | "variation"
    | "markers"
    | "cliches"
    | "rigidity"
    | "rhythm"
  )[];
}
```

### System prompt

```
Você é um editor especializado em reescrita cirúrgica de textos produzidos por LLM. Você corrige issues específicos sem reescrever o texto inteiro.

Suas regras:

1. PRESERVE TODOS OS FATOS. Reescrita não pode mudar afirmações, números, exemplos, claims. Se o texto diz "três meses", continua dizendo "três meses".

2. PRESERVE A ESTRUTURA GERAL. Você não reorganiza seções. Mexe parágrafo a parágrafo, frase a frase.

3. SOBRE MARCADORES DE ORALIDADE: você só insere marcadores que aparecem nos EXAMPLES fornecidos. Se examples têm "cara", você pode usar "cara". Se não têm, não invente. Marcador colado sem fundamento na voz do autor é o tique que você está corrigindo, não a solução.

4. SOBRE VARIAÇÃO ESTRUTURAL: pode quebrar parágrafos uniformes, encurtar frases longas paralelas, fundir frases curtas que repetem estrutura. Isso é seguro mesmo sem examples.

5. SOBRE IMPERFEIÇÕES: você NUNCA insere reticências decorativas, "anyway", "enfim" como ornamento, ou hesitações sem motivo cognitivo. Hesitação só pertence em ponto de transição real (autocorreção, mudança de raciocínio).

6. MUDANÇA MÍNIMA SEMPRE. Se um issue não está na lista de focus, não toque.
```

### User prompt template

```
Aplique as correções abaixo ao texto. Mudança mínima.

TEXTO ATUAL:
{{$config.draft}}

CRÍTICA RECEBIDA:
Score atual: {{$config.critique.naturalnessScore}}/100

Issues a corrigir (em ordem de severity):
{{#each $config.critique.issues}}
- [{{this.type}}, severity {{this.severity}}] "{{this.excerpt}}"{{#if this.suggestedFix}} — sugestão: {{this.suggestedFix}}{{/if}}
{{/each}}

Foco desta iteração: {{$config.focusDimensions}}

{{#if $config.voiceExamples}}
EXEMPLOS DE VOZ REAL DO AUTOR (única fonte permitida pra inserção de marcadores):
{{$config.voiceExamples}}
{{/if}}

{{#if $config.userVoiceProfile.signatureMarkers}}
MARCADORES SIGNATURE DO AUTOR:
{{$config.userVoiceProfile.signatureMarkers}}
{{/if}}

INSTRUÇÕES:
- Corrija APENAS os issues listados, na ordem de severity
- Para inserção de marcadores, use SOMENTE os que aparecem nos exemplos
- Sem ajuste de marcadores se não há exemplos disponíveis — restrinja-se a variação estrutural
- Preserve fatos, números, claims
- Sem prefácio nem lista de mudanças

Retorne apenas o texto corrigido.
```

## Loop control

### Estados e transições

```ts
// src/orchestrator/refinement-loop.ts

export interface LoopConfig {
  maxIterations: number; // default 3
  minImprovementDelta: number; // default 5 (pontos de score)
  targetScore: number; // default 75
  earlyExitOnConvergence: boolean; // default true
}

export interface LoopState {
  iteration: number;
  history: IterationRecord[];
  exitReason?: ExitReason;
}

export interface IterationRecord {
  iteration: number;
  text: string;
  critique: CritiqueResult;
  appliedFocus: string[];
  textChanges: number; // quantos parágrafos mudaram desde anterior
}

export type ExitReason =
  | "target-reached" // score >= target
  | "convergence" // delta < minImprovement
  | "max-iterations" // bateu limite
  | "regression" // score caiu
  | "no-changes" // humanizer não mexeu em nada
  | "fidelity-violation"; // gate de fidelidade barrou
```

### Pseudocódigo

```ts
async function runRefinementLoop(
  initialText: string,
  briefing: string,
  userProfile?: UserVoiceProfile,
  voiceExamples?: VoiceExample[],
  config: LoopConfig = defaults,
): Promise<LoopResult> {
  const state: LoopState = { iteration: 0, history: [] };
  let currentText = initialText;
  let previousCritique: CritiqueResult | undefined;

  while (state.iteration < config.maxIterations) {
    const critique = await criticSkill.run({
      draft: currentText,
      userVoiceProfile: userProfile,
      voiceExamples,
      previousScore: previousCritique?.naturalnessScore,
      previousDimensions: previousCritique?.dimensions,
    });

    // saída por target
    if (critique.naturalnessScore >= config.targetScore) {
      state.exitReason = "target-reached";
      break;
    }

    // saída por regressão (anti-Goodhart)
    if (
      previousCritique &&
      critique.naturalnessScore < previousCritique.naturalnessScore - 3
    ) {
      // reverte pra texto anterior, sai
      currentText = state.history[state.history.length - 1].text;
      state.exitReason = "regression";
      break;
    }

    // saída por convergência
    if (previousCritique) {
      const delta =
        critique.naturalnessScore - previousCritique.naturalnessScore;
      if (Math.abs(delta) < config.minImprovementDelta) {
        state.exitReason = "convergence";
        break;
      }
    }

    // executa humanizer
    const humanized = await humanizerSkill.run({
      draft: currentText,
      critique,
      userVoiceProfile: userProfile,
      voiceExamples,
      preserveFacts: true,
      maxStructuralChanges: 5,
      focusDimensions: critique.rewriteFocus ?? [],
    });

    // detecta no-op
    const changes = countParagraphChanges(currentText, humanized);
    if (changes === 0) {
      state.exitReason = "no-changes";
      break;
    }

    state.history.push({
      iteration: state.iteration,
      text: currentText,
      critique,
      appliedFocus: critique.rewriteFocus ?? [],
      textChanges: changes,
    });

    currentText = humanized;
    previousCritique = critique;
    state.iteration++;
  }

  if (!state.exitReason) {
    state.exitReason = "max-iterations";
  }

  return { finalText: currentText, state };
}
```

### Por que cada saída

- **target-reached**: caso ideal. Saiu cedo, custou pouco.
- **convergence**: melhoria marginal — não compensa custo de mais uma iteração.
- **regression**: critical. Detecta Goodhart em ação. Reverte pro texto anterior. Sem essa saída, o loop pode degradar texto bom em busca de score irreal.
- **max-iterations**: hit do teto. Aceita o que tem. Loga warning.
- **no-changes**: humanizer não viu o que corrigir ou não conseguiu corrigir. Sai sem custo extra.
- **fidelity-violation**: tratado fora do loop, no gate seguinte.

## Skill auxiliar: fidelity-check

### Por que é obrigatória, não opcional

Sem fidelity check, o loop pode produzir texto cada vez mais natural mas progressivamente mais distante do briefing. Você acaba com post lindo sobre algo levemente diferente do que pediu. Pior: a degradação é invisível porque o critic não avalia conteúdo, só forma.

### Schema

```ts
// src/skills/fidelity-check/types.ts

export interface FidelityResult {
  fidelityScore: number; // 0-100

  preservation: {
    keyClaims: ClaimMatch[]; // claims do briefing → presença no texto
    facts: FactMatch[]; // números, nomes, eventos
    intent: number; // 0-100, score de match de intenção
  };

  drift: {
    addedClaims: string[]; // texto faz claims que briefing não pediu
    omittedClaims: string[]; // briefing pedia mas texto não cobre
    contradictions: string[]; // texto contradiz briefing
  };

  passed: boolean; // true se fidelityScore >= threshold
}

export interface ClaimMatch {
  claim: string;
  presentInText: boolean;
  confidence: number;
  excerpt?: string;
}
```

### Quando roda

Após o loop terminar (qualquer exitReason), antes do contractEngine. Se falhar, opções:

1. Volta pro pipeline com instrução de recuperar claims omitidos (custoso, mas preserva qualidade do loop)
2. Aborta e usa último texto que passou em fidelity (history do loop)
3. Falha o pipeline (se ambiente não tolera fallback)

Recomendação: opção 2 como default. Opção 1 só em modo de produção crítica.

## Skill auxiliar: voice-drift-check (condicional)

### Quando faz sentido

Só faz sentido se Memory System tem `UserVoiceProfile` consolidado pra esse user. Pra cold start, voice-drift-check fica disabled.

### Diferença do critic.dimensions.fidelityToVoice

O critic avalia voz como uma das 6 dimensões, integrada no score. O voice-drift-check é gate dedicado: compara o output final contra o profile e bloqueia se desvio é severo, mesmo que naturalness score tenha sido alto.

Necessário porque o loop pode produzir texto que **soa natural pra língua mas não pro autor**. É a versão extrema de Goodhart: sistema otimizou pra "português brasileiro espontâneo genérico" e perdeu a assinatura do user.

### Schema simplificado

```ts
export interface VoiceDriftResult {
  driftScore: number; // 0-100, alto = mais drift
  signatureMarkersPresent: number; // % dos markers do profile
  paragraphProfileMatch: number; // 0-100
  sentenceLengthMatch: number; // 0-100
  passed: boolean;
}
```

## Skill auxiliar: adversarial-critic (Fase 5, opcional)

### Motivação

O critic principal pode ter viés sistemático: aprovar tipos específicos de tique que ele mesmo não foi calibrado pra ver. Solução clássica: segundo critic com prompt diferente, treinado/prompted pra ser cético. Se ambos aprovam, confiança alta. Se discordam, escala pra revisão humana ou pra terceiro juiz.

### Quando implementar

Não é blocker pra Fase 4. Faz sentido quando você tem volume suficiente pra gerar dataset de divergências e analisar onde o critic primário falha sistematicamente. Antes disso, é overengineering.

## Plano faseado

### Fase 4.1 — Critic + Humanizer básicos (1 sprint)

- Implementar skill `critic` com schema + prompt + integração ao orchestrator
- Implementar skill `humanizer` com schema + prompt + integração
- **Sem loop ainda**: critic roda uma vez após `refine`, humanizer roda uma vez se shouldRewrite=true, sai. É loop de 1 iteração.
- Testar contra os 10 textos do corpus existente: medir delta de score entre `refine.output` e `humanizer.output`

Critério de pronto: humanizer produz output com score > critic do `refine.output` em 70%+ dos casos no corpus.

### Fase 4.2 — Loop completo com saídas defensivas (1 sprint)

- Implementar `runRefinementLoop` com todos os ExitReasons
- Adicionar circuit breaker: max 3 iterações, regression detection ativa
- Persistir loop history no Trace Recorder
- CLI: `engine trace inspect --loop-only` mostra trajetória de score

Critério de pronto: 0 loops infinitos em corpus de teste. Score final >= score inicial em 95% dos casos. Custo médio: < 3x do pipeline pré-Fase 4.

### Fase 4.3 — Fidelity check (1 sprint)

- Implementar skill `fidelity-check`
- Adicionar como gate pós-loop, antes do contractEngine
- Implementar fallback opção 2 (volta pro último texto que passou em fidelity)

Critério de pronto: 0 outputs aprovados com claim drift em corpus de teste com briefings explícitos.

### Fase 4.4 — Voice drift check (0.5 sprint, condicional ao Memory)

- Implementar skill `voice-drift-check` se Memory System tem >= 3 users com profiles consolidados
- Caso contrário, pular essa sub-fase

### Fase 5 — Adversarial validation (futuro)

- Apenas após coleta de dados sobre falhas sistemáticas do critic primário

## Métricas pra Fase 4

Adicionar ao baseline existente:

| Métrica                  | Como medir                                          | Alvo                     |
| ------------------------ | --------------------------------------------------- | ------------------------ |
| Score delta médio        | critic(humanizer.output) − critic(refine.output)    | > 8 pontos               |
| Iterações médias por run | Média de loop iterations                            | < 2.0                    |
| Taxa de regression       | % de runs que terminaram em regression              | < 10%                    |
| Taxa de target-reached   | % de runs que saíram por target                     | > 40%                    |
| Fidelity passes          | % de outputs que passam fidelity check sem fallback | > 90%                    |
| Custo médio              | Tokens totais por run                               | < 3x baseline pré-fase-4 |
| Latência média           | Tempo total por run                                 | < 4x baseline pré-fase-4 |
| Voice drift              | Drift score médio (se Memory ativo)                 | < 25                     |

## Riscos e mitigações consolidados

**1. Goodhart**

- Mitigação primária: regression detection no loop (reverte se score cai)
- Mitigação secundária: humanizer só insere marcadores com fonte real
- Mitigação terciária (Fase 5): adversarial critic

**2. Drift de fidelidade**

- Mitigação: fidelity-check como gate obrigatório, não opcional
- Mitigação secundária: humanizer system prompt explicita "preserve fatos"

**3. Performatividade ("imperfeições calculadas")**

- Mitigação: humanizer não inserir hesitações sem fonte
- Mitigação secundária: critic detecta "calculated-imperfection" como issue type

**4. Custo explodindo**

- Mitigação: max iterations + early exit por convergência
- Mitigação secundária: critic em modelo menor (Haiku-tier), humanizer em modelo maior

**5. Loop não converge**

- Mitigação: max iterations hard cap
- Mitigação secundária: detecção de no-changes (humanizer não mexeu, sai)

**6. Texto fica genérico-natural mas perde voz do user**

- Mitigação: voice-drift-check (quando Memory disponível)
- Mitigação secundária: dimension fidelityToVoice no critic já desconta

## Resumo executivo

A proposta de loop crítico/humanizer tem mérito real e endereça um gap concreto: os tiques residuais que escapam de regex e de iteração linear. Mas como qualquer sistema com loop e score, os modos de falha são mais sutis que os do pipeline linear — Goodhart, drift, performatividade.

A diferença entre essa Fase 4 e a proposta original é a presença obrigatória de:

- Regression detection (reverte se score cai — anti-Goodhart)
- Fidelity check como gate, não opcional (anti-drift)
- Restrição no humanizer de só inserir marcadores com fonte real (anti-performatividade)

Sem esses três, o loop pode produzir texto pior do que o pipeline atual em métricas que importam mas que naturalness score não captura.

Implementar em 4 sub-fases sequenciais permite medir ganho real em cada incremento. Se a Fase 4.1 não produzir delta significativo no corpus, o resto do plano é overengineering — prudente parar e reavaliar antes de investir nas 4.2-4.4.
