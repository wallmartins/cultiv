# Shell do Workspace e Rotas Secundárias (`/app`)

**Status:** accepted
**Complementa:** ADR 0003 (detalha o shell e as rotas secundárias do workspace descritas lá) · coerente com ADR 0004 (geração tema-first) e ADR 0001 (calibração como único ponto de entrada de voz)
**Supersede:** o "Active Execution Drawer" (Screen 6) e o desenho das telas de histórico/voz/config anteriores em `docs/frontend-application-flow.md`
**Trilha de decisão:** `.scratch/rotas-secundarias-app/` (mapa wayfinder + tickets 01–08 e seus assets: `prototype/shell-prototype.html`, `voice-profile-prototype.html`, `history-prototype.html`, `workspace-style-tile.html`, `research/billing-backend-surface.md`)

## Contexto

A ADR 0004 desenhou a **rota de geração** tema-first. Faltava levar as **rotas secundárias** do `/app` — shell, entrada/onboarding, perfil de voz, histórico, execução ativa e config — ao mesmo nível de profundidade, formando **uma aplicação coesa** em vez de telas isoladas. A referência visual do flow-doc estava podre (um gradiente ocre-a-terracota que nunca foi o sistema real) e o desenho pressupunha um "drawer de execução" pensado para um estilo de UI que não é mais o nosso.

Esta ADR oficializa o **shell ChatGPT-like** e as decisões de cada rota secundária, com a **coesão** como objetivo declarado em dois eixos: estrutural (shell/navegação) e visual (linguagem/tokens).

## Decisões

### 1. Linguagem visual: herdar + estender, não redesenhar (ticket 01)

O SSOT visual é **grafite + acid-chartreuse** com serifa editorial (`packages/ui/src/tokens.css` / `DESIGN.md`) — **não** o gradiente ocre-terracota do flow-doc (doc podre, a ser removido). O `/app` **herda a landing e estende** via uma camada `data-surface="workspace"`: a **serifa editorial carrega pra dentro** (Instrument Serif nos títulos), densidade e raios mais apertados, glow reservado a interação real, e **um token novo `--danger`** para os estados que a landing não tem (falha, recusa, exclusão). Ao aplicar essa camada, **aposentar** os valores superseded (moss/golden/Playfair) da issue 39. Style-tile: `prototype/workspace-style-tile.html`.

### 2. Shell + navegação ChatGPT-like (ticket 02)

Três colunas:
- **Rail esquerdo** persistente (off-canvas no mobile): marca · **＋ Nova geração** (acento) · **Histórico como navegação primária** · rodapé com o chip **"Sua voz"** (anel de confiança, alterna o widget direito) + **avatar** → menu (perfil de voz · planos & billing · config · sair).
- **Centro** rolável (coluna ≤760px) que **dobra** como tela de nova geração (ADR 0004) e como **detalhe de geração** carregado do histórico.
- **Widget de voz** colapsável à direita (~340px) — o **companion** compacto de comparação voz↔texto, alternado pelo chip "Sua voz".

Consequência: **não há rota `/history` separada** — o histórico é o rail e o detalhe carrega no centro; o **perfil de voz ganha duas superfícies** (companion + rota `/voice`); o **drawer fica redundante** (ver §5).

### 3. Fluxo de entrada onboarding-first (ticket 04)

**Wizard primeiro, app depois.** Signup (Auth0) → **Wizard de Calibração em tela cheia** (materializa a ADR 0001) → passo 1 traz um **aviso leve** de consentimento → 4 amostras de escrita → **tela de revisão** que **absorve os poucos segundos do Voice Profile Rebuild** (é rápido) e apresenta ali o perfil derivado (confiança, "como pensa", traços) junto da **autorização formal de consentimento**. **Confirmar = grava o perfil + destrava a geração** (a janela "voz construindo" colapsa dentro deste passo; não é estado do shell). Em seguida: **tela-ponte de boas-vindas** com o **companion de voz já aberto** + **tour leve e pulável** → cai no "chega e escreve" (ADR 0004).

**Escape "Calibrar depois":** leva a um **workspace travado** — o centro mostra **conteúdo de demonstração marcado "exemplo"** + um CTA persistente "Calibrar minha voz"; ＋Nova geração e Histórico ficam inertes. Reentrar no wizard daqui usa uma **versão mais leve, integrada ao layout do workspace** (mesmos 5 passos, chrome diferente).

