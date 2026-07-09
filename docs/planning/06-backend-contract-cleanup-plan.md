# Plano 06: Ajustes de Backend, SDK e Contratos para v1

> Status: **Planejado** — aguardando execução
> Criado em: 2025-07-06
> Escopo: backend (`apps/backend`, `packages/*`) e `client-sdk`

## Contexto

O documento `docs/frontend-backend-contracts.md` foi revisado contra o código real. Ele está correto na maioria dos contratos já implementados, mas existem gaps, inconsistências e código morto que precisam ser resolvidos antes de iniciar a implementação do frontend (`apps/web`).

Este plano consolida os apontamentos da revisão e os novos alinhamentos de produto (fluxo orientado por intenção, não por canal/mídia; onboarding como única fonte de exemplos de voz; `formatExpressions` não usado).

## Regras gerais

- O backend é a fonte da verdade.
- O `client-sdk` é a única forma de comunicação frontend-backend.
- Não alterar testes existentes de forma a perder cobertura — reescrever skipped tests quando necessário.
- Nunca fazer `git commit`/`git push` sem autorização explícita.

## Issues do plano

| # | Issue | Prioridade | Status | Dependências |
|---|-------|------------|--------|--------------|
| 06-01 | [Remover `formatExpressions` do domínio de voz](06-01-remover-format-expressions.md) | Alta | Pendente | Nenhuma |
| 06-02 | [Remover listagem pública de exemplos de voz](06-02-remover-listagem-exemplos-voz.md) | Alta | Pendente | Nenhuma |
| 06-03 | [Simplificar catálogo público de content types](06-03-simplificar-catalogo-content-types.md) | Alta | Pendente | Nenhuma |
| 06-04 | [Adicionar `currency` ao `BillingEntitlementView`](06-04-adicionar-currency-entitlement.md) | Média | Pendente | Nenhuma |
| 06-05 | [Corrigir type-check do backend](06-05-corrigir-typecheck-backend.md) | **Crítica** | Pendente | 06-02 (parcial) |
| 06-06 | [Implementar Onboarding Completion no backend](06-06-onboarding-completion-backend.md) | **Crítica** | Pendente | Nenhuma |
| 06-07 | [Adicionar step `context_setup` ao wizard de calibração](06-07-step0-context-setup-wizard.md) | **Crítica** | Pendente | 06-06 |
| 06-08 | [Expor revogação de consentimento de voz](06-08-revogar-consentimento-voz.md) | Alta | Pendente | Nenhuma |
| 06-09 | [Reescrever testes pulados](06-09-reescrever-testes-pulados.md) | Média | Pendente | 06-02, 06-05, 06-07 |
| 06-10 | [Atualizar `docs/frontend-backend-contracts.md`](06-10-atualizar-contratos-documentacao.md) | Média | Pendente | 06-01 a 06-08 |
| 06-11 | [Criar estrutura base do `apps/web`](06-11-criar-apps-web.md) | Baixa | Pendente | 06-06, 06-07 |

## Sequência recomendada de execução

```
06-01 (remover formatExpressions)
06-02 (remover listagem exemplos voz)
06-03 (simplificar catálogo content types)
06-04 (adicionar currency)
    ↓
06-05 (corrigir type-check) — depende parcialmente de 06-02
    ↓
06-06 (onboarding completion backend)
    ↓
06-07 (step 0 context_setup)
    ↓
06-08 (revogar consentimento voz)
    ↓
06-09 (reescrever testes pulados)
    ↓
06-10 (atualizar contratos.md)
    ↓
06-11 (criar apps/web)
```

## Critérios de aceitação gerais

1. `pnpm build` passa.
2. `pnpm --filter @my-ai-orchestrator/backend exec tsc -p tsconfig.json --noEmit` passa (type-check).
3. `pnpm test` passa sem regressões.
4. `docs/frontend-backend-contracts.md` reflete o estado real do backend e SDK.

## Notas

- As issues 06-06 e 06-07 são **bloqueantes** para o frontend de onboarding.
- A issue 06-05 é bloqueante para qualquer trabalho seguro no backend, pois hoje o type-check está quebrado (apesar do build esbuild passar).
- A issue 06-11 pode ser executada em paralelo com 06-09 e 06-10, desde que 06-06 e 06-07 estejam prontas.
