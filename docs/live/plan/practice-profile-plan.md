# Plano `/implement` — Practice Profile

Companheiro da **ADR 0010**. Task set ordenado, backend + web, pré-lançamento (greenfield, sem migração). O **norte** (`.scratch/adaptacao-por-dominio/norte/`) é insumo citado, não reescrito.

> **Caminho crítico (2 pré-requisitos que tudo depende):**
> 1. **Nova forma do briefing** (F0-3) — sem ela, a adaptação de perguntas é cosmética.
> 2. **Re-chavear o compositor `planGeneration` de intent→gênero×tamanho×canal** (F1-2) — a cirurgia 07+13, uma passada só.
>
> **Estado (2026-07-22):** Fases 0–3 entregues (f63a922 · ec4b9f4 · 003ec1b+5d8ad53 · 4348e0f) e auditadas em profundidade. **A Fase 3.5 (consolidação da auditoria) BLOQUEIA a Fase 4** — quem for implementar a Fase 4 começa por ela. Toda fase passa a fechar pelo **Portão de revisão por fase** (seção no fim) antes do commit final.

---

## Fase 0 — Contratos & schema

- **F0-1 · Schema do Practice Profile.** Dupla de tabelas irmã single-row-por-usuário: `practice_profiles` (3 eixos + 7 dimensões, `depth: seed|enriched`) + `practice_profile_diagnostics` (sugestões de enriquecimento aceitas/rejeitadas, padrão `voice_profile_diagnostics.traitConfirmations` / `trait-confirmation.ts:14-51`). Upsert em `user_id`, rebuild substitui inteiro. Perfil chega como **valor** no `GenerationContext` (governança `voice-profile-centralization` — sem import de `database` em `text-quality`). Schema das 7 dimensões: ver norte `backbone-curado.md`.
- **F0-2 · `WizardContextSchema`** (`packages/contracts/src/voice-calibration.ts:5-9`): gate muda de `domain && audience` para `assunto && lugarDeFala && público≥1` (`Step1Context.tsx:29`); **remover `selfDeclaredStrength`**. Público = texto livre, múltiplas entradas.
- **F0-3 · Nova forma do briefing** ⚠️ CAMINHO CRÍTICO. `buildBriefing()` (`generate-view.ts:106-132`) para de colapsar em `keyPoints[]` sem rótulo; passa a `{ topic, audience, payload, anchor, resistance, stake }`. `getBriefingText()` (`skill-inputs.ts:24-52`) serializa os campos rotulados.
- **F0-4 · `EpistemicPostureSchema` 3→7+`not_applicable`** (`reasoning.ts:57-61`): `exploratory·investigative·advocacy·expository·instructive·experiential·promotional·not_applicable`; `advocacy_mixed`→`advocacy`. Tocar `contracts/voice.ts:121`, `domain/voice.ts:145`, o prompt de extração (`argument-development-extraction.ts:142,209,226`) e o fallback (`voice-signature-brief-fallback.ts:232,252`). Modo retórico (dominante+secundário) entra no contrato de gênero. Ver norte `genero-dimensoes.md`.
- **F0-5 · `ExecutionsListQuerySchema`** (`list-query.ts:12-21`): remover `intent` + `contentType` (dormentes) de `normalizeExecutionsListFilters`, `matchesExecutionsListFilters:89`, `ExecutionsListFilterItem.generationIntent`. `lengthTier` fica. **Persistir `modo` (dominante) no `data` da execução** no lugar de `generationIntent`.
- **F0-6 · `BackendGenerationPrefillRequest`** muda de forma (`generation-prefill-types.ts:5-9`) — o prefill instancia 4 slots em vez de classificar intent.

## Fase 1 — A cirurgia 07+13 (uma passada, não duas)

- **F1-1 · Remover andaime morto** (compositor já é o caminho vivo, prod): ramo legado `resolve-generation-target.ts:113-133`, `PipelineTypeSchema` (`job.ts:11-22`), `CONTENT_TYPE_PRESETS`, `legacyContentTypeId`, e os 7 pontos do intent (`INTENT_ANGLE`, `PHASE1_LEGACY_INTENT_MAP`, `RHETORICAL_PROFILES`, `defaultPresetByIntentTier`, `INTENT_LENS_PRIORITY`, filtro Postgres `data->>'generationIntent'`, `MeExecutionRequestSchema.intent`).
- **F1-2 · Re-chavear `planGeneration`** ⚠️ CAMINHO CRÍTICO: de `intent × scope × qualityMode` para **gênero × tamanho × canal**. Os controles de modo (`argument-lenses.ts`, `expression-instructions.ts`) já são tabelas — re-chavear a chave.
- **F1-3 · Deletar código morto da calibração** (05): `THEMES_BY_DOMAIN`, `themePool`, `pickThemeFromPool`, `rotationIndex`, `step.label`, `capturesFeatures`, ~~`argument_development.defaultTheme`~~ *(correção da auditoria 2026-07-22: NÃO era morto — é o fallback vivo das âncoras G3 em `voice-calibration-context.ts:26`; fica)*.

