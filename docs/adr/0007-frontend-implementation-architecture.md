# Arquitetura de Implementação Frontend do `/app`

**Status:** accepted
**Complementa:** ADR 0003 (materializa a stack + data layer para o workspace `/app`), 0004 (geração tema-first), 0005 (shell/rotas), 0006 (billing/trial)
**Emenda:** ADR 0003 — a camada `packages/shared/services/` (um `Effect.Service` por subclient) é **removida** (ver Errata 1)
**Trilha de decisão:** `.scratch/implementacao-app-web/` (mapa wayfinder "Implementação do `/app` web — do design às tarefas" + tickets 01–16 e assets em `research/`: `convencao-fidelidade.md`, `shared-shape.md`, `arvore-rotas.md`, `bootstrap-spec.md`, `breakdown-07..15.md`; design em `design/`)

## Contexto

As ADRs 0003–0006 travaram **o quê** e **por quê** do workspace `/app` (stack, fluxo de geração, shell/rotas, billing/trial). Faltava o **como** de implementação: a forma concreta do `packages/shared`, a convenção de fidelidade do design-system em código, a árvore de rotas TanStack, o bootstrap do `apps/web`, e o design inteiro (as 10 fichas + os estados de borda) quebrado numa lista de tarefas ordenada por superfície.

O mapa wayfinder resolveu isso em 15 tickets de planejamento (01–15). Esta ADR **consolida** essas decisões num registro canônico, **formaliza as erratas** que os breakdowns levantaram contra ADRs anteriores, e **fecha o apêndice de contratos** (o que o front stuba vs. o que precisa de backend). O plano de execução ordenado vive em `docs/live/plan/frontend-implementation-plan.md`; esta ADR é a âncora arquitetural que ele referencia.

> **Escopo:** só a surface `/app` web (SPA autenticada). Landing (Astro, `apps/landing`) e extensão (WXT) estão fora — a extração de componentes compartilhados volta quando a extensão nascer.

## Decisões

As decisões detalhadas vivem nos tickets/assets do mapa (linkados abaixo por referência — esta ADR não os re-enuncia, indexa). O que segue é o esqueleto arquitetural travado.

### 1. Design-system em código: CSS-first, um SSOT (ticket 03)

`research/convencao-fidelidade.md`. Os `.tsx` são **wrappers finos** sobre as classes de `packages/ui/src/*.css` + `var(--token)`; os objetos JS `c`/`f` morrem. 8 primitivos (`Pill Chip Mono Serif Ring StatusDot Panel Banner`) em `packages/ui/app/primitives`. Tokens divididos por universalidade: `--danger/--warning/--dim/--font-mono` → `tokens.css`; `--halo/--hover/--activebg/--line2` → nova `workspace.css`. Tema via `[data-theme]`.

### 2. Camada de dados `packages/shared` (ticket 04)

`research/shared-shape.md`. **Sem camada `services/`** (ver Errata 1). O pacote é `runtime/` (`ManagedRuntime` + `RuntimeProvider` + `useRun`) + `hooks/` (TanStack Query consumindo `ClientSdkService` via `useRun`; orquestração mora aqui) + `stores/` (Zustand focados) + `derive/` (funções puras). `ManagedRuntime` criado uma vez no root com `getToken → auth0.getAccessTokenSilently`; SSE (`useExecutionWatch`) escreve no cache do Query (`setQueryData`), nunca em `useState` paralelo. Query é a única fonte de verdade do servidor.

### 3. Árvore de rotas TanStack (ticket 05)

`research/arvore-rotas.md`. Shell = rota de **layout** (rail + `<Outlet/>` + companion); filhas `/app/{generate,g/$id,voice,settings,plans,billing}`; **detalhe = rota filha `/app/g/$id`** (não search-param); `/app/calibrate` = wizard cheio **fora** do shell; recalibração leve + travado + filtros = estado Zustand. Gate no `beforeLoad` keia em `onboarding.completed` → `calibrate | locked | normal` (via `deriveAppMode`, router context).

### 4. Bootstrap + casa dos componentes (ticket 06)

`research/bootstrap-spec.md`. `apps/web` = Vite **SPA** (`base:"/app/"`, `TanStackRouterVite`, alias `~`; **sem** TanStack Start/Nitro/Tailwind — ver Out of scope). Providers: `Auth0Provider → QueryClientProvider → RuntimeProvider → RouterProvider`. **Split container/apresentacional:** `packages/ui/app/<surface>/` só apresentacional (React como `peerDependency` → mantém `ui: Set([])` na governança); containers finos (hooks→props) em `apps/web/src/routes/`. Escopo do workspace = **`[data-surface="workspace"]`** (ortogonal ao `[data-theme]`).

### 5. Breakdowns por superfície (tickets 07–15)

