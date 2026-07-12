# @my-ai-orchestrator/web

O aplicativo autenticado do Cultiv (login Auth0 + rotas `/app/*`). **Em
recriação** — este pacote é hoje só um scaffold com uma página placeholder para
manter o deploy da Vercel verde enquanto o app real (TanStack Start / Vite) não
volta.

## Estrutura

- `public/index.html` — placeholder "em breve" (estático, sem dependências).
- `scripts/build.mjs` — publica `public/` em `dist/` (o que a Vercel serve).
- `scripts/serve.mjs` — servidor estático local (`pnpm --filter @my-ai-orchestrator/web dev`).
- `src/` — vazio; onde o app real vai nascer.
- `vercel.json` — install a partir da raiz do workspace + `pnpm build` → `dist/`.

## Deploy (Vercel)

Projeto separado da landing, apontando para **Root Directory = `apps/web`**.
Veja a raiz do repo para o passo a passo do painel.
