# Issue 06-06: Implementar Onboarding Completion no backend

**Status:** Pendente  
**Prioridade:** **Crítica**  
**Dependências:** Nenhuma  

## Contexto

O redirecionamento pós-login descrito no `CONTEXT.md` depende de saber se o usuário completou o onboarding:

- Usuário sem onboarding completo → `/app/onboarding`
- Usuário com onboarding completo → `/app/generate`

Hoje esse estado é apenas client-side. O backend precisa ser a fonte da verdade.

## Objetivo

Implementar persistência backend do status de onboarding do usuário.

## Escopo

### 1. Migration

Criar `apps/backend/src/infra/migrations/0015-add-onboarding-completion.ts`:
- Adicionar coluna `onboarding_completed_at` (`varchar(64)`, nullable) na tabela `application_users`.
- Valor: timestamp ISO do momento da conclusão, ou `NULL` se não completou.

### 2. Tipos

- `apps/backend/src/infra/postgres-tables.ts`: adicionar `onboarding_completed_at: string | null` em `ApplicationUsersTable`.
- `apps/backend/src/auth/application-user.ts`: adicionar `onboardingCompletedAt?: string` em `BackendApplicationUser`.
- `apps/backend/src/auth/application-user.ts`: adicionar método `updateOnboardingStatus(userId, completedAt)` no repository.

### 3. Repository

- `apps/backend/src/infra/postgres-repositories/postgres-application-user-repository.ts`: implementar `updateOnboardingStatus`.
- `apps/backend/src/auth/application-user-memory.ts`: implementar `updateOnboardingStatus` para in-memory store.

### 4. Rotas

Criar `apps/backend/src/routes/onboarding-routes.ts`:
- `POST /me/onboarding/complete`
  - Body: `{}` (vazio, apenas autenticação necessária)
  - Response: `{ completed: true, completedAt: string }`
- `GET /me/onboarding/status`
  - Response: `{ completed: boolean, completedAt?: string }`

Registrar as rotas em:
- `apps/backend/src/app/route-definitions.ts`
- `apps/backend/src/app/routes.ts`

### 5. SDK

Criar `packages/client-sdk/src/onboarding.ts`:
- `onboarding.complete()` → `POST /me/onboarding/complete`
- `onboarding.getStatus()` → `GET /me/onboarding/status`

Atualizar:
- `packages/client-sdk/src/client.ts` — adicionar `onboarding` ao `ClientSdk`.
- `packages/client-sdk/src/index.ts` — exportar tipos.

### 6. Contratos

Criar `packages/contracts/src/onboarding.ts`:
- `OnboardingStatusView`: `{ completed: boolean, completedAt?: string }`

Atualizar `packages/contracts/src/index.ts`.

### 7. Integração com wizard

Após `voiceCalibration.completeReview()` bem-sucedido, o frontend chamará `onboarding.complete()`.

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `apps/backend/src/infra/migrations/0015-add-onboarding-completion.ts` | Criar |
| `apps/backend/src/infra/postgres-tables.ts` | Atualizar |
| `apps/backend/src/auth/application-user.ts` | Atualizar |
| `apps/backend/src/infra/postgres-repositories/postgres-application-user-repository.ts` | Implementar método |
| `apps/backend/src/auth/application-user-memory.ts` | Implementar método |
| `apps/backend/src/routes/onboarding-routes.ts` | Criar |
| `apps/backend/src/app/route-definitions.ts` | Adicionar rotas |
| `apps/backend/src/app/routes.ts` | Registrar rotas |
| `packages/contracts/src/onboarding.ts` | Criar |
| `packages/contracts/src/index.ts` | Exportar |
| `packages/client-sdk/src/onboarding.ts` | Criar |
| `packages/client-sdk/src/client.ts` | Adicionar ao SDK |
| `packages/client-sdk/src/index.ts` | Exportar |

## Verificação

1. `pnpm build` passa.
2. Type-check do backend passa.
3. `pnpm test` passa.
4. Testes unitários para:
   - `POST /me/onboarding/complete` retorna `{ completed: true, completedAt }`.
   - `GET /me/onboarding/status` retorna `{ completed: false }` antes de completar.
   - `GET /me/onboarding/status` retorna `{ completed: true }` após completar.
5. O redirecionamento pós-login pode ser implementado no frontend.

## Risco

Médio. Requer migration de banco e novos endpoints. Impacta diretamente o fluxo de onboarding do frontend.
