# Fluxo de Geração Tema-First Guiado

**Status:** accepted
**Emenda a:** ADR 0003 (substitui o fluxo de geração intent-first descrito lá e em `docs/frontend-application-flow.md`)
**Trilha de decisão:** `.scratch/fluxo-geracao-tema-first/` (mapa wayfinder + tickets 01–07 e seus assets de research)

## Contexto

O desenho original do workspace autenticado abria a geração por **intent-first**: o usuário escolhia um Content Type num seletor, um formulário dinâmico (dirigido pelo `inputSchema` do catálogo) coletava o briefing, e só então gerava. Na prática isso inverte a ordem mental do autor: as pessoas não chegam com uma "intenção" nem com um formato — chegam com **um tema, uma ideia, uma proposta de texto** (como fariam no ChatGPT). Forçar a taxonomia interna (intent, content type) como primeira decisão do usuário é fricção que não corresponde a como ele pensa.

Esta ADR oficializa um fluxo **tema-first guiado**: um campo de texto livre para o tema, uma inferência que preenche o setup nos bastidores, e uma sessão conversacional curta que extrai o que dá corpo e originalidade ao texto — mantendo a qualidade do pipeline existente.

## Decisões

### 1. Espinha: inferir calado, interromper só quando ambíguo (ticket 02)

O usuário digita o **tema em texto livre** — único input obrigatório. A partir dele, o setup (intent, tamanho, canal, content type) é **inferido e permanece invisível** quando a confiança é alta. O usuário **nunca vê a palavra "intent"** nem escolhe content type.

Exceção adaptativa: quando um campo fica de baixa confiança, **ele — e só ele** — vira uma pergunta em linguagem natural, acompanhada de uma explicação curta do que aquela escolha muda no texto. Campos confiantes seguem invisíveis.

Fundamento (ticket 01): `intent` é **load-bearing** no pipeline — injeta o ângulo retórico no prompt (`INTENT_ANGLE`), patcheia passos do compositor, define tamanho default e content type. Não pode ser removido; por isso é **inferido, não perguntado**.

### 2. Content type derivado; canal é o único input explícito (ticket 03)

- **Content type colapsa em derivado.** O backend (`resolve-generation-target.ts`) já deriva o content type de `intent × lengthTier` e **ignora** qualquer `contentType` enviado pelo cliente quando há intent+scope. O "Content Type Selector" e o formulário dinâmico por `inputSchema` **saem do fluxo primário**.
- **Canal é o único input explícito opcional.** Diferente do resto, o canal não é inferível por confiança — é conhecimento externo do autor (ele sabe ou não onde vai publicar). Um seletor leve e pulável.
- **Vocabulário em duas camadas:** a UI mostra **plataformas ricas** (LinkedIn, X, Instagram, Medium, Substack, blog, newsletter…) mapeadas nos **4 buckets comportamentais** de `GenerationChannelSchema` (`professional-network`/`social`/`blog`/`email`). O pipeline **não muda**; diferenças finas por plataforma ficam para a Fase 2.

### 3. Mecanismo de inferência (ticket 04)

Uma **única chamada LLM estruturada** com `gemini-3.1-flash-lite` (padrão da casa para tarefas rápidas/baratas), reusando o template de `reasoning-extraction.ts` (JSON-no-prompt → `parseJsonFromLlmResponse` → `Schema.decodeUnknown`, com fallback via routing profile).

- **Confiança recai só no intent**, via um flag `ambiguous` + um `alternative` intent (não um float calibrado) — é o que aciona a pergunta de ambiguidade do item 1.
- **Canal por heurística determinística** (scan de nome de plataforma no tema), não LLM.
- **Latência ~2–3s**, timeout 12s, **fallback gracioso** (default `share-idea` + tamanho default) que **nunca bloqueia** o fluxo.
- **Output** mapeia sobre o `GeneratePrefillSchema` (hoje contrato sem uso) + envelope de ambiguidade + `briefingSeed` + plano de perguntas.

### 4. Sessão conversacional de aprofundamento (ticket 05)

Perguntas **uma por vez** (estilo entrevista), **puláveis**, com um "Gerar agora" sempre visível e uma nota persuasiva ("quanto mais você contar, mais denso, original e com a sua cara o texto fica").