## Fase 2 — O gerador (cita o norte, não reescreve)

- **F2-1 · As 5 superfícies generativas** (norte `gerador-spec.md`): G1 semente síncrona (especificidade paramétrica) · G2 enriquecimento assíncrono (grounding web) · G3 âncora de calibração · G4 slots de geração · G5 pergunta HITL de nicho. As 6 leis (não-inventar-fatos, JSON puro, ancorar em especificidades, degradar, cadeia de providers).
- **F2-2 · Cadeia Gemini→Groq = CONFIG, não infra nova**: `preferredAttempts`/`fallbackAttempts` no `catalog.json` para os passos generativos novos (já existe em `voice-rebuild-pipeline.ts`).
- **F2-3 · Gate de discriminabilidade** (aparato novo justificado — `text-quality` julga texto, não perguntas/perfis): T1–T4 do norte `criterio-de-aceite.md`.

## Fase 3 — Onboarding

- **F3-1 · Derivação síncrona do perfil-semente** entre tela 1 e 2 — **nova chamada de LLM síncrona no funil** (hoje não há nenhuma). Latência/timeout/degradado.
- **F3-2 · Piso do onboarding = bloquear+retentar SEM escape genérico** (custo assimétrico; NÃO é o piso "nunca bloqueia" da ADR 0004, que é da geração): auto-retry 2× invisível → falha visível + botão de retry, **sem "continuar assim mesmo"** (decisão 2026-07-22, fiel à ADR 0010 §5 e ao norte `gerador-spec.md` §G1 — só a semente G1 bloqueia, nunca âncora agnóstica; amostra genérica envenena o perfil permanentemente). Cadeia Gemini→Groq por baixo (o status de falha é HTTP 500, não 503, pra não compor com o retry de mutação do client-sdk).
- **F3-3 · Locale na assinatura** (`buildStepPrompt`/`resolveTheme`, `voice-calibration-candidates.ts:28`): o prompt gerado nasce no idioma pedido; hoje só pt-BR.
- **F3-4 · Trocar a ponta do seam existente:** `setContext()`→`refreshSessionStepPrompts()`→`buildStepPrompt()` (`voice-calibration-service.ts:290-292`) já reescreve as telas 2–5 — trocar `resolveTheme`/`THEMES_BY_DOMAIN` pela âncora gerada (G3).
- **F3-5 · Enriquecimento no rebuild de `completeReview`**, pós-consentimento, uma vez, só-acrescenta (`voice-rebuild-pipeline.ts`). G2 + a rede G5 (grounding fino → pergunta no `/voice`).

## Fase 3.5 — Consolidação da auditoria ⚠️ BLOQUEIA A FASE 4

> Origem: auditoria completa das Fases 0–3 (2026-07-22; 5 agentes de revisão + verificação manual dos graves — todos os achados abaixo confirmados no código, com `file:line`). **Nenhum item da Fase 4 começa antes de C-1..C-4 fecharem.** C-5..C-12 fecham junto, ou a exceção é justificada por escrito aqui. Os quatro primeiros tocam o coração do valor do produto: o aparato anti-clichê ("clichê é existencial", ADR 0010 §3) e o ciclo de vida do perfil (§4).

### Defeitos confirmados (ordem de ataque)

