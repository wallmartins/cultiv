# Mudanças Propostas — Motor de Identificação de Padrões

Este documento mapeia as mudanças necessárias para alinhar o motor de identificação do Cultiv com o referencial teórico, incluindo o reframing de formato/canal para características textuais.

---

## Reframing: De Formato/Canal para Características Textuais

### O problema atual

O sistema atual organiza `FormatExpressionProfile` por **content type** (blog, linkedin, email, thread). Cada content type tem seu register, openingStyle e technicalDensity. Isso assume que o estilo do autor muda **por canal**.

### A realidade

Canais como blog, LinkedIn e email tornaram-se **oplatforms de distribuição**, não determinantes de estilo. Um autor que escreve no LinkedIn e no Substack frequentemente mantém o mesmo voice — o que muda é o **tamanho do texto** e a **complexidade estrutural**, não o estilo.

### O que os artigos dizem

- **2510.13302 (OSST):** estilo é transferível entre canais quando o conteúdo é neutralizado — estilo não é propriedade do canal
- **2507.13614:** homogeneização entre modelos mostra que estilo é mais profundo que formato
- **pmid:35857768:** n-gramas sintáticos são independentes de tópico e formato
- **pmid:35942740:** features linguísticas são "universais" dentro de um idioma

### Nova dimensão: Características Textuais

Em vez de organizar por canal, o perfil deve capturar como o autor se comporta quando o **tamanho** e a **complexidade** do texto mudam:

| Dimensão | O que mede | Por que importa |
|---|---|---|
| **Tamanho** (curto/médio/longo) | Como o autor adapta densidade de informação ao espaço disponível | Autores curtos são mais diretos; longos são mais desenvolvidos |
| **Complexidade argumentativa** (simples/moderada/complexa) | Como o autor estrutura raciocínio conforme a demanda cognitiva | Autores simples usam exemplos; complexos usam abstração |
| **Tom** (formal/informal/técnico/conversacional) | Registro do autor independente de canal | Pode variar com audiência, não com plataforma |
| **Ritmo** (rápido/misto/lento) | Cadência de frases e parágrafos | Ritmo é propriedade do autor, não do formato |

### O que sai do cálculo

- `contentType` como chave primária de `FormatExpressionProfile`
- Diferenciação por canal (blog vs. linkedin vs. email)
- `explicitContentType` e `effectiveContentTypeHints` como fatores de cobertura

### O que entra no cálculo

- **Text Length Bucket:** curto (<80 palavras), médio (80-200), longo (>200)
- **Argument Complexity:** quantas camadas de raciocínio o autor emprega
- **Register Profile:** como o registro varia com o contexto (não com o canal)
- **Rhythm Profile:** padrões de comprimento de frase e parágrafo

---

## Mudança 1: Pré-wizard Contextual + Wizard de Calibração em 5 Etapas

### Substitui

- Calibration Session com rounds A/B (voice-calibration-candidates.ts)
- Geração determinística de candidatos a partir de word banks
- Seleção + edição de candidatos

### Implementa

**Fase 0 — Pré-wizard (3 perguntas contextuais):**
Coleta domínio, audiência e auto-declaração de ponto forte. Essas respostas:
- Personalizam os temas das Etapas 1 e 3
- Servem de baseline para validação na Etapa 5
- Não capturam estilo (o wizard descobre pelo texto)

**Fases 1-5 — Wizard de escrita:**
Wizard onde o usuário escreve textos genuínos em 5 etapas progressivas:

| Fase | Etapa | Tamanho | Tema | O que captura |
|---|---|---|---|---|
| 0 | Contexto | (perguntas) | Domínio, audiência | Baseline, personalização |
| 1 | Micro-decisões | ~60 palavras (3 frases) | Opinião cotidiana | Vocabulário, pontuação, tom |
| 2 | Como eu penso | ~150 palavras (10 frases) | Algo que aprendi | Reasoning, postura epistêmica |
| 3 | Como eu construo | ~250 palavras (15 frases) | Posição importante | Argument development, transições |
| 4 | Versatilidade | ~180 palavras (10 frases) | Explicar algo complexo | Register adaptation, complexity |
| 5 | Revisão | (apresentação) | Perfil inferido | Author affirmation, confidence |

### Justificativa teórica

- **2510.13302:** textos genuínos são essenciais para transferibilidade de estilo
- **2507.13614:** 5 textos são suficientes para medir variância e consistência
- **2505.15422:** cold start com wizard guiado é viável com 5 amostras
- **2507.00838:** features emergem do ato de escrever, não de respostas a perguntas

