# Backlog de Implementacao - Plano Derivado da Auditoria

## Backlog Gemini Migration (2026-05-07)

Fonte: `gemini-migration-plan.md`

Status macro:
- [ ] Fase 0 - Baseline pre-Gemini (5 briefings x 3 modos)
- [x] Fase 1 - Diagnostico `timesUsed: 0`
- [x] Fase 2 - `activeMarkers` no prompt (implementacao tecnica concluida)
- [x] Fase 3 - Adapter Gemini + tuning por quality mode (implementacao concluida; medicao formal adiada)
- [x] Fase 4 - Filtro rating no retrieval + anti-pattern retrieval (implementacao concluida; medicao formal adiada)
- [x] Fase 5 - Retrieval avancado (format-aware + tag-weighted + MMR) (implementacao concluida; medicao formal adiada)
- [x] Fase 6 - Skill-level model dispatch (strict) (implementacao concluida; medicao formal adiada)
- [x] Fase 7 - Observabilidade de dimensoes + calibration (implementacao concluida; medicao formal adiada)

### Epic GM-00 - Baseline e Diagnostico
- [x] GM-001 Criar `tests/fixtures/baseline-briefings.json` com 5 briefings canonicos
- [ ] GM-002 Capturar baseline pre-Gemini em `tests/baselines/baseline-pre-gemini.json` (15 runs)
- [ ] GM-003 Documentar medias e dimensao mais fraca em `.agents/braddock/memory/decisions.md`
- [x] GM-004 Diagnosticar `timesUsed: 0` (cenario A/B/C) com log em `tests/baselines/icl-diagnostic.log`
- [x] GM-005 Corrigir bookkeeping de uso caso necessario e remover logs temporarios

### Epic GM-01 - Voice Retrieval Quality
- [x] GM-006 Excluir `selfRating <= 3` do retrieval positivo
- [x] GM-007 Implementar `retrieveAntiPatterns` para exemplos fracos (rating <= 3)
- [x] GM-008 Propagar `activeMarkers` agregados para prompts `draft` e `voice-match`
- [ ] GM-009 Re-medir baseline fase 2/4 e salvar artefatos (`baseline-fase-2.json`, `baseline-fase-4.json`) (pendente por decisao de pular mediacoes longas neste momento)
- [x] GM-018 Expor anti-pattern retrieval via endpoint de voice (`GET /voice/users/:userId/anti-patterns`)
- [x] GM-019 Implementar retrieval format-aware com fallback cross-format
- [x] GM-020 Implementar diversidade no top-k com MMR
- [x] GM-021 Implementar model dispatch por step no strict (`model` + `thinkingBudget`)
- [x] GM-022 Emitir evento `iteration-dimensions` no refinement loop
- [x] GM-023 Expor endpoint `GET /traces/:traceId/dimensions`
- [x] GM-024 Critic recebe anti-pattern examples da memoria no prompt
- [x] GM-025 Refine recebe dimensoes prioritarias baixas (`criticDimensionsLow`) no prompt

### Epic GM-02 - Gemini Adapter
- [x] GM-010 Criar `src/adapters/gemini-adapter.ts`
- [x] GM-011 Criar `src/adapters/gemini-embedding-provider.ts`
- [x] GM-012 Ajustar `BaseLlmAdapter.getRequestBody(context?)` e compatibilidade adapters atuais
- [x] GM-013 Atualizar `src/constants/index.ts` com modelos e timeout Gemini
- [x] GM-014 Atualizar `QUALITY_MODE_POLICIES` e resolucao de modelo por qualityMode
- [x] GM-015 Ativar factory de embedding provider e registrar adapter no entry-point
- [x] GM-016 Atualizar `.env.example` e default adapter
- [x] GM-017 Consolidar validacao automatizada (testes + typecheck) da integracao Gemini

Este arquivo consolida as correcoes propostas a partir de `auditory.md` e `audit-findings.md` em uma ordem de execucao pratica.

Objetivo: reduzir primeiro os bugs que comprometem o fluxo real do pipeline, depois endurecer gates e observabilidade, e por fim abrir o caminho para simplificacao do payload.

## Status geral