- **C-1 · Guarda de idempotência do perfil-semente.** `setContext` deriva G1 e faz `put()` incondicional (`voice-calibration-service.ts:329-344`, upsert puro em `user_id`, sem guarda de depth/versão) — re-rodar o wizard (`maxWizards=10` em criador/pro) regride um perfil `enriched` para semente v1, descartando o enriquecimento G2 e violando o só-acrescenta (ADR 0010 §4). Regra proposta: eixos declarados **idênticos** ⇒ reusa o perfil existente sem re-derivar; eixos **mudados** ⇒ re-seed legítimo (recalibração = novo ciclo de vida, ADR §4). Teste dos dois ramos + do cenário de re-run.
- **C-2 · Gate de clichê por dimensão + retry sem furo.** `detectClicheLeak` só dispara quando TODAS as dimensões carecem de específico (`.every`, `practice-profile-anti-patterns.ts:88`) — 4 de 5 genéricas passam — e o check é pulado na re-tentativa (`retry === 0 &&`, `practice-profile-generation-core.ts:132`), então uma semente ainda-genérica shippa. Passar a detecção per-dimensão (espelhando o `fieldSpecificityReport` do T2) e re-checar no retry: 2ª saída ainda genérica ⇒ conta como falha da tentativa → próximo provider da cadeia; cadeia esgotada ⇒ G1 bloqueia (piso do onboarding), G3/G4 degradam. Cobrir com testes de genericidade **parcial** (hoje inexistentes — os testes atuais só exercitam payloads 100% genéricos).
- **C-3 · Detector de específico-nomeado: mixed-case + gêmeos unificados.** `/^[A-ZÀ-Ý][a-zà-ÿ]+$/` rejeita PostgreSQL/TypeScript/iOS/npm como nome próprio (`practice-profile-anti-patterns.ts:55` + gêmeo `discriminability.ts` no text-quality) — retries falso-positivos e disparos falsos de G5 justamente no domínio-vitrine. As listas de filler dos gêmeos **já divergiram** ("pensar" vs "pense fora da caixa"). Reconhecer mixed-case/camelCase, unificar detector + listas (fonte única onde a governança permitir; senão, teste de paridade) e cobrir edge-cases (marcas, acentos pt-BR).
- **C-4 · Scripts quebrados pela purga F1 + ponto cego do typecheck.** `apps/backend/scripts/analyze-calibration-option-b.ts` (value-import de `resolvePhase1LegacyContentTypeId`, deletado — `billing:analyze-option-b` crasharia na carga) e `scripts/step-planner/briefing-variants.ts` (`GenerationIntent`). Consertar ou deletar os dois, e incluir `apps/backend/scripts/` num gate de typecheck (o `include` dos tsconfigs não os cobre — "lint verde" era ponto cego).

### Divergências e decisões

- **C-5 · `MODE_ANGLE["promote"]` re-derivado do norte.** O texto atual é herança verbatim do intent `update-subscribers` (framing de changelog); o norte define promover como "persuade com interesse material" (`genero-dimensoes.md`). Reescrever a partir da definição do modo. Na mesma passada: decidir o destino do conteúdo de `engage-audience` (fundir num modo ou descartar, por escrito).
- **C-6 · DECISÃO — lentes de argumento.** F1 **deletou** `INTENT_LENS_PRIORITY` sem substituta (o commit dizia "re-key"); hoje a seleção de lentes é só regex de briefing + voz. Decidir: (a) manter e registrar como corte deliberado, ou (b) re-adicionar como `MODE_LENS_PRIORITY` keyed por `RhetoricalMode` (tabela declarativa, default seguro).
- **C-7 · Teto de latência no `setContext`.** Pior caso ~240s (G1: 3 tentativas × 2 retries × 20s; G3 esgota a própria cadeia antes do `orElseSucceed`) vs. "rápida, cabe na rota crítica" (norte G1). Timeout agregado externo (~60s) sobre G1+G3; estouro ⇒ mesmo caminho do hard-block F3-2 (500 + retry visível).
- **C-8 · Localizar os erros da tela sem escape.** `describeCalibrationError` (`calibrate-view.ts:101-109`) prefere a mensagem técnica crua do backend ("no provider attempts configured") — inglês, na única tela em que o usuário não tem saída. Mapear para i18n; a mensagem técnica vai para o log. (Mesma classe do defeito conhecido de word-count — aquele segue no mapa de defeitos.)
- **C-9 · Higiene de menores.** `ponytail: F1-4` → F0-1 (`contracts/practice-profile.ts:31`; F1-4 não existe); CONTEXT.md "Presupposition" ↔ código `readerAssumption` (alinhar um dos dois — regra "use os termos exatos"); deletar `step.label` (morto, sem leitor); deletar `ExecutionsListFilterItem.contentType` (morto, F0-5 não varreu); corrigir o comentário do `clicheProbe` que sobre-promete sincronia com `findThinDimensions`; combining-marks literais → escapes explícitos no regex de normalização.
- **C-10 · Dedup do scaffolding de prompt.** ~40% do system-prompt é verbatim-idêntico entre G1/G2, G3 e G4 → extrair `buildSystemPromptScaffold` no core (o autor já extraiu `formatDeclaredAxes`/`PRACTICE_DIMENSIONS_GUIDE` — completar a passada). O sufixo de retry promete "sinal G5" que só o schema do G2 carrega → variante por superfície.
- **C-11 · Testes faltantes sem ticket próprio.** "G1 sucede + G3 falha ⇒ âncoras agnósticas em `session.anchorsByStepId`" (o `orElseSucceed` não tem teste direto); integração Postgres dos repos practice-profile na suíte gated (`test:postgres`).
- **C-12 · Processo.** Push do branch + CI verde (os 6 commits nunca rodaram CI — toda verificação foi local); investigar o `pnpm lint` flaky no runner paralelo do pnpm (erro fantasma "eslint not found"; serializado passa limpo).

