# Design do Wizard de Calibração — 5 Etapas

Este documento detalha o design do novo wizard de calibração que substitui a Calibration Session atual (rounds A/B).

---

## Visão Geral

O wizard coleta 5 textos genuínos do autor, cada um com características controladas de tamanho e complexidade argumentativa. Antes das etapas de escrita, 3 perguntas contextuais personalizam os temas e servem de baseline para validação. A partir dos textos, o motor de identificação extrai o perfil completo.

### Fluxo

```
┌─────────────────────────────────────────────────────────┐
│  Pré-wizard: Contexto do Autor                          │
│  3 perguntas rápidas (~30 segundos)                     │
│  Captura: domínio, audiência, auto-declaração           │
├─────────────────────────────────────────────────────────┤
│  Etapa 1: Micro-decisões                                │
│  "Qual sua opinião sobre [tema]?"                       │
│  ~60 palavras | 3 frases                                │
│  Captura: vocabulário, pontuação, tom                   │
├─────────────────────────────────────────────────────────┤
│  Etapa 2: Como eu penso                                 │
│  "Algo que você aprendeu recentemente"                  │
│  ~150 palavras | 10 frases                              │
│  Captura: reasoning, postura epistêmica                 │
├─────────────────────────────────────────────────────────┤
│  Etapa 3: Como eu construo                              │
│  "Defenda uma posição sobre algo importante"            │
│  ~250 palavras | 15 frases                              │
│  Captura: argument development, transições              │
├─────────────────────────────────────────────────────────┤
│  Etapa 4: Versatilidade                                 │
│  "Explique algo complexo para leigos"                   │
│  ~180 palavras | 10 frases                              │
│  Captura: register adaptation, complexity               │
├─────────────────────────────────────────────────────────┤
│  Etapa 5: Revisão e confirmação                         │
│  Apresentação do perfil inferido                         │
│  Captura: author affirmation, confidence final          │
└─────────────────────────────────────────────────────────┘
```

---

## Pré-wizard: Contexto do Autor

### Objetivo
Coletar 3 dados contextuais que personalizam os temas do wizard e servem de baseline para validação. O wizard sem contexto gera temas genéricos — com contexto, gera temas que o autor domina, produzindo texto mais autêntico.

### Perguntas

```
┌─────────────────────────────────────────────────┐
│  Antes de começar, nos ajude a personalizar     │
│  os temas para você:                            │
│                                                 │
│  1. "Em que área você atua ou escreve?"         │
│     [tecnologia] [negócios] [educação]          │
│     [saúde] [criativo] [outros___]              │
│                                                 │
│  2. "Para quem você normalmente escreve?"       │
│     [colegas] [clientes] [público geral]        │
│     [comunidade técnica] [estudantes]           │
│                                                 │
│  3. (Opcional) "Tem algo que você faz bem       │
│     como escritor? Uma característica que        │
│     reconhece no seu texto?"                    │
│     [textarea livre, máx 200 caracteres]        │
│                                                 │
│  [Continuar →]                                  │
└─────────────────────────────────────────────────┘
```

### O que cada pergunta alimenta

| Pergunta | Alimenta | Exemplo de uso |
|---|---|---|
| Área de atuação | Gera temas da Etapa 1 e 3 que o autor domina | "tecnologia" → tema: "ferramentas de IA no trabalho" |
| Audiência | Calibra register esperado (baseline para validation) | "colegas técnicos" → register esperado: informal técnico |
| Ponto forte (opcional) | Validação na Etapa 5: texto confirma ou contradiz auto-declaração | "sou direto" → se texto usa hedges → flag |

### Schema

```typescript
interface WizardContext {
  readonly domain?: string;           // "tecnologia", "negócios", "educação", etc.
  readonly audience?: string;         // "colegas", "público geral", etc.
  readonly selfDeclaredStrength?: string; // textarea livre (opcional)
}
```

### Regras de geração de temas

