# Plano de implementação frontend do `/app` — ordenado, `/implement`-ready

> Âncora arquitetural: **ADR 0007** (+ ADRs 0003–0006). Trilha completa: mapa wayfinder `.scratch/implementacao-app-web/` (tickets 01–16 + `research/*`). Este plano é a **sequência de execução** que o `/implement` segue tarefa-a-tarefa; cada tarefa referencia o breakdown que a detalha.

## Como ler

- Cada tarefa tem **id** (`Fn`/`Pn`/`Sn`), **depende de**, e um ponteiro pro asset com a árvore/bindings/estados.
- **Split obrigatório** (ADR 0007 §4): cada superfície = apresentacional em `packages/ui/app/<surface>/` (props-in, React peerDep, zero `shared`/`sdk`) + container em `apps/web/src/routes/` (liga hooks do `packages/shared`).
- **Regras de conteúdo (invariantes, valem em toda tarefa):** identidade = **tema** nunca formato · **zero jargão** no DOM (enums→chips pt em containers/`derive`) · **sem plano free** · estados são first-class.
- **Contratos classe-c** (ADR 0007 apêndice #6/#7/#8/N2): **pré-requisito de backend** (decisão de 2026-07-13) — entram na **Fase −1**, num track de backend próprio; a UI dependente **espera** o contrato aterrissar (nada ships desabilitado). Ver ADR 0007 "Track de backend, pré-requisito".

---

## Fase −1 — Contratos de backend (pré-requisito; track separado — ESPECIFICADO)

> **Track planejado.** Âncora: **ADR 0008** (Contratos de backend do `/app`); plano ordenado `/implement`-ready em **`docs/live/plan/backend-contracts-plan.md`** (grafo, tarefas, assets). Vive em `apps/backend`/`packages/{contracts,database}` (Effect-hardening + testes de postgres). A decisão de 2026-07-13 estendeu o pré-requisito p/ **classe-b + classe-c** (varredura completa — o front nunca stuba): as shapes abaixo viraram **contratos concretos** (não mais stub v1). A UI dependente espera cada um aterrissar; roda **em paralelo** com a Fase 0/1 do frontend. Ordem (`backend-contracts-plan.md`): B8 é a base → B-CATALOG → B6/BN2; B-LEDGER/B-EXEC/B-PREFILL paralelos; B7 por último.

**Classe-c (travam a feature):**
- **B8. #8 — status tipado + `canGenerate`/`trialing`** (`B-STATUS` no plano) — enum de 5 valores + `gate` tipado; `accessUntil`/`renewsAt`/`trialEndsAt`/`paymentMethod`; `canGenerate` como fato do servidor. A base do gating. **Bloqueia** S3/S7/S8 + inertização do shell.
- **B6. #6 — gestão de assinatura** (`B-LIFECYCLE`) — **flags de capacidade por gateway** (Stripe via Customer Portal / ASAAS in-app); dunning **refletido** do nativo; `accessUntil` = clock interno. **Bloqueia** S8.
- **B7. #7 — account ops LGPD** (`B-ACCOUNT`) — reset **mantém a carteira**; excluir **anonimiza+retém billing** (fiscal) e hard-deleta o resto; conta vira **tombstone**. **Bloqueia** S9.
- **BN2. N2 — retorno do checkout** (parte do `B-LIFECYCLE`) — `GET /checkout-status/:intentId` = **verdade de servidor** (param de URL é inseguro). **Bloqueia** o retorno real de S7.

**Classe-b (agora contrato concreto, não mais stub):**
- **B-CATALOG. #3+#5 — catálogo + top-up** — preço em cents = **SSOT backend** (`default-plans.ts`); trial = grant `ceil(5×custo)`. Destrava S7 real (fim do hardcode de preço).
- **B-LEDGER. #4 — extrato curado** — `LedgerStatementView`, **curadoria no backend** (`curateLedger` do front deletado). Destrava o extrato de S8 real.
- **B-EXEC. #1+#2+N3 — busca + reação + cancelar** — busca por `briefingTopic` **com backfill**; reação mutável; cancelar **best-effort** (libera reserva). Destrava busca/reação de S4 + cancelar de S10 real.
- **B-PREFILL. N1 — prefill** — greenfield, `POST /me/generation-prefill`. Destrava o prefill de S3.

## Fase 0 — Fundação (bloqueia tudo; independente da Fase −1)

- **F1. Bootstrap Vite SPA do `apps/web`** — depende de: —. `research/bootstrap-spec.md`. Trocar o placeholder estático por Vite (`base:"/app/"`, `TanStackRouterVite`, `@vitejs/plugin-react`, alias `~`). `index.html` + `src/main.tsx`. Adicionar deps `@tanstack/react-query` + `zustand`. `vercel.json` já é SPA (manter). **Sem** Start/Nitro/Tailwind.
- **F2. `packages/ui` — CSS de workspace + primitivos + export `./app`** — depende de: —. `research/convencao-fidelidade.md` + **ADR 0007 Errata 2**. Criar `src/workspace.css` (tokens `--halo/--hover/--activebg/--line2` sob `[data-surface="workspace"]`) + export `./workspace.css`; mover `--danger/--warning/--dim/--font-mono` + registrar Fragment Mono em `tokens.css`; export `./app`; React como `peerDependency`.
- **P2. Definir os 8 primitivos como superconjunto** — depende de: F2. **ADR 0007 Errata 2.** `packages/ui/app/primitives/{Pill,Chip,Mono,Serif,Ring,StatusDot,Panel,Banner}.tsx` com a API que os states exigem (`Ring value/tone`, `Pill outline`, `Banner slots`) — fixar antes de converter states. Wrappers finos sobre classes CSS.
- **F3. `packages/shared` — esqueleto** — depende de: F1. `research/shared-shape.md` + **ADR 0007 Errata 1+3**. Pastas `runtime/` (`makeAppRuntime`+`RuntimeProvider`+`useRun`), `hooks/`, `stores/`, `derive/`. **Sem `services/`.** Stores: `theme.ts`(persist), `shell.ts`, `history-filter.ts`, `unread.ts`(persist), `wizard-session.ts`, **`toast.ts`**(Errata 3). Derives puros: `deriveAppMode`, `creditsAsTexts`, `hasVoiceProfile`.
- **F4. Providers + governança + smoke** — depende de: F1, F2, F3. Montar `Auth0Provider→QueryClientProvider→RuntimeProvider→RouterProvider` em `main.tsx`. Adicionar `shared` ao allow-set de `tests/governance/monorepo-governance`; confirmar `ui: Set([])`. Smoke em `tests/web/` (pragma jsdom, `renderWithRouter`) que monta o shell vazio.

## Fase 1 — Shell + roteamento (bloqueia as superfícies)

- **S1. Árvore de rotas** — depende de: F4. `research/arvore-rotas.md`. `createRouter({basepath:'/app'})`, rota de layout do shell, `/callback`, `/app/calibrate` fora do shell, filhas `{generate,g/$id,voice,settings,plans,billing}`, `beforeLoad` do gate (`deriveAppMode`).
- **S2. Shell (07)** — depende de: S1, P2. `research/breakdown-07-shell.md`. Apresentacional `packages/ui/app/shell/` (`WorkspaceShell/Rail/Panel/VoiceCompanion`) + container rota de layout `/app` (`ExecutionWatcher` por item vivo, `deriveAppMode` no context). Hooks: `useExecutionsList`+`history-filter`, `useRunningExecutionsWatch`(Errata 3), `useEntitlement`+`creditsAsTexts`, `useVoiceProfile`. Estados: normal/travado(→S6)/gerações vivas.

## Fase 2 — Superfícies primárias (paralelizáveis entre si após a Fase 1)

- **S3. Geração tema-first (08)** — depende de: S2, **B8** (gating real de `canGenerate`/trial). `research/breakdown-08-geracao.md`. `packages/ui/app/generate/` + containers `generate.tsx`/`g.$id.tsx`. Hooks `useGeneratePrefill`(gap N1)/`usePreview`/`useGenerate`/`useExecutionWatch`/`useEntitlement` + `wizard-session`. Estados: vazio/analisando/2ª-3ª pergunta/ambiguidade/custo/escrevendo/paralelismo. **N1**: verificar `generation-prefill.infer` no SDK.
- **S4. Histórico + detalhe (09)** — depende de: S2 (rail vive no shell). `research/breakdown-09-historico.md`. `packages/ui/app/{history,detail}/` + containers. Rail item = tema + StatusDot + selo progressivo + não-lido (`unread`). Detalhe: corpo herói serifa, banda "Alinhamento de voz" colapsável (→S5). Gaps #1(busca client v1)/#2(reação otimista).
- **S5. Voz — rota + companion (10)** — depende de: S2 (companion no shell). `research/breakdown-10-voz.md`. **Uma fonte, duas superfícies:** apresentacionais `packages/ui/app/voice/` reusados por rota E companion, ambos lendo o mesmo `useVoiceProfile`. `ConsentPanel` SSOT (revogar apaga perfil + desliga geração). Consent hooks (Errata 3). Recalibrar→wizard leve (S6).

## Fase 3 — Entrada, monetização, ajustes

- **S6. Onboarding + travado (11)** — depende de: S2, S5. `research/breakdown-11-onboarding.md`. Wizard = motor único, 2 chromes (`full` em `/app/calibrate` × `light` overlay do `/app/voice`); passo 6 absorve o rebuild (nunca vira estado do shell) + consentimento (gate duro) + destrave limitado por trial. Travado = shell em `appMode:'locked'`. Hooks de calibração faltantes (Errata 3), gap #8.
- **S7. Planos + checkout + paywall (12)** — depende de: S2, **B8** (paywall/trial), **BN2** (retorno real). `research/breakdown-12-planos.md`. `packages/ui/app/plans/` + container. Catálogo ADR 0006 §3, **sem plano free**, checkout = **redirect real**, retorno em 3 estados. 4 paywalls contextuais. Gaps #3(catálogo)/#5(top-up) seguem stub b.
- **S8. Billing / gestão (13)** — depende de: S2, **B6** (gestão de assinatura), **B8** (status tipado). `research/breakdown-13-billing.md`. `packages/ui/app/billing/` + container. Saldo "~N textos", extrato **curado** (`curateLedger`), 4 estados de assinatura (`deriveSubscriptionState`). Gap #4 (ledger) segue stub b até haver rota.
- **S9. Configurações + escada LGPD (14)** — depende de: S5 (consent SSOT), S8 (deep-link plano), **B7** (account ops LGPD). `research/breakdown-14-configuracoes.md`. `packages/ui/app/settings/` + container. 4 seções; escada destrutiva (revogar<resetar<excluir, type-to-confirm no excluir); tema só na topbar, idioma dono aqui. Gap #10 (prefs) segue class-a.

## Fase 4 — Estados de sistema (fecha o wiring; depende das superfícies)

- **S10. Estados de borda + kit de sistema (15)** — depende de: S3, S4, S5, S6, S8 (os hosts precisam existir). `research/breakdown-15-estados.md`. Converter os 11 `states/*.tsx` contra a API dos primitivos (P2) e mover pra `packages/ui/app/states/`; **portar a 12ª tela `1a` (Geração degradada)**. Fazer o **wiring dentro dos fluxos hospedeiros** (nunca telas soltas): `1a/1c/2f/2g` = regiões dos hosts; os outros 8 = standalone parametrizados. Kit de sistema (execução paralela no rail + toast ambiente + não-lido + Web Notifications) sobre `useRunningExecutionsWatch` + `toast.ts` (Errata 3).

---

## Grafo de dependências (resumo)

```
Track backend (Fase −1, paralelo):  B8 ─┬─────────┐   B6 ─┐   B7 ─┐   BN2 ─┐
                                        │         │      │      │       │
Frontend:  F1 ─┬─ F3 ─┐                 │         │      │      │       │
           F2 ─┴─ P2  ├─ F4 ─ S1 ─ S2 ─┼─ S3 ────┤      │      │       │
                      └──────────────   ├─ S4     ├─ S10 │      │       │
                                        ├─ S5 ────┼─ S6  │      │       │
                                        └─ S7 ◀───┴──────┼──────┼───────┘   (S7 espera B8+BN2)
                                           S8 ◀──────────┴──────┘           (S8 espera B6+B8)
                                           S9 ◀─────────────────┘           (S9 espera B7; e S5+S8)
```

Caminhos críticos, **dois em paralelo**:
- **Frontend puro:** F1/F2 → F3/P2 → F4 → S1 → S2 → {S4, S5} → S10. Não toca backend; pode começar já.
- **Full-stack (gated):** o track de backend (B8 primeiro) precisa aterrissar antes de S3/S7/S8/S9. B8 é o gargalo — libera o gating de S3 e é dependência de S7/S8.

Ordem prática: **começar a Fase 0/1 do frontend E o B8 do backend simultaneamente**; conforme cada Bn aterrissa, sua superfície destrava. S10 (estados) fecha por último.

## Dependência de backend (Fase −1 — pré-requisito, não dívida)

#8 status de assinatura tipado (maior alavancagem — gating de trial/paywall como fato do servidor) · #6 gestão de assinatura · #7 account ops LGPD · N2 return-URL do gateway com status. **Esforço próprio** (outro escopo — ver ADR 0007 "Track de backend, pré-requisito"). Precisa de planejamento dedicado antes do `/implement` das superfícies dependentes.