### Emendas de plano já aplicadas pela auditoria
- F1-3 corrigido acima (`defaultTheme` não era morto).
- **F4-7 adicionado à Fase 4** (produtor de gênero) — 6 marcadores `ponytail: F4` apontavam para ticket inexistente.
- Deferral do grounding G2 registrado (seção "Deferrals de plataforma").

### Resolução da Fase 3.5 (2026-07-22)

- **C-1 ✅** Guarda em `deriveCalibrationAnchors`: eixos idênticos (fold case + ordem de públicos — mudança cosmética não é ciclo de vida novo) ⇒ reusa o perfil armazenado (enriched nunca regride) e gera G3 a partir dele; eixos mudados ⇒ re-seed com `version = anterior + 1`. Testes dos dois ramos + re-run.
- **C-2 ✅** `assessClicheLeak` per-dimensão ({fillerHit, thin}); leak em QUALQUER dimensão dispara retry; retry ainda genérico ⇒ falha da tentativa → próximo provider. **Exceção de projeto:** G2 aceita saída *thin* (sem filler) após o retry — dimensão magra honesta É o gatilho do G5; reprovar thinness no G2 tornaria o niche-ask inalcançável. `fieldSpecifics` é sondado como unidade (fragmentos curtos ancoram coletivamente). Testes de genericidade parcial adicionados.
- **C-3 ✅** Fonte única: detector + lista de filler vivem em `text-quality/discriminability` (`namesSpecific`/`containsGenericCliche` exportados); backend importa (sem gêmeo, sem teste de paridade). Reconhece mixed-case/internal-capital (PostgreSQL, TypeScript, iOS, eBay), all-caps (AWS) e marcas com ponto (Fly.io, Node.js); listas de filler fundidas (união). **Limite conhecido:** marcas 100%-minúsculas (npm) seguem invisíveis ao proxy determinístico — sem blocklist por design (generalização à cauda longa); dígitos/aspas ainda capturam.
- **C-4 ✅ (escopo maior que o auditado)** O gate de typecheck (`tsconfig.scripts.json` + lint encadeado) revelou **5** scripts quebrados, não 2: `analyze-calibration-option-b` **deletado** (análise inteira era intent×pipeline-legado, ambos mortos; decisão de pricing já tomada na ADR 0009); `compositor-parity-harness` **deletado** (comparava com o caminho legado removido na F1 — propósito cumprido); `briefing-variants` re-chaveado por `briefingKey`; `run-calibration-sweep` re-chaveado modo×tier (`BRIEFING_KEY_BY_MODE`); `step-planner-smoke-harness` + erro latente em `live-generation-api` consertados. Scripts `billing:analyze-option-b`/`compositor:parity` removidos dos package.json.
- **C-5 ✅** `MODE_ANGLE["promote"]` reescrito da definição do norte (persuasão com interesse material declarado, evidência não hype, um próximo passo claro). **Destino do conteúdo de `engage-audience` (por escrito): descartado como ângulo de modo** — "convidar reação" é mecânica de canal (já vive em `CHANNEL_FORMAT_BASE.social`), não modo retórico; sua prioridade de lente (psychological) foi absorvida na linha do promote (C-6).
- **C-6 ✅ decisão (b)** `MODE_LENS_PRIORITY` keyed por `RhetoricalMode` (tabela declarativa, default seguro = cai em briefing+ordem padrão): expound/argue herdam suas linhas de intent; promote re-derivado do modo (psychological + financial). Fio novo: `plan.parameters.rhetoricalMode` → inputs do pipeline → `buildStepVoiceContext` → lentes. Testes.
- **C-7 ✅** `Effect.timeoutFail` de 60s agregado sobre a derivação no `setContext`; estouro = mesmo caminho do hard-block (500 + retry visível, sessão intocada). Teste com TestClock.
- **C-8 ✅** `describeCalibrationError` não repassa mais a mensagem técnica (vai pro console): mapeia word-count → `errors.tooShort(n)` e code `service_unavailable`/500 → `errors.derivationFailed` (pt+en). `ponytail:` o match por string do word-count é interino — raiz (código estruturado no backend) segue no mapa de defeitos.
- **C-9 ✅** `ponytail: F1-4`→`F0-1` (contracts + bridge); CONTEXT.md "Presupposition"→"Reader Assumption"; `step.label` deletado (6 entradas, sem leitor); `ExecutionsListFilterItem.contentType` deletado (+3 escritores); comentário do `clicheProbe` corrigido; combining-marks resolvido pela unificação C-3 (o normalize do backend morreu).
- **C-10 ✅** `buildSystemPromptScaffold` no core (role + locale + nota opcional; linha de ancoragem unificada); sufixo de retry ganha escape por superfície via `retryEscape` — só o G2 promete o sinal G5.
- **C-11 ✅** Teste direto do `orElseSucceed` (G1 ok + G3 falha ⇒ âncoras agnósticas via `getStepPrompt`); `postgres-practice-profile-repository.test.ts` na suíte gated (17/17 verdes contra Postgres real). De brinde: a migração `0024-practice-profile` faltava no `postgres-test-helpers` — adicionada.
- **C-12 ✅ (diagnóstico) / push pendente** O "pnpm lint flaky" **não é do pnpm**: é o subcomando `lint` do **rtk 0.43.0**, que assume eslint (`pnpm -r exec eslint`), imprime o fantasma "Command eslint not found" **e retorna exit 0** (mascara falha real). O hook às vezes reescreve `pnpm lint`→`rtk lint`. Mitigação: usar `pnpm -r --if-present lint` ou `rtk proxy pnpm lint`; CI roda pnpm cru, não é afetado. Push do branch + CI: executado no fechamento desta fase.

