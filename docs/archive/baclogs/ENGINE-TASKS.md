# Engine Evolution â€” Task Board

> Derivado de ENGINE-EVOLUTION-PLAN.md. Executar na ordem definida.
> Status: `[ ]` pendente Â· `[~]` em andamento Â· `[x]` concluÃ­do

---

## Fase 1 â€” Refactor + ReorganizaÃ§Ã£o por DomÃ­nio + Language Profiles

### 1.1 Refactor: dictionary-detector.ts

- [x] **T-001** Extrair `COMMON_PORTUGUESE_WORDS` para `src/language-profiles/pt-BR/dictionary.json`
- [x] **T-002** Criar `DictionaryDataLoader` que carrega o JSON no lugar do Set inline
- [x] **T-003** Extrair `looksLikeProperNoun()` para `src/language-gate/detectors/proper-noun-detector.ts`
- [x] **T-004** Reduzir `dictionary-detector.ts` para classe Ãºnica com ~200 linhas usando os mÃ³dulos extraÃ­dos
- [x] **T-005** Garantir todos os testes passando apÃ³s refactor

### 1.2 Refactor: types/guards.ts

- [x] **T-006** Criar diretÃ³rio `src/types/guards/`
- [x] **T-007** Extrair guards de pipeline para `src/types/guards/pipeline.ts`
- [x] **T-008** Extrair guards de trace para `src/types/guards/trace.ts`
- [x] **T-009** Extrair guards de execution para `src/types/guards/execution.ts`
- [x] **T-010** Extrair guards de context para `src/types/guards/context.ts`
- [x] **T-011** Extrair guards de adapter para `src/types/guards/adapter.ts`
- [x] **T-012** Criar `src/types/guards/index.ts` re-exportando tudo
- [x] **T-013** Atualizar todos os imports que apontavam para `types/guards.ts`
- [x] **T-014** Deletar `src/types/guards.ts` original
- [x] **T-015** Garantir todos os testes passando apÃ³s refactor

### 1.3 Refactor: validation/schemas.ts

- [x] **T-016** Criar diretÃ³rio `src/validation/schemas/`
- [x] **T-017** Extrair schemas de adapter para `src/validation/schemas/adapter.ts`
- [x] **T-018** Extrair schemas de skill para `src/validation/schemas/skill.ts`
- [x] **T-019** Extrair schemas de pipeline para `src/validation/schemas/pipeline.ts`
- [x] **T-020** Criar `src/validation/schemas/index.ts` re-exportando tudo
- [x] **T-021** Atualizar todos os imports que apontavam para `validation/schemas.ts`
- [x] **T-022** Deletar `src/validation/schemas.ts` original
- [x] **T-023** Garantir todos os testes passando apÃ³s refactor

### 1.4 Language Profile â€” Estrutura base

- [x] **T-024** Instalar dependÃªncia `franc` para auto-detecÃ§Ã£o de idioma
- [x] **T-025** Criar `src/language-profiles/types.ts` com interface `LanguageProfile` completa (dictionary, patterns, prompts, defaults, contracts, errorMessages)
- [x] **T-026** Criar `src/language-profiles/registry.ts` com `LanguageProfileRegistry` (register, resolve por prioridade: explicit â†’ contentType â†’ auto-detect)
- [x] **T-027** Criar `src/language-profiles/detector.ts` com `franc` para auto-detecÃ§Ã£o e mapeamento ISO â†’ cÃ³digo de perfil

### 1.5 Language Profile â€” MigraÃ§Ã£o pt-BR

