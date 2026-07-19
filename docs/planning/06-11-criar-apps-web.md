# Issue 06-11: Criar estrutura base do `apps/web`

**Status:** Pendente  
**Prioridade:** Baixa  
**Dependências:** 06-06 (Onboarding Completion), 06-07 (Step 0)  

## Contexto

O antigo `apps/web` foi removido porque estava desorganizado. O `package.json` raiz ainda referencia `@my-ai-orchestrator/web`, mas o pacote não existe no monorepo. Precisamos criar uma nova estrutura limpa para o frontend.

## Objetivo

Criar a base do novo aplicativo web do Cultiv, pronto para consumir o `client-sdk` e seguir o design system Cultiv Cartography.

## Escopo

### 1. Estrutura do pacote

Criar `apps/web/` com:
- `package.json` com `@my-ai-orchestrator/web`.
- Dependência de `@my-ai-orchestrator/client-sdk`.
- Dependência de `@my-ai-orchestrator/ui` (design system).
- Configuração de TypeScript, Vite/TanStack Start e Tailwind conforme padrão do monorepo.

### 2. Configuração de autenticação

- Integrar Auth0 SPA SDK.
- Configurar provider de token para o `createClientSdk`.

### 3. Rotas base

Criar estrutura de rotas vazia ou com placeholders:
- `/app/onboarding` — onboarding de calibração
- `/app/generate` — geração
- `/app/history` — histórico
- `/app/voice` — dashboard de voz
- `/app/settings` — configurações

### 4. Layout e design system

- Aplicar `data-surface="workspace"`.
- Configurar tipografia Cartografia (`Autoridade`, `Condução`, `Margem`, `Coordenadas`).
- Criar layout base com navegação workspace.

### 5. Configuração de build/dev

- Garantir que `pnpm dev:web` e `pnpm build:web` funcionem.
- Adicionar scripts ao `package.json` do `apps/web`.

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `apps/web/package.json` | Criar |
| `apps/web/tsconfig.json` | Criar |
| `apps/web/vite.config.ts` / `app.config.ts` | Criar conforme TanStack Start |
| `apps/web/src/app.tsx` | Criar entrypoint |
| `apps/web/src/routes/**` | Criar rotas base |
| `apps/web/src/components/layout/**` | Criar layout base |
| `apps/web/src/lib/sdk.ts` | Configurar SDK |
| `apps/web/src/lib/auth.ts` | Configurar Auth0 |

## Verificação

1. `pnpm install` funciona.
2. `pnpm dev:web` sobe a aplicação.
3. `pnpm build:web` gera build de produção.
4. O SDK é importável a partir do `apps/web`.

## Risco

Baixo em si, mas é a issue com maior escopo de implementação. Recomenda-se dividir em fases menores conforme `docs/planning/05-frontend-implementation.md`.
