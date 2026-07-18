# Fase B — GAPs de backend abertos (registrados durante fixes de review)

> Numeração continua a série de GAPs já usada em `.scratch/implementacao-app-web/research/breakdown-*.md` (GAP #1–#10). Este arquivo é o registro vivo em `docs/live/plan/` — a pasta `.scratch/` é só o research original, não é atualizada.

## Status (2026-07-18)

Após investigação adversarial (1 investigador read-only por GAP) + implementação:

| GAP | Veredicto | Estado |
| :-- | :-- | :-- |
| **#11** custo de estorno | GO — o número já era calculado no enqueue e descartado | **RESOLVIDO** — `reservedCredits` threaded contrato→enqueue→mapper→front; `LongTimeoutWatch` mostra o valor real |
| **#13** citações material-base | GO — client que descriptografa já injetado no voice-service | **RESOLVIDO** — `samples[]` lidos live via `listByUser` no `getProfileScreen`, sem persistência/migração |
| **#12** reabrir passo | Manter forward-only na v1 (padrão "Recalibrar = nova sessão", ADR 0005 §3) | **DEFERIDO** (reopen) + CTA "Reescrever esta amostra" → "Ver esta amostra" (era affordance enganosa). Único caso real: free-tier (`maxWizards:1`, sem Recalibrar) — decisão de produto. |
| **#6** reativação | Cancel do ASAAS é `DELETE` imediato — nada a reverter; re-checkout é o correto (bate com contract-03 v1) | **WON'T-FIX v1** — fallback banner→/plans mantido. Ver **#15** (bug adjacente do webhook Stripe). |
| **#14** intent na ambiguidade | Nenhuma correção mecânica cabe na ADR 0004 | **DECISÃO PENDENTE** — (b) endpoint LLM-reclassify como addendum à ADR 0004, ou (c) aceitar o risco (status quo). |

## GAP #6 (continuação) — "Reativar assinatura" sem contrato

**Onde dói:** `packages/ui/app/billing/PlanCard.tsx` não tem CTA de reativação; `BillingRoute` (`apps/web/src/routes/billing.tsx`) cai no fallback de banner (`bannerActionFor` → `openPortal`/`goPlans`) para o estado `canceled` em vez de um botão dedicado "Reativar assinatura →".

**Causa raiz:** `BillingManagement.canReactivate` vem **hardcoded `false`** do backend (`apps/backend/src/routes/billing-routes.ts:70,103`, `EMPTY_MANAGEMENT` e `resolveEntitlementManagement`) — não existe lógica de reativação para nenhum gateway ainda (nem Stripe portal, nem ASAAS in-app). `packages/shared/src/hooks/billing.ts:74` já documenta isso inline: "Reactivation / payment-method changes for ASAAS in-app management ... have no backend endpoint yet".

**Falta:**
- Backend: endpoint de reativação (ASAAS in-app, já que Stripe cai no Customer Portal) + `canReactivate` deixar de ser sempre `false` quando a assinatura ainda está dentro da janela de reativação (`accessUntil` no futuro).
- SDK: método `reactivateSubscription` em `@my-ai-orchestrator/client-sdk` + hook `useSubscriptionReactivate` em `packages/shared` (mesmo padrão de `useSubscriptionCancel`).
- Front (fora do escopo desta rodada): `PlanCard`/`BillingRoute` passam a expor o CTA real quando `management.canReactivate` vier `true`.

**Status atual do front:** deixado como fallback via banner (`Reativar →` chama `goPlans`/`openPortal`, nunca um endpoint inventado) — não bloqueia, mas não é a ação dedicada que o breakdown original (13-billing.md) descreve.

---

## GAP #11 (novo) — ✅ RESOLVIDO (2026-07-18) — Valor de estorno em `LongTimeoutWatch` sem contrato

**Onde dói:** `packages/ui/app/states/LongTimeoutWatch.tsx` (view do watch de execução após 2 min) — o botão de cancelar precisa comunicar quanto será estornado ao usuário.

**Causa raiz:** `ExecutionStatusView` (`packages/contracts/src/execution/view.ts:113-129`, o único contrato que `apps/web/src/routes/g.$id.tsx`/`detail-view.ts` têm sobre uma execução em andamento) não carrega nenhum campo de custo/crédito reservado (`reservedCredits` só existe em `BillingWallet`, nível de carteira agregada — `packages/contracts/src/billing.ts:69,83` — não por execução). Não há como saber, a partir dos dados que o host já consome, quantos créditos aquela execução específica reservou (o valor varia 1–20 conforme o texto).

**Decisão desta rodada:** copy honesta sem número fabricado — "Cancelar e estornar os créditos reservados" (antes: "estornar 2 créditos", literal herdado do mock). Nenhuma prop nova foi adicionada a `LongTimeoutWatch` (não haveria de onde o container buscar o valor).

**Falta:**
- Contrato: `ExecutionStatusView` (ou um campo específico de execuções em andamento) expor o custo/reserva em créditos daquela execução.
- Front (quando o campo existir): `LongTimeoutWatch` ganha uma prop `refundCredits: number`, threaded a partir de `ExecutionDetailContainer` (`apps/web/src/routes/g.$id.tsx`), voltando à copy com número real.

---

## GAP #12 (novo) — nenhuma transição de "reabrir um passo anterior" na calibração de voz

**Onde dói:** `apps/web/src/routes/calibrate.tsx` + `-wizard-overlay.tsx` — "Voltar" (`WritingStep.onBack`) e "Reescrever esta amostra" (na tela de resultado com baixa confiança) navegam o `displayStepId` local de volta pra um passo já enviado, pra revisão/reescrita. Antes deste fix, "Continuar" a partir dali reenviava esse `stepId` obsoleto via `submitAnswerMutation`/`skipStepMutation`, e o backend sempre rejeitava com 400 — silenciosamente, já que nenhuma das duas mutações tinha `onError`.

**Causa raiz:** `apps/backend/src/product/voice/voice-calibration-service.ts`:
- `assertSessionInProgress` (:124-135) rejeita qualquer mutação assim que `session.status` deixa de ser `"in_progress"` — e `completeReview` seta `session.status = "completed"` (:465), então nada na sessão pode ser mutado de novo depois da revisão, nunca mais.
- `setContext` (:280) só aceita definir contexto enquanto `currentStepId` é `"context_setup"` ou `"micro_opinion"`.
- `submitStep` (:330) e `skipStep` (:414) rejeitam qualquer `stepId` que não seja exatamente `session.currentStepId`.

Não existe, em nenhum lugar desse serviço, uma transição pra reabrir um passo que já ficou atrás de `currentStepId` — seja a sessão ainda `in_progress`, seja já `completed`.

**Mitigação do front (este fix):** os dois containers agora calculam `isPastStep(session, stepId)` (`calibrate-view.ts`) no branch de escrita do `buildWizardContent`. Quando verdadeiro, o passo renderiza somente-leitura (`WritingStep.readOnly`: textarea vira `readOnly`, link de pular some, ação principal vira "Voltar para onde parei") e o `onContinue` apenas chama `setDisplayStepId(session.currentStepId)` — resume de onde a sessão realmente está — em vez de reenviar. `submitAnswerMutation`/`skipStepMutation` também ganharam `onError` empurrando um toast honesto (via `useToastStore` de `packages/shared`) para falhas genuínas no passo atual real.

**Continua em aberto:** "Reescrever esta amostra" não tem contrapartida funcional no backend — depois de `completeReview` a sessão já está `"completed"` e nada reabre o passo mais fraco pra uma edição de verdade. Hoje essa ação só permite *ver* a amostra congelada, não salvar uma reescrita.

**Falta:**
- Backend: uma transição tipo `reopenStep(sessionId, stepId)` que volte `currentStepId` (enquanto ainda `in_progress`) ou descompletar a sessão e reabrir um passo (pós-completar).
- Front (quando a transição existir): trocar o `readOnly`/resume por uma edição real que reenvia através dessa nova transição.

---

## GAP #13 (novo) — ✅ RESOLVIDO (2026-07-18) — `VoiceMaterialBaseBreakdownSchema` só carrega contagens, nunca o texto das amostras

**Onde dói:** `packages/ui/app/voice/MaterialBaseSamples.tsx` renderiza tiles de contagem (total/ativos/excluídos/fixados) em vez das citações das amostras que o design pede — o mock/spec (`.scratch/implementacao-app-web/issues/10-breakdown-voz.md`: "material-base (4 amostras read-only + cobertura + próximo passo)") quer trechos citados de verdade (`samples: {q, meta}[]`), não só contagens agregadas.

**Causa raiz:** `packages/contracts/src/voice.ts` `VoiceMaterialBaseBreakdownSchema` (:169-177) só expõe `totalExamples`/`activeExamples`/`excludedExamples`/`pinnedExamples` + breakdowns por classificação/tipo de conteúdo/idioma — nunca o texto da amostra de calibração em si.

**Decisão desta rodada:** componente deixado como está (contagens) — nenhum dado de citação foi fabricado no front.

**Falta:**
- Contrato: adicionar um campo `samples: readonly { readonly q: string; readonly meta: string }[]` (ou equivalente) ao `VoiceMaterialBaseBreakdownSchema`, vindo dos `VoiceExample` reais que a sessão de calibração já criou.
- Front (quando o campo existir): `MaterialBaseSamples` passa a renderizar as citações reais em vez dos tiles de contagem.

---

## GAP #14 (novo) — pergunta de ambiguidade não tem como corrigir o `intent` no front

**Onde dói:** `apps/web/src/routes/generate.tsx` (~:78-83 no `previewInput`, ~:156 no `handleGenerate`) sempre envia o `intent` originalmente inferido (`prefill.intent`); a resposta da pergunta de ambiguidade (`generate-view.ts` `buildGuidedSteps`, step `kind: "ambiguity"`) é texto livre e cai em `keyPoints[]` via `buildBriefing` — nunca substitui/corrige o `intent` enviado.

**Causa raiz:** `GenerationIntentAmbiguitySchema` (`packages/contracts/src/generation-prefill.ts:14-18`) carrega `ambiguous: boolean` + `alternative?: GenerationIntent` — um candidato de enum existe, mas só serve pra montar o texto da pergunta ("Isso é mais sobre X ou sobre Y?"). Não existe contrato/endpoint que aceite de volta a resposta em linguagem natural do usuário e devolva/confirme qual dos dois intents é o certo — `resolveGenerationTarget` (`apps/backend/src/product/generation/resolve-generation-target.ts`) confia no `intent` recebido verbatim, sem reclassificação server-side a partir de texto.

Além disso, ADR 0004 (`docs/adr/0004-theme-first-generation-flow.md:21,61`) deixa explícito que o intent "não pode ser removido; por isso é inferido, não perguntado", e rejeita explicitamente uma UI de escolha/chips pro setup ("Perguntar o setup explicitamente / card de confirmação com chips: fricção desnecessária"). Trocar a pergunta de ambiguidade por dois botões selecionáveis no front — o único jeito de mapear a resposta pra um dos dois valores do enum sem reclassificação real — contrariaria essa decisão de design já tomada.

**Decisão desta rodada:** nenhuma heurística de parsing de texto livre foi criada no front pra adivinhar qual intent o usuário quis dizer (seria fabricar uma classificação sem base real). O comportamento foi mantido como estava: a resposta continua alimentando `keyPoints[]` como contexto pro pipeline; o `intent` enviado continua sendo o originalmente inferido. `ponytail:` no site da pergunta (`generate-view.ts`) aponta pra este GAP.

**Falta:**
- Contrato: um campo (ex.: em `MeExecutionRequest`) que carregue a resposta do usuário — ou já um intent escolhido — de volta pro backend, OU um endpoint que receba `{theme, answer}` e devolva um intent confirmado/corrigido.
- Front (quando o contrato existir): `packages/shared/src/stores/wizard-session.ts` ganha uma ação tipo `setIntentOverride(intent)`; `apps/web/src/routes/generate.tsx` passa a usar esse intent corrigido no preview e no `handleGenerate`.

---

## GAP #15 (novo) — sinal de "un-cancel" do webhook Stripe é descartado

**Onde dói:** um usuário que reativa a assinatura pelo próprio Stripe Customer Portal (desfaz o `cancel_at_period_end`) não vê o `status` local voltar de `"canceled"` para `"active"` — fica preso até a próxima fatura de renovação se auto-corrigir.

**Causa raiz:** `apps/backend/.../stripe-adapter.ts:135-139` só emite sinal quando `cancel_at_period_end === true` (comentário: "só a intenção de cancelar… produz sinal aqui"); o evento `customer.subscription.updated` com `cancel_at_period_end: false` (reativação via portal) é silenciosamente ignorado.

**Achado adjacente** ao investigar #6 (não é o que o #6 pedia). Independente e bem-escopado.

**Falta:**
- Backend: no parser do webhook Stripe, tratar `cancel_at_period_end: false` → emitir um sinal de resume/active que reconcilia o `status` local. Pequeno, sem migração.