### Portão de revisão da Fase 3.5 (2026-07-22, revisores em Opus, implementação em Fable)

4 revisores (3 fatias + 1 transversal), read-only, contra `4348e0f..3db5c61`. **Vereditos: 11 de 12 itens FAITHFUL; C-3 PARTIAL → consertado → FAITHFUL.** Gates re-rodados pelos revisores: smoke 3/3 · guardrails 2/2 · voice-profile-centralization 7/7 · lint dos 18 pacotes limpo · suíte segura 394/394 · Postgres gated 17/17 (verificado independentemente por 2 revisores). Scripts re-chaveados do C-4 executados de verdade (build real + sweep dry-run 15/15 células + smoke harness 5/5 cenários).

Achados e destino:
- **MAJOR (confirmado por 2 revisores independentes): ênfase em ALL-CAPS lida como específico.** O regex novo do C-3 aceitava qualquer palavra 100%-maiúscula mid-sentence ("MUITO", "ENORME") como nome — furava o invariante 3 da ADR ("a média é o clichê") sem retry. **Consertado antes do commit final:** all-caps só conta em forma de acrônimo (2–4 chars: AWS, LGPD); mais longo é ênfase ⇒ genérico. Falso negativo (HTTPS) custa 1 retry barato; falso positivo envenenaria perfil. Testes de regressão dos dois lados.
- **MINOR consertados junto:** dedup de audiências no `sameDeclaredAxes` (duplicata cosmética não é ciclo de vida novo); dica morta `billing:analyze-option-b` removida do sweep; `detectClicheLeak` órfão deletado (produção usa `assessClicheLeak`); deriva pré-existente CONTEXT.md "expose"→"expound" (mesma classe do C-9).
- **Test-gaps fechados:** fronteira da exceção do G2 pinada (filler no retry falha mesmo com `acceptThinAfterRetry`); genericidade parcial coberta também em G3 e G4 (antes só G1).
- **INFO registrados, não-bloqueantes:** estado parcial put-então-timeout é self-healing pelo reuse do próprio C-1; corrida de `setContext` concorrente (dupla aba) é pré-existente e sem lock — se virar defeito observável, é ticket do mapa de defeitos; diagnostics stale pós-re-seed é dormente (nada consome `pendingNicheAskDimensions` até F5-3).

## Fase 4 — Geração

