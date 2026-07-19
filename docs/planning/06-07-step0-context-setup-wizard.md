# Issue 06-07: Adicionar step `context_setup` ao wizard de calibração

**Status:** Pendente  
**Prioridade:** **Crítica**  
**Dependências:** 06-06 (Onboarding Completion)  

## Contexto

Hoje o wizard de calibração começa no step `micro_opinion` (`packages/domain/src/voice-calibration.ts`). O `WizardContext` (domain, audience, selfDeclaredStrength) existe, mas é tratado como uma etapa separada via `POST /me/voice-calibration/sessions/:sessionId/context`, só podendo ser setado antes do primeiro submit.

O produto definiu que o onboarding deve ter uma **tela 1 formal de context_setup** (step 0), onde o usuário preenche domínio, público e pontos fortes antes de começar a escrever.

## Objetivo

Transformar o `WizardContext` em um step formal `context_setup` do wizard.

## Escopo

### 1. Domain

Em `packages/domain/src/voice-calibration.ts`:
- Adicionar ao início de `CALIBRATION_WIZARD_STEPS`:
  ```ts
  {
    id: "context_setup",
    label: "Contexto",
    targetWords: 0,
    maxWords: 0,
    minWords: 0,
    targetSentences: 0,
    capturesFeatures: [] as const,
    themePool: [] as const,
    defaultTheme: ""
  }
  ```
- O `currentStepId` inicial passa a ser `"context_setup"`.

### 2. Backend — serviço de calibração

Em `apps/backend/src/product/voice/voice-calibration-service.ts`:
- `setContext()` deve aceitar `currentStepId === "context_setup"` (além de `"micro_opinion"` para compatibilidade transitória).
- Após setar context, avançar para `"micro_opinion"`.
- Garantir que `getStepPrompt({ stepId: "context_setup" })` funcione e retorne prompt vazio/nulo.

### 3. Backend — session store

Em `apps/backend/src/product/voice/voice-calibration-session-store.ts`:
- Verificar `buildInitialSteps()` para incluir o novo step.
- Garantir que `createVoiceCalibrationSession` inicie em `"context_setup"`.

### 4. Contratos

- `VoiceCalibrationStepPromptViewSchema` deve permitir `targetWords`, `maxWords`, `minWords` opcionais/zeros para o step de contexto.

### 5. SDK

Nenhuma mudança necessária no SDK — `setContext()` já existe.

### 6. Documentação

Atualizar `docs/frontend-backend-contracts.md` e `docs/planning/05-frontend-implementation.md` para refletir o novo fluxo de 7 steps:

| Tela | Step ID | Tipo | Conteúdo |
|------|---------|------|----------|
| 1 | `context_setup` | Formulário | Domain, audience, selfDeclaredStrength |
| 2 | `micro_opinion` | Escrever | Opinião curta |
| 3 | `reasoning_reflection` | Escrever | Reflexão |
| 4 | `argument_development` | Escrever | Argumentação |
| 5 | `format_adaptation` | Escrever | Adaptação |
| 6 | `review_confirm` | Revisar | Revisão e confirmação |
| 7 | `success` / `error` | Resultado | Confirmação ou retry |

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `packages/domain/src/voice-calibration.ts` | Adicionar step `context_setup` |
| `apps/backend/src/product/voice/voice-calibration-service.ts` | Aceitar context em `context_setup` |
| `apps/backend/src/product/voice/voice-calibration-session-store.ts` | Ajustar step inicial |
| `packages/contracts/src/voice-calibration.ts` | Ajustar schema de step prompt |
| `docs/frontend-backend-contracts.md` | Atualizar fluxo do wizard |
| `docs/planning/05-frontend-implementation.md` | Atualizar fluxo do wizard |

## Verificação

1. `pnpm build` passa.
2. Type-check do backend passa.
3. `pnpm test` passa.
4. Testes unitários para:
   - Iniciar sessão retorna `currentStepId === "context_setup"`.
   - `setContext()` funciona em `context_setup`.
   - `setContext()` falha após avançar para `micro_opinion`.
   - Temas do domínio são usados quando `domain` é setado.

## Risco

Médio. Altera o início do wizard e pode quebrar testes existentes de calibração que assumem `micro_opinion` como primeiro step.
