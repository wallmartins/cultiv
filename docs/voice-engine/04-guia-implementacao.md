# Guia de Implementação — Do's and Don'ts

Este documento lista o que fazer e o que NÃO fazer ao implementar as mudanças propostas no motor de identificação de padrões.

---

## Regras Gerais

### ✅ Do's

1. **Manter retrocompatibilidade** — campos novos são `optional`. O sistema atual continua funcionando sem signals quantitativos.

2. **Implementar deterministic extraction primeiro** — é módulo isolado, sem dependências, e serve de base para todo o resto.

3. **Calibrar thresholds com dados reais** — os valores de consistencyScore (0.7), topicIndependenceScore (0.6), etc. são estimates iniciais. Devem ser ajustados após rodar o wizard com 50-100 usuários reais.

4. **Tratar signals como opcional em toda a cadeia** — `voice-profile.ts`, `voice-rebuild-derivation.ts`, e o prompt de geração devem funcionar sem signals (fallback para behavior atual).

5. **Manter `CALIBRATION_ROUND_DIMENSIONS` até wizard estar em produção** — não remover código existente antes de validar o novo fluxo.

6. **Testar deterministic extraction com textos reais** — criar dataset de 20-30 textos de autores conhecidos para validar que features são discriminativas.

7. **Logging detalhado em cada etapa do wizard** — tempo por etapa, completion rate, word count real vs. target, features extraídas.

8. **Implementar retry + DLQ desde o início** — wizard é async, falhas são esperadas. Profile parcial é melhor que nenhum profile.

9. **Extrair signatureOpenings/Closings durante reasoning extraction** — são frases típicas, não textos inteiros.

10. **Passar quantitativeSignals para development drift** — checks quantitativos tornam drift mais preciso.

### ❌ Don'ts

1. **NÃO remover `FormatExpressionProfile` antes de validar que nenhuma feature é perdida** — embora não seja consumido no prompt, confirmar que `tone`, `cadence` e `QuantitativeSignals` cobrem tudo.

2. **NÃO tornar o wizard obrigatório sem skip** — sempre oferecer pular etapas (com penalty de confidence). Usuários que não completam 5/5 ainda devem ter perfil funcional (confidence baixa).

3. **NÃO usar LLM para extrair features determinísticas** — a extração determinística é rápida (<50ms) e não depende de provider. LLM é usada apenas para sintetizar narrativa legível.

4. **NÃO confundir consistência com genérico** — consistencyScore > 0.95 é suspeito, mas consistencyScore entre 0.7-0.9 é ideal. Não penalizar autores consistentes.

5. **NÃO pedir ao usuário que descreva seu estilo** — auto-declaração é baseline, não ground truth. O wizard descobre o estilo pelo texto.

6. **NÃO implementar topicIndependenceScore sem dataset variado** — o cálculo requer textos de temas diferentes. Sem isso, o score é inválido.

7. **NÃO mudar o `Structured Prompt` de geração sem testes A/B** — guardrails quantitativos podem piorar geração se mal calibrados. Testar com e sem antes de shipped.

8. **NÃO penalizar variação legítima no drift** — autores escrevem diferente em contextos diferentes. O drift deve detectar desvio do padrão, não variação natural.

9. **NÃO adicionar `typeTokenRatio` check no drift** — já é coberto por `antiPatterns`. Redundância aumenta false positives.

10. **NÃO usar `examples` (textos brutos) no prompt de geração** — profile com signals + reasoning + development é mais preciso. Exemplos brutos são ruído.

11. **NÃO esconder scores do usuário** — consistência e independência de tema são diagnósticos, não métricas de vergonha. Mostrar com contexto e sugestões de melhoria.

12. **NÃO forçar refazer wizard** — sugerir refazer a etapa com maior variância, não o wizard todo. Respeitar o tempo do usuário.

---

## Implementação por Fase

### Fase 1: Foundation (sem quebrar existente)

#### ✅ Do
- Adicionar `QuantitativeSignals` como `optional` em `DerivedVoiceProfile`
- Adicionar `CALIBRATION_WIZARD_STEPS` ao lado de `CALIBRATION_ROUND_DIMENSIONS` (não substituir)
- Criar `deterministic-extraction.ts` como módulo puro (sem side effects)
- Adicionar `WizardContext` ao schema de calibração

#### ❌ Don't
- Não remover `CALIBRATION_ROUND_DIMENSIONS` ainda
- Não mudar `deriveConfidence` ainda
- Não alterar `VoiceCalibrationSession.tsx` ainda
- Não adicionar dependências externas para NLP (usar regex + cálculos básicos)

---

### Fase 2: Backend

#### ✅ Do
- Integrar `deterministic-extraction.ts` no `voice-rebuild-pipeline.ts` como step opcional
- Adicionar `QuantitativeSignals` ao `DerivedVoiceProfile` durante rebuild
- Atualizar `deriveConfidence` para aceitar signals opcionais (com fallback)
- Testar confidence composta com fixtures sintéticas