Cada superfície tem um `research/breakdown-NN-*.md` com árvore de componentes (split), bindings por nome dos hooks/stores do 04, estados first-class, e tarefas ordenadas. Índice: Shell (07) · Geração tema-first (08) · Histórico+detalhe (09) · Voz — uma fonte, duas superfícies (10) · Onboarding+travado (11) · Planos+checkout+paywall (12) · Billing/gestão (13) · Configurações+escada LGPD (14) · Estados de sistema+wiring dos estados de borda (15). Regras de conteúdo transversais (invariantes): identidade de uma geração é sempre o **tema** (nunca o formato); **nunca** expor jargão interno (intent/content type/signature/TRAIT_KEYS crus); **não existe plano free** (free trial da ADR 0006); estados são cidadãos de 1ª classe.

## Erratas (formalizadas aqui, canônicas)

Os breakdowns levantaram três correções a decisões anteriores. Ficam registradas aqui; os ADRs/assets originais ganham um ponteiro.

### Errata 1 — ADR 0003: remover `packages/shared/services/`

A ADR 0003 (§ Data Layer, e `packages/shared` descrito como "services Effect-TS, um por subclient do SDK") prescreve uma camada de `Effect.Service` 1:1 com os subclients do SDK. **Removida.** O `client-sdk` **já entrega esse seam** — `ClientSdkService` (Context.Tag) expõe os 7 subclients como Effects. Um wrapper 1:1 por cima é duplicação sem ganho (regra ponytail: o helper já existe no nível abaixo). **A orquestração que a ADR imaginava nos services passa a morar nos hooks** de `packages/shared/hooks` (ex.: `useGenerate` compõe prefill→run). O `packages/shared` fica: `runtime/` + `hooks/` + `stores/` + `derive/`. As demais decisões de stack da ADR 0003 (Astro/Vite/WXT, Effect+Query+Zustand, Auth0, monorepo) **permanecem vigentes**.

### Errata 2 — ticket 03: a API dos 8 primitivos é um **superconjunto**, não troca literal de token

O wiring dos estados de borda (ticket 15) descobriu que os componentes `states/*.tsx` importados chamam os primitivos com uma API que **diverge** das classes CSS atuais: `Ring` com `frac/stroke` (precisa `value/tone`), `Pill` com variante `outline`, `Banner` com slots. Portanto a definição dos 8 primitivos (ticket 03) precisa ser fixada como o **superconjunto** dessas necessidades **antes** de converter os states — não é wrapper literal de uma classe existente. Ajuste a `research/convencao-fidelidade.md` em conformidade na tarefa de primitivos (P2 do plano).

### Errata 3 — ticket 04: adições ao `packages/shared`

O `shared-shape.md` (04) não previu duas peças que os breakdowns exigem, mais dois grupos de hooks. Adicionar:
- **`stores/toast.ts`** — store de toast ambiente (kit de sistema do 15: toast de conclusão clicável em qualquer rota).
- **`hooks/useRunningExecutionsWatch()`** — multi-watch **shell-scoped** (observa todas as execuções vivas para o rail + toast + notificações), distinto do `useExecutionWatch(id)` por-detalhe.
- **consent hooks** — `useConsentStatus/useGrantConsent/useRevokeConsent` (10/11; o 04 só nomeou profile + mutação de traço).
- **mutações de calibração faltantes** — `useSetContext/useSkipStep/useCalibrationEntitlement` (11; métodos SDK já existem, só faltam os hooks).

## Apêndice de contratos (especificados — ver ADR 0008)

> **Executado (2026-07-14).** O track de backend abaixo foi planejado num esforço próprio → **ADR 0008** (Contratos de backend do `/app`) + `docs/live/plan/backend-contracts-plan.md`. **Todos os 11 gaps classe-b + classe-c** foram especificados como contratos concretos (Effect Schema + rota/persistência). As shapes desta tabela deixam de ser "a especificar"; os **classe-b saem de "stub v1" para contrato real** (o front liga direto). A tabela abaixo preserva a análise original de classificação; a spec canônica de cada um vive na ADR 0008.


Consolidado dos gaps do ticket 02 + os que emergiram nos breakdowns. **Classe-a** = derivável/stubável client-side no `derive/`, sem backend; **classe-b** = precisa de contrato, mas o v1 funciona com stub/fallback; **classe-c** = precisa de backend, trava a feature real.