- **F4-1 · Popular `briefing.audience`** (soquete já ligado — `skill-inputs.ts:44`, `skill-templates.ts:98`; só popular via passo ① de estreitamento).
- **F4-2 · Estreitamento de público** por chips, passo **antes** das perguntas; amortecedores (auto-pular com público único; denominador comum sem estreitar). "+adicionar público" = efêmero pra aquela geração.
- **F4-3 · Prefill troca de trabalho:** instanciar os 4 slots (carga·ancoragem·resistência·stake do leitor) em vez de classificar intent.
- **F4-4 · Alavancas de público** via prompt: densidade de jargão + se explicado (vocabulário da dimensão Léxico; o público modula quanto), pressuposição, rampa, encerramento.
- **F4-5 · Limpar resíduos de prompt:** `skill-templates.ts:261` (linha tech-first morta) → substituir pela modulação positiva de jargão-por-público; `skill-templates.ts:98` → escopar a comprehensibilidade, não estilo.
- **F4-6 · Vocabulário de chips de canal** (`generate-view.ts:144-154`): tirar os 7 nomes de plataforma → escolher por bucket funcional. Web only, não contrato.
- **F4-7 · Produtor de gênero** ⚠️ era buraco de plano (auditoria 2026-07-22: 6 marcadores `ponytail: F4` sem ticket correspondente): inferir `RhetoricalMode` (dominante+secundário) + `GenreSignature` das **respostas** dos 4 slots, no **fim** das perguntas, por **substância nunca por léxico** (norte `genero-dimensoes.md`; ADR 0010 §10). Substitui o default `"expound"` (`resolve-generation-target.ts:15-17`, `generation-prefill.ts:189`, `reasoning.ts:69-71`, web `generate.tsx`/`generate-view.ts`).

### Resolução da Fase 4 (2026-07-22)

Implementada em Opus (eu + 2 agentes de fan-out que herdaram Opus), arquivos disjuntos: **eu** (fundação + backend de geração), **agente prompt** (F4-4/F4-5), **agente web** (F4-1/F4-2/F4-6 + threading do F4-7). Duas decisões do usuário (grilling antes de codar): **(1) produtor de gênero = endpoint dedicado** `POST /me/genre-inference` disparado no fim das perguntas e propagado ao preview+generate (o preço chaveia no `planSignature` que embute o modo, então preview e generate têm de concordar — inferir só no generate quebraria o `quoteId`). **(2) morte do classificador de domínio = só o lado do PROMPT** nesta fase; o classificador `technical/non-technical/mixed` + `lexical-release-gate` + critic + `voice-hints.filterLexiconForDomain` ficam para a **Fase 6** ("régua neutra", F6-1).

- **F4-1 ✅** O soquete `briefing.audience` (já ligado) é populado pela escolha de estreitamento: web passa a `narrowedAudience` ao `buildBriefing` (4º arg) e ao `GenerationPrefillRequest.audience`.
- **F4-2 ✅** Rota de leitura NOVA `GET /me/practice-profile` (`MePracticeProfileResponse`, só os eixos declarados, nunca as 7 dimensões) — não havia superfície expondo `audiences[]` à web. Passo de chips **antes** do prefill (o prefill escreve os slots por público estreitado). Amortecedores: auto-pular 0/1 público, estreitar 2+, denominador comum ao recusar, "+adicionar" efêmero (nunca persiste no perfil).
- **F4-3 ✅** `resolveSlotQuestions` no prefill: carrega o perfil (`getByUser`), gera os 4 slots G4 (`generateGenerationSlots`, perfil×tema×público) e degrada pro backbone genérico (`backboneGenerationSlots`) em TODO caminho faltante. Dedup: a cópia duplicada do backbone no prefill foi deletada (fonte única no módulo de slots). Mapa `SLOT_TO_ANGLE` preserva o vocabulário de ângulos que o `buildBriefing` da web já dobra. As duas chamadas LLM do passo "analyzing" (tamanho/extras + G4) rodam em paralelo (`Effect.all`).
- **F4-4 ✅** `audience-modulation.ts`: bloco com as 4 alavancas (densidade de jargão + se explicado, pressuposição, rampa, encerramento), **acessibilidade só, nunca a voz** (invariante 1, explícito no prompt); público ausente → instrução neutra, nunca gate tech.
- **F4-5 ✅** Linha tech-first morta (`skill-templates.ts` output-rules) → modulação positiva por público; linha de topic/audience re-escopada pra comprehensibilidade (voz é dona do estilo). `prompt-domain-policy.ts` **deletado** (era prompt-only, consumidor único). `GenerationDomain`/classifier intactos (Fase 6).
- **F4-6 ✅** `platformOptions` da web: 7 nomes de plataforma → 4 buckets funcionais (`professional-network/social/blog/email`); preselect do `detectedPlatform` preservado via mapa plataforma→bucket. Web only, contrato intocado.
- **F4-7 ✅** `genre-producer.ts` + endpoint: infere `GenreSignature` (modo dominante+secundário + postura + prosa) das 4 respostas por **substância** (prompt explícito, sem match de léxico), totalmente gracioso (degrada pra expositório, nunca bloqueia). Dominante → compositor via `request.rhetoricalMode`; assinatura completa → prompt via `inputs.genre` (seção `genre-section.ts`). Todos os 6 marcadores `ponytail: F4` resolvidos.

