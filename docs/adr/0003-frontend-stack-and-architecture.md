# Frontend Stack & Architecture

**Status:** accepted
**Emendada por:** ADR 0004 — o **fluxo de geração** descrito aqui e em `docs/frontend-application-flow.md` era intent-first (seletor de content type + formulário dinâmico). A ADR 0004 o substitui por um fluxo **tema-first guiado**. As decisões de **stack** desta ADR (Astro/Vite/WXT, data layer, auth, monorepo) permanecem vigentes.

O frontend do Cultiv é dividido em três entregas com runtimes desacoplados, unificados sob o mesmo domínio via proxy reverso, compartilhando serviços e design tokens centralizados no monorepo.

## Decisões

### Stack por superfície

| Superfície | Runtime | Build | Propósito |
|---|---|---|---|
| Landing + pública (`/`, `/en/*`, `/pricing`) | Astro | SSG/SSR independente | SEO/GEO, content collections, zero JS por padrão |
| Workspace autenticado (`/app/*`) | Vite + React 19 + TanStack Router | SPA independente | Aplicação interativa pesada (formulários dinâmicos, SSE, wizards, drawers) |
| Extensão de navegador | WXT + React 19 + Manifest V3 | Build independente | Sidebar/popup com geração, copia resultado para a página ativa |

Nenhum runtime compartilha build. O usuário percebe um único site contínuo. A landing é a porta de entrada (login/assinatura), e o workspace é a aplicação.

### Roteamento de domínio unificado

Proxy reverso (Vercel rewrites / Cloudflare) roteia:
- `/*` → deploy do Astro
- `/app/*` → deploy do Vite SPA

Trivial de configurar, desacopla deploys, e o usuário nunca vê a fronteira entre os dois sistemas.

### Monorepo

```
apps/
  landing/           → Astro (SSG/SSR)   — "home pública"
  web/               → Vite + React 19   — workspace autenticado
  extension/         → WXT + React 19    — extensão de navegador
packages/
  ui/
    tokens/          → CSS custom properties, temas (fonte única da verdade visual)
    landing/         → Componentes .astro que consomem tokens
    app/             → Componentes .tsx que consomem tokens
  shared/            → Serviços Effect-TS, hooks React, stores Zustand — consumido por web e extension
  client-sdk/        → (existente, bridge única com backend)
```

**`packages/ui`** é híbrido: tokens são compartilhados; componentes têm duas implementações nativas (`landing/` em `.astro`, `app/` em `.tsx`), evitando carregar React no Astro para componentes triviais. O design system visual (Cartography) será definido em etapa futura; por enquanto só a arquitetura de tokens é resolvida.

**`packages/shared`** expõe services Effect-TS (um por subclient do SDK), hooks de consumo (`usePreview`, `useExecutionWatch`, etc.) e stores Zustand de UI. Consumido por `apps/web` e `apps/extension`. Sem código duplicado entre SPA e extensão.

### Data Layer

```
┌─────────────────────────────────────────┐
│ React Component                         │
│  ├─ useQuery / useMutation (TanStack)   │  ← cache, stale-while-revalidate
│  ├─ Zustand store                       │  ← UI state (form, layout, filters)
│  └─ hooks/use-run                       │  ← bridge Effect → React lifecycle
├─────────────────────────────────────────┤
│ packages/shared/services/               │
│  └─ Effect.Service (um por subclient)   │  ← orquestração, retry, cancelamento
├─────────────────────────────────────────┤
│ packages/client-sdk                     │  ← HTTP, SSE, auth token, idempotency
└─────────────────────────────────────────┘
```

- **Effect-TS** gerencia side effects assíncronos, composição de serviços e cancelamento automático. Um `ManagedRuntime` no root do app; componentes consomem via `useRun(effect)`.
- **TanStack Query** gerencia cache, invalidação, stale-while-revalidate. Effect é usado dentro da `queryFn` — Query é dono do cache, Effect é o fetcher.
- **Zustand** gerencia estado síncrono de UI (valores de formulário, drawer aberto/fechado, filtros). Não é concorrente do Effect — é complementar.

### Auth

