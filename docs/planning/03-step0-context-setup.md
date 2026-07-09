# Tarefa 03: Step 0 (Context Setup) no Wizard de Calibração

**Status:** Pendente
**Prioridade:** Alta
**Dependências:** Tarefa 02 (Onboarding Completion)

## Objetivo

Transformar o `WizardContext` existente em uma etapa formal do wizard de calibração, coletando temática, público e pontos fortes do escritor antes dos textos de escrita.

## Contexto atual

O `WizardContext` já existe como schema e rota separada:
- Schema: `{ domain?: string, audience?: string, selfDeclaredStrength?: string }`
- Rota: `POST /me/voice-calibration/sessions/:sessionId/context`
- Validação: Só pode ser setado antes do primeiro submit (`currentStepId === "micro_opinion"`)

## O que precisa mudar

### 1. Adicionar step `context_setup` ao wizard

Em `packages/domain/src/voice-calibration.ts`:

```ts
// Adicionar no início de CALIBRATION_WIZARD_STEPS:
{
  id: "context_setup",
  label: "Contexto",
  targetWords: 0,
  maxWords: 0,
  minWords: 0
}
```

O `currentStepId` inicial muda de `"micro_opinion"` para `"context_setup"`.

### 2. Atualizar rota de context

A rota `POST .../context` pode ser mantida como está, ou o context pode ser submetido junto com o step 0 via `submitStep`. 

**Decisão recomendada:** Manter a rota `POST .../context` separada, já que o step 0 coleta dados estruturados (não texto livre). O frontend coleta os 3 campos e chama `setContext()` antes de avançar para o step 1.

### 3. Atualizar validação de context

Em `apps/backend/src/product/voice/voice-calibration-service.ts`:

- `setContext()` deve aceitar `currentStepId === "context_setup"` (além de `"micro_opinion"`)
- Após setar context, avançar para `"micro_opinion"`

### 4. Atualizar prompts do step 1

Quando `domain` é setado no context, o step `micro_opinion` usa temas do domínio (já implementado em `voice-calibration-context.ts`).

### 5. SDK

Nenhuma mudança necessária no SDK — o `setContext()` já existe.

## Fluxo do usuário

1. Tela 1: Formulário com 3 campos (domain, audience, selfDeclaredStrength)
2. Usuário preenche e clica "Próximo"
3. Frontend chama `setContext({ domain, audience, selfDeclaredStrength })`
4. Frontend chama `getStepPrompt({ sessionId, stepId: "micro_opinion" })` para obter o prompt do step 2
5. Avança para Tela 2 (micro_opinion)

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `packages/domain/src/voice-calibration.ts` | Atualizar — adicionar step `context_setup` |
| `apps/backend/src/product/voice/voice-calibration-service.ts` | Atualizar — aceitar context em `context_setup` |
| `apps/backend/src/product/voice/voice-calibration-session-store.ts` | Verificar — `buildInitialSteps()` com novo step |

## Verificação

1. `pnpm build` — deve passar
2. Teste manual:
   - Iniciar sessão → `currentStepId` deve ser `"context_setup"`
   - Chamar `setContext()` → deve funcionar
   - Chamar `getStepPrompt("micro_opinion")` → deve retornar prompt com tema do domínio
   - Submeter step 1 → deve funcionar normalmente
3. Criar testes unitários para:
   - `setContext()` funciona em `context_setup`
   - `setContext()` NÃO funciona após avançar para `micro_opinion`
   - Temas do domínio são usados quando `domain` é setado