### Portão de revisão da Fase 4 (2026-07-22, revisores em Fable, implementação em Opus)

4 revisores (3 fatias + 1 transversal), read-only, contra o diff não-commitado (base `1e6c8d1`). **Vereditos: 9/9 itens FAITHFUL** (F4-1..F4-7 + F4-3/F4-7 backend). Gates re-rodados independentemente por 2 revisores: smoke 3/3 · guardrails:effect 2/2 · voice-profile-centralization 7/7 · typecheck dos 6 pacotes limpo · suíte Phase-4 100/100. Corrida de quote-consistency (gênero assíncrono muda o modo) **verificada SEGURA** por 2 revisores: `usePreview` não usa `placeholderData`, então a mudança de `queryKey` reseta `data`→undefined, o `quoteId` vai undefined e o backend precifica fresco (sem `quote_stale`).

Achados e destino:
- **MAJOR (AuditGen) — divergência `rhetoricalMode` vs `genre.rhetoricalMode.dominant`.** `toInternalPipelineRequest` passava só `request.rhetoricalMode`; um caller de API mandando `genre` sem `rhetoricalMode` planejaria/precificaria como `expound` enquanto o prompt diz outro modo. **Consertado:** `rhetoricalMode: request.rhetoricalMode ?? request.genre?.rhetoricalMode.dominant` (`public-generation.ts`). *Inalcançável pela web (que manda os dois consistentes); guarda de robustez pra API.*
- **MAJOR (AuditGen) — latência sem teto no caminho G4 do prefill (classe do defeito C-7).** Sem timeout agregado, o passo "analyzing" podia arrastar ~110s antes de degradar. **Consertado:** `Effect.timeoutFail` de 45s no G4 (→backbone) e 30s no produtor de gênero (→default), + teste com TestClock. Mesma classe/remédio do C-7 (onboarding).
- **MINORs consertados junto:** `not_applicable` vazava enum cru no prompt de gênero (`genre-section.ts` omite a linha) + teste; 2 branches de degrade sem teste (attempts=0, público vazio) cobertos; 2 comentários órfãos citando o deletado `BACKBONE_QUESTION_COPY` reescritos; nit de doc no comentário do `MePracticeProfileResponse` (perfil nulo → sem público, não "denominador comum").
- **Registrado como follow-up (test-hardening, MINOR):** os testes web de estreitamento/gênero afirmam estado do store, não o payload da mutação chegando ao SDK (o harness web não intercepta chamadas de SDK; risco baixo, `runPrefill`/`handleGenerate` são pass-through triviais). E o guard de regressão do MAJOR-1 (genre sem rhetoricalMode) precisa da suíte de integração gated — não adicionado à suíte segura.
- **INFO não-bloqueantes:** `resolveSlotQuestions` funde um `DatabaseError` real no mesmo degrade silencioso de "sem perfil" (convenção existente do codebase, sem `recordDegradationSignal` nas superfícies irmãs); a corrida do gênero assíncrono é degrade por design (o usuário que corre pro generate antes do gênero resolver gera com `expound` — vale um check de latência guiado por eval depois).
- **Pós-portão (full `pnpm test`, pego pelo usuário):** 3 arquivos de teste de estrutura de prompt (`backend-system-prompt-voice`, `compositor-expression-instructions`, `reasoning-prompt-snapshots`) quebraram com o F4-4/F4-5 — montavam `locals` com as tags mortas `{{generationDomain}}`/`{{domainPolicy}}` e o `resolveTemplate` falha em tag não-resolvida; um deles ainda afirmava o conteúdo tech-first removido. **Não estavam no conjunto de regressão direcionado do portão** (a regra "NUNCA `pnpm test` cru" me levou a um subconjunto que não cobria esses prompt-snapshots). Consertados (commit `72c3bc9`): tags novas nos fixtures + asserção stale trocada pela linha de modulação por público. Full suite (chaves vazias): **268 arquivos verdes · 0 falha · 15 skip** (integração/eval gated). **Lição:** depois de mexer no template de prompt, rodar o conjunto amplo de prompt/skill, não só os testes novos + fatia estreita. Também consertado nesta passada: o teste stale `describeCalibrationError` (C-8, commit `2910994`).

