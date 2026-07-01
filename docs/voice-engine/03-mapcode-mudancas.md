# Mapa de Código — Mudanças Propostas

Este documento mapeia cada arquivo afetado pelas mudanças, com descrição do que muda e referência ao documento de mudanças.

---

## Visão Geral dos Documentos

| Documento | Conteúdo |
|---|---|
| `00-referencial-teorico.md` | 10 artigos, 6 princípios orientadores |
| `01-mudancas-propostas.md` | 14 mudanças com justificativa teórica |
| `02-wizard-calibracao-design.md` | Pré-wizard + wizard em 5 etapas, temas, interface |
| `03-mapcode-mudancas.md` | Este arquivo — mapeamento por arquivo |
| `04-guia-implementacao.md` | Do's and Don'ts, padrões de código, rollback |
| `05-decisoes-produto.md` | 10 decisões consolidadas com justificativa |

---

## Arquivos por Complexidade de Mudança

### 🔴 Alta Complexidade (requer redesign significativo)

#### `apps/backend/src/product/voice/voice-calibration-candidates.ts`
- **Atual:** gera candidatos A/B deterministicamente a partir de word banks
- **Mudança:** substituir por geração de temas + prompts do wizard
- **Dependências:** `CALIBRATION_WIZARD_STEPS` (novo schema)
- **Referência:** `02-wizard-calibracao-design.md` → Temas do Wizard

#### `apps/backend/src/product/voice/voice-calibration-service.ts`
- **Atual:** gerencia rounds A/B, seleção, edição, attestation
- **Mudança:** gerenciar wizard de 5 etapas, cada uma com textarea genuíno
- **Dependências:** novo `DeterministicFeatureExtraction`, novo schema de steps
- **Referência:** `02-wizard-calibracao-design.md` → Fluxo

#### `apps/web/src/app/onboarding/screens/VoiceCalibrationSession.tsx`
- **Atual:** cards A/B com seleção + edição + attestation
- **Mudança:** wizard multi-step com textarea por etapa
- **Dependências:** novos contratos de wizard steps
- **Referência:** `02-wizard-calibracao-design.md` → Interface

#### `apps/backend/src/product/voice/deterministic-extraction.ts` (NOVO)
- **Não existe atualmente**
- **Mudança:** criar feature extraction determinística
- **Dependências:** nenhuma (módulo isolado)
- **Referência:** `01-mudancas-propostas.md` → Mudança 2

#### `apps/backend/src/product/voice/voice-calibration-context.ts` (NOVO)
- **Não existe atualmente**
- **Mudança:** gerenciar `WizardContext` (domínio, audiência, auto-declaração)
- **Dependências:** nenhum (módulo isolado)
- **Referência:** `02-wizard-calibracao-design.md` → Pré-wizard Contextual

---

### 🟡 Média Complexidade (modificações estruturais)

#### `packages/domain/src/voice-calibration.ts`
- **Atual:** `CALIBRATION_ROUND_DIMENSIONS` com 3 dimensões cíclicas
- **Mudança:** `CALIBRATION_WIZARD_STEPS` com 5 etapas + metadados
- **Impacto:** `voice-calibration-candidates.ts`, `voice-calibration-service.ts`
- **Referência:** `02-wizard-calibracao-design.md` → CALIBRATION_WIZARD_STEPS

#### `packages/domain/src/voice.ts`
- **Atual:** `DerivedVoiceProfile` sem sinais quantitativos
- **Mudança:** adicionar `QuantitativeSignals` ao perfil
- **Impacto:** `voice-rebuild-derivation.ts`, contratos, database schema
- **Referência:** `01-mudancas-propostas.md` → Mudança 3

#### `packages/contracts/src/voice.ts`
- **Atual:** schemas de VoiceProfile sem QuantitativeSignals
- **Mudança:** adicionar schema de QuantitativeSignals
- **Impacto:** validação, serialização, UI
- **Referência:** `01-mudancas-propostas.md` → Mudança 3

#### `packages/contracts/src/reasoning.ts`
- **Atual:** `CoreReasoningSignature` e `ArgumentDevelopmentSignature`
- **Mudança:** adicionar campos de features textuais (textLengthBucket, etc.)
- **Impacto:** extração LLM, apresentação
- **Referência:** `01-mudancas-propostas.md` → Mudança 6

#### `apps/backend/src/product/voice/voice-rebuild-derivation.ts`
- **Atual:** `deriveConfidence` baseada em contagem
- **Mudança:** `deriveConfidence` composta com signals
- **Dependências:** `QuantitativeSignals` do perfil
- **Referência:** `01-mudancas-propostas.md` → Mudança 4

#### `packages/text-quality/src/voice/voice-profile.ts`
- **Atual:** `createVoiceProfile` e `mergeVoiceProfile` com formatExpressionProfile e examples
- **Mudança:** integrar quantitative signals, adicionar signatureOpenings/Closings, remover formatExpressionProfile e examples
- **Dependências:** `QuantitativeSignals` do perfil
- **Referência:** `01-mudancas-propostas.md` → Mudanças 9, 10, 11

