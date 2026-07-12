# Tarefa 02: Onboarding Completion no Backend

**Status:** Pendente
**Prioridade:** Alta
**Dependências:** Nenhuma

## Objetivo

Implementar persistência backend do status de onboarding do usuário, permitindo cross-device sync e redirect inteligente pós-login.

## Escopo

### 1. Migration (novo arquivo `0015-add-onboarding-completion.ts`)
- Adicionar coluna `onboarding_completed_at` (varchar(64), nullable) na tabela `application_users`
- Valor: timestamp ISO do momento da conclusão, ou NULL se não completou

### 2. Atualizar tipos (apps/backend/src/)
- `infra/postgres-tables.ts`: Adicionar `onboarding_completed_at: string | null` em `ApplicationUsersTable`
- `auth/application-user.ts`: Adicionar `onboardingCompletedAt?: string` em `BackendApplicationUser`
- `auth/application-user.ts`: Adicionar método `updateOnboardingStatus(userId, completedAt)` no repository

### 3. Implementar repository
- `infra/postgres-repositories/postgres-application-user-repository.ts`: Implementar `updateOnboardingStatus` com Kysely update
- `auth/application-user-memory.ts`: Implementar `updateOnboardingStatus` para in-memory store

### 4. Rotas (novo arquivo `routes/onboarding-routes.ts`)
- `POST /me/onboarding/complete` — Marca onboarding como completo
  - Body: `{}` (vazio, apenas autenticação necessária)
  - Response: `{ completed: true, completedAt: string }`
  - Auth: JWT Bearer (End User)

- `GET /me/onboarding/status` — Retorna status do onboarding
  - Response: `{ completed: boolean, completedAt?: string }`
  - Auth: JWT Bearer (End User)

### 5. Route definitions (apps/backend/src/app/route-definitions.ts)
- Adicionar `CompleteOnboarding` e `GetOnboardingStatus` às rotas públicas

### 6. Route registration (apps/backend/src/app/routes.ts)
- Registrar as novas rotas no `registerBackendRoutes`

### 7. SDK (packages/client-sdk/src/)
- Novo arquivo `onboarding.ts` ou adicionar a subclient existente
- `onboarding.complete()`: `POST /me/onboarding/complete` → `{ completed: boolean, completedAt: string }`
- `onboarding.getStatus()`: `GET /me/onboarding/status` → `{ completed: boolean, completedAt?: string }`

### 8. Contracts (packages/contracts/src/)
- Novo schema ou adicionar a `voice.ts`:
  - `OnboardingStatusView`: `{ completed: boolean, completedAt?: string }`

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `apps/backend/src/infra/migrations/0015-add-onboarding-completion.ts` | Criar |
| `apps/backend/src/infra/postgres-tables.ts` | Atualizar |
| `apps/backend/src/auth/application-user.ts` | Atualizar |
| `apps/backend/src/infra/postgres-repositories/postgres-application-user-repository.ts` | Atualizar |
| `apps/backend/src/auth/application-user-memory.ts` | Atualizar |
| `apps/backend/src/routes/onboarding-routes.ts` | Criar |
| `apps/backend/src/app/route-definitions.ts` | Atualizar |
| `apps/backend/src/app/routes.ts` | Atualizar |
| `packages/client-sdk/src/onboarding.ts` | Criar |
| `packages/client-sdk/src/client.ts` | Atualizar |
| `packages/client-sdk/src/index.ts` | Atualizar |
| `packages/contracts/src/onboarding.ts` | Criar |
| `packages/contracts/src/index.ts` | Atualizar |

## Verificação

1. `pnpm build` — deve passar
2. `pnpm test` — testes existentes não devem quebrar
3. Criar testes unitários para:
   - `POST /me/onboarding/complete` retorna `{ completed: true }`
   - `GET /me/onboarding/status` retorna `{ completed: false }` antes de completar
   - `GET /me/onboarding/status` retorna `{ completed: true }` após completar
4. Verificar que o redirect pós-login funciona:
   - Usuário sem onboarding completo → `/app/onboarding`
   - Usuário com onboarding completo → `/app/generate`