- [x] **T-028** Criar diretÃ³rio `src/language-profiles/pt-BR/`
- [x] **T-029** Migrar `language-gate/flag-words.ts` â†’ `src/language-profiles/pt-BR/patterns.ts` (flag words + mapeamentos)
- [x] **T-030** Migrar padrÃµes de `critic/detectors/performative.ts` â†’ seÃ§Ã£o `patterns.performative` do perfil pt-BR
- [x] **T-031** Migrar padrÃµes de `critic/detectors/freshness.ts` â†’ seÃ§Ã£o `patterns.freshnessClichÃ©s` do perfil pt-BR
- [x] **T-032** Migrar padrÃµes de `critic/detectors/marker-isolated.ts` â†’ seÃ§Ã£o `patterns.markerIsolated` do perfil pt-BR
- [x] **T-033** Migrar todos os prompts de `src/config/prompts/*.ts` â†’ `src/language-profiles/pt-BR/prompts.ts`
- [x] **T-034** Migrar contracts de `src/contracts/library/validation-post.contract.ts` â†’ `src/language-profiles/pt-BR/contracts.ts`
- [x] **T-035** Migrar mensagens de erro do `language-gate/gate.ts` â†’ `src/language-profiles/pt-BR/index.ts` (errorMessages)
- [x] **T-036** Criar `src/language-profiles/pt-BR/index.ts` montando o `LanguageProfile` completo com todas as partes migradas
- [x] **T-037** Injetar `LanguageProfile` em `LanguageGate` (remover hardcode pt-BR)
- [x] **T-038** Injetar `LanguageProfile` em `CriticSkill` e detectors (remover hardcode pt-BR)
- [x] **T-039** Injetar `LanguageProfile` em `DraftSkill` (remover constraint hardcoded em portuguÃªs)
- [x] **T-040** Validar que output em pt-BR Ã© idÃªntico ao de antes da migraÃ§Ã£o

### 1.6 Language Profile â€” Scaffold en-US

- [x] **T-041** Criar `src/language-profiles/en-US/` com estrutura completa
- [x] **T-042** Criar `en-US/dictionary.json` vazio com estrutura de array
- [x] **T-043** Criar `en-US/patterns.ts` com arrays vazios e TODOs documentados
- [x] **T-044** Criar `en-US/prompts.ts` com strings vazias e TODOs documentados
- [x] **T-045** Criar `en-US/contracts.ts` com arrays vazios e TODOs documentados
- [x] **T-046** Criar `en-US/index.ts` montando perfil com dados scaffold
- [x] **T-047** Registrar `en-US` no `LanguageProfileRegistry`

### 1.7 Refactor: pipelines/registry.ts

- [x] **T-048** Extrair lÃ³gica de quality policies para `src/pipelines/quality-policy.ts` (`QUALITY_MODE_POLICIES`, `resolveQualityPolicy`)
- [x] **T-049** Extrair `buildDynamicIclExamples()` para `src/pipelines/example-selection.ts`
- [x] **T-050** Extrair `buildBriefingText()` para `src/pipelines/briefing-builder.ts`
- [x] **T-051** Extrair `buildDeterministicDiagnostics()` para `src/pipelines/diagnostics.ts`
- [x] **T-052** Extrair `buildPipelineTemplate()` para `src/pipelines/plan-builder.ts`
- [x] **T-053** Reduzir `pipelines/registry.ts` para tipos e re-exports (~160 linhas)
- [x] **T-054** Atualizar todos os imports afetados
- [x] **T-055** Garantir todos os testes passando apÃ³s refactor

### 1.8 Refactor: core/orchestrator.ts

- [x] **T-056** Extrair lÃ³gica de execuÃ§Ã£o de step para `src/core/step-executor.ts`
- [x] **T-057** Extrair lÃ³gica de language gate para `src/core/language-gate-handler.ts`
- [x] **T-058** Extrair `handleRefinementLoopStep()` para `src/core/refinement-loop-handler.ts`
- [x] **T-059** Extrair `tryBypassLlmExecution()` + utilitÃ¡rios para `src/core/error-recovery.ts`
- [x] **T-060** Reduzir `core/orchestrator.ts` para orquestrador principal (~300 linhas)
- [x] **T-061** Garantir todos os testes passando apÃ³s refactor

### 1.9 Refactor: orchestrator/refinement-loop.ts

- [x] **T-062** Extrair parsing JSON para `src/orchestrator/json-extraction.ts` (parseJsonText, buildJsonCandidates)
- [x] **T-063** Extrair decisÃ£o de loop para `src/orchestrator/decision-engine.ts` (compareDecision, compareCritiqueDimensions)
- [x] **T-064** Extrair ledger para `src/orchestrator/ledger-builder.ts` (buildLedgerForText, buildQualityLedger, tipos compartilhados)
- [x] **T-065** Extrair feedback para `src/orchestrator/feedback-builder.ts` (buildIterationFeedback, summarizeIssues)
- [x] **T-066** Reduzir `refinement-loop.ts` para orquestrador do loop (~280 linhas)
- [x] **T-067** Garantir todos os testes passando apÃ³s refactor

### 1.10 Refactor: memory/voice-examples.ts