- [x] P0 - Corrigir loop de refinamento e passagem de contexto
- [x] P0 - Corrigir language gate e retry
- [x] P0 - Integrar detectores regex ao critic
- [x] P1 - Adicionar detectores faltantes
- [x] P1 - Tornar a memoria idempotente e persistente
- [x] P1 - Endurecer contracts e trace
- [x] P2 - Criar suite de regressao e calibracao
- [x] P3 - Implementar pipeline registry e payload simplificado
- [ ] P0 - Implementar qualityMode e budget por politica
- [ ] P0 - Reduzir chamadas LLM com gating deterministic-first
- [ ] P1 - Consolidar payload rico no humanizer
- [ ] P1 - Instrumentar benchmark de custo/latencia/qualidade por modo
- [ ] P2 - Implementar ICL dinamico para personalizacao de voz

## Ordem recomendada

1. Corrigir o loop de refinamento e a passagem de contexto.
2. Corrigir o language gate.
3. Integrar os detectores regex ao critic.
4. Adicionar os detectores faltantes.
5. Tornar a memoria idempotente e persistente.
6. Endurecer contracts e trace.
7. Criar suite de regressao e calibracao.
8. Implementar pipeline registry e payload simplificado.
9. Implementar qualityMode e budget por politica.
10. Reduzir chamadas LLM com gating deterministic-first.
11. Consolidar payload rico no humanizer.
12. Instrumentar benchmark de custo/latencia/qualidade por modo.
13. Implementar ICL dinamico para personalizacao de voz.

## Itens de trabalho

### BK-01 - Corrigir loop de refinamento e passagem de contexto

- Status: concluido
- Prioridade: P0
- Esforco estimado: 3h a 5h
- Dependencias: nenhuma
- Arquivos mais provaveis: `src/orchestrator/refinement-loop.ts`, `src/skills/critic.ts`, `src/skills/humanizer.ts`, `src/skills/refine.ts`

Descricao:
Hoje o loop gera contexto em um formato e os skills leem outro. O resultado e que critic/humanizer perdem parte do feedback, e `refine` nao recebe `aiTics`.

Escopo:

- Padronizar a passagem de `critique`, `previousScore`, `previousDimensions`, `voiceExamples`, `focusDimensions` e `forceAggressive`.
- Fazer `refine` receber `aiTics` do audit.
- Garantir que o humanizer leia a critica real ao inves de cair em fallback vazio.

Critério de aceite:

- O humanizer altera o texto com base na critica real.
- O critic consegue comparar iteracoes anteriores.
- `refine` usa `aiTics` quando presentes.
- Teste de integracao do loop mostra feedback aplicado de ponta a ponta.

Validacao:

- `npm run lint`
- `npm test`

### BK-02 - Corrigir language gate e retry

- Status: concluido
- Prioridade: P0
- Esforco estimado: 3h a 4h
- Dependencias: nenhuma, mas idealmente depois de BK-01
- Arquivos mais provaveis: `src/language-gate/gate.ts`, `src/language-gate/word-detector.ts`, `src/language-gate/dictionary-detector.ts`, `src/core/orchestrator.ts`

Descricao:
O gate detecta parte dos leaks, mas a severidade e o fluxo de retry ainda nao garantem correcao real. Leaks relevantes continuam escapando ou viram warning demais.

Escopo:

- Revisar severidade para ingles nao tecnico e palavras suspeitas relevantes.
- Reduzir tolerancia de warnings acumulados.
- Fazer `retryInstruction` ser aplicado na tentativa seguinte de forma efetiva.

Critério de aceite:

- Leak CJK e leak estrangeiro obvio bloqueiam.
- Retry reaplica a instrução corretiva no novo passo.
- Testes cobrem casos conhecidos do audit.

Validacao:

- `npm run lint`
- `npm test`

### BK-03 - Integrar detectores regex ao critic

- Status: concluido
- Prioridade: P0
- Esforco estimado: 4h a 6h
- Dependencias: BK-01
- Arquivos mais provaveis: `src/skills/critic.ts`, `src/skills/critic/detectors/*`, `src/skills/critic/types.ts`

Descricao:
Os detectores existem, mas estao desconectados do critic. Sem isso, o critic depende demais do LLM e perde sinais deterministicos.

Escopo:

- Rodar `detectPerformative`, `detectFreshness` e `detectParallelTripleExpansion` antes do julgamento do modelo.
- Mesclar os achados regex com a resposta final do critic.
- Alimentar `issues`, `rewriteFocus` e score com esses resultados.

Critério de aceite:

- Textos com disclaimer performativo, trinca paralela ou clichê de marketing aparecem nos issues.
- Os achados deterministas alteram o score e o foco da reescrita.

Validacao:

- `npm run lint`
- `npm test`