```typescript
function resolveTheme(step: WizardStep, context: WizardContext): string {
  // Etapas 2 e 4: prompts fixos (não dependem de contexto)
  if (step.id === "reasoning_reflection" || step.id === "format_adaptation") {
    return step.fixedPrompt;
  }

  // Etapa 1: tema genérico da área do autor
  if (step.id === "micro_opinion" && context.domain) {
    return THEMES_BY_DOMAIN[context.domain]?.opinion ?? step.defaultTheme;
  }

  // Etapa 3: tema argumentativo da área do autor
  if (step.id === "argument_development" && context.domain) {
    return THEMES_BY_DOMAIN[context.domain]?.argument ?? step.defaultTheme;
  }

  return step.defaultTheme;
}

const THEMES_BY_DOMAIN: Record<string, { opinion: string; argument: string }> = {
  tecnologia: {
    opinion: "Vale a pena aprender a programar em 2026?",
    argument: "Ferramentas de IA devem ser obrigatórias no trabalho"
  },
  negocios: {
    opinion: "Trabalho remoto é produtivo ou prejudica o time?",
    argument: "Pequenas empresas devem investir em marca pessoal"
  },
  educacao: {
    opinion: "Escola deveria ensinar mais sobre vida prática?",
    argument: "Avaliação por provas ainda faz sentido"
  },
  // ...
};
```

### Por que apenas 3 perguntas

- **Área de atuação** → Personaliza temas, evita texto genérico (impacto alto, fricção baixa)
- **Audiência** → Calibra register, serve de baseline para validation (impacto alto, fricção baixa)
- **Ponto forte** → Validação qualitativa na Etapa 5 (impacto médio, opcional)

### O que NÃO perguntar

| Pergunta | Por quê não |
|---|---|
| "Você escreve formal ou informal?" | O wizard descobre pelo texto — pergunta não captura estilo real |
| "Qual formato você usa (blog, LinkedIn)?" | Canal não define estilo — reframing documentado |
| "Como você gostaria de soar?" | Aspiração ≠ realidade — o texto é a verdade |
| Mais de 5 perguntas | Fricção mata completion rate |

### Razão teórica
- **2510.13302:** temas que o autor domina geram texto autêntico → estilo transferível
- **2507.00838:** features emergem do ato de escrever, não de respostas a perguntas
- **pmid:35942740:** poder discriminativo vem do texto, não de metadados

---

## Etapa 1: Micro-decisões

### Objetivo
Capturar a camada mais superficial da voz: vocabulário preferido, marcadores de pontuação, tom direto vs. reflexivo, e tamanho de frase.

### Prompt ao usuário
> "Qual é a sua opinião sobre [tema cotidiano simples]?"
>
> Temas sugeridos (rotacionam):
> - "Trabalho remoto: vantagens ou desvantagens?"
> - "O que faz um bom café?"
> - "Vale a pena acordar cedo?"
> - "Qual o melhor formato de conteúdo online?"

### Parâmetros
- **Tamanho alvo:** ~60 palavras (3-4 frases)
- **Tamanho máximo:** 100 palavras
- **Formato:** textarea com contador de palavras
- **Opcional:** usuário pode pular (reduz confidence)

### Features capturadas (determinísticas)
| Feature | O que mede |阈值 para detecção |
|---|---|---|
| avgWordLength | Complexidade lexical | qualquer valor |
| punctuationDensity | Uso de pontuação | qualquer valor |
| avgSentenceLength | Cadência de frase | qualquer valor |
| formalityScore | Formalidade | qualquer valor |
| emotionalityScore | Carga emocional | qualquer valor |
| hedgingMarkers | "talvez", "acho que", "provavelmente" | contagem |
| certaintyMarkers | "certamente", "sempre", "nunca" | contagem |

### Razão teórica
- **2507.00838:** features de pontuação são preditores fortes em textos curtos
- **pmid:35942740:** features simples já têm poder discriminativo

---

## Etapa 2: Como eu penso

### Objetivo
Capturar o Reasoning Signature: como o autor constrói raciocínio, sua postura epistêmica, e relação com o leitor.

### Prompt ao usuário
> "Conte sobre algo que você aprendeu recentemente e como isso mudou sua perspectiva."
>
> Orientações:
> - Pode ser algo pessoal ou profissional
> - Não precisa ser longo — foque no que foi significativo
> - Escreva como escreveria para um colega