**Gates duros:** perfil de voz (via calibração) **e** consentimento de treino. Recusar o consentimento = sem análise dos textos = sem perfil = sem produto.

### 4. Perfil de voz: duas superfícies, sem jargão, revisão de traços (ticket 05)

A rota `/voice` lê o `VoiceProfileScreenView` **traduzido pra linguagem humana** — nunca os nomes internos das signatures. As duas proses são o herói: `core.narrativeProse` → **"Como eu penso"**, `development.developmentProse` → **"Como eu desenvolvo um texto"**; os enums (certainty, epistemic posture, opening/closing mode, move labels) viram **chips em português comum**.

- **Interação central: revisão de traços.** Os 7 `TRAIT_KEYS` viram uma lista com **Confere / Nem tanto** por traço (`voice.recordTraitConfirmation` → `confirmed`/`disputed`/skip), com badge **Inferido → Confirmado → Contestado** e a confiança. É o gesto que afina a voz.
- **Consentimento mora aqui** (grant/revoke, com estado `--danger` avisando que apaga o perfil e desliga a geração). É o **SSOT do consentimento na UI**; config apenas espelha o estado e faz deep-link.
- **Material-base** = os 4 prompts da calibração (read-only — novos exemplos só recalibrando, ADR 0001) + cobertura por formato + próximo passo (`nextActionCodes` traduzido). **Recalibrar** reabre o wizard leve (§3).
- **Companion = subconjunto estrito da rota** (mesma fonte): confiança + as duas proses + traços, read-only, levando à rota via "Ver perfil completo →". Uma fonte, duas superfícies.

Asset: `prototype/voice-profile-prototype.html`.

### 5. Histórico é o rail; detalhe no centro (ticket 06)

O **histórico É a navegação primária** (rail), sem rota `/history` separada; o **detalhe carrega no centro**, o mesmo lugar da nova geração. Item = **tema** (`briefingTopic`) + tempo relativo + dot de status + selo de formato; rail **agrupado por tempo** (Hoje / Ontem / 7 dias / Este mês).

- **Sem filtro por "intent"** — coerência com a ADR 0004 (o usuário nunca vê essa palavra). Filtros expostos: **busca por tema · período (`7d/30d/90d/all`) · status · formato**. O `intent` fica só como sinal interno.
- **Formato progressivo** (para gerações sem canal): o selo é `[tamanho][· canal?]` — o `lengthTier` sempre resolve (tem default do intent), o `channel` é o único input explícito opcional (ADR 0004) e só aparece se escolhido; sem canal, "Texto livre". **A identidade do item é sempre o tema, nunca o formato.**
- **Leitura do resultado:** o texto gerado (`JobResult.content`) é o herói; faixa **"Alinhamento de voz" colapsável (inicia fechada)** com os `appliedSignals` (traços aplicados · regras respeitadas · anti-padrões evitados) → liga ao companion (§4); **reaction** 👍/👎 + motivo; metadados incluem **selo de fallback** quando `usedFallbackVoiceProfile`.

Asset: `prototype/history-prototype.html`.

### 6. Drawer descartado; execução paralela; notificação de conclusão (ticket 07)

O **Active Execution Drawer (Screen 6) é removido**. Progresso e leitura já vivem no rail (item "live" com barra) + centro (leitura focada), com **SSE por job** (`GET /me/executions/:executionId/events`) como fonte.

- **Concorrência paralela** (confirmado no código — `runtime/execution-queue.ts` roda BullMQ Worker `concurrency ?? 2`, sem lock de "uma ativa por usuário"): várias gerações coexistem; até ~2 processam por vez, o excedente fica `queued`. Cada uma debita créditos.
- **Descoberta de conclusão quando o usuário está longe = B+C:** **toast ambiente** no instante da conclusão (clicável, em qualquer rota) **+** **marcador persistente de "não lido"** no item do rail (sobrevive a reload, limpa ao abrir).
- **Fora da aba:** **Web Notifications API** entra no v1 (client-side, barato). **Web Push real** (entrega com a aba fechada — service worker + VAPID + subscriptions no backend) fica **adiado**.

### 7. Config enxuta + escada destrutiva LGPD (ticket 08)

A rota de config (alcançada pelo menu do avatar) tem 4 seções:
- **Conta:** identidade read-only (Auth0) · logout · **excluir conta**.
- **Preferências:** idioma da interface (pt-BR/en) — config é o dono; **tema (claro/escuro) NÃO é setting** (fica só no toggle da topbar); **notificações de conclusão** (toggle + permissão do browser, §6).
- **Privacidade & dados:** consentimento de treino → **deep-link `/voice`** (SSOT no §4), espelhando o estado atual; **exportar** e **resetar** por LGPD.
- **Plano:** resumo mínimo (plano + saldo) → **deep-link pro billing** (ADR de Billing).

