# Resumo das Tarefas

> Atualizado em 2026-07-06

## Tarefas

| # | Tarefa | Status | Prioridade | Dependências |
|---|---|--------|------------|--------------|
| 01 | [Remoção do Código Morto](01-remocao-codigo-morto.md) | ✅ Concluída | - | - |
| 02 | [Onboarding Completion no Backend](02-onboarding-completion-backend.md) | ✅ Concluída | Alta | Nenhuma |
| 03 | [Step 0 (Context Setup) no Wizard](03-step0-context-setup.md) | ✅ Concluída | Alta | Tarefa 02 |
| 04 | [Reescrever Testes Pulados](04-reescrever-testes-pulados.md) | ✅ Concluída | Média | Tarefa 03 |
| 05 | [Implementação do Frontend](05-frontend-implementation.md) | Pendente | Alta | Tarefas 02, 03, 04 |

## Plano 06: Ajustes de Backend, SDK e Contratos

> Plano criado após revisão minuciosa de `docs/frontend-backend-contracts.md` contra o código real.

| # | Issue | Status | Prioridade | Dependências |
|---|-------|--------|------------|--------------|
| 06 | [Plano mestre: Ajustes de Backend, SDK e Contratos](06-backend-contract-cleanup-plan.md) | ✅ Concluído | Alta | - |
| 06-01 | [Remover `formatExpressions`](06-01-remover-format-expressions.md) | ✅ Concluída | Alta | Nenhuma |
| 06-02 | [Remover listagem pública de exemplos de voz](06-02-remover-listagem-exemplos-voz.md) | ✅ Concluída | Alta | Nenhuma |
| 06-03 | [Simplificar catálogo público de content types](06-03-simplificar-catalogo-content-types.md) | ✅ Concluída | Alta | Nenhuma |
| 06-04 | [Adicionar `currency` ao BillingEntitlementView](06-04-adicionar-currency-entitlement.md) | ✅ Concluída | Média | Nenhuma |
| 06-05 | [Corrigir type-check do backend](06-05-corrigir-typecheck-backend.md) | ✅ Concluída | Crítica | 06-02 |
| 06-06 | [Onboarding Completion no backend](06-06-onboarding-completion-backend.md) | ✅ Concluída | Crítica | Nenhuma |
| 06-07 | [Step 0 (`context_setup`) no wizard](06-07-step0-context-setup-wizard.md) | ✅ Concluída | Crítica | 06-06 |
| 06-08 | [Expor revogação de consentimento de voz](06-08-revogar-consentimento-voz.md) | ✅ Concluída | Alta | Nenhuma |
| 06-09 | [Reescrever testes pulados](06-09-reescrever-testes-pulados.md) | ✅ Concluída | Média | 06-02, 06-05, 06-07 |
| 06-10 | [Atualizar docs/frontend-backend-contracts.md](06-10-atualizar-contratos-documentacao.md) | ✅ Concluída | Média | 06-01 a 06-08 |
| 06-11 | [Criar estrutura base do apps/web](06-11-criar-apps-web.md) | ⏸️ Pendente | Baixa | 06-06, 06-07 |

## Sequência de implementação

```
Tarefa 01 (Concluída)
    ↓
Tarefa 02 (Onboarding Completion)
    ↓
Tarefa 03 (Step 0 Context Setup)
    ↓
Tarefa 04 (Reescrever Testes)
    ↓
Tarefa 05 (Frontend) ──────────────────┐
    ↓                                   │
Tarefa 05 Fase 1: Core Generation      │
Tarefa 05 Fase 2: Execution History    │
Tarefa 05 Fase 3: Voice Dashboard      │
Tarefa 05 Fase 4: Voice Onboarding     │
Tarefa 05 Fase 5: Settings & Billing   │
```

## Estimativas

| Tarefa | Esforço estimado |
|--------|------------------|
| 02 | 2-3h |
| 03 | 1-2h |
| 04 | 3-4h |
| 05 | 2-3 semanas |

## Notas

- A Tarefa 05 pode ser paralelizada por fase
- As fases 1-3 do frontend não dependem das tarefas 02-04
- A fase 4 (Voice Onboarding) depende das tarefas 02 e 03