### BK-04 - Adicionar detectores faltantes

- Status: concluido
- Prioridade: P1
- Esforco estimado: 4h
- Dependencias: BK-03
- Arquivos mais provaveis: `src/skills/critic/detectors/marker-isolated.ts`, `src/skills/critic/detectors/all-caps.ts`

Descricao:
Existem tiques observados no audit que ainda nao tem detector dedicado, especialmente marcador isolado no fim do texto e caixa alta para enfase.

Escopo:

- Criar detector para marcador isolado como punchline.
- Criar detector para enfase em ALL CAPS.
- Registrar ou remover `subtle-pattern-detector` se estiver morto.

Critério de aceite:

- Casos como `Inclusive.` sozinho e uso decorativo de caps sao sinalizados.
- O registry nao referencia skill nao registrada.

Validacao:

- `npm run lint`
- `npm test`

### BK-05 - Tornar a memoria idempotente e persistente

- Status: concluido
- Prioridade: P1
- Esforco estimado: 8h
- Dependencias: nenhuma, mas melhora BK-01 e BK-03
- Arquivos mais provaveis: `src/memory/voice-examples.ts`, `src/memory/manager.ts`, `src/memory/file-memory.ts`

Descricao:
O sistema de exemplos de voz hoje muta estado durante leitura e nao persiste como deveria. Isso gera variacao entre runs e quebra reproducibilidade.

Escopo:

- Separar selecao pura de mutacao de uso.
- Persistir voice examples em backend apropriado.
- Fazer o mesmo briefing retornar o mesmo conjunto de exemplos.
- Definir fallback claro para cold start.

Critério de aceite:

- `selectExamples` nao altera o estado.
- Runs repetidos com o mesmo contexto nao mudam por causa da memoria.
- Novo usuario recebe comportamento previsivel.

Validacao:

- `npm run lint`
- `npm test`

### BK-06 - Endurecer contracts e trace

- Status: concluido
- Prioridade: P1
- Esforco estimado: 4h a 6h
- Dependencias: BK-01 e BK-03
- Arquivos mais provaveis: `src/contracts/contract-engine.ts`, `src/core/trace.ts`, `src/core/orchestrator.ts`

Descricao:
O trace precisa registrar melhor o que foi aplicado e quando. Contracts tambem precisam virar parte do historico auditavel.

Escopo:

- Registrar versao do contract no trace.
- Garantir que violations tenham consumo real no fluxo.
- Reduzir validação redundante e deixar claro onde o gate opera.

Critério de aceite:

- O trace mostra qual contract foi usado.
- Violations aparecem no ponto correto do fluxo.
- O comportamento fica rastreavel por step.

### BK-DB-01 - Estruturar persistencia operacional no SQLite

- Status: concluido
- Prioridade: P1
- Esforco estimado: 6h a 10h
- Dependencias: BK-05 e BK-06
- Arquivos mais provaveis: `src/storage/migrations.ts`, `src/storage/sqlite-trace-store.ts`, `src/storage/sqlite-idempotency-store.ts`, `src/features/pipeline/pipeline.service.ts`, `src/features/pipeline/pipeline.controller.ts`

Descricao:
O projeto ja usava arquivo para dados vivos demais. Esta leva moveu para SQLite os pontos que pediam persistencia real, idempotencia e rastreabilidade operacional.

Escopo:

- Criar migrations para `voice_examples`, `voice_example_usage`, `pipeline_runs`, `pipeline_run_steps`, `contract_validations`, `pipeline_run_events` e `idempotency_keys`.
- Persistir traces completos, steps, contract validations e eventos de execucao.
- Adicionar chave de idempotencia no fluxo `/run`.
- Fechar os handles de banco explicitamente em testes e servicos.

Critério de aceite:

- Execucoes ficam auditaveis no banco.
- Idempotencia responde igual para mesma chave e mesmo payload.
- Reuso de chave com payload diferente vira conflito.
- A suite continua verde.

Validacao:

- `npm run lint`
- `npm test`

### BK-07 - Criar suite de regressao e calibracao

- Status: concluido
- Prioridade: P2
- Esforco estimado: 8h a 16h
- Dependencias: BK-02, BK-03, BK-04
- Arquivos mais provaveis: `tests/regression/*`, `tests/language-gate/*`, `tests/skills/critic/*`, `tests/orchestrator/*`

Descricao:
Sem regressao automatizada, os mesmos tiques e leaks vao reaparecer. Esta suite deve servir como guardrail dos casos reportados na auditoria.