---

## Mudança 2: Extração Determinística de Features

### Substitui

- Extração exclusivamente via LLM (reasoning-extraction.ts, argument-development-extraction.ts)
- Ground truth inexistente para validar extração LLM

### Implementa

Camada `DeterministicFeatureExtraction` que roda em cada texto do wizard:

```
Input: texto do autor
Output: {
  // Lexical
  typeTokenRatio: number,
  avgWordLength: number,
  hapaxRatio: number,
  vocabularyRichness: number,

  // Syntactic
  avgSentenceLength: number,
  sentenceLengthVariance: number,
  avgDependencyDepth: number,
  posDistribution: Record<string, number>,

  // Structural
  paragraphCount: number,
  avgParagraphLength: number,
  punctuationDensity: number,
  avgWordsPerSentence: number,

  // Semantic
  formalityScore: number,
  emotionalityScore: number,
  certaintyMarkers: number,
  hedgingMarkers: number
}
```

### Justificativa teórica

- **2507.00838:** StyloMetrix + n-gramas como features determinísticas
- **2507.13614:** features multi-nível (morfologia, sintaxe, semântica)
- **pmid:35942740:** features simples (frequência) já têm poder discriminativo alto

---

## Mudança 3: Sinais Quantitativos no Perfil

### Substitui

- Confidence baseada apenas em contagem de exemplos
- Diagnósticos baseados em reasonCodes textuais

### Implementa

Campo `QuantitativeSignals` no `DerivedVoiceProfile`:

```typescript
interface QuantitativeSignals {
  // Features médias dos textos do wizard
  readonly aggregate: DeterministicFeatures;

  // Consistência entre textos (desvio padrão inverso)
  readonly consistencyScore: number;  // 0-1

  // Features que persistem entre temas diferentes
  readonly topicIndependenceScore: number;  // 0-1

  // Core reasoning estável entre tamanhos diferentes
  readonly crossLengthConsistency: number;  // 0-1

  // Qualidade da extração LLM
  readonly extractionQuality: {
    readonly reasoningExtracted: boolean;
    readonly developmentExtracted: boolean;
    readonly reconciliationNeeded: boolean;
  };
}
```

### Justificativa teórica

- **2507.13614:** variância euclidiana como métrica de qualidade
- **2510.13302:** transferibilidade como validação de estilo autêntico
- **2507.00838:** SHAP para explicar quais features são discriminativas

---

## Mudança 4: Confidence Composta

### Substitui

```typescript
// Atual
if (attestedCount >= 2) base = "medium";
if (attestedCount >= 5 && diversityScore >= 4) base = "high";
```

### Implementa

```typescript
// Nova
function deriveConfidence(
  exampleCount: number,
  signals: QuantitativeSignals,
  cap?: VoiceProfileConfidence
): VoiceProfileConfidence {
  // Base: contagem (5 textos do wizard = base sólida)
  let base = exampleCount >= 5 ? "high" : exampleCount >= 3 ? "medium" : "low";

  // Boost: consistência
  if (signals.consistencyScore > 0.7) base = upgrade(base);

  // Boost: topic independence
  if (signals.topicIndependenceScore > 0.6) base = upgrade(base);

  // Boost: extração LLM completa
  if (signals.extractionQuality.reasoningExtracted
      && signals.extractionQuality.developmentExtracted) {
    base = upgrade(base);
  }

  // Penalty: texto muito genérico (consistência > 0.95 = suspeito)
  if (signals.consistencyScore > 0.95) base = downgrade(base);

  return minConfidence(base, cap ?? "high");
}
```

### Justificativa teórica

- **pmid:39781110:** procedimento probabilístico interpretável
- **2507.13614:** variância como sinal de qualidade (não apenas contagem)
- **2505.15422:** abordagem "portfolio" (múltiplos sinais)

---

## Mudança 5: Anti-padrões como Guardrails Quantitativos

### Substitui

- Anti-padrões como lista de strings
- Prompt de geração baseado apenas em narrativeProse

### Implementa

Guardrails numéricos derivados das features determinísticas:

