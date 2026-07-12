# @my-ai-orchestrator/web

O aplicativo autenticado do Cultiv (login Auth0 + rotas `/app/*`). **Em
recriação** — este pacote é hoje só um scaffold com uma página placeholder para
manter o deploy da Vercel verde enquanto o app real (TanStack Start / Vite) não
volta.

## Estrutura

- `public/index.html` — placeholder "em breve" (estático, sem dependências).
- `scripts/build.mjs` — publica `public/` em `dist/app/` (o que a Vercel serve).
- `scripts/serve.mjs` — servidor estático local em `/app` (`pnpm --filter @my-ai-orchestrator/web dev`).
- `src/` — vazio; onde o app real vai nascer.
- `vercel.json` — install a partir da raiz do workspace + `pnpm build` → `dist/`, com fallback SPA de `/app/*` → `/app/index.html`.

## Roteamento sob `/app` (ADR 0003)

Tudo neste app vive sob o base path `/app`, **não** na raiz. A landing (Astro)
é dona do domínio `cultiv.app` e faz *proxy reverso* de `/app/*` para o deploy
deste projeto via `rewrites` (ver `apps/landing/vercel.json`). Servir na raiz
faria os assets do futuro SPA (referenciados como `/app/...`) vazarem para a
zona da landing. Quando o app real (Vite + React + TanStack Router) nascer,
configure `base: "/app"` no Vite e `basepath="/app"` no router.

## Deploy (Vercel)

Projeto separado da landing, apontando para **Root Directory = `apps/web`**.
O domínio `cultiv.app` **não** fica neste projeto — ele responde só via proxy da
landing. Ajuste a URL de destino do rewrite em `apps/landing/vercel.json` para a
URL de produção deste projeto.
