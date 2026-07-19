# Estrutura de agentes — implementação do `/app` (backend-first → frontend inteiro)

> **Status:** **APROVADO** (2026-07-17). Estrutura de referência para a execução futura; nenhum código de app escrito ainda — a execução começa por aqui quando disparada.
> **Decisões do usuário (este esforço):** (1) desenhar a estrutura de agentes e **aprovar antes** de qualquer código; (2) **backend primeiro** — toda a Fase −1 de contratos aterrissa no `client-sdk` **antes** do frontend; então o app inteiro F1→S10, com todas as superfícies já **destravadas**; (3) design **re-importado** do MCP e comparado.
> **Reconciliações resolvidas (2026-07-17):** #1 **dropar Fragment Mono** → `--font-mono` de sistema (segue `app-design-bridge.md` P1). · #2 o rewrite do `apps/landing/src/data/plans.ts` p/ consumir o SDK **entra no A2**. · #3 refresh geral de design **pulado** (cópia local de 13/07 válida); registro histórico de shell **portado** → `docs/design/app-mock/shell-options-decision.md`.
> **Âncoras:** ADR 0003 (stack) · 0004 (geração) · 0005 (shell/rotas) · 0006 (billing/trial) · **0007** (arquitetura de impl. frontend) · **0008** (contratos backend). Planos ordenados: `docs/live/plan/backend-contracts-plan.md` (Fase A) + `docs/live/plan/frontend-implementation-plan.md` (Fase B). Design: `app-design-bridge.md` + bundle de handoff (`.scratch/implementacao-app-web/`).

## 1. Veredito do re-import de design (MCP)

Projeto live `6beda6a0…` = "Protótipo interativo com guidelines". O bundle `design_handoff_cultiv_workspace/` bate 1:1 com a cópia local de 13/07 (`Cultiv App.dc.html`, `Workspace - Estados de borda.dc.html`, `support.js`, `tokens/*`, `assets/*`), **mais** `Workspace - Opções de shell.dc.html` — que o README marca como *registro histórico de decisão de shell* (já travado na ADR 0005). **Sem mudança material** que invalide o plano. A referência de fidelidade continua válida.

- **E0 — resolvido:** refresh geral **pulado** (cópia local de 13/07 válida). Único delta do live — `Workspace - Opções de shell.dc.html` — foi **portado e destilado** em `docs/design/app-mock/shell-options-decision.md` (registro de por que o shell é a mistura "1d"; insumo do B-S2).

## 2. Invariantes — todo agente obedece (gate de review recusa quem violar)

- **Backend é SSOT.** Nenhuma regra de negócio no front. Preço, catálogo, trial, gate de geração, ledger, ciclo de vida = fatos do servidor.
- **Toda integração passa pelo `packages/client-sdk`.** O front **nunca** fala HTTP com o backend direto. Contrato novo no backend ⇒ **subclient/rota no SDK** no mesmo slice.
- **Tokens só de `packages/ui`.** `var(--token)` + classes de `packages/ui/src/*.css`. Zero cor/fonte hard-coded. Nada de `box-shadow rgba()` fora da doutrina.
- **Effect-hardening (backend/contracts):** `packages/contracts` só depende de `effect`; **proibido** `throw`, `Schema.decodeUnknownSync`, contrato tipado `Promise`. Erro/async = valores Effect; decoders via `createSchemaDecoder`.
- **Extend-before-rebuild (ponytail):** estender `packages/payments`/execuções/`auth`, não greenfield. Greenfield explícito só: prefill, reação, account ops, Auth0 Management.
- **Split apresentacional/container (frontend, ADR 0007 §4):** apresentacional em `packages/ui/app/<surface>/` (props-in, React `peerDependency`, **zero** import de `shared`/`sdk` → mantém `ui: Set([])`); container fino em `apps/web/src/routes/` (liga hooks→props).
- **Regras de conteúdo:** identidade de uma geração = **tema** (nunca formato) · **zero jargão** interno no DOM (enums→chips pt em containers/`derive/`) · **não existe plano free** (trial 7d) · estados (vazio/carregando/erro/rodando/não-lido/falhou/travado/pagamento-pendente) são cidadãos de 1ª classe.
- **Governança é load-bearing:** `monorepo-governance`, `effect-hardening-governance`, `voice-profile-centralization` — falha lá = violação de design, não flake.