```
== AUTHOR VOICE ==
{narrativeProse do CoreReasoningSignature}

== WRITING CONSTRAINTS ==
- Average sentence length: {avgSentenceLength} words (±15%)
- Sentence length variance: {sentenceLengthVariance} (maintain rhythm)
- Formality level: {formalityScore} (0=colloquial, 1=formal)
- Vocabulary diversity: {typeTokenRatio} (higher=more varied)
- Dependency depth: {avgDependencyDepth} (sentence complexity)
- Punctuation density: {punctuationDensity} (0=clean, 1=heavy)

== ANTI-PATTERNS ==
{derivedAntiPatterns}

== WHAT TO AVOID ==
- Sentences consistently shorter than {avgSentenceLength * 0.5}
- Vocabulary repetition above {1 - typeTokenRatio} threshold
- Formality above {formalityScore + 0.2} or below {formalityScore - 0.2}
```

### Justificativa teórica

- **2507.00838:** LLMs geram texto mais padronizado — guardrails compensam
- **2507.13614:** features quantitativas servem de limites para geração
- **pmid:38984302:** features intrínsecas são superiores a TF-IDF

---

## Mudança 6: Separação Estilo vs. Conteúdo no VoiceExample

### Substitui

- `effectiveContentTypeHints` como fator de cobertura
- `explicitContentType` como chave de agrupamento

### Implementa

Campos novos no `VoiceExample`:

```typescript
interface VoiceExample {
  // ... campos existentes ...

  // Nova classificação
  readonly textLengthBucket: "short" | "medium" | "long";
  readonly argumentComplexity: "simple" | "moderate" | "complex";
  readonly register: "formal" | "informal" | "technical" | "conversational";

  // Features determinísticas (calculadas na ingestão)
  readonly deterministicFeatures?: DeterministicFeatures;

  // Tópico (para cálculo de topic independence)
  readonly topicTag?: string;
}
```

### Justificativa teórica

- **2510.13302:** estilo vs. tópico são camadas separáveis
- **pmid:27006870:** features de conteúdo devem ser separadas de features de estilo
- **pmid:35857768:** n-gramas sintáticos são independentes de tópico

---

## Mudança 7: VoiceProfileDiagnostics com Métricas Quantitativas

### Substitui

- `reasonCodes` e `nextActionCodes` como único diagnóstico
- `materialBase` baseado em contagens

### Implementa

Campo adicional no `VoiceProfileDiagnostics`:

```typescript
interface VoiceProfileDiagnostics {
  // ... campos existentes ...

  readonly quantitativeMetrics?: {
    readonly consistencyScore: number;
    readonly topicIndependenceScore: number;
    readonly crossLengthConsistency: number;
    readonly featureCoverage: number;      // % de features detectadas
    readonly extractionSuccessRate: number; // reasoning + development ok
    readonly averageDeterministicQuality: number; // qualidade das features
  };
}
```

---

## Mudança 8: Remoção do Import de Textos

### Substitui

- `VoiceExampleComposer` (frontend)
- `voice-batch-helpers.ts`, `voice-batches.ts`
- `VoiceExampleDraft` com campos de canal/formato
- `effectiveContentTypeHints`, `explicitContentType`

### Implementa

Wizard é a única entrada de dados. Não existe mais import de textos existentes.

### Justificativa

- Wizard coleta textos com metadados controlados (tamanho, complexidade, tema)
- Textos importados não têm contexto de produção
- Simplifica o sistema: uma entrada, um fluxo

---

## Mudança 9: Remoção do FormatExpressionProfile

### Substitui

- `FormatExpressionProfile` (contentType, register, openingStyle, technicalDensity)
- `formatExpressionProfile` no `TextQualityVoiceProfile`
- `formatExpressionProfile` no `DerivedVoiceProfile`

### Implementa

Campos substituídos por:

| Campo atual | Substituto |
|---|---|
| `contentType` | Removido |
| `register` | `tone` do DerivedVoiceProfile |
| `openingStyle` | `CoreReasoningSignature.narrativeProse` |
| `technicalDensity` | `QuantitativeSignals.formalityScore` |

### Justificativa

- Campo é armazenado mas **não consumido no prompt de geração**
- Canal não define estilo — é apenas distribuição
- Artigo 2510.13302: estilo é transferível entre canais

---

## Mudança 10: Remoção de Exemplos Brutos do Prompt

### Substitui

- `examples` no `TextQualityVoiceProfile` (textos originais do autor)
- `lacksExampleCadence` no drift scoring

### Implementa

- `signatureOpenings` e `signatureClosings` (frases de abertura/fechamento típicas)
- Profile com quantitative signals substitui exemplos brutos

### Justificativa

- Perfil com signals é mais preciso que exemplos brutos (numérico vs. inferência)
- Artigo 2510.13302: um one-shot interpretado (narrativeProse) é suficiente
- Artigo 2507.00838: features determinísticas são mais discriminativas