Escopo:

- Criar fixtures com textos da serie 1-16.
- Cobrir language gate, critic e detectores novos.
- Adicionar calibracao de score em casos conhecidos.

Critério de aceite:

- Cada problema do audit tem ao menos um teste que falha antes e passa depois.
- A suite roda sem dependencia de LLM real.

### BK-08 - Implementar pipeline registry e payload simplificado

- Status: concluido
- Prioridade: P3
- Esforco estimado: 20h a 30h
- Dependencias: BK-05 e, idealmente, BK-06
- Arquivos mais provaveis: `src/pipelines/*`, `src/core/orchestrator.ts`, `src/api/index.ts`, `src/features/pipeline/pipeline.service.ts`

Descricao:
O formato simplificado de entrada so faz sentido depois que a memoria e a resolucao interna de contexto estiverem confiaveis.

Escopo:

- Criar registry de pipelines predefinidos.
- Fazer o engine aceitar `pipelineType` em vez de steps inline.
- Resolver `userId`, `briefing` e `context` internamente.
- Manter compatibilidade com o formato verbose.

Critério de aceite:

- Payload compacto executa sem expor a estrutura interna do pipeline.
- Modo verbose continua funcionando para debug.
- Validacoes de entrada ficam claras para `userId` e `pipelineType`.

## Sugestao de abertura de issues

Se quiser acompanhar por issue, este e um mapeamento direto:

- `BK-01` -> `fix: align refinement loop context`
- `BK-02` -> `fix: language gate retry and severity`
- `BK-03` -> `feat: wire regex detectors into critic`
- `BK-04` -> `feat: add missing critique detectors`
- `BK-05` -> `feat: make voice memory persistent and deterministic`
- `BK-06` -> `feat: persist contract and trace metadata`
- `BK-07` -> `test: add regression and calibration suite`
- `BK-08` -> `feat: add pipeline registry and simplified payload`
- `BK-10` -> `feat: quality-mode scoring and loop budget policy`
- `BK-11` -> `feat: deterministic-first gates to reduce llm calls`
- `BK-12` -> `feat: rich humanizer payload with author and diagnostics context`
- `BK-13` -> `test: benchmark quality-mode cost latency and quality`

## Critérios para marcar como concluido

- O bug observado no audit nao reaparece nos testes.
- O comportamento fica consistente entre runs.
- O trace permite explicar o que aconteceu em cada step.
- O payload simplificado fica disponivel sem quebrar o formato antigo.

### BK-09 - Implementar ICL dinamico para personalizacao de voz

- Status: planejado
- Prioridade: P2
- Esforco estimado: 2 a 4 semanas
- Dependencias: BK-05, BK-06, BK-08
- Arquivos mais provaveis: `src/memory/*`, `src/features/pipeline/pipeline.service.ts`, `src/pipelines/registry.ts`, `src/skills/humanizer.ts`, `src/config/prompts/humanizer-prompt.ts`, `src/orchestrator/refinement-loop.ts`

Descricao:
Adicionar retrieval semantico de exemplos reais do autor para alimentar o Humanizer com few-shot dinamico, aumentando fidelidade de voz sem comprometer custo e latencia.

Escopo:

- Ingestao/indexacao de exemplos do autor com metadados (`user_id`, `content_type`) e embeddings.
- Retrieval Top-K por briefing + filtros de usuario e formato.
- Injecao dos exemplos no Humanizer com budget de tokens e fallback seguro.
- Observabilidade: latencia de retrieval, tokens extras, impacto em fidelityToVoice e taxa de aceitacao no loop.
- Rodar em shadow mode e/ou A/B antes de virar padrao.

Criterio de aceite:

- Melhora consistente de fidelidade de voz em comparacao ao baseline.
- Latencia e custo dentro dos limites definidos para producao.
- Reducao de revisao manual para ajustes de tom/estilo.

Validacao:

- `npm run lint`
- `npm test`

### BK-10 - Implementar qualityMode e budget por politica

- Status: planejado
- Prioridade: P0
- Esforco estimado: 1 a 2 semanas
- Dependencias: BK-08
- Arquivos mais provaveis: `src/validation/schemas.ts`, `src/pipelines/registry.ts`, `src/orchestrator/refinement-loop.ts`, `src/core/orchestrator.ts`, `src/features/pipeline/pipeline.routes.ts`

Descricao:
Adicionar `qualityMode` como controle principal de custo/latencia/qualidade, com faixa minima de score e budget de loops/chamadas por modo (`fast`, `balanced`, `strict`).

