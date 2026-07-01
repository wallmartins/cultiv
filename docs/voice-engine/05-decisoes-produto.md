# Decisões de Produto — Refactor do Motor de Voz

Este documento consolida todas as decisões tomadas durante o redesign do motor de identificação de padrões.

---

## Decisão 1: Import de textos existentes — REMOVIDO

**Decisão:** O wizard de calibração é a única entrada de dados para o perfil de voz. Não existirá mais opção de importar textos que o autor já escreveu.

**Justificativa:**
- Wizard coleta textos genuínos com características controladas (tamanho, complexidade)
- Textos importados não têm metadados de contexto (não sabemos para quem, em que situação foram escritos)
- Simplifica o sistema: uma entrada, um fluxo, um perfil

**Impacto:**
- `VoiceExampleComposer` (frontend) → removido do onboarding
- `voice-batch-helpers.ts`, `voice-batches.ts` → removidos
- `VoiceExampleDraft` → simplificado (remove `channel`, `format`, `explicitContentType`)
- `effectiveContentTypeHints` → removido
- `explicitContentType` → removido

---

## Decisão 2: FormatExpressionProfile — REMOVIDO

**Decisão:** `FormatExpressionProfile` é removido do schema. Não é necessário manter.

**Justificativa:**
- O campo é armazenado mas **não é consumido no prompt de geração** (verificado no código)
- `register` já existe em `tone` do DerivedVoiceProfile
- `openingStyle` já existe em `CoreReasoningSignature.narrativeProse`
- `technicalDensity` é coberto por `QuantitativeSignals.formalityScore`
- Canal (blog, linkedin, email) não define estilo — é apenas distribuição

**O que substitui:**

| Campo atual | Substituto |
|---|---|
| `contentType` | Removido (canal não define estilo) |
| `register` | `tone` do DerivedVoiceProfile |
| `openingStyle` | `CoreReasoningSignature.narrativeProse` |
| `technicalDensity` | `QuantitativeSignals.formalityScore` |
| `narrativeProse` (por formato) | `CoreReasoningSignature.narrativeProse` (global) |

---

## Decisão 3: Exemplos brutos no prompt — REMOVIDOS

**Decisão:** O campo `examples` (textos originais do autor) é removido do `TextQualityVoiceProfile`. Substituído por `signatureOpenings` e `signatureClosings`.

**Justificativa:**
- Perfil com signals quantitativos é **mais preciso** que exemplos brutos:
  - `formalityScore` = 0.62 (numérico) vs. "leia 5 textos e infira formalidade"
  - `avgSentenceLength` = 18.3 (numérico) vs. "leia e conte"
  - `antiPatterns` = explícito vs. "deduza o que evitar"
- Artigo 2510.13302: um único example one-shot é suficiente para transferência — o `narrativeProse` serve como esse one-shot interpretado
- Artigo 2507.00838: features determinísticas são mais discriminativas que exemplos brutos

**O que entra no lugar:**

```typescript
interface DerivedVoiceProfile {
  // ...campos existentes...
  readonly signatureOpenings?: readonly string[];  // "Eu tenho pensado que...", "Uma coisa que..."
  readonly signatureClosings?: readonly string[];  // "Mas isso é só...", "A pergunta que fica..."
}
```

Frases de abertura/fechamento típicas, extraídas pelo Reasoning Extraction a partir dos textos do wizard. Entra no prompt como referência, sem ser texto bruto.

**Risco de genérico:** baixo. O perfil com reasoning + development + quantitative signals + anti-patterns é mais rico que 5 textos brutos. O risco real está na qualidade da extração LLM.

---

## Decisão 4: Migração — NENHUMA

**Decisão:** Não existe preocupação com migração. Só existe o perfil do autor principal (em desenvolvimento), que pode ser apagado para fresh start.

**Justificativa:** Produto em desenvolvimento, não lançado.

---

## Decisão 5: Voice Dashboard — Redesign completo

**Decisão:** O Voice Dashboard é redesignado para o novo formato.

**O que sai:**
- `VoiceExamplesList` — não existem mais "examples" no sentido antigo
- `VoiceExampleComposer` — wizard substitui
- `VoiceNextStepPanel` — simplificar (sem "adicione mais exemplos")