#### `packages/text-quality/src/quality/development-drift.ts`
- **Atual:** `evaluateArgumentDevelopmentDrift` com regex matching apenas
- **Mudança:** adicionar parâmetro `quantitativeSignals` e 3 novos checks (sentence length, formality, vocabulary)
- **Dependências:** `QuantitativeSignals` do perfil
- **Referência:** `01-mudancas-propostas.md` → Mudança 12

#### `packages/text-quality/src/quality/drift.ts`
- **Atual:** `evaluateVoiceDrift` com pesos 40/30/30
- **Mudança:** passar `quantitativeSignals` para development drift
- **Dependências:** `development-drift.ts` atualizado
- **Referência:** `01-mudancas-propostas.md` → Mudança 12

#### `apps/backend/src/execution/quality/voice-judge-policy.ts`
- **Atual:** `isBorderline` com threshold fixo
- **Mudança:** threshold dinâmico baseado em `consistencyScore`
- **Dependências:** `QuantitativeSignals` do perfil
- **Referência:** `01-mudancas-propostas.md` → Mudança 12

#### `apps/web/src/app/onboarding/lib/onboarding-steps.ts`
- **Atual:** `OnboardingStep` com 3 passos (0, 1, 2)
- **Mudança:** expandir para 5 passos do wizard
- **Impacto:** `VoiceCalibrationSession.tsx`, progress display
- **Referência:** `02-wizard-calibracao-design.md` → Etapas

---

### 🟢 Baixa Complexidade (ajustes pontuais)

#### `packages/domain/src/voice-calibration.ts` (entitlement)
- **Atual:** `VOICE_CALIBRATION_PLAN_LIMITS` com maxRounds: 3/10/10
- **Mudança:** manter limits mas adaptar para wizard (1 wizard = 5 textos)
- **Impacto:** cobrança de quota, limits de plano
- **Referência:** `02-wizard-calibracao-design.md` → Fluxo

#### `apps/backend/src/product/voice/voice-calibration-service-helpers.ts`
- **Atual:** helpers para rounds A/B
- **Mudança:** adaptar para wizard steps
- **Dependências:** novo schema de steps
- **Referência:** `02-wizard-calibracao-design.md` → Interface

#### `apps/backend/src/product/voice/voice-rebuild-pipeline.ts`
- **Atual:** chama reasoning + development extraction
- **Mudança:** adicionar chamada de deterministic extraction
- **Dependências:** novo `deterministic-extraction.ts`
- **Referência:** `01-mudancas-propostas.md` → Mudança 2

#### `apps/backend/src/product/voice/reasoning-extraction.ts`
- **Atual:** extrai reasoning de todos os examples
- **Mudança:** adapter para receber textos do wizard com metadados de etapa
- **Dependências:** textos do wizard com `topicTag`
- **Referência:** `02-wizard-calibracao-design.md` → Captura por etapa

#### `apps/backend/src/product/voice/argument-development-extraction.ts`
- **Atual:** extrai development de 2+ active examples
- **Mudança:** adapter para receber textos do wizard (mínimo Etapas 2+3)
- **Dependências:** textos do wizard
- **Referência:** `02-wizard-calibracao-design.md` → Captura por etapa

---

### 🔵 Remoções

#### `apps/web/src/app/voice/components/VoiceExamplesList.tsx`
- **Remover** — não existem mais "examples" no sentido antigo
- **Referência:** `01-mudancas-propostas.md` → Mudança 8

#### `apps/web/src/app/voice/components/VoiceExampleComposer.tsx`
- **Remover** — wizard substitui
- **Referência:** `01-mudancas-propostas.md` → Mudança 8

#### `apps/backend/src/product/voice/voice-batch-helpers.ts`
- **Remover** — batches de import não existem mais
- **Referência:** `01-mudancas-propostas.md` → Mudança 8

#### `apps/backend/src/product/voice/voice-batches.ts`
- **Remover** — batches de import não existem mais
- **Referência:** `01-mudancas-propostas.md` → Mudança 8

#### `packages/contracts/src/voice.ts` (campos removidos)
- **Remover:** `FormatExpressionProfileSchema`, `formatExpressionProfile` do `TextQualityVoiceProfileSchema`
- **Remover:** `examples` do `TextQualityVoiceProfileSchema`
- **Referência:** `01-mudancas-propostas.md` → Mudanças 9, 10

#### `packages/domain/src/voice.ts` (campos removidos)
- **Remover:** `formatExpressionProfile` do `DerivedVoiceProfile`
- **Referência:** `01-mudancas-propostas.md` → Mudança 9