- [x] **T-068** Extrair operaÃ§Ãµes de banco para `src/memory/voice-example-repository.ts` (parseExample, cloneExample, parsing puro)
- [x] **T-069** Extrair lÃ³gica de scoring para `src/memory/example-scorer.ts` (filterCandidates, calculateScore, applyMMR)
- [x] **T-070** Extrair lÃ³gica de ranking semÃ¢ntico para `src/memory/semantic-ranker.ts` (computeSemanticScores, cosineSimilarity)
- [x] **T-071** Reduzir `voice-examples.ts` para coordenador (~200 linhas)
- [x] **T-072** Garantir todos os testes passando apÃ³s refactor

### 1.11 ReorganizaÃ§Ã£o por domÃ­nio

> **Nota:** Os refactors 1.7â€“1.10 foram feitos nos diretÃ³rios originais (`src/pipelines/`, `src/core/`, `src/orchestrator/`, `src/memory/`). As tasks abaixo movem os arquivos para a estrutura de domÃ­nio definitiva.

- [x] **T-073** Criar estrutura de diretÃ³rios de domÃ­nio: `pipeline-execution/`, `skill-registry/`, `content-generation/`, `notification/`
- [x] **T-074** Mover arquivos refatorados para os domÃ­nios corretos conforme estrutura definida em ENGINE-EVOLUTION-PLAN.md
- [x] **T-075** Atualizar todos os imports afetados pela movimentaÃ§Ã£o
- [x] **T-076** Verificar ausÃªncia de imports circulares entre domÃ­nios
- [x] **T-077** Garantir build limpo e todos os testes passando apÃ³s reorganizaÃ§Ã£o

---

## Fase 2 â€” Content Generation por Tipo

### 2.1 Infraestrutura declarativa

- [x] **T-078** Criar `ContentTypeStore` seguindo o padrão de persistência já adotado no projeto
- [x] **T-079** Definir schema YAML/JSON para content type definition (pipeline + steps + inputSchema + defaultLanguage)
- [x] **T-080** Implementar suporte a `extends:` em steps (override de constraints sem duplicar)
- [x] **T-081** Substituir `PIPELINE_TYPES` hardcoded em `pipelines/registry.ts` por carregamento dinÃ¢mico via `ContentTypeStore`
- [x] **T-082** Criar `src/content-generation/_shared/` com steps reutilizÃ¡veis (voice-match, research, refine)

### 2.2 Content types declarativos

- [x] **T-083** Implementar `blog-post`: pipeline + 5 steps (research, outline, draft, seo, refine) com constraints especÃ­ficos
- [x] **T-084** Implementar `linkedin-post`: pipeline + 3 steps (hook, insight, cta) com hook obrigatÃ³rio na linha 1, mÃ¡x 3000 chars
- [x] **T-085** Implementar `twitter-thread`: pipeline + 3 steps (hook-tweet, thread-body, engagement) com cada tweet como unidade independente
- [x] **T-086** Implementar `newsletter`: pipeline + 3 steps (subject-line, sections, cta) com subject testÃ¡vel
- [x] **T-087** Migrar contracts hardcoded de TypeScript para declarativo por tipo de conteÃºdo
- [~] **T-088** Validar qualidade de output manualmente para cada tipo (pelo menos 3 geraÃ§Ãµes por tipo)

---

## Fase 3 â€” API Surface EstÃ¡vel

- [x] **T-089** Criar `src/api/types.ts` com todos os tipos: `JobCreatedResponse`, `JobStatusResponse`, `JobProgress`, `JobResult`, `JobError`, `SSEEvent`, `ContentTypeDefinition`
- [x] **T-090** Garantir que `POST /pipelines` retorna exatamente `JobCreatedResponse`
- [x] **T-091** Garantir que `GET /jobs/:jobId` retorna exatamente `JobStatusResponse`
- [x] **T-092** Garantir que `GET /content-types` retorna `ContentTypeDefinition[]`
- [x] **T-093** Garantir que `GET /skills` retorna introspection da registry
- [x] **T-094** Instalar e configurar `@fastify/swagger` + `@fastify/swagger-ui`
- [x] **T-095** Expor `GET /docs` com OpenAPI spec em JSON
- [x] **T-096** Adicionar `GET /health` com status bÃ¡sico da engine
- [x] **T-097** Escrever testes de integraÃ§Ã£o para cada endpoint validando shape de retorno contra `types.ts`

---

## Fase 4 â€” Execution Strategy

