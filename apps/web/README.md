# @my-ai-orchestrator/web

O aplicativo autenticado do Cultiv (login Auth0 + rotas `/app/*`). **Em
recriação** — este pacote é hoje um scaffold Vite + React 19 mínimo; as rotas,
providers e superfícies reais chegam nas próximas slices (ver
`docs/adr/0007-frontend-implementation-architecture.md`).

## Estrutura

- `index.html` — entry HTML do SPA, monta `#app` (`data-surface="workspace"`).
- `src/main.tsx` — bootstrap mínimo; providers reais (Auth0/Query/Runtime/Router) chegam na F4.
- `vite.config.ts` — `base: "/app/"`, plugin do TanStack Router + React.
- `vercel.json` — install a partir da raiz do workspace + `pnpm build` → `dist/`, com fallback SPA de `/app/*` → `/app/index.html`.

## Roteamento sob `/app` (ADR 0003)

Tudo neste app vive sob o base path `/app`, **não** na raiz. A landing (Astro)
é dona do domínio `cultiv.app` e faz *proxy reverso* de `/app/*` para o deploy
deste projeto via `rewrites` (ver `apps/landing/vercel.json`). Servir na raiz
faria os assets do SPA (referenciados como `/app/...`) vazarem para a zona da
landing. `base: "/app/"` no Vite mantém os assets alinhados com esse proxy.

## Deploy (Vercel)

Projeto separado da landing, apontando para **Root Directory = `apps/web`**.
O domínio `cultiv.app` **não** fica neste projeto — ele responde só via proxy da
landing. Ajuste a URL de destino do rewrite em `apps/landing/vercel.json` para a
URL de produção deste projeto.