## 3. Topologia

```
                    ┌─────────────────────────────┐
                    │  COORDENADOR (eu)           │  sequencia fases, aplica gates,
                    │  não escreve feature-code   │  reconcilia contradições, reporta
                    └──────────────┬──────────────┘
        FASE A (backend)           │            FASE B (frontend)
   ┌───────────────────────┐      gate     ┌────────────────────────────┐
   │ 7 agentes vertical-    │  ───────────▶ │ agentes de fundação → shell│
   │ slice (contrato+rota+  │  backend done │ → superfícies → estados    │
   │ persist+SDK)           │  & no SDK     │ (split ui/app × routes)    │
   └───────────────────────┘               └────────────────────────────┘
        cada fase: agente-revisor adversarial (design/spec/invariantes) + gate de testes
```

- **Execução via Task subagents** (um por slice), sequenciados por mim com **gates humanos entre fases** (respeita "aprovar antes"). Não é um Workflow autônomo — você fica no loop a cada gate. (Posso migrar pra Workflow se quiser mais automação; hoje não é o padrão pedido.)
- Cada agente-executor é pareado, ao fechar, com um **agente-revisor adversarial** read-only que confere contra o breakdown/contrato + invariantes + design, antes do gate de testes.

---

## 4. FASE A — Backend (Fase −1): contratos aterrissando no SDK

Cada agente entrega um **slice vertical**: `packages/contracts` (Effect Schema) → `apps/backend` (rota + serviço + persistência/migração) → **`packages/client-sdk` (subclient/rota)**. Sem o SDK, o front não enxerga — SDK é entregável obrigatório de cada slice.