#### `packages/domain/src/voice-profile-mappers.ts` (campos removidos)
- **Remover:** `formatExpressionProfile` do `toTextQualityVoiceProfile`
- **Referência:** `01-mudancas-propostas.md` → Mudança 9

---

## Ordem de Implementação Sugerida

### Fase 1: Foundation (sem quebrar existente)
1. `deterministic-extraction.ts` — módulo isolado, sem dependências
2. `voice-calibration-context.ts` — módulo isolado para WizardContext
3. `voice-calibration.ts` — adicionar `CALIBRATION_WIZARD_STEPS` (manter `CALIBRATION_ROUND_DIMENSIONS` para compatibilidade)
4. `voice.ts` + `contracts/voice.ts` — adicionar `QuantitativeSignals` como opcional, adicionar `signatureOpenings`/`signatureClosings`

### Fase 2: Backend
5. `voice-rebuild-derivation.ts` — confidence composta (funciona com signals opcional)
6. `voice-rebuild-pipeline.ts` — integrar deterministic extraction
7. `reasoning-extraction.ts` — adapter para wizard texts, extrair signatureOpenings/Closings
8. `argument-development-extraction.ts` — adapter para wizard texts

### Fase 3: Calibration Flow
9. `voice-calibration-candidates.ts` — substituir por tema generation
10. `voice-calibration-service.ts` — wizard flow + retry/DLQ
11. `voice-calibration-service-helpers.ts` — helpers para wizard
12. `onboarding-steps.ts` — expandir para 5 passos

### Fase 4: Text Quality (Prompt + Drift)
13. `voice-profile.ts` (text-quality) — integrar signals, remover examples/formatExpression
14. `development-drift.ts` — adicionar checks quantitativos
15. `drift.ts` — passar signals para development drift
16. `voice-judge-policy.ts` — threshold dinâmico

### Fase 5: Frontend
17. `VoiceCalibrationSession.tsx` — redesign wizard com textarea
18. Dashboard components — redesign com signals
19. Remover `VoiceExamplesList.tsx`, `VoiceExampleComposer.tsx`

### Fase 6: Cleanup
20. Remover `CALIBRATION_ROUND_DIMENSIONS` e lógica A/B
21. Remover `FormatExpressionProfile` dos schemas
22. Remover `examples` do `TextQualityVoiceProfile`
23. Remover `voice-batch-helpers.ts`, `voice-batches.ts`
24. Atualizar testes

---

## Dependências entre Mudanças

```
deterministic-extraction.ts (novo)
       │
       ▼
voice.ts (QuantitativeSignals + signatureOpenings/Closings)
       │
       ├──► voice-rebuild-derivation.ts (confidence composa)
       │         │
       │         └──► voice-rebuild-pipeline.ts (integrar extraction)
       │
       ├──► voice-profile.ts (text-quality: prompt + signals)
       │         │
       │         ├──► development-drift.ts (checks quantitativos)
       │         │         │
       │         │         └──► drift.ts (passar signals)
       │         │                   │
       │         │                   └──► voice-judge-policy.ts (threshold dinâmico)
       │         │
       │         └──► structured prompt (7 seções)
       │
       └──► contracts/voice.ts (atualizar schemas)

voice-calibration.ts (WIZARD_STEPS)
       │
       ├──► voice-calibration-context.ts (WizardContext)
       │
       ▼
voice-calibration-candidates.ts (tema generation)
       │
       ▼
voice-calibration-service.ts (wizard flow + retry/DLQ)
       │
       ├──► voice-calibration-service-helpers.ts
       │
       └──► VoiceCalibrationSession.tsx (frontend wizard)

REMOVERS:
  VoiceExamplesList.tsx ──► removido
  VoiceExampleComposer.tsx ──► removido
  voice-batch-helpers.ts ──► removido
  voice-batches.ts ──► removido
  FormatExpressionProfile ──► removido dos schemas
  examples (textuais) ──► removido do prompt
```

---

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Wizard tem completion rate baixo | Perfil incompleto | Temas acessíveis, optional skip, progress visual |
| Extração determinística lenta | UX ruim | <50ms por texto, processamento em paralelo |
| Confidence composta muito restritiva | Poucos perfis "high" | Thresholds calibrados com dados reais |
| Features topic-dependent entram no perfil | Geração enviesada | topicIndependenceScore como gate |
| LLM extraction falha frequentemente | Perfil sem reasoning | Fallback para deterministic-only, retry |

---

## Métricas de Validação

### Após implementação, medir:

1. **Consistency Score distribution:** esperado 0.5-0.85 para autores humanos
2. **Topic Independence Score:** esperado >0.5 para textos do wizard
3. **Extraction success rate:** esperado >90% reasoning, >85% development
4. **User confirmation rate:** esperado >70% sem edição
5. **Voice Confidence distribution:** esperado >60% "high" após wizard completo
6. **Generation quality:** comparar textos gerados com vs. sem quantitative signals