**Escada de gestos destrutivos** (distintos, cada um bem explicado, escopo crescente):
1. **Revogar consentimento** (na `/voice`) — apaga só o perfil de voz; histórico e conta ficam.
2. **Resetar conta** (config) — apaga perfil de voz + exemplos + histórico, **mantém a conta/login** → volta ao estado recém-criado, caindo de novo no onboarding (§3).
3. **Excluir conta** (config) — terminal: remove tudo + o login.

**Exportar meus dados** — ação não-destrutiva (portabilidade LGPD): download único com perfil de voz + exemplos + histórico + dados de conta.

### 8. Contratos a especificar (não implementados hoje)

Estas rotas/contratos **não existem** e precisam ser criados na implementação (só a especificação é escopo aqui):
- **Histórico:** busca textual por tema no `ExecutionsListQuery`; `executions.submitReaction` / `ExecutionReactionView`.
- **Config/LGPD:** endpoints de **exportar dados**, **resetar conta** e **excluir conta**.

## Alternativas consideradas e rejeitadas

- **Redesenhar a linguagem visual do zero / manter o gradiente ocre-terracota:** o gradiente era doc podre; o sistema grafite+acid já existe e é o SSOT. Herdar + estender vence (ticket 01).
- **App primeiro, geração travada até calibrar (em vez de wizard-first):** perde a força do onboarding-first, em que a calibração determina o funcionamento do app. Reconciliado como wizard-first **com** escape "Calibrar depois" para um workspace travado (ticket 04).
- **Esperar o rebuild numa tela "preparando sua voz" após o wizard:** desnecessário — o rebuild é rápido e a espera colapsa dentro do passo de revisão (ticket 04).
- **Expor o filtro de "intent" no histórico:** contradiz a ADR 0004 (intent invisível). Liderar por tema (ticket 06).
- **Manter o Active Execution Drawer:** redundante no shell ChatGPT-like — rail + centro já cobrem progresso e leitura, e a fila async cobre o paralelismo que justificava o drawer (ticket 07).
- **Uma geração por vez (serial):** o backend async/filas suporta paralelo sem esforço extra; serial limitaria o "mando vários e volto depois" sem ganho (ticket 07).
- **Consentimento gerido em config (em vez de `/voice`):** o consentimento é semanticamente sobre a voz; a `/voice` é a casa, config só espelha e linka (tickets 05/08).
- **"Excluir meus dados" e "excluir conta" como um só gesto:** colapsar perderia o "reset sem perder o login"; mantidos distintos, com "resetar conta" como nome mais intuitivo (ticket 08).
- **Web Push real no v1:** custo alto (service worker + VAPID + backend) para o ganho; Notifications API cobre o caso comum agora (ticket 07).

## Consequências

- **Coesão em dois eixos** garantida por um único shell (estrutural) e uma única camada de tokens (visual) — o objetivo declarado do esforço.
- **Screen 6 (drawer) removida** do flow-doc; Navigation Flow, Screens 2–5 e Execution Watch reescritas para o modelo rail+centro (ver `docs/frontend-application-flow.md`).
- **Coerência com ADR 0004** (o histórico e o "Ajustar" respeitam o intent invisível), **ADR 0001** (calibração é o único ponto de entrada; resetar/recalibrar sempre voltam ao wizard) e **ADR 0003** (stack e contratos reusados; `voice.*`, `executions.*`, `billing.getEntitlement` intocados).
- **Novos contratos a implementar** (§8) — especificados, não construídos aqui. O eixo de billing (planos/checkout/gestão) fica para o **ADR de Billing/Plans** (mapa, tickets 09/10/12).
- **Protótipos são descartáveis** — as variantes validadas entram reescritas de verdade na implementação do `/app`; ficam linkados como assets, não colados.

---

## Emendada pela ADR 0010 — Practice Profile (2026-07-21)

Ver `docs/adr/0010-practice-profile.md` → Consequências. Esta ADR continua válida; a 0010 emenda pontos específicos (calibração gerada do Practice Profile / intent muda de momento e representação / `/voice` vira identidade de escrita, conforme o caso). Consulte a 0010 antes de tratar esta como intocada.