`@auth0/auth0-react` com `loginWithPopup()` como primário, `loginWithRedirect()` como fallback quando popup é bloqueado. TanStack Router `beforeLoad` protege `/app/*`. Rota `/callback` processa o redirect Auth0 e redireciona para `/app/generate`.

### Extensão (WXT)

Sem content script de injeção. A extensão abre como sidebar/popup com o fluxo completo de geração. Opcionalmente detecta a URL da aba ativa para pré-preencher o campo `channel` do preview (ex: `linkedin`, `blog`). O popup expõe "Copiar para área de transferência" — o usuário cola manualmente no campo destino. Auth via `@auth0/auth0-react` no popup (mesmo fluxo do SPA).

### Extensão — Fluxo

```
Usuário na página → Abre extensão (sidebar/popup)
→ Extensão lê URL da aba ativa → Pré-seleciona plataforma/canal se detectado
→ Usuário digita o tema → inferência (prefill) → sessão de perguntas guiadas (ADR 0004)
→ Gerar (API via client-sdk, igual ao SPA)
→ Resultado no popup → Copiar → Usuário cola no campo destino
```

## Alternativas consideradas e rejeitadas

- **TanStack Start (app unificado):** Beta, ecossistema imaturo para SEO comparado ao Astro. A complexidade de SSR para o workspace autenticado não se pagava — toda tela depende de dados client-side.
- **Next.js App Router:** Opinionado, conflito com Effect-TS (RSC não comporta closures com Effect, boundary `"use client"` força repensar services). Runtime Node.js desnecessário para SPA.
- **Nuxt 3:** Excelente SEO, mas abandona React e perde o ecossistema compartilhado com extensão e `packages/ui`.
- **SPA puro para landing:** SEO/GEO é prioridade #1 para aquisição. SPA sem SSR comprometeria indexação.
- **Astro + React islands na landing:** Carregar React no marketing surface para componentes triviais quebra a premissa "zero JS por padrão". O modelo híbrido de tokens + implementações nativas resolve isso.

## Nota de implementação (2026-07-09)

`packages/ui` foi criado **tokens-first**: por enquanto expõe apenas
`@my-ai-orchestrator/ui/tokens.css` (custom properties, temas light/dark,
fontes, escalas, motion — a fonte única da verdade visual), consumido hoje por
`apps/landing`. Dois desvios deliberados em relação à estrutura desenhada acima:

- **`packages/ui/landing` não será criado.** Os componentes da landing são
  seções de página (Hero, Pricing, FounderNote…) com copy e narrativa acopladas
  — têm um único consumidor por definição e permanecem em
  `apps/landing/src/components`. O subdiretório previsto aqui fazia sentido
  para primitivos `.astro` compartilhados entre páginas públicas; hoje esses
  primitivos são classes CSS que acompanham os tokens. Essa camada de
  identidade em CSS já vive em `packages/ui/src` e é consumida como folhas
  importáveis — `styles.css` (tokens + fontes + keyframes + base universal),
  `type.css`, `primitives.css`/`primitives-classic.css` — pela landing e,
  ao nascer, por `apps/web`. Ajustar aqui replica a identidade por todas as
  camadas; **componentes de framework** (`.astro`/`.tsx`) seguem nativos.
- **`packages/ui/app` nasce junto com o segundo consumidor.** A regra adotada:
  extrair quando o segundo consumidor está à vista, não antes. Componentes
  `.tsx` entram no pacote quando `apps/web` (recriado) e/ou `apps/extension`
  existirem para compartilhá-los.

O pacote está registrado na governança do monorepo (`tests/governance`) como
folha sem dependências de runtime — precisa continuar consumível por Astro,
React e extensão igualmente.

## Consequências

- Dois deploys independentes coordenados por proxy reverso. Simples de configurar, mas é uma peça de infra que precisa existir.
- `packages/shared` acopla `apps/web` e `apps/extension` nas mesmas versões de services e stores. Mudanças em shared exigem testar ambos os consumidores. O acoplamento é aceitável porque as duas superfícies executam o mesmo fluxo de negócio.
- `packages/ui` com duas implementações de componente exige disciplina para manter consistência visual entre `.astro` e `.tsx`. Tokens centralizados mitigam, mas não eliminam o risco de drift.