### Parâmetros
- **Tamanho alvo:** ~150 palavras (8-12 frases)
- **Tamanho máximo:** 250 palavras
- **Formato:** textarea com contador de palavras

### Features capturadas (determinísticas)
| Feature | O que mede |
|---|---|
| avgSentenceLength | Cadência |
| sentenceLengthVariance | Ritmo (variance = ritmo caótico) |
| avgDependencyDepth | Complexidade sintática |
| posDistribution | Distribuição de classes gramaticais |
| openingPattern | Primeira frase: declaração vs. pergunta vs. contexto |
| closingPattern | Última frase: conclusão vs. aberta vs. pergunta |

### Razão teórica
- **2510.13302:** reasoning requer texto com carga argumentativa
- **2507.13614:** features sintáticas capturam como o autor organiza pensamento

---

## Etapa 3: Como eu construo

### Objetivo
Capturar o Argument Development Signature: rotinas argumentativas, tendências de transição, uso de contraexemplos, e anti-padrões estruturais.

### Prompt ao usuário
> "Defenda uma posição sobre algo que importa para você."
>
> Orientações:
> - Escolha algo sobre o qual você realmente tem opinião
> - Não precisa ser polêmico — pode ser algo que você acredita no trabalho
> - Argumente com exemplos ou razões

### Parâmetros
- **Tamanho alvo:** ~250 palavras (12-18 frases)
- **Tamanho máximo:** 400 palavras
- **Formato:** textarea com contador de palavras

### Features capturadas (determinísticas)
| Feature | O que mede |
|---|---|
| paragraphCount | Estrutura de argumentação |
| avgParagraphLength | Densidade por parágrafo |
| transitionMarkers | Conectivos: "mas", "porém", "além disso", "portanto" |
| counterexampleMarkers | "por outro lado", "no entanto", "imagina que" |
| insightTiming | Posição do insight principal no texto |
| avgDependencyDepth | Complexidade sintática (deve ser maior que Etapa 2) |

### Razão teórica
- **2507.13614:** development traits (openingMode, perspectiveShiftDensity, etc.)
- **pmid:35857768:** n-gramas sintáticos como markers independentes de tópico

---

## Etapa 4: Versatilidade

### Objetivo
Capturar como o autor adapta registro e complexidade para diferentes audiências, validando consistência cross-formato.

### Prompt ao usuário
> "Explique algo que você sabe bem para alguém que não conhece o assunto."
>
> Orientações:
> - Pode ser algo do seu trabalho, hobby, ou interesse
> - Foque em tornar acessível sem simplificar demais
> - Imagine que está explicando para um amigo curioso

### Parâmetros
- **Tamanho alvo:** ~180 palavras (8-12 frases)
- **Tamanho máximo:** 300 palavras
- **Formato:** textarea com contador de palavras

### Features capturadas (determinísticas)
| Feature | O que mede |
|---|---|
| avgWordLength | Complexidade lexical (deve diminuir vs. Etapa 3) |
| formalityScore | Formalidade (deve diminuir vs. Etapa 3) |
| avgSentenceLength | Cadência (deve ser mais curta que Etapa 3) |
| technicalDensity | Presença de termos técnicos |
| analogyMarkers | "é como", "imagina que", "pensa em" |

### Razão teórica
- **2510.13302:** validação de transferabilidade de estilo
- **2507.13614:** adaptabilidade de registro como feature

---

## Etapa 5: Revisão e Confirmação

### Objetivo
Apresentar o perfil inferido ao usuário para confirmação, e calibrar a confidence final.

### Fluxo

1. **Loading:** extração determinística + LLM em paralelo
2. **Apresentação:** perfil em prose legível com 3 seções:
   - "Como você pensa" (Core Reasoning Signature)
   - "Como você desenvolve textos" (Argument Development Signature)
   - "Como sua voz varia" (consistência e variância)
3. **Confirmação:** usuário confirma ou rejeita cada seção
4. **Ajuste:** se rejeitar,usuário pode refinar (opcional)
5. **Finalização:** confidence final calculada

### Interface