Repertório — **backbone fixo de 4 ângulos** (o que só o autor tem): **tese/hipótese**, **experiência concreta**, **contra-argumento/tensão**, **motivação/por que agora**. Híbrido: ordem adaptada ao intent, phrasing adaptado ao tema, mais **0–2 perguntas extras geradas pela LLM** quando o tema pede. O backbone garante a cobertura; extras só somam. A pergunta de ambiguidade (item 1), quando existe, é o primeiro passo.

### 5. Mapeamento tema + respostas → briefing (ticket 06)

As respostas viram as **chaves que o pipeline de fato lê** (`getBriefingText`): tema → `topic`; tese → `goal`; experiência/contra-argumento/motivação/extras → `keyPoints[]`; `question`/`systemContext` preenchidos por intent para disparar patches de passo. **Degradação graciosa = omitir a chave** (nunca placeholder vazio); briefing menor faz o step-planner escolher pipeline mais leve. O `briefingSeed` só preenche `topic`/`language` e **nunca fabrica** pontos — autenticidade de voz.

### 6. Contrato e endpoint (ticket 07)

- **Endpoint novo `POST /me/generation-prefill`** roda a inferência. Request `{ theme, language? }` → Response `{ prefill: GeneratePrefill, intentAmbiguity, detectedPlatform?, questionPlan[] }`. Reusa/estende o `GeneratePrefillSchema`.
- **Servidor stateless; sessão em estado client-side (Zustand).** Uma chamada de prefill → o cliente percorre o `questionPlan` acumulando respostas → monta o briefing → uma chamada `POST /me/executions/run`. Sem round-trip por pergunta, sem persistência de sessão.
- **Reuso intocado:** `generation-preview`, `executions/run`, SSE, `GenerationIntentRequest`, `GenerationChannelSchema`, todo o pipeline.
- **client-sdk:** novo subclient `generationPrefill.infer({ theme, language })`.

### Porta de entrada (`/app/generate`)

A tela primária passa a abrir com o **campo de tema** em foco. Usuários de primeira viagem seguem o gancho de onboarding/calibração existente (governado pela ADR 0001, fora do escopo desta ADR) antes de cair no `/app/generate`.

## Alternativas consideradas e rejeitadas

- **Manter intent-first (seletor + formulário dinâmico):** contra-produtivo — impõe a taxonomia interna como primeira decisão do usuário. Rejeitado (é justamente o que esta ADR substitui).
- **Remover o intent de vez e só perguntar tamanho/canal:** derrubaria a qualidade — o intent é load-bearing (ticket 01). Reconciliado como "inferir, não perguntar".
- **Perguntar o setup explicitamente / card de confirmação com chips:** fricção desnecessária; o setup fica invisível quando confiante (ticket 02).
- **Confiança por-campo como float calibrado:** auto-confiança de LLM é mal-calibrada; o flag `ambiguous`+`alternative` é mais robusto (ticket 04).
- **Perguntas 100% geradas por LLM (sem backbone):** imprevisível, pode pular ângulos que elevam qualidade. Rejeitado em favor do híbrido (ticket 05).
- **Sessão de perguntas com estado server-side:** desnecessário — o plano é emitido de uma vez, então estado client-side + servidor stateless basta (ticket 07).

## Consequências

- **Uma capacidade nova** (endpoint `/me/generation-prefill` + serviço de inferência + subclient + constante plataforma→bucket) e **muito reuso** — o pipeline, o preview, a execução e os contratos de canal ficam intocados.
- O catálogo de content types e o `inputSchema` **deixam de dirigir o formulário** do fluxo primário (podem seguir existindo para uso interno/derivação e para a extensão até alinhamento).
- A qualidade depende de o `intent` inferido estar certo. Mitigado pela pergunta de ambiguidade, pelo "Ajustar" (tamanho/canal) e por regenerar. Requer um **eval** (~15–20 temas) na implementação para afinar o prompt e o limiar de ambiguidade — não bloqueia esta decisão.
- **Compatível com a Fase 2:** o mapa intent×lengthTier→content type e word targets estão marcados `@phase1-legacy` ("replaced by generationProfile in Phase 2"). O prefill desenhado aqui vira o **produtor do futuro `generationProfile`** — a migração é natural, não uma reescrita.