Escopo:

- Adicionar `qualityMode` na request simplificada com default `balanced`.
- Resolver score efetivo por modo (`minScore`) e suportar `targetScore` como override avancado sem quebrar o piso do modo.
- Definir budgets por modo (`maxLoops`, `maxLLMCalls`) e aplicar no fluxo de refinamento.
- Retornar sempre o melhor candidato observado dentro do budget (`best-so-far`).

Criterio de aceite:

- Request aceita `qualityMode` e aplica politicas corretas por modo.
- O loop respeita budget e nao para automaticamente ao atingir piso de score.
- O output final e o melhor candidato observado, nao obrigatoriamente o ultimo.

Validacao:

- `npm run lint`
- `npm test`

### BK-11 - Reduzir chamadas LLM com gating deterministic-first

- Status: planejado
- Prioridade: P0
- Esforco estimado: 1 a 2 semanas
- Dependencias: BK-10
- Arquivos mais provaveis: `src/core/orchestrator.ts`, `src/skills/analyze.ts`, `src/skills/critic.ts`, `src/pipelines/registry.ts`, `src/language-gate/*`

Descricao:
Aplicar estrategia deterministic-first para etapas de analise e validacao, reduzindo chamadas desnecessarias a LLM sem abrir mao de gates duros.

Escopo:

- Introduzir pre-analise deterministica em `analyze/audit` e `critic`.
- Chamar LLM apenas sob baixa confianca, conflito de sinais ou risco relevante.
- Tornar `fidelity-check`, `voice-drift-check` e `adversarial-critic` condicionais ao modo e risco.
- Registrar no trace toda decisao de gate (chamou ou nao chamou LLM e motivo).

Criterio de aceite:

- Reducao mensuravel de chamadas LLM por execucao em todos os modos.
- Nenhuma regressao nos hard gates (language/contratos/fidelidade quando ativo).
- Decisoes de gating ficam auditaveis no trace.

Validacao:

- `npm run lint`
- `npm test`

### BK-12 - Consolidar payload rico no humanizer

- Status: planejado
- Prioridade: P1
- Esforco estimado: 1 semana
- Dependencias: BK-10, BK-11
- Arquivos mais provaveis: `src/skills/humanizer.ts`, `src/config/prompts/humanizer-prompt.ts`, `src/pipelines/registry.ts`, `src/orchestrator/refinement-loop.ts`

Descricao:
Concentrar no `humanizer` um payload unico e rico (diagnostico deterministico + perfil autoral + ICL + contratos) para reduzir retrabalho entre etapas e melhorar qualidade do passe principal.

Escopo:

- Consolidar sinais de regex, language gate, termos proibidos e issues priorizados.
- Injetar dados autorais e exemplos selecionados do ICL dinamico no mesmo payload.
- Preservar ledger de fatos e protecoes ja validadas para evitar regressao.
- Ajustar instrucoes para uma reescrita principal mais forte e objetiva.

Criterio de aceite:

- Humanizer recebe payload completo e aplica correcoes com menos passes auxiliares.
- Reducao de chamadas redundantes entre `voice-match/refine/humanizer`.
- Melhora de score medio sem aumento de latencia no modo `balanced`.

Validacao:

- `npm run lint`
- `npm test`

### BK-13 - Instrumentar benchmark de custo/latencia/qualidade por modo

- Status: planejado
- Prioridade: P1
- Esforco estimado: 3 a 5 dias
- Dependencias: BK-10, BK-11
- Arquivos mais provaveis: `tests/regression/*`, `tests/integration/*`, `src/core/trace.ts`, `src/storage/sqlite-trace-store.ts`, `docs/*`

Descricao:
Criar benchmark comparativo baseline vs `qualityMode` para validar ganhos reais de tempo/custo e monitorar impacto de qualidade por modo.

Escopo:

- Capturar e persistir metricas por execucao: latencia total, chamadas LLM, tokens e score final.
- Rodar suites comparativas por modo (`fast`, `balanced`, `strict`) em cenarios fixos.
- Documentar thresholds esperados e criterio de aprovacao para rollout.

Criterio de aceite:

- Relatorio comparativo reproduzivel com baseline e novos modos.
- Ganho de latencia e chamadas LLM visivel no `fast` e `balanced`.
- `strict` preserva qualidade com reducao parcial de custo.

Validacao:

- `npm run lint`
- `npm test`