```
┌─────────────────────────────────────────────────┐
│  Seu perfil de voz está pronto                  │
│                                                 │
│  ┌─── Como você pensa ──────────────────────┐  │
│  │ [narrativeProse do CoreReasoning]         │  │
│  │                                           │  │
│  │ [✓ Confirmo] [✎ Quero ajustar]           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Como você desenvolve textos ──────────┐  │
│  │ [developmentProse do ArgumentDevelopment] │  │
│  │                                           │  │
│  │ [✓ Confirmo] [✎ Quero ajustar]           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Consistência da sua voz ──────────────┐  │
│  │ Consistência: 0.78 (boa)                  │  │
│  │ Independência de tema: 0.65 (boa)         │  │
│  │ Confiança: ALTA                           │  │
│  │                                           │  │
│  │ [✓ Tudo certo, vamos gerar!]              │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Confidence final

```
confidence = f(
  exampleCount = 5,                    // base: wizard completo
  consistencyScore,                    // > 0.7 → boost
  topicIndependenceScore,              // > 0.6 → boost
  crossLengthConsistency,              // > 0.5 → boost
  reasoningExtracted = true,           // boost
  developmentExtracted = true,         // boost
  userConfirmed = true                 // boost
)
```

### Razão teórica
- **pmid:39781110:** procedimento probabilístico interpretável
- **2505.15422:** abordagem "portfolio" (múltiplos sinais)

---

## Temas do Wizard

### Princípio de seleção
Temas devem ser:
1. **Do domínio do autor** (quando contexto disponível) — texto mais autêntico
2. **Genéricos o suficiente** para qualquer pessoa ter opinião (fallback sem contexto)
3. **Variados** para validar independência topical
4. **Neutros** para não enviesar registro
5. **Progressivos** em complexidade cognitiva

### Pool de temas por contexto

| Área | Etapa 1 (opinião) | Etapa 3 (argumento) |
|---|---|---|
| Tecnologia | "Vale a pena aprender a programar?" | "IA deve ser obrigatória no trabalho?" |
| Negócios | "Trabalho remoto é produtivo?" | "Pequenas empresas devem investir em marca?" |
| Educação | "Escola deveria ensinar mais vida prática?" | "Avaliação por provas ainda faz sentido?" |
| Saúde | "Telemedicina substitui consulta presencial?" | "Prevenção deveria ter mais investimento que tratamento?" |
| Criativo | "Inteligência artificial ajuda ou atrapalha a criação?" | "Criatividade pode ser ensinada?" |

### Pool de temas genéricos (fallback)

| Etapa | Temas (rotacionam) |
|---|---|
| 1 | "Trabalho remoto", "Bom café", "Acordar cedo", "Conteúdo online" |
| 3 | "Posição sobre educação", "Futuro do trabalho", "Importância de X", "Por que Y importa" |

### Etapas com prompts fixos (não dependem de contexto)

| Etapa | Prompt |
|---|---|
| 2 | "Conte sobre algo que você aprendeu recentemente e como isso mudou sua perspectiva." |
| 4 | "Explique algo que você sabe bem para alguém que não conhece o assunto." |

### Geração dinâmica
Temas são resolvidos por `resolveTheme(step, context)` que combina:
- `WizardContext.domain` → tema da área do autor
- `WizardContext.audiência` → (futuro: adaptar prompt da Etapa 4)
- Fallback → tema genérico do pool

---

## Mudanças no Backend

### `packages/domain/src/voice-calibration.ts`

```typescript
// Substituir CALIBRATION_ROUND_DIMENSIONS
export const CALIBRATION_WIZARD_STEPS = [
  {
    id: "micro_opinion",
    label: "Opinião curta",
    prompt: "Qual é a sua opinião sobre {theme}?",
    targetWords: 60,
    maxWords: 100,
    targetSentences: 3,
    capturesFeatures: ["lexical", "punctuation", "tone"] as const,
    themePool: [
      "trabalho remoto",
      "um bom café",
      "acordar cedo",
      "melhor formato de conteúdo online"
    ]
  },
  {
    id: "reasoning_reflection",
    label: "Como eu penso",
    prompt: "Conte sobre algo que você aprendeu recentemente e como isso mudou sua perspectiva.",
    targetWords: 150,
    maxWords: 250,
    targetSentences: 10,
    capturesFeatures: ["reasoning", "authority", "certainty"] as const,
    themePool: [] // prompt fixo
  },
  {
    id: "argument_development",
    label: "Como eu construo",
    prompt: "Defenda uma posição sobre algo que importa para você.",
    targetWords: 250,
    maxWords: 400,
    targetSentences: 15,
    capturesFeatures: ["development", "transitions", "epistemic"] as const,
    themePool: [] // prompt fixo
  },
  {
    id: "format_adaptation",
    label: "Versatilidade",
    prompt: "Explique algo que você sabe bem para alguém que não conhece o assunto.",
    targetWords: 180,
    maxWords: 300,
    targetSentences: 10,
    capturesFeatures: ["register", "complexity", "adaptation"] as const,
    themePool: [] // prompt fixo
  },
  {
    id: "review_confirm",
    label: "Revisão",
    // não coleta texto — apenas apresenta perfil
    capturesFeatures: ["affirmation"] as const,
    themePool: []
  }
] as const;
```

### `apps/backend/src/product/voice/deterministic-extraction.ts` (novo)

```typescript
export interface DeterministicFeatures {
  readonly typeTokenRatio: number;
  readonly avgWordLength: number;
  readonly hapaxRatio: number;
  readonly avgSentenceLength: number;
  readonly sentenceLengthVariance: number;
  readonly avgDependencyDepth: number;
  readonly paragraphCount: number;
  readonly avgParagraphLength: number;
  readonly punctuationDensity: number;
  readonly formalityScore: number;
  readonly emotionalityScore: number;
  readonly certaintyMarkerCount: number;
  readonly hedgingMarkerCount: number;
  readonly transitionMarkerCount: number;
}