#### ❌ Don't
- Não chamar deterministic extraction em textos que não são do wizard
- Não sobrescrever confidence anterior se signals são undefined
- Não bloquear rebuild se deterministic extraction falhar (é opcional)
- Não logar features determinísticas em texto (são dados sensíveis do autor)

---

### Fase 3: Calibration Flow

#### ✅ Do
- Criar `voice-calibration-context.ts` para gerenciar `WizardContext`
- Adaptar `voice-calibration-candidates.ts` para `resolveTheme(step, context)`
- Expandir `voice-calibration-service.ts` para wizard de 5 etapas
- Manter fluxo A/B como fallback atrás de feature flag

#### ❌ Don't
- Não remover fluxo A/B até wizard estar em produção por 2 semanas
- Não gerar temas via LLM no backend (usar pool estático + contexto)
- Não forçar completion de todas as etapas (skip com penalty)
- Não salvar `WizardContext` em voice profile (é metadata de sessão)

---

### Fase 4: Text Quality (Prompt + Drift)

#### ✅ Do
- Integrar `quantitativeSignals` no `voice-profile.ts` (text-quality)
- Adicionar `signatureOpenings` e `signatureClosings` ao prompt
- Adicionar 3 checks quantitativos ao `development-drift.ts`
- Passar `quantitativeSignals` para `drift.ts`
- Implementar threshold dinâmico no `voice-judge-policy.ts`
- Remover `formatExpressionProfile` e `examples` dos schemas

#### ❌ Don't
- Não mudar pesos do score composto (40/30/30) ainda
- Não adicionar `typeTokenRatio` check (redundante com antiPatterns)
- Não remover `lacksExampleCadence` antes de validar que `avgSentenceLength` cobre
- Não mudar thresholds sem dados reais

---

### Fase 5: Frontend

#### ✅ Do
- Criar componente `WizardStep` reutilizável com textarea + contador
- Mostrar progress visual (5 etapas + pré-wizard)
- Validar word count mínimo antes de permitir avanço
- Permitir voltar e editar etapas anteriores
- Redesignar Voice Dashboard com seção de signals quantitativos
- Mostrar breakdown de consistência por etapa
- Oferecer refazer etapa com maior variância
- Remover `VoiceExamplesList` e `VoiceExampleComposer`

#### ❌ Don't
- Não usar wizard multi-page (manter em uma tela com steps)
- Não esconder o contador de palavras (transparência)
- Não auto-submeter ao atingir word count (usuário clica "Continuar")
- Não usar animações pesadas entre etapas (mantê-lo focused)
- Não gamificar scores (são diagnóstico, não pontos)
- Não forçar refazer wizard (sugerir refazer etapa específica)

---

### Fase 6: Cleanup

#### ✅ Do
- Remover `CALIBRATION_ROUND_DIMENSIONS` e fluxo A/B
- Remover `generateCalibrationCandidates` (word bank)
- Remover `VoiceExamplesList.tsx` e `VoiceExampleComposer.tsx`
- Remover `voice-batch-helpers.ts` e `voice-batches.ts`
- Remover `FormatExpressionProfile` dos schemas
- Remover `examples` do `TextQualityVoiceProfile`
- Atualizar testes para novo fluxo

#### ❌ Don't
- Não remover dados de sessões A/B antigas (manter para audit)
- Não mudar `VOICE_CALIBRATION_PLAN_LIMITS` (mantém mesmo com wizard)
- Não remover `editDeltaScore` do `VoiceExample` (pode ser útil para outros flows)

---

## Padrões de Código

### Deterministic Features

```typescript
// ✅ Do: módulo puro, sem dependências externas
export function extractDeterministicFeatures(text: string): DeterministicFeatures {
  const sentences = splitSentences(text);
  const words = splitWords(text);
  // ... cálculos ...
  return { typeTokenRatio, avgSentenceLength, ... };
}

// ❌ Don't: não usar bibliotecas NLP pesadas
import nlp from 'compromise'; // NÃO — manter leve
```

### Confidence Calculation

```typescript
// ✅ Do: fallback para behavior atual
function deriveConfidence(
  activeExamples: readonly VoiceExampleRecord[],
  signals?: QuantitativeSignals,
): VoiceProfileConfidence {
  if (!signals) {
    return deriveLegacyConfidence(activeExamples); // fallback
  }
  return deriveCompositeConfidence(activeExamples, signals);
}

// ❌ Don't: não assumir que signals sempre existe
function deriveConfidence(
  activeExamples: readonly VoiceExampleRecord[],
  signals: QuantitativeSignals, // NÃO — deve ser optional
): VoiceProfileConfidence { ... }
```

### Theme Resolution

```typescript
// ✅ Do: pool estático + contexto
function resolveTheme(step: WizardStep, context?: WizardContext): string {
  if (!context?.domain) return step.defaultTheme;
  return THEMES_BY_DOMAIN[context.domain]?.[step.id] ?? step.defaultTheme;
}

// ❌ Don't: não gerar via LLM no backend
async function resolveTheme(step: WizardStep, context: WizardContext): Promise<string> {
  return await llm.complete(`Generate a theme for ${context.domain}...`); // NÃO
}
```