| Agente | Contrato | Lê | Produz | Runnable check | Destrava |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **A1** | **B-STATUS** (#8) *a base* | `contract-02-status-entitlement.md`, ADR 0008 §1 | `status` 5-valores + `canGenerate`/`gate` tipado, `accessUntil/renewsAt/trialEndsAt/paymentMethod`; reescreve `entitlement.ts`; migração `+lapsed`; SDK | teste puro 5 status × gate | gating de S3/S7/S8 + inertização do shell |
| **A2** | **B-CATALOG** (#3+#5) | `contract-04-catalogo-topup.md`, `apps/landing/src/data/plans.ts` | `PlanCatalogView` + `TopUpCatalogView`, cents, anual −20% backend; **reescreve `default-plans.ts` stale** (SSOT + grant trial `ceil(5×custo)`); rotas; SDK; **+ rewrite do `apps/landing/src/data/plans.ts` p/ consumir o SDK** (fim do drift landing↔app, design-bridge P2) | catálogo decodifica; grant = ceil(5×custo); landing lê do SDK | S7 (planos) + link top-up de S8 + catálogo da landing |
| **A3** | **B-LIFECYCLE** (#6+N2) | `contract-03-ciclo-vida.md` | flags de capacidade por gateway; `cancelSubscription` (ASAAS); webhooks dunning; produtores (seed `trialing`, clocks `→lapsed`, `everSubscribed`); `GET /checkout-status/:intentId`; SDK | teste puro do clock de ciclo | S8 (gestão) + retorno real de S7 |
| **A4** | **B-LEDGER** (#4) *paralelo* | `contract-05-ledger.md` | `LedgerStatementView` (curadoria **no backend**, `statement.ts`); 6 categorias; SDK | soma net de `generation_cycle` | extrato de S8 |
| **A5** | **B-EXEC** (#1+#2+N3) *paralelo* | `contract-06-execucoes.md` | busca `q?` + denormalizar `data.briefingTopic` + backfill; `execution_reactions`; `cancelled` + `cancelJob` (libera reserva); SDK | busca por tópico; cancel libera reserva | busca/reação de S4 + cancelar de S10 |
| **A6** | **B-PREFILL** (N1) *paralelo* | `contract-07-prefill.md` | greenfield `POST /me/generation-prefill` (reusa `reasoning-extraction.ts`); 8º subclient `generationPrefill.infer` | prefill retorna backbone | prefill de S3 |
| **A7** | **B-ACCOUNT** (#7) *por último* | `contract-08-account-ops.md` | export/reset/excluir; anonimização de billing; tombstone + auth guard; Auth0 Management M2M; SDK | apaga um user preserva outro; PII some, fiscal fica | escada destrutiva de S9 |

**Ordem (dep graph do backend-contracts-plan.md):**
```
A1 STATUS ─┬─ A2 CATALOG ─ A3 LIFECYCLE ─┐
           │                              ├─ A7 ACCOUNT
A5 EXEC ───┼──────────────────────────────┘
A4 LEDGER ─┤   (A4/A5/A6 independentes — rodam junto de A1)
A6 PREFILL ┘
```
Caminho crítico: **A1 → A2 → A3 → A7**. A4/A5/A6 em paralelo desde o início.

**Gate da Fase A (tudo verde antes de abrir a Fase B):**
`pnpm lint` (tsc) · `pnpm test` · `pnpm test:postgres` · `pnpm guardrails:effect` · `pnpm smoke` (monorepo-governance) · **parity SDK↔rotas** (todo contrato exposto no SDK, tipos batendo) · revisor adversarial por slice.

---

## 5. FASE B — Frontend F1→S10 (todas as superfícies já destravadas)

### 5.1 Fundação (bloqueia tudo)

| Agente | Tarefas | Lê | Produz | Verifica |
| :-- | :-- | :-- | :-- | :-- |
| **B-UI** | F2 → P2 | `convencao-fidelidade.md`, `app-design-bridge.md` P1, ADR 0007 Errata 2 | `packages/ui/src/workspace.css` (`--halo/--hover/--activebg/--line2` sob `[data-surface="workspace"]`); move `--danger/--warning/--dim/--font-mono` p/ `tokens.css`; **labels técnicos usam `var(--font-mono)` de sistema — SEM Fragment Mono** (design-bridge P1); export `./workspace.css` + `./app`; React peerDep; **8 primitivos** `packages/ui/app/primitives/` como **superconjunto** (`Ring value/tone`, `Pill outline`, `Banner slots`) | tsc; `ui: Set([])` intacto; grep sem `Fragment Mono` |
| **B-APP** | F1 → F3 | `bootstrap-spec.md`, `shared-shape.md`, ADR 0007 Errata 1+3 | F1: Vite SPA (`base:"/app/"`, `TanStackRouterVite`, alias `~`, deps query+zustand); F3: `packages/shared` = `runtime/`(`makeAppRuntime`+`RuntimeProvider`+`useRun`) + `hooks/` + `stores/` (`theme,shell,history-filter,unread,wizard-session,`**`toast`**) + `derive/` (`deriveAppMode,creditsAsTexts,hasVoiceProfile`). **Sem `services/`.** | tsc |
| **B-WIRE** | F4 | ADR 0007 §4 | `Auth0Provider→QueryClient→RuntimeProvider→RouterProvider`; adiciona `shared` ao allow-set de `monorepo-governance`; smoke em `tests/web/` (jsdom, `renderWithRouter`) montando shell vazio | `pnpm smoke` + smoke web |

### 5.2 Shell + rotas

| Agente | Tarefas | Lê | Produz |
| :-- | :-- | :-- | :-- |
| **B-S1** | S1 rotas | `arvore-rotas.md` | `createRouter({basepath:'/app'})`, rota de layout do shell, `/callback`, `/app/calibrate` fora do shell, filhas `{generate,g/$id,voice,settings,plans,billing}`, `beforeLoad` do gate (`deriveAppMode`) |
| **B-S2** | S2 shell | `breakdown-07-shell.md`, `docs/design/app-mock/shell-options-decision.md` | apresentacional `packages/ui/app/shell/` (`WorkspaceShell/Rail/Panel/VoiceCompanion`) + container rota de layout (`ExecutionWatcher`, `deriveAppMode` no context). Composição = mistura "1d" (moldura+halo+busca+widgets de voz flutuantes que fecham juntos no ×). Hooks: `useExecutionsList`+`history-filter`, `useRunningExecutionsWatch`, `useEntitlement`+`creditsAsTexts`, `useVoiceProfile` |

### 5.3 Superfícies (paralelizáveis após S2; backend já pronto ⇒ nada gated)

| Agente | Superfície | Lê | Depende de |
| :-- | :-- | :-- | :-- |
| **B-S3** | Geração tema-first (08) | `breakdown-08-geracao.md` | S2; usa A1(gate)+A6(prefill) |
| **B-S4** | Histórico + detalhe (09) | `breakdown-09-historico.md` | S2; usa A5(busca/reação) |
| **B-S5** | Voz — rota + companion (10) | `breakdown-10-voz.md` | S2 (uma fonte, duas superfícies via `useVoiceProfile`) |
| **B-S6** | Onboarding + travado (11) | `breakdown-11-onboarding.md` | S2, S5 |
| **B-S7** | Planos + checkout + paywall (12) | `breakdown-12-planos.md` | S2; usa A2(catálogo)+A1(paywall)+A3(retorno) |
| **B-S8** | Billing / gestão (13) | `breakdown-13-billing.md` | S2; usa A3(gestão)+A1(status)+A4(ledger) |
| **B-S9** | Configurações + escada LGPD (14) | `breakdown-14-configuracoes.md` | S5, S8; usa A7(account ops) |

Cada superfície: split `packages/ui/app/<surface>/` (apresentacional) + container `apps/web/src/routes/`; estados first-class; zero jargão; bindings por nome dos hooks/stores do `shared`.

### 5.4 Estados de borda (fecha o wiring)

| Agente | Tarefas | Lê | Depende de |
| :-- | :-- | :-- | :-- |
| **B-S10** | S10 estados (15) | `breakdown-15-estados.md` | S3,S4,S5,S6,S8 |

Converte os 11 `states/*.tsx` contra a API dos primitivos (P2) → `packages/ui/app/states/`; **porta a 12ª tela `1a`**; wiring **dentro dos fluxos hospedeiros** (nunca telas soltas); kit de sistema (execução paralela no rail + `toast` + não-lido + Web Notifications) sobre `useRunningExecutionsWatch` + `stores/toast`.

### 5.5 Sequência da Fase B

```
B-UI (F2→P2) ─┐
B-APP(F1→F3) ─┴─ B-WIRE(F4) ─ B-S1 ─ B-S2 ─┬─ S3 ─┐
                                            ├─ S4 ─┤
                                            ├─ S5 ─┼─ S6
                                            ├─ S7 ─┼─ S10
                                            └─ S8 ─┴─ S9
```
**Gate por superfície:** tsc (`pnpm lint`) · testes `tests/web/` · revisor adversarial (design fidelity pixel-level + spec do breakdown + invariantes de conteúdo) · `/verify` no fluxo quando houver superfície viva. **Gate final:** suite completa + `pnpm smoke`.

---

## 6. Reconciliações — RESOLVIDAS (2026-07-17)

1. **Fragment Mono → resolvido: DROPAR.** Labels técnicos usam `var(--font-mono)` de sistema (segue `app-design-bridge.md` P1). O F2/B-UI **não** registra Fragment Mono. Gate: grep sem `Fragment Mono` no `packages/ui`.
2. **Catálogo landing → resolvido: INCLUIR no A2.** O A2 reescreve `apps/landing/src/data/plans.ts` p/ consumir o SDK no mesmo slice (fim do drift landing↔app; design-bridge P2).
3. **Refresh de design → resolvido: PULAR o geral, portar só o shell.** Registro histórico de shell destilado em `docs/design/app-mock/shell-options-decision.md`; insumo do B-S2.
4. **`ui: Set([])` (invariante permanente).** Promover tokens + primitivos não dá dependência de runtime ao `ui` (React `peerDependency`). Gate de governança guarda.

## 7. Estado & próximo passo

**Estrutura aprovada e salva.** Quando você disparar a execução, a ordem é: **Fase A** (A1→A2→A3→A7 no caminho crítico + A4/A5/A6 em paralelo) com o **gate de backend** (testes + effect-hardening + parity SDK) → **Fase B** (fundação → shell → superfícies → estados) com **gate por superfície**. Cada agente-executor fecha com um revisor adversarial antes do gate. Você aprova em cada fronteira de fase.