| # | Gap | Superfície | Classe | v1 (stub) | Precisa de backend |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | Busca textual por tema | Histórico (09) | b | filtro client-side na janela carregada | busca server-side paginada |
| 2 | `submitReaction` / `ExecutionReactionView` | Detalhe (09) | b | reação otimista no cache | persistência da reação |
| 3 | `PlanCatalogView` (`GET /me/billing/plans` c/ preço) | Planos (12) | b | ler catálogo da ADR 0006 §3 | endpoint (backend é SSOT do catálogo) |
| 4 | `LedgerStatementView` (extrato curado) | Billing (13) | b | vazio/oculto até haver rota | endpoint de ledger + curadoria |
| 5 | Lista de top-up | Planos/Billing (12/13) | b | link discreto inerte | endpoint de pacotes de top-up |
| 6 | Gestão de assinatura (cancelar/reativar/regularizar/trocar método) | Billing (13) | **c** | botões desabilitados c/ nota | money ops no backend |
| 7 | Account ops (exportar/resetar/excluir) | Configurações (14) | **c** | diálogos prontos, ação desabilitada | endpoints LGPD |
| 8 | `status` de assinatura tipado + `accessUntil`/`renewsAt`/`trialEndsAt`/`paymentMethod` liberando `canGenerate`/`trialing` | Trial/paywall/billing (08/11/12/13) | **c** | `deriveCanGenerate` client-side de entitlement | contrato de status real |
| 9 | appMode derivável | Shell/gate (07/05) | a | `deriveAppMode` (04) | — |
| 10 | Prefs (idioma/notificações) | Configurações (14) | a/b | idioma client-side + Auth0 metadata | persistência server-side |
| N1 | `generation-prefill.infer` (ADR 0004 §6) | Geração (08) | b | verificar se o método existe no SDK; se sim, só wire | catalogar/expor se ausente |
| N2 | Return-URL do gateway carregando status | Checkout (12) | **c** | polling de entitlement pós-retorno | param de status ou endpoint checkout-status (entitlement sozinho não separa pendente de falha) |
| N3 | Cancelar geração em curso | Execução (15) | b/c | esconder ação | endpoint de cancelamento |

**Regra (revisada — decisão do usuário, 2026-07-13):** o front implementa **classe-a/b** já (com stub via `derive/` onde marcado). Os contratos **classe-c** (#6, #7, #8, N2) **são pré-requisito de backend**: implementados e disponíveis **antes** de qualquer UI que dependa deles — nenhuma superfície com ação desabilitada ships. Isto redesenha o escopo (o backend estava fora do mapa de frontend) e é um **esforço próprio** (ver "Track de backend, pré-requisito" abaixo). #8 é o de maior alavancagem e o mais transversal (gating de trial/paywall + `canGenerate` — fato do servidor, não derivável no client com correção).

### Track de backend, pré-requisito (novo esforço)

Os contratos classe-c não cabem na competência do `/implement` do frontend (outra área do código — `apps/backend`, `packages/contracts`, `packages/database` — com governança Effect-hardening e testes de postgres próprios). Ficam num **track de planejamento separado**, cuja saída (endpoints + contratos Effect Schema) o plano de frontend consome como dependência dura. As superfícies dependentes (geração/shell no gating, planos, billing, configurações) só entram **depois** que seus contratos aterrissam. Ver `docs/live/plan/frontend-implementation-plan.md` (Fase −1 + anotações de dependência).

> **Resultado do track (2026-07-14):** especificado na **ADR 0008** + `docs/live/plan/backend-contracts-plan.md`. O escopo estendeu-se de classe-c p/ **classe-b + classe-c** (varredura completa). Ordem: **#8 (status) é a base** → catálogo → ciclo de vida; ledger/execuções/prefill em paralelo; account ops por último. Uma decisão material do track: a premissa dos **dois gateways** (ASAAS+Stripe) foi re-checada e mantida (Stripe-only viável em 2026 mas não p/ SaaS BR-first mid-ticket).

## Consequências

- O `/implement` tem um plano ordenado (`docs/live/plan/frontend-implementation-plan.md`) e esta ADR como âncora; nenhuma decisão de arquitetura pendente.
- `packages/shared` e `packages/ui/app` entram no grafo de imports permitido (`tests/governance/monorepo-governance`): `shared` ganha allow-set; `ui` permanece `Set([])` (React como peerDep).
- Os contratos classe-c (#6, #7, #8, N2) são **pré-requisito**, não dívida: um track de backend próprio os entrega antes das superfícies dependentes (decisão de 2026-07-13). O frontend serializa parcialmente atrás desse track — em troca, nada ships desabilitado.
- A trilha completa (o porquê de cada decisão) fica no mapa wayfinder em `.scratch/implementacao-app-web/`.

## Alternativas descartadas

- **Stack SSR (TanStack Start + Nitro) + Tailwind** — havia um bootstrap anterior nesse formato (`.worktrees/architecture-deepening/apps/web`). Contradiz a ADR 0003 (Vite SPA client-side, CSS-first sem Tailwind, landing Astro separada). Rejeitado; reusadas só versões de deps/alias/material de i18n.
- **Manter a camada `services/` da ADR 0003** — duplicação do seam que o `client-sdk` já provê (ver Errata 1).
- **Componentes conectados em `packages/ui/app`** (importando `shared`/`client-sdk`) — quebraria o invariante `ui: Set([])` (leaf zero-dep consumível por Astro/extensão). Resolvido pelo split container/apresentacional (ticket 06).