**O que fica:**
- `VoiceReasoningPresentation` — simplificar (prose do reasoning + development)
- `VoiceConfidenceRing` — manter (growth ring continua válido)
- `VoiceDevelopmentTraitsStrip` — manter (traits continuam sendo extraídos)

**O que entra:**
- Seção de `QuantitativeSignals` (consistency, topic independence)
- Mostrar **qual etapa** tem maior variância (não apenas score global)
- Sugerir refazer a etapa com maior variância
- Etapa bônus opcional para mejorar independência de tema

**Interface proposta:**

```
┌─────────────────────────────────────────────────┐
│  Seu Perfil de Voz                              │
│                                                 │
│  ┌─── Como você pensa ──────────────────────┐  │
│  │ [CoreReasoningSignature narrativeProse]   │  │
│  │ Certeza: moderada | Conclusão: lenta     │  │
│  │ Relação com leitor: par                  │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Como você desenvolve textos ──────────┐  │
│  │ [ArgumentDevelopment prose]               │  │
│  │ Postura: exploratória                     │  │
│  │ Traits: [abertura] [exemplos] [ritmo]     │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Consistência ─────────────────────────┐  │
│  │                                           │  │
│  │ Etapa 1:  ████████████░░  alta            │  │
│  │ Etapa 2:  ██████░░░░░░░░  baixa ← problema│  │
│  │ Etapa 3:  ██████████████  alta            │  │
│  │ Etapa 4:  ████████░░░░░░  média           │  │
│  │                                           │  │
│  │ A Etapa 2 tem características diferentes  │  │
│  │ das outras. Pode significar:              │  │
│  │ • Você escreve diferente emcontextos      │  │
│  │   reflexivos (válido)                     │  │
│  │ • O tema não era familiar                 │  │
│  │                                           │  │
│  │ [Refazer Etapa 2]                         │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Independência de tema ────────────────┐  │
│  │ Score: 0.62 (boa)                        │  │
│  │                                           │  │
│  │ ✓ Ritmo de frase                          │  │
│  │ ✓ Uso de pontuação                        │  │
│  │ ✗ Complexidade sintática (varia)          │  │
│  │                                           │  │
│  │ [Escrever texto extra] [Manter assim]     │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  Confiança: ALTA                                │
│  [Recalibrar wizard] [Gerar texto]             │
└─────────────────────────────────────────────────┘
```

**Regras de melhoria:**
- Consistência: refazer a etapa com maior variância (não o wizard todo)
- Independência de tema: etapa bônus opcional (não cobra quota)
- Não gamificação: scores são diagnóstico, não pontos

---

## Decisão 6: Structured Prompt — Guardrails quantitativos

**Decisão:** O prompt de geração é atualizado com signals quantitativos + signature phrases. Exemplos brutos são removidos.

**Prompt resultante:**

```
== AUTHOR VOICE ==
{coreReasoningSignature.narrativeProse}

== HOW THEY DEVELOP TEXTS ==
{argumentDevelopmentSignature.developmentProse}

== SIGNATURE PHRASES ==
Openings: {signatureOpenings}
Closings: {signatureClosings}

== WRITING STYLE ==
Tone: {tone}
Cadence: {cadence}
Markers: {styleMarkers}

== QUANTITATIVE CONSTRAINTS ==
- Average sentence length: {avgSentenceLength} words (±15%)
- Sentence length variance: {sentenceLengthVariance}
- Vocabulary diversity: {typeTokenRatio}
- Formality level: {formalityScore}
- Dependency depth: {avgDependencyDepth}

== ANTI-PATTERNS ==
{antiPatterns}
{derivedAntiPatterns}

== STRUCTURAL RULES ==
{rules}
```

**Por que funciona:**
- **2507.00838:** LLMs geram texto mais padronizado — guardrails numéricos compensam
- **2507.13614:** features quantitativas servem de limites concretos
- **2510.13302:** reasoning + development narrative guiam a "alma" do texto
- **pmid:35857768:** features sintáticas (dependency depth) são topic-independent

---

## Decisão 7: Voice Judge + Development Drift — v2 desde o início

**Decisão:** Implementar os checks quantitativos no development drift desde a v1.

### Novos checks em `development-drift.ts`

| Check | Threshold | Penalidade | Justificativa |
|---|---|---|---|
| Sentence length | ±25% do target | -15 | 25% é tolerância razoável |
| Formality | ±0.2 do target | -10 | 0.2 é ~20% da escala 0-1 |
| Vocabulary diversity | <70% do target | -10 | 70% detecta repetição excessiva |