export function extractDeterministicFeatures(text: string): DeterministicFeatures {
  // Implementação usando:
  // - tokenização simples (split por espaços/pontuação)
  // - contagem de POS tags (via biblioteca leve ou regex)
  // - cálculos estatísticos básicos
  // - listas de marcadores (hedging, certainty, transitions)
  // Tempo estimado: <50ms por texto
}
```

### `apps/backend/src/product/voice/voice-rebuild-derivation.ts`

```typescript
// Substituir deriveConfidence
function deriveConfidence(
  activeExamples: readonly VoiceExampleRecord[],
  signals?: QuantitativeSignals,
  maxConfidenceFromCalibration?: VoiceProfileConfidence
): VoiceProfileConfidence {
  const count = activeExamples.length;
  let base: VoiceProfileConfidence = "low";

  if (count >= 5) base = "medium";
  if (count >= 5 && signals && signals.consistencyScore > 0.7) base = "high";

  // Boost: topic independence
  if (signals?.topicIndependenceScore ?? 0 > 0.6) {
    base = upgradeConfidence(base);
  }

  // Boost: extração completa
  if (signals?.extractionQuality.reasoningExtracted
      && signals?.extractionQuality.developmentExtracted) {
    base = upgradeConfidence(base);
  }

  // Penalty: muito consistente (suspeito de genérico)
  if (signals?.consistencyScore ?? 0 > 0.95) {
    base = downgradeConfidence(base);
  }

  const cap = maxConfidenceFromCalibration ?? "high";
  return minConfidence(base, cap);
}
```

---

## Métricas de Sucesso

| Métrica | Target | Como medir |
|---|---|---|
| Completion rate wizard | >80% | % de usuários que completam 5 etapas |
| Time per step | <3min | Tempo médio por etapa |
| Text quality | >50 palavras/texto | Média de palavras por etapa |
| Consistency score | 0.5-0.85 | Range saudável (não muito baixo, não muito alto) |
| Topic independence | >0.5 | Features que persistem entre temas |
| Reasoning extraction | >90% success | % de wizard que produz reasoning válido |
| Development extraction | >85% success | % de wizard que produz development válido |
| User confirmation | >70% | % de usuários que confirmam perfil sem edição |
| Voice confidence high | >60% de wizards | % de wizards que atingem confidence "high" |
