---
title: Persistência PostgreSQL de ApplicationUser e Operator
doc_type: issue
status: draft
domain: backend-production
last_updated: 2026-05-29
---

# Persistência PostgreSQL de ApplicationUser e Operator

## Parent

- `docs/archive/prd/backend-production-readiness.md`
- `docs/archive/issues/backend-production-readiness/04-postgresql-sistema-de-registro.md`
- `docs/archive/issues/backend-production-readiness/05-migrations-e-validacao-de-schema-no-boot.md`
- `docs/archive/issues/backend-production-readiness/09-application-user-repository-and-jit-provisioning.md`

## What to build

As Issues 04 e 05 estabeleceram a infraestrutura PostgreSQL (conexão, Kysely, migrations runner, schema validation no boot) e criaram migrations para 9 entidades (jobs, memories, content types, pipelines, voice state), mas **deixaram de fora duas entidades críticas**: `ApplicationUser` e `Operator`.

Atualmente, mesmo com `DATABASE_URL` configurada, os repositórios de `ApplicationUser` e `Operator` continuam sendo instâncias em memória (`application-user-memory.ts`, `operator-memory.ts`). Isso significa que:

- O JIT provisioning de usuários é **perdido a cada restart do servidor**
- Operadores criados para testes ou administração **somem com o restart**
- Em produção, não há durabilidade para a identidade local que ancora ownership, billing e audit trail
- O schema validation no boot (`expectedDatabaseTables`) não inclui as tabelas `application_users` nem `operators`

Os ADRs 0010, 0011 e 0012 já decidem que:

- O `ApplicationUser` é a raiz de ownership local, com status (`active` / `suspended`) controlado pelo backend
- O `Operator` é uma identidade separada para acesso operacional, com permissões explícitas
- O provisionamento de `ApplicationUser` é JIT (primeiro request autenticado), enquanto `Operator` é criado administrativamente

Esta slice preenche esse gap: cria as tabelas, implementa os repositórios PostgreSQL, condiciona a injeção ao ambiente e adiciona os testes de integração.

## Schema das tabelas

### `application_users`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `varchar(64)` | PK |
| `external_subject` | `varchar(255)` | NOT NULL, UNIQUE — valor do `sub` do Auth0 JWT |
| `status` | `varchar(16)` | NOT NULL, DEFAULT `'active'` — `active` ou `suspended` |
| `created_at` | `varchar(64)` | NOT NULL — ISO 8601 |
| `updated_at` | `varchar(64)` | NOT NULL — ISO 8601 |

### `operators`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `varchar(64)` | PK — corresponde ao `sub` do JWT do operador |
| `permissions` | `jsonb` | NOT NULL, DEFAULT `'[]'` |
| `roles` | `jsonb` | NOT NULL, DEFAULT `'[]'` |
| `status` | `varchar(16)` | NOT NULL, DEFAULT `'active'` — `active` ou `suspended` |
| `created_at` | `varchar(64)` | NOT NULL — ISO 8601 |
| `updated_at` | `varchar(64)` | NOT NULL — ISO 8601 |

> A interface `BackendOperator` atual não expõe `createdAt` / `updatedAt`. As colunas existem na tabela para auditabilidade, mas o repositório pode gerenciá-las internamente sem alterar a interface pública.

## Implementation expectations

### 1. Migration `0002-add-application-users-and-operators.ts`

Criar em `apps/backend/src/infra/migrations/0002-add-application-users-and-operators.ts`:

- `up(db)`: cria as tabelas `application_users` e `operators` com o schema acima, incluindo unique index em `application_users.external_subject`
- `down(db)`: dropa as tabelas na ordem inversa (operators primeiro, depois application_users)

Seguir exatamente o padrão do `0001-init-schema.ts`:
- usar `db.schema.createTable(...)` com Kysely
- colunas `varchar`, `jsonb`, `integer`, `defaultTo` conforme o caso
- `primaryKey()`, `notNull()`, `unique()` nas constraints

### 2. Atualizar `DatabaseTables` em `postgres-tables.ts`

Adicionar duas interfaces de tabela:

```typescript
export interface ApplicationUsersTable {
  id: string;
  external_subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OperatorsTable {
  id: string;
  permissions: string;
  roles: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

E estender `DatabaseTables` com:

```typescript
application_users: ApplicationUsersTable;
operators: OperatorsTable;
```

### 3. Atualizar `expectedDatabaseTables` em `migration-runner.ts`

Adicionar `"application_users"` e `"operators"` ao array `expectedDatabaseTables` para que o schema validation no boot inclua essas tabelas.

### 4. Criar `postgres-application-user-repository.ts`

Criar em `apps/backend/src/infra/postgres-repositories/postgres-application-user-repository.ts`:

- Função `createPostgresApplicationUserRepository(db: Kysely<DatabaseTables>): BackendApplicationUserRepository`
- Implementar os 3 métodos da interface `BackendApplicationUserRepository`:
  - `findByExternalSubject(externalSubject)` — `SELECT * FROM application_users WHERE external_subject = ?`
  - `create(args)` — `INSERT INTO application_users (...) VALUES (...)` com `external_subject`, `status`, `created_at`, `updated_at`
  - `findById(id)` — `SELECT * FROM application_users WHERE id = ?`
- Usar `Effect.tryPromise` para operações de banco, seguindo o padrão de `postgres-job-repository.ts`
- Parse do row do banco para `BackendApplicationUser` (converter `string` para `Date` no `createdAt`/`updatedAt`)

### 5. Criar `postgres-operator-repository.ts`

Criar em `apps/backend/src/infra/postgres-repositories/postgres-operator-repository.ts`:

- Função `createPostgresOperatorRepository(db: Kysely<DatabaseTables>): BackendOperatorRepository`
- Implementar os 2 métodos da interface `BackendOperatorRepository`:
  - `findById(id)` — `SELECT * FROM operators WHERE id = ?`
  - `create(args)` — `INSERT INTO operators (...) VALUES (...)` com `id`, `permissions` (JSON), `roles` (JSON), `status`, `created_at`, `updated_at`
- Parse do row do banco (converter `jsonb` string para `readonly string[]`)

### 6. Atualizar `createBackendProductServices` em `product/services.ts`

Modificar a injeção de `users` e `operators` para ser **condicional ao ambiente**:

```typescript
// Se config.databaseUrl estiver definida (qualquer ambiente com PostgreSQL):
//   users = createPostgresApplicationUserRepository(db)
//   operators = createPostgresOperatorRepository(db)
// Caso contrário (dev local sem banco, testes):
//   users = createBackendApplicationUserMemoryRepository()
//   operators = createBackendOperatorMemoryRepository()
```

O banco `db` já é injetado via `dependencies.database` — é o `Kysely<DatabaseTables>` disponível no `BackendProductServices.database`. Usar o mesmo critério que a Issue 04 estabeleceu: se `config.databaseUrl` existe, usar PostgreSQL; senão, usar memória.

### 7. Manter repositórios em memória como fallback

Os arquivos `application-user-memory.ts` e `operator-memory.ts` existentes **não devem ser removidos**. Eles continuam sendo o padrão para:
- Desenvolvimento local sem PostgreSQL
- Testes unitários que não precisam de banco
- CI/CD que não tem serviço PostgreSQL disponível

### 8. Testes

#### Testes unitários para `application-user-memory.ts`

Já existem em `tests/application-user.test.ts` — verificar se cobrem todos os cenários:
- criação e busca por id
- busca por external subject
- idempotência (repetir com mesmo `externalSubject`)
- retornar `undefined` para não encontrado

#### Testes de integração para `postgres-application-user-repository.ts`

Criar `tests/postgres-application-user-repository.test.ts`:
- conectar a um banco PostgreSQL de teste (usar o mesmo setup dos testes postgres existentes)
- rodar a migration `0002` via migration runner
- testar os mesmos cenários dos testes unitários, mas contra o banco real
- testar unique constraint: inserir dois registros com mesmo `external_subject` deve falhar
- testar que dados persistem após "reinicialização" (criar um registro, fechar conexão, abrir nova, buscar pelo id)

#### Testes de integração para `postgres-operator-repository.ts`

Criar `tests/postgres-operator-repository.test.ts`:
- criar operador, buscar por id
- retornar `undefined` para não encontrado
- verificar serialização de permissions e roles como JSON

#### Atualizar testes existentes de auth

Os testes em `tests/application-user.test.ts` e `tests/public-auth.test.ts` usam os repositórios em memória e devem continuar funcionando sem alterações — o comportamento do JIT provisioning é o mesmo, independente do backend de armazenamento.

### 9. Verificar integração com `resolveBackendPublicAuthenticatedActor`

A função `resolveOrProvisionApplicationUser` em `public-auth.ts:71-87` já usa a interface `BackendApplicationUserRepository`. Como a interface não muda, **nenhuma alteração é necessária** no fluxo de auth. A troca do repositório em memória pelo PostgreSQL é transparente.

### 10. Verificar integração com `resolveBackendOperationalActor`

A função em `operational-auth.ts` usa `BackendOperatorRepository.findById`. Como a interface não muda, a troca é transparente. Verificar se `operational-auth.ts` já extrai corretamente o `userId` do JWT para buscar o operador.

## Acceptance criteria

- [ ] Migration `0002` cria as tabelas `application_users` e `operators` com as colunas corretas, constraints e índices.
- [ ] Migration `0002` é reversível (`down` dropa as tabelas sem efeito colateral).
- [ ] `DatabaseTables` em `postgres-tables.ts` inclui `application_users` e `operators`.
- [ ] `expectedDatabaseTables` em `migration-runner.ts` inclui `application_users` e `operators`.
- [ ] `createPostgresApplicationUserRepository` implementa `findByExternalSubject`, `create` e `findById` com Kysely.
- [ ] `createPostgresOperatorRepository` implementa `findById` e `create` com Kysely.
- [ ] `createBackendProductServices` em `services.ts` usa os repositórios PostgreSQL quando `config.databaseUrl` está definida, e os repositórios em memória como fallback.
- [ ] Repositórios em memória existentes permanecem intactos e disponíveis para dev/test sem banco.
- [ ] Testes de integração PostgreSQL para ambos os repositórios passam.
- [ ] Testes unitários existentes de auth e JIT provisioning continuam passando sem alterações.
- [ ] Schema validation no boot inclui `application_users` e `operators`, falhando se as tabelas não existirem.
- [ ] Após a implementação, usuários provisionados via JIT persistem entre restarts do servidor quando PostgreSQL está configurado.

## Referências de código

### Interfaces e repositórios existentes (não modificar, apenas implementar)

| Arquivo | Propósito |
|---|---|
| `apps/backend/src/auth/application-user.ts` | Interface `BackendApplicationUser` e `BackendApplicationUserRepository` |
| `apps/backend/src/auth/operator.ts` | Interface `BackendOperator` e `BackendOperatorRepository` |
| `apps/backend/src/auth/application-user-memory.ts` | Implementação em memória (manter como fallback) |
| `apps/backend/src/auth/operator-memory.ts` | Implementação em memória (manter como fallback) |
| `apps/backend/src/auth/public-auth.ts` | JIT provisioning — NÃO precisa de alteração |

### Arquivos a modificar

| Arquivo | O que fazer |
|---|---|
| `apps/backend/src/infra/migrations/0002-add-application-users-and-operators.ts` | **Criar** — migration up/down |
| `apps/backend/src/infra/postgres-tables.ts` | **Modificar** — adicionar `ApplicationUsersTable`, `OperatorsTable`, estender `DatabaseTables` |
| `apps/backend/src/infra/migration-runner.ts` | **Modificar** — adicionar `"application_users"` e `"operators"` ao `expectedDatabaseTables` |
| `apps/backend/src/infra/postgres-repositories/postgres-application-user-repository.ts` | **Criar** — implementação PostgreSQL de `BackendApplicationUserRepository` |
| `apps/backend/src/infra/postgres-repositories/postgres-operator-repository.ts` | **Criar** — implementação PostgreSQL de `BackendOperatorRepository` |
| `apps/backend/src/product/services.ts` | **Modificar** — injeção condicional dos repositórios |
| `apps/backend/tests/postgres-application-user-repository.test.ts` | **Criar** — testes de integração PostgreSQL |
| `apps/backend/tests/postgres-operator-repository.test.ts` | **Criar** — testes de integração PostgreSQL |

### Como testar integração PostgreSQL local

```bash
# Subir PostgreSQL local (Docker)
docker run -d --name content-lib-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=content_lib -p 5432:5432 postgres:16

# Rodar migrations contra o banco local
DATABASE_URL=postgres://postgres:postgres@localhost:5432/content_lib pnpm migrate

# Rodar servidor apontando pro banco
DATABASE_URL=postgres://postgres:postgres@localhost:5432/content_lib pnpm dev

# Testar com Auth0 ou token de dev
curl -H "Authorization: Bearer $(pnpm token:generate)" http://localhost:3000/api/pipelines
```

## Blocked by

- `docs/archive/issues/backend-production-readiness/01-config-bootstrap-unificada-para-dev-test-e-prod.md` (já concluído)
- `docs/archive/issues/backend-production-readiness/04-postgresql-sistema-de-registro.md` (já concluído)
- `docs/archive/issues/backend-production-readiness/09-application-user-repository-and-jit-provisioning.md` (já concluído)