- [ ] **T-098** Criar interface `ExecutionStrategy` em `src/pipeline-execution/strategy/index.ts`
- [ ] **T-099** Implementar `SyncStrategy`: executa pipeline inline, retorna resultado imediato com `status: 'done'`
- [ ] **T-100** Implementar store in-memory (`Map`) para `GET /jobs/:jobId` em modo sync
- [ ] **T-101** Instalar `bullmq` e configurar conexÃ£o com Redis
- [ ] **T-102** Implementar `AsyncStrategy`: enfileira job no BullMQ, retorna `status: 'queued'`
- [ ] **T-103** Implementar workers BullMQ que executam pipelines e persistem resultado
- [ ] **T-104** Implementar `GET /jobs/:jobId` com Redis store para modo async
- [ ] **T-105** Ler `EXECUTION_MODE` do environment e injetar strategy correta na inicializaÃ§Ã£o
- [ ] **T-106** Adicionar `EXECUTION_MODE=sync` no `.env.example`
- [ ] **T-107** Testar troca de modo sem nenhuma mudanÃ§a no contrato HTTP
- [ ] **T-108** Escrever testes para ambas as strategies

---

## Fase 5 â€” Memory PlugÃ¡vel

- [ ] **T-109** Criar interface `MemoryAdapter` em `src/memory/adapters/index.ts`
- [ ] **T-110** Formalizar `FileMemoryAdapter` implementando a interface
- [ ] **T-111** Implementar `RedisMemoryAdapter` (L2) com TTL configurÃ¡vel
- [ ] **T-112** Implementar `HttpMemoryAdapter` (L3) com `X-Internal-Secret` header
- [ ] **T-113** Implementar `LRUCache` wrapper para L1 (in-process, TTL ~10s)
- [ ] **T-114** Implementar `LayeredMemoryAdapter` (L1 + L2 + L3) com write-through e invalidaÃ§Ã£o de cache
- [ ] **T-115** Configurar adapter via `MEMORY_BACKEND` environment variable
- [ ] **T-116** Documentar API de memory endpoints que o Python Backend deve expor (GET/PUT/DELETE `/internal/memory/:userId/:key`)
- [ ] **T-117** Escrever testes com mocks para `LayeredMemoryAdapter` (cache hit L1, miss L1 hit L2, miss tudo â†’ L3, write-through)

---

## Fase 6 â€” SSE + NotificaÃ§Ãµes

- [ ] **T-118** Implementar `GET /notifications/sse` com Server-Sent Events via Fastify
- [ ] **T-119** Worker publica evento no Redis pub/sub a cada step concluÃ­do: `{ type: 'progress', stepName, percent }`
- [ ] **T-120** Worker publica evento de conclusÃ£o: `{ type: 'done', jobId, result }`
- [ ] **T-121** Worker publica evento de erro: `{ type: 'error', jobId, error }`
- [ ] **T-122** API layer assina Redis pub/sub por `userId` e forwarda eventos para conexÃ£o SSE ativa
- [ ] **T-123** Implementar reconexÃ£o SSE sem perda de eventos (Last-Event-ID header)
- [ ] **T-124** Implementar persistÃªncia de notificaÃ§Ã£o para usuÃ¡rio offline via `POST /internal/notifications` no Python Backend
- [ ] **T-125** Implementar `GET /notifications/pending` retornando notificaÃ§Ãµes nÃ£o entregues
- [ ] **T-126** Testar fluxo completo: submit â†’ progresso via SSE â†’ notificaÃ§Ã£o ao concluir

---

## Resumo por Fase

| Fase                              | Tasks             | DescriÃ§Ã£o     |
| --------------------------------- | ----------------- | ------------- |
| 1 â€” Refactor + DomÃ­nio + Language | T-001 â†’ T-077     | 77 tasks      |
| 2 â€” Content Generation            | T-078 â†’ T-088     | 11 tasks      |
| 3 â€” API Surface                   | T-089 â†’ T-097     | 9 tasks       |
| 4 â€” Execution Strategy            | T-098 â†’ T-108     | 11 tasks      |
| 5 â€” Memory PlugÃ¡vel               | T-109 â†’ T-117     | 9 tasks       |
| 6 â€” SSE + NotificaÃ§Ãµes            | T-118 â†’ T-126     | 9 tasks       |
| **Total**                         | **T-001 â†’ T-126** | **126 tasks** |