---

## Mudança 11: Structured Prompt com Guardrails Quantitativos

### Substitui

- Prompt baseado apenas em narrativeProse + anti-patterns

### Implementa

Prompt com 7 seções:
1. AUTHOR VOICE (reasoning narrativeProse)
2. HOW THEY DEVELOP TEXTS (development prose)
3. SIGNATURE PHRASES (openings/closings)
4. WRITING STYLE (tone, cadence, markers)
5. QUANTITATIVE CONSTRAINTS (sentence length, variance, TTR, formality, dependency depth)
6. ANTI-PATTERNS (lista + derived)
7. STRUCTURAL RULES

### Justificativa

- **2507.00838:** LLMs geram padronizado — guardrails compensam
- **2507.13614:** features quantitativas = limites concretos
- **pmid:35857768:** features sintáticas são topic-independent

---

## Mudança 12: Development Drift v2

### Substitui

- `evaluateArgumentDevelopmentDrift` sem checks quantitativos

### Implementa

3 novos checks:

| Check | Threshold | Penalidade |
|---|---|---|
| Sentence length | ±25% do target | -15 |
| Formality | ±0.2 do target | -10 |
| Vocabulary diversity | <70% do target | -10 |

Threshold dinâmico no Voice Judge:
- consistencyScore > 0.8 → threshold +5
- consistencyScore < 0.5 → threshold -5

### Justificativa

- Features quantitativas tornam drift mais preciso
- Threshold dinâmico respeita variância natural do autor

---

## Mudança 13: Voice Dashboard Redesign

### Substitui

- `VoiceExamplesList`
- `VoiceExampleComposer`
- `VoiceNextStepPanel` (simplificar)

### Implementa

- Seção de QuantitativeSignals com breakdown por etapa
- Sugerir refazer etapa com maior variância
- Etapa bônus opcional para independência de tema

### Justificativa

- Dashboard deve refletir o novo modelo (wizard, não import)
- Transparência sobre como o perfil foi construído

---

## Mudança 14: Tratamento de Falhas — Retry + DLQ

### Implementa

- Retry 1-2x por etapa do wizard
- DLQ para falhas persistentes
- Profile funciona com steps parciais
- Confidence reflete completude

### Justificativa

- Wizard é async por fila — retry é natural
- Profile parcial é melhor que nenhum profile

---

## Resumo: Impacto por Arquivo

| Arquivo | Mudança | Complexidade |
|---|---|---|
| `packages/domain/src/voice-calibration.ts` | Expandir dimensions para 5 etapas com metadados | Baixa |
| `packages/domain/src/voice.ts` | Adicionar QuantitativeSignals, signatureOpenings/Closings; remover formatExpressionProfile | Média |
| `packages/contracts/src/voice.ts` | Atualizar TextQualityVoiceProfileSchema | Média |
| `packages/contracts/src/reasoning.ts` | Adicionar textLengthBucket, argumentComplexity | Baixa |
| `apps/backend/src/product/voice/voice-calibration-candidates.ts` | Substituir por geração de temas | Alta |
| `apps/backend/src/product/voice/voice-rebuild-derivation.ts` | Confidence composta com signals | Média |
| `apps/backend/src/product/voice/voice-calibration-service.ts` | Adaptar para wizard de 5 etapas + retry/DLQ | Alta |
| `apps/web/src/app/onboarding/screens/VoiceCalibrationSession.tsx` | Redesign para wizard com textarea | Alta |
| **NOVO:** `apps/backend/src/product/voice/deterministic-extraction.ts` | Feature extraction determinística | Alta |
| **NOVO:** `apps/backend/src/product/voice/voice-calibration-context.ts` | WizardContext (domínio, audiência) | Baixa |
| `packages/text-quality/src/voice/voice-profile.ts` | Integrar quantitative signals, remover examples | Média |
| `packages/text-quality/src/quality/development-drift.ts` | Adicionar checks quantitativos | Média |
| `packages/text-quality/src/quality/drift.ts` | Atualizar cálculo composto | Baixa |
| `apps/backend/src/execution/quality/voice-judge-policy.ts` | Threshold dinâmico | Baixa |
| `apps/web/src/app/voice/components/` | Redesign dashboard | Alta |
| **REMOVER:** `apps/web/src/app/voice/components/VoiceExamplesList.tsx` | — | — |
| **REMOVER:** `apps/web/src/app/voice/components/VoiceExampleComposer.tsx` | — | — |