### Parâmetro adicional

```typescript
function evaluateArgumentDevelopmentDrift(
  development: ArgumentDevelopmentSignature,
  candidate: string,
  stepName?: string,
  quantitativeSignals?: QuantitativeSignals  // NOVO
): VoiceDriftResult
```

### Threshold dinâmico no Voice Judge

```typescript
function resolveDevelopmentDriftThreshold(signals?: QuantitativeSignals): number {
  const base = 75;
  if (!signals) return base;
  if (signals.consistencyScore > 0.8) return base + 5;  // autores consistentes → mais apertado
  if (signals.consistencyScore < 0.5) return base - 5;  // autores variados → mais flexível
  return base;
}
```

### Pesos no score composto

Manter 40/30/30 (surface/reasoning/development). Os novos checks entram DENTRO de `development.score`.

---

## Decisão 8: Tratamento de falhas — Retry + DLQ

**Decisão:** Wizard é async com retry e DLQ.

```
Step Submit → Queue: wizard-step-processing
  1. Deterministic extraction (<50ms)
     → Retry 1x, depois DLQ
  2. Salvar VoiceExample com features
     → Retry 2x, depois DLQ
  3. Se Etapa 3+: LLM extraction
     → Retry 1x, depois DLQ
     → Profile fica sem reasoning/development
  4. Se Etapa 5: Confidence calculation
     → Retry 1x, depois DLQ

DLQ: wizard-step-failures
  - stepId, userId, error, attemptCount
  - Manual retry ou auto-retry com backoff

Recovery:
  - Wizard retoma de onde parou (step salvo)
  - Profile funciona com steps parciais
  - Confidence reflete completude
```

### Regras de fallback

| Falha | Retry | Fallback |
|---|---|---|
| Deterministic extraction | 1x | Features vazias (profile funciona sem) |
| VoiceExample save | 2x | Wizard bloqueado (sem exemplo, sem profile) |
| LLM extraction | 1x | Reasoning/development ausentes (surface only) |
| Confidence calculation | 1x | Confidence = "low" |

---

## Decisão 9: Pré-wizard — 3 perguntas contextuais

**Decisão:** 3 perguntas antes do wizard para personalizar temas e servir de baseline.

| Pergunta | O que alimenta | Obrigatória? |
|---|---|---|
| "Em que área você atua?" | Gera temas das Etapas 1 e 3 | Sim |
| "Para quem você escreve?" | Calibra register esperado | Sim |
| "Tem algo que faz bem como escritor?" | Validação na Etapa 5 | Opcional |

**O que NÃO perguntar:**
- "Você escreve formal ou informal?" → wizard descobre pelo texto
- "Qual formato você usa?" → canal não define estilo
- "Como você gostaria de soar?" → aspiração ≠ realidade
- Mais de 5 perguntas → fricção mata completion rate

---

## Decisão 10: Reframing de formato/canal

**Decisão:** Formato/canal (blog, linkedin, email) sai do cálculo. Características textuais (tamanho, complexidade, registro, ritmo) entram.

| Sai | Entra |
|---|---|
| `contentType` como chave | `textLengthBucket` (short/medium/long) |
| `FormatExpressionProfile` | `QuantitativeSignals` |
| Diferenciação por canal | Diferenciação por tamanho e complexidade |
| `effectiveContentTypeHints` | `topicTag` |

---

## Resumo: Checklist de Decisões

| # | Decisão | Status |
|---|---|---|
| 1 | Import removido | ✅ Decidido |
| 2 | FormatExpressionProfile removido | ✅ Decidido |
| 3 | Exemplos brutos removidos, signature phrases adicionadas | ✅ Decidido |
| 4 | Sem migração | ✅ Decidido |
| 5 | Dashboard redesignado | ✅ Decidido |
| 6 | Structured Prompt com guardrails quantitativos | ✅ Decidido |
| 7 | Development Drift v2 (com quantitative checks) | ✅ Decidido |
| 8 | Retry + DLQ para falhas | ✅ Decidido |
| 9 | Pré-wizard com 3 perguntas | ✅ Decidido |
| 10 | Reframing formato/canal → características textuais | ✅ Decidido |