### Development Drift

```typescript
// ✅ Do: aceitar signals como opcional, 3 novos checks
function evaluateArgumentDevelopmentDrift(
  development: ArgumentDevelopmentSignature,
  candidate: string,
  stepName?: string,
  quantitativeSignals?: QuantitativeSignals  // NOVO, opcional
): VoiceDriftResult {
  let score = 100;
  // ...checks existentes...

  // NOVO: checks quantitativos
  if (quantitativeSignals) {
    const candidateAvgSentenceLength = computeAvgSentenceLength(candidate);
    const target = quantitativeSignals.aggregate.avgSentenceLength;
    if (Math.abs(candidateAvgSentenceLength - target) > target * 0.25) {
      score -= 15;
    }
    // ...formality, TTR checks...
  }

  return { score: Math.max(0, Math.min(100, score)), notes };
}

// ❌ Don't: não assumir que signals existe
function evaluateArgumentDevelopmentDrift(
  development: ArgumentDevelopmentSignature,
  candidate: string,
  stepName?: string,
  quantitativeSignals: QuantitativeSignals  // NÃO — deve ser optional
): VoiceDriftResult { ... }
```

### Structured Prompt

```typescript
// ✅ Do: 7 seções com signals quantitativos
function buildStructuredPrompt(profile: VoiceProfile): { system: string; user: string } {
  const system = [
    "== AUTHOR VOICE ==",
    profile.coreReasoningSignature?.narrativeProse ?? "",
    "",
    "== HOW THEY DEVELOP TEXTS ==",
    profile.argumentDevelopmentSignature?.developmentProse ?? "",
    "",
    "== SIGNATURE PHRASES ==",
    `Openings: ${profile.signatureOpenings?.join("; ") ?? "none"}`,
    `Closings: ${profile.signatureClosings?.join("; ") ?? "none"}`,
    "",
    "== WRITING STYLE ==",
    `Tone: ${profile.tone}`,
    `Cadence: ${profile.cadence}`,
    `Markers: ${profile.styleMarkers.join(", ")}`,
    "",
    "== QUANTITATIVE CONSTRAINTS ==",
    `- Average sentence length: ${profile.quantitativeSignals?.aggregate.avgSentenceLength ?? "varies"} words (±15%)`,
    `- Sentence length variance: ${profile.quantitativeSignals?.aggregate.sentenceLengthVariance ?? "varies"}`,
    `- Vocabulary diversity: ${profile.quantitativeSignals?.aggregate.typeTokenRatio ?? "varies"}`,
    `- Formality level: ${profile.quantitativeSignals?.aggregate.formalityScore ?? "varies"}`,
    `- Dependency depth: ${profile.quantitativeSignals?.aggregate.avgDependencyDepth ?? "varies"}`,
    "",
    "== ANTI-PATTERNS ==",
    ...profile.antiPatterns,
    ...(profile.derivedAntiPatterns ?? []),
    "",
    "== STRUCTURAL RULES ==",
    ...profile.rules
  ].join("\n");

  return { system, user: "" };
}

// ❌ Don't: não usar examples brutos no prompt
function buildStructuredPrompt(profile: VoiceProfile): { system: string; user: string } {
  const system = [
    "Write in this author's style.",
    "Examples:", profile.examples.join("\n---\n"),  // NÃO — textos brutos são ruído
  ].join("\n");
  return { system, user: "" };
}
```

### Frontend Wizard

```typescript
// ✅ Do: validação por etapa
function canAdvance(step: WizardStep, wordCount: number): boolean {
  return wordCount >= step.targetWords * 0.5; // mínimo 50% do target
}

// ❌ Don't: não exigir word count exato
function canAdvance(step: WizardStep, wordCount: number): boolean {
  return wordCount === step.targetWords; // NÃO — flexibilidade
}
```

---

## Métricas de Validação

### Antes de shipped

| Métrica | Target | Como medir |
|---|---|---|
| Deterministic extraction < 50ms | 99% dos textos | Benchmark com 1000 textos |
| Wizard completion rate > 70% | Usuários reais | Analytics |
| Confidence "high" em > 50% dos wizards | Usuários reais | Dashboard |
| Zero regressão no generation quality | Testes A/B | Comparar textos gerados com/sem signals |

### Após shipped (2 semanas)

| Métrica | Target | Ação se abaixo |
|---|---|---|
| Completion rate > 80% | Usuários reais | Revisar temas, simplificar prompts |
| Consistency score 0.5-0.85 | Distribuição | Ajustar thresholds |
| Reasoning extraction > 90% | Wizards completos | Revisar prompt de extração |
| User confirmation > 70% | Etapa 5 | Revisar prose do perfil |

---

## Rollback

Se algo der errado após shipped:

1. **Feature flag `voice.calibrationWizardV1`** — desligar volta para A/B
2. **Signals opcionais** — sem signals, confidence usa lógica antiga
3. **Deterministic extraction** — se lenta, desabilitar sem impacto no perfil
4. **Dados** — sessões do wizard ficam no banco, não precisam de rollback
