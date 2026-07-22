# Plano `/implement` — Practice Profile

Companheiro da **ADR 0010**. Task set ordenado, backend + web, pré-lançamento (greenfield, sem migração). O **norte** (`.scratch/adaptacao-por-dominio/norte/`) é insumo citado, não reescrito.

> **Caminho crítico (2 pré-requisitos que tudo depende):**
> 1. **Nova forma do briefing** (F0-3) — sem ela, a adaptação de perguntas é cosmética.
> 2. **Re-chavear o compositor `planGeneration` de intent→gênero×tamanho×canal** (F1-2) — a cirurgia 07+13, uma passada só.

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
- **F1-3 · Deletar código morto da calibração** (05): `THEMES_BY_DOMAIN`, `themePool`, `pickThemeFromPool`, `rotationIndex`, `step.label`, `capturesFeatures`, `argument_development.defaultTheme`.

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

## Fase 4 — Geração

- **F4-1 · Popular `briefing.audience`** (soquete já ligado — `skill-inputs.ts:44`, `skill-templates.ts:98`; só popular via passo ① de estreitamento).
- **F4-2 · Estreitamento de público** por chips, passo **antes** das perguntas; amortecedores (auto-pular com público único; denominador comum sem estreitar). "+adicionar público" = efêmero pra aquela geração.
- **F4-3 · Prefill troca de trabalho:** instanciar os 4 slots (carga·ancoragem·resistência·stake do leitor) em vez de classificar intent.
- **F4-4 · Alavancas de público** via prompt: densidade de jargão + se explicado (vocabulário da dimensão Léxico; o público modula quanto), pressuposição, rampa, encerramento.
- **F4-5 · Limpar resíduos de prompt:** `skill-templates.ts:261` (linha tech-first morta) → substituir pela modulação positiva de jargão-por-público; `skill-templates.ts:98` → escopar a comprehensibilidade, não estilo.
- **F4-6 · Vocabulário de chips de canal** (`generate-view.ts:144-154`): tirar os 7 nomes de plataforma → escolher por bucket funcional. Web only, não contrato.

## Fase 5 — `/voice` (identidade de escrita)

- **F5-1 · `/voice` = voz + prática**, duas seções, mesmo gesto de aceitar/rejeitar (reusa `voice.tsx:97-103`). Companion = subconjunto read-only; `settings` continua só espelhando.
- **F5-2 · Duas naturezas de edição:** (a) editar declaração in-place (não é exemplo, ADR 0001 não trava); (b) aceitar/rejeitar sugestões de enriquecimento (store separada, só-acrescenta).
- **F5-3 · Afordância da pergunta HITL de nicho** (G5).

## Fase 6 — Qualidade & eval

- **F6-1 · A régua fica neutra** — nenhuma mudança de scoring por domínio (confirmar, não construir).
- **F6-2 · Conjunto de avaliação multi-domínio:** semear `apps/backend/scripts/calibration/briefings.ts` + `packages/eval` (hoje tech-only) com domínios por **span de estilo** (tech·marketing·climate + 1 distante), reusando os perfis do norte como padrão-ouro. Rodar discriminabilidade nos textos gerados.
- **F6-3 · Refactor guardas → tabela declarativa** (decisão do usuário): `development-drift.ts`/`development-critic.ts`/`voice-signature-divergence.ts` (cadeias de `if`) viram `Record<EpistemicPosture, …>` keyed-by-value **com default seguro** (valor sem linha cai em guarda neutra, nunca desprotegido).
- **F6-4 · Re-chavear o Format Expression Profile** de Content Type (morto no 07) para **canal** (`CONTEXT.md:646` — "how the author sounds on a channel"). Público NÃO entra no FEP (é eixo paralelo).

## Coordenação com o mapa de defeitos (não resolver aqui)

- `briefing.question`/`briefing.systemContext` = ramos de patch mortos no step-planner (`step-planner/briefing-rules.ts:24-44`) — a F0-3 toca de raspão. → `defeitos/07`.
- `Text must contain at least N words` cru em inglês na UI pt-BR (`voice-calibration-service.ts:361-371`) — a Fase 3 toca o arquivo. → cluster de localização no mapa de defeitos.

## Governança a não quebrar
`monorepo-governance` (grafo de imports), `effect-hardening-governance` (sem `throw`/`decodeUnknownSync`/`Promise` nos pacotes Effect), `voice-profile-centralization` (perfil como valor, não import). Rodar `pnpm smoke` + `pnpm guardrails:effect`.