## Fase 5 — `/voice` (identidade de escrita)

- **F5-1 · `/voice` = voz + prática**, duas seções, mesmo gesto de aceitar/rejeitar (reusa `voice.tsx:97-103`). Companion = subconjunto read-only; `settings` continua só espelhando.
- **F5-2 · Duas naturezas de edição:** (a) editar declaração in-place (não é exemplo, ADR 0001 não trava); (b) aceitar/rejeitar sugestões de enriquecimento (store separada, só-acrescenta).
- **F5-3 · Afordância da pergunta HITL de nicho** (G5).

## Fase 6 — Qualidade & eval

- **F6-1 · A régua fica neutra** — nenhuma mudança de scoring por domínio (confirmar, não construir).
- **F6-2 · Conjunto de avaliação multi-domínio:** semear `apps/backend/scripts/calibration/briefings.ts` + `packages/eval` (hoje tech-only) com domínios por **span de estilo** (tech·marketing·climate + 1 distante), reusando os perfis do norte como padrão-ouro. Rodar discriminabilidade nos textos gerados.
- **F6-3 · Refactor guardas → tabela declarativa** (decisão do usuário): `development-drift.ts`/`development-critic.ts`/`voice-signature-divergence.ts` (cadeias de `if`) viram `Record<EpistemicPosture, …>` keyed-by-value **com default seguro** (valor sem linha cai em guarda neutra, nunca desprotegido).
- **F6-4 · Re-chavear o Format Expression Profile** de Content Type (morto no 07) para **canal** (`CONTEXT.md:646` — "how the author sounds on a channel"). Público NÃO entra no FEP (é eixo paralelo).

## Deferrals de plataforma (rastreados)

- **Grounding web do G2** (decisão do autor, 2026-07-21; marcador `ponytail: platform` em `practice-profile-generator.ts:110-112`): `ai-adapters` não tem superfície de grounding/tool-use, então o enriquecimento roda como 2ª passada de especificidade paramétrica — mesma fonte da semente, não o "grounding web nativo do provider" da ADR 0010 §3. O seam é plugável; destrava quando `ai-adapters` ganhar grounding nativo. Até lá, G5 (perguntar ao autor) é o mitigador do buraco epistêmico. Sem fase dona — reavaliar depois da Fase 6.

## Portão de revisão por fase (processo obrigatório)

Toda fase fecha com auditoria completa **antes do commit final** — o mesmo fluxo que produziu a Fase 3.5. Receita executável: `.claude/commands/phase-audit.md` (`/phase-audit <fase>`).

1. **Revisores em modelo DIFERENTE do que implementou** (imparcialidade): implementação em Fable 5 ⇒ revisão em Opus; implementação em Opus ⇒ revisão em Fable. Nunca o mesmo modelo revisando a própria família de saída.
2. **1 agente por fatia coerente do plano + 1 transversal** (governança, os 5 invariantes da ADR 0010, seams entre fases, ledger de ponytails vs. tickets, qualidade SOLID/dedup), em paralelo, read-only, julgando contra plano + ADR + norte — **lendo o código, nunca a mensagem de commit**.
3. **O orquestrador re-verifica todo achado major/critical no fonte** antes de aceitá-lo (agentes erram; achado não confirmado não entra).
4. **Major/critical: consertado antes do commit.** Minor: consertado junto ou vira ticket na fase seguinte. Nada é descartado sem justificativa escrita no plano.
5. Verificação: `pnpm smoke` + `pnpm guardrails:effect` + typecheck + suíte segura direcionada. **NUNCA `pnpm test` cru** (chama a Groq real e queima quota diária).
6. O resultado (vereditos por item + achados abertos) entra no plano como seção da fase, e os deferrals ganham ticket — nenhum `ponytail:` pode apontar para ticket inexistente.

## Coordenação com o mapa de defeitos (não resolver aqui)

- `briefing.question`/`briefing.systemContext` = ramos de patch mortos no step-planner (`step-planner/briefing-rules.ts:24-44`) — a F0-3 toca de raspão. → `defeitos/07`.
- `Text must contain at least N words` cru em inglês na UI pt-BR (`voice-calibration-service.ts:361-371`) — a Fase 3 toca o arquivo. → cluster de localização no mapa de defeitos.

## Governança a não quebrar
`monorepo-governance` (grafo de imports), `effect-hardening-governance` (sem `throw`/`decodeUnknownSync`/`Promise` nos pacotes Effect), `voice-profile-centralization` (perfil como valor, não import). Rodar `pnpm smoke` + `pnpm guardrails:effect`.
