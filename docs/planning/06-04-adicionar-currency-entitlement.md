# Issue 06-04: Adicionar `currency` ao `BillingEntitlementView`

**Status:** Pendente  
**Prioridade:** Média  
**Dependências:** Nenhuma  

## Contexto

O contrato `BillingEntitlementView` em `packages/contracts/src/billing-checkout.ts:32-43` já prevê o campo `currency`:

```ts
{
  planId: string;
  tier: string;
  status: string;
  availableCredits: number;
  monthlyCreditsRemaining: number;
  canonicalCreditCost: number;
  quotaRemaining: number;
  quotaLimit: number;
  currency: Schema.optional(BillingCurrencySchema); // <-- já existe no contrato
}
```

Porém, o backend em `apps/backend/src/routes/billing-routes.ts:83-96` **não retorna** `currency` no response. O SDK decodifica com sucesso (campo opcional), mas o frontend nunca recebe a moeda.

## Objetivo

Garantir que `GET /me/billing/entitlement` retorne `currency` de forma consistente com o plano do usuário.

## Escopo

### 1. Backend — rota de entitlement

Em `apps/backend/src/routes/billing-routes.ts`:
- Identificar a moeda do plano ativo do usuário.
- Incluir `currency` no objeto validado pelo `BillingEntitlementViewSchema`.
- Se o plano não tiver moeda definida, fallback para `"BRL"`.

Possíveis fontes:
- `plan.currency` (se existir no objeto do plano).
- `entitlement.currency`.
- Configuração padrão do backend (`options.config.defaultCurrency` se existir).

### 2. Testes

- Adicionar teste unitário para `GET /me/billing/entitlement` verificando que `currency` está presente.
- Atualizar testes existentes que validam a estrutura do entitlement.

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `apps/backend/src/routes/billing-routes.ts` | Adicionar `currency` ao response |
| `apps/backend/tests/*` ou `tests/backend/*` | Adicionar/atualizar testes |

## Verificação

1. `pnpm build` passa.
2. Type-check do backend passa.
3. `pnpm test` passa.
4. `GET /me/billing/entitlement` retorna `{ ..., currency: "BRL" | "USD" }`.

## Risco

Baixo. Apenas adicionar um campo opcional que já existe no contrato.
