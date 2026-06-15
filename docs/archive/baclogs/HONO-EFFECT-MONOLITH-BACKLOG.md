# Hono + Effect Monorepo Backlog

> Backlog derivado do `docs/archive/plans/HONO-EFFECT-MONOLITH-PLAN.md`.
>
> Este backlog reaproveita tarefas do backlog anterior sempre que elas continuam validas, mas reposiciona tudo pela nova estrategia de migracao:
> `packages` primeiro, depois `backend`, depois `web` e, por ultimo, `mobile`.
>
> Status padrao: `planned`.
> Nao reescreva a historia da migracao. Atualize apenas o status e os itens que forem sendo executados.

---

## Convencao

- `planned` = nao iniciado
- `in_progress` = em execucao
- `blocked` = dependencia externa ou decisao pendente
- `done` = concluido e validado

---

## Estrategia De Migracao

### Regras Gerais

- o projeto atual e a fonte de verdade de comportamento
- o novo monorepo e a fonte de verdade arquitetural
- legado e nova estrutura coexistem ate a paridade funcional minima
- nao iniciar web ou mobile antes de fechar a base de packages e o backend
- `packages/ui` so entra quando a frente de web começar
- todo item novo deve ser modelado como package, service, layer, contract ou app, nunca como subarquitetura paralela

### Ordem De Entrega

1. fundacao do monorepo
2. packages centrais
3. backend Hono + Effect
4. web
5. `packages/ui`
6. mobile
7. limpeza final do legado

---

## Sequencia Operacional Inicial

### Onda 1 - Fundacao E Primeiros Packages

Ordem exata:

1. `M0-01` definir arvore final do monorepo e limites entre `apps/` e `packages/`
2. `M0-02` criar `pnpm-workspace.yaml`
3. `M0-03` criar `turbo.json`
4. `M0-04` criar `packages/config`
5. `M0-05` definir convencoes de `src/index.ts`
6. `M0-06` definir politica de dependencias
7. `M0-07` definir naming conventions
8. `M0-08` definir smoke test minimo
9. `M0-09` atualizar documentacao base
10. `M1-01` criar `packages/contracts`
11. `M1-02` definir schemas base com `Effect.Schema`
12. `M1-03` modelar contratos de execucao, job, memoria, idioma e conteudo

Status operacional:

- `M0-01` a `M0-05` concluidas
- `M0-06` a `M0-08` planejadas
- `M0-09` concluida
- `M1-01` a `M1-03` concluidas
- `M1-04` a `M1-06` concluidas
- `M1-07` a `M1-10` concluidas

Regras da onda:

- nao abrir M1 antes de concluir a fundacao tecnica minima de M0
- nao iniciar backend antes de contracts, domain, core e orchestrator existirem
- qualquer ajuste de escopo deve voltar para esta sequencia, nao para o legado

---

## Epic M0 - Fundacao Do Monorepo

- [x] **M0-01** Definir a arvore final do monorepo e os limites entre `apps/` e `packages/`
- [x] **M0-02** Criar `pnpm-workspace.yaml` e garantir descoberta correta de workspaces
- [x] **M0-03** Criar `turbo.json` com grafo de build, lint e test por pacote
- [x] **M0-04** Criar `packages/config` com `tsconfig`, `eslint`, `prettier` e presets compartilhados
- [x] **M0-05** Definir convencoes de `src/index.ts` e exportacao publica por package
- [x] **M0-06** Definir politica de dependencias entre packages e regra de importacao interna
- [x] **M0-07** Definir naming conventions para apps, packages, jobs, schemas e contracts
- [x] **M0-08** Definir smoke test minimo do monorepo
- [x] **M0-09** Atualizar documentacao base com a nova arquitetura e ordem de entrega

Dependencias:

- nenhuma

Critério de pronto:

- o monorepo compila, resolve paths e executa tooling compartilhado sem depender de codigo legado

---

## Epic M1 - Packages Centrais

> Esta fase carrega a maior prioridade tecnica. Os packages abaixo devem existir antes da composicao final do backend.

### M1.A - Contratos, dominio e core

- [x] **M1-01** Criar `packages/contracts`
- [x] **M1-02** Definir schemas base com `Effect.Schema` para request, response, errors e eventos
- [x] **M1-03** Modelar contratos de execucao, job, memoria, idioma e conteudo
- [x] **M1-04** Criar `packages/domain`
- [x] **M1-05** Modelar entidades, value objects, invariantes e policies de dominio
- [x] **M1-06** Modelar `LanguageProfile`, pipeline e modelos de conteudo no dominio
- [x] **M1-07** Criar `packages/core`
- [x] **M1-08** Implementar bootstrap de Effect, config, logger, tracing e DI base
- [x] **M1-09** Definir strategies base de execucao `SyncStrategy` e `AsyncStrategy`
- [x] **M1-10** Criar testes unitarios para contracts, domain e core

### M1.B - Orquestracao e skills

- [x] **M1-11** Criar `packages/orchestrator`
- [x] **M1-12** Implementar a espinha dorsal de pipelines, steps e refinamento
- [x] **M1-13** Implementar selecao de strategy de execucao e coordenacao de jobs
- [x] **M1-14** Criar `packages/skills`
- [x] **M1-15** Migrar skill registry, store e declarative executor do legado
- [x] **M1-16** Migrar validacao e introspection de skills
- [x] **M1-17** Implementar skills sensiveis a idioma e refinement
- [x] **M1-18** Cobrir skills e orchestrator com testes de contrato e fluxo

### M1.C - Infraestrutura compartilhada

- [x] **M1-19** Criar `packages/database`
- [x] **M1-20** Implementar repositories, mapping ORM <-> dominio e transacoes
- [x] **M1-21** Persistir jobs, progresso e historico de execucao
- [x] **M1-22** Criar `packages/ai-adapters`
- [x] **M1-23** Implementar clientes e adaptacao de providers LLM
- [x] **M1-24** Criar `packages/feature-flags`
- [x] **M1-25** Definir contrato unico de flags para execucao, conteudo e rollout
- [x] **M1-26** Criar `packages/payments`
- [x] **M1-27** Definir contratos de plano, uso, entitlement e gateway
- [x] **M1-28** Criar `packages/client-sdk` como esqueleto inicial
- [x] **M1-29** Definir transporte HTTP tipado a partir de contractsFaça
- [x] **M1-30** Cobrir infra compartilhada com testes basicos e mocks
- [x] **M1-31** Implementar ledger append-only de creditos com idempotencia por operacao
- [x] **M1-32** Implementar politica de debito por modo (`fast`, `balanced`, `strict`) com surcharge por retry
- [x] **M1-33** Implementar rollover parcial de creditos por ciclo com cap configuravel
- [x] **M1-34** Implementar pacote extra de creditos (top-up) e fluxo de concessao de saldo
- [x] **M1-35** Evoluir contratos tipados de billing/entitlement para suportar wallet, ledger e ciclo de geracao
- [x] **M1-36** Cobrir billing v2 com testes de concorrencia, idempotencia e auditoria de saldo

### M1.D - Hardening Effect-TS (P0)

> Frente obrigatoria para alinhar 100% dos packages a filosofia do Effect-TS antes de avancar backend/web/mobile.
> Escopo derivado de analise de aderencia (prioridades alta e media), cobrindo canal de erro tipado, eliminacao de `throw`,
> contratos `Effect.Effect<A, E, R>`, decode nao-sync e composicao de Layer/Runtime sem execucao precoce.

- [x] **M1-37** Criar taxonomy unica de erros tipados por package usando `Data.TaggedError`: - `packages/client-sdk`: request invalida, http status nao-2xx, parse/decode de resposta - `packages/ai-adapters`: provider nao encontrado, request invalida, normalize invalido - `packages/database`: recurso nao encontrado, conflito de criacao, invariantes de transacao - `packages/feature-flags`: definicao invalida, rollout invalido, variante inconsistente - `packages/payments`: plano inexistente, entitlement ausente, credito insuficiente, assinatura inativa - `packages/skills`: registro duplicado, skill invalida, path proibido, carregamento de modulo falho, template invalido
- [x] **M1-38** Eliminar `throw new Error` de codigo de dominio/servico e migrar para `Effect.fail` com erros tipados
- [x] **M1-39** Proibir uso de `Error` generico no canal `E`; atualizar APIs internas para erros discriminados por `_tag`
- [x] **M1-40** Migrar todos os contratos assicronos baseados em `Promise` para `Effect.Effect<A, E, R>` em: - `packages/client-sdk` - `packages/ai-adapters` - `packages/payments` - `packages/skills` - `packages/database` (principalmente transacao e operacoes que podem falhar)
- [x] **M1-41** Refatorar implementacoes de IO para `Effect.tryPromise({ try, catch })` e `Effect.try` (sem excecao escapar para defect)
- [x] **M1-42** Substituir validacoes sync que lancam excecao por decode effectful: - migrar `Schema.decodeUnknownSync` para `Schema.decodeUnknown` com mapeamento de erro tipado - padronizar estrategia para parse/decode em request/response/contratos
- [x] **M1-43** Garantir que `Effect.runPromise`/`Effect.runSync` exista apenas em entrypoints e testes; remover execucao em helpers
- [x] **M1-44** Reforcar fronteiras de Layer: - constructors/factories retornam valores puros ou `Effect` - wiring de dependencias via `Layer` (sem estado global oculto) - ausencia de side effects no import-time
- [x] **M1-45** Introduzir guias de composicao e regras de erro no monorepo: - ADR curto de estilo Effect (erro tipado, Layer, runtime boundary) - checklist de PR obrigatorio para packages Effect
- [x] **M1-46** Atualizar testes para refletir canal de erro tipado: - asserts por `_tag` em vez de mensagem textual fragil - cobertura de falhas esperadas por package - cenarios de decode invalido e mapeamento de erro
- [x] **M1-47** Adicionar testes de regressao para garantir ausencia de `throw` nao mapeado em caminhos criticos
- [x] **M1-48** Adicionar guardrails automatizados no CI: - regra lint/grep bloqueando `throw new Error` em camadas de servico/usecase (excecoes permitidas apenas em bordas definidas) - regra para bloquear `Schema.decodeUnknownSync` fora de testes/migracao explicita - regra para bloquear novos contratos `Promise` em packages Effect
- [x] **M1-49** Executar migracao em ondas sem quebrar consumo: - onda A: `contracts` + `core` (fundacao de erro tipado e utilitarios) - onda B: `client-sdk` + `ai-adapters` - onda C: `database` + `feature-flags` - onda D: `payments` + `skills` + `orchestrator`
- [x] **M1-50** Validar pronto de aderencia Effect-TS: - zero ocorrencias de `throw new Error` nos packages alvo (fora bordas explicitamente permitidas) - zero `Schema.decodeUnknownSync` em runtime de producao - zero novos contratos `Promise` nos packages alvo - smoke + testes verdes apos migracao

### M1.E - Base Tecnica Do Runtime Do Backend

> Esta frente fecha a base tecnica reutilizavel que o backend vai consumir. Ela nao substitui a orquestracao de produto do M2, mas evita que o backend precise reinventar primitives do legado.

- [ ] **M1-51** Definir primitivas compartilhadas de runtime para `context`, `trace`, `step`, `retry` e `progress`
- [ ] **M1-52** Migrar `ContextManager`, `TraceRecorder`, validacao de contrato, resolucao de idioma e execucao base de step para packages consumiveis
- [ ] **M1-53** Formalizar fronteiras de `memory`, `storage`, `corpus` e `adapters` como services/layers ou interfaces de package
- [ ] **M1-54** Cobrir a execucao do core sem HTTP com smoke tests e testes de composicao end-to-end

Dependencias:

- M0-01
- M0-04
- M0-05

Critério de pronto:

- os packages centrais existem, sao testaveis e podem ser consumidos pelo backend sem dependencias circulares

---

## Epic M2 - Backend Hono + Effect

> Esta fase substitui a estrutura atual por um backend composicional, mantendo a logica central fora dos handlers.

### M2.A - Casca HTTP e bootstrap

- [x] **M2-01** Criar `apps/backend`
- [x] **M2-02** Criar entrypoint e bootstrap do runtime Effect
- [x] **M2-03** Integrar Hono como borda HTTP
- [x] **M2-04** Criar roteamento base e handlers finos
- [x] **M2-05** Criar map de erros HTTP a partir dos erros tipados
- [x] **M2-06** Portar healthcheck e endpoints basicos
- [x] **M2-07** Introduzir validacao de request e response por schemas compartilhados

### M2.B - Execucao principal

- [x] **M2-08** Migrar o fluxo principal de execucao para Effect
- [x] **M2-09** Implementar contrato unico `sync`/`async` por strategy
- [x] **M2-10** Migrar idempotencia e fallback de qualidade para services Effect, incluindo: - enforcement de politica executavel por modo (`fast`, `balanced`, `strict`) - selecao de melhor candidato por score com retries por modo - limite global de chamadas LLM por job e criterio de parada - integracao do debito de creditos por ciclo de geracao (`reserve`, `capture`, `release`)
- [x] **M2-11** Migrar selecao de adapter/model e montagem de resposta
- [x] **M2-12** Remover regra de negocio de handlers
- [x] **M2-13** Cobrir o fluxo principal com testes de integracao

### M2.C - Capacidades herdadas da engine

- [x] **M2-14** Migrar o dominio de memory plugavel para packages + backend
- [x] **M2-15** Implementar leitura em camadas da memoria com invalidacao e write-through
- [x] **M2-16** Migrar resolucao de `LanguageProfile` para services compostos
- [x] **M2-17** Migrar language gate e retry corretivo para Effect
- [x] **M2-18** Migrar pipelines por tipo de conteudo para orchestrator
- [x] **M2-19** Migrar progress tracking e notificacoes para SSE
- [x] **M2-20** Implementar jobs e workers com persistencia recuperavel

### M2.D - Backend de produto

- [x] **M2-21** Integrar `packages/database`, `packages/ai-adapters`, `packages/payments` e `packages/feature-flags`, incluindo ledger de creditos e persistencia de ciclo de geracao
- [x] **M2-22** Integrar autorizacao de uso e limites de plano, separando limite de trafego (rate limit) de limite de saldo (creditos)
- [x] **M2-23** Expor contratos estaveis para consumo de apps e SDK
- [x] **M2-24** Documentar as rotas publicas e os contratos de integracao
- [x] **M2-25** Implementar telemetria de custo e qualisodade por geracao: - `llm_calls_total`, `input_tokens_total`, `output_tokens_total` - `estimated_usd_cost`, `debited_credits`, `selection_reason` - rastreabilidade por `jobId`, `generationCycleId` e `idempotencyKey`
- [x] **M2-26** Validar paridade funcional com o legado atual antes de desativar qualquer fluxo
- [x] **M2-27** Garantir que nenhuma rota ou fluxo de producao ainda dependa do runtime legado para execucao principal

### M2.E - Refinamento Dos Tipos Do Runtime

> Esta frente fecha a transicao dos `unknown` temporarios do runtime para tipos concretos, somente depois da execucao principal estar provada e antes da estabilizacao dos contratos publicos.

- [ ] **M2-28** Refinar `TraceEvent.payload`, `TraceStep.contract`, `TraceStep.parsedOutput`, `StepOutput.metadata` e `Context.state` em `packages/core` com tipos concretos, unions discriminadas ou modelos de estado por dominio
- [ ] **M2-29** Refinar `RefinementSkillContext`, `SkillExecutionResult` e `SkillInfo` em `packages/skills` para reduzir `unknown` em `userVoiceProfile`, `voiceExamples`, `contractValidation` e `contractViolations`
- [ ] **M2-30** Refinar contratos de `ExecutionAdapter`, `MemoryManager` e `TraceStoreLike` apenas onde o formato ja estiver estabilizado pelo backend, mantendo `unknown` apenas nas fronteiras externas reais
- [ ] **M2-31** Alinhar contratos publicos do backend e do SDK com os novos tipos fechados de trace, progress, job e runtime
- [ ] **M2-32** Cobrir o refinamento com smoke tests e guardrails de regressao para impedir reintroducao de `unknown` nas superficies ja estabilizadas

Dependencias:

- M1-01
- M1-11
- M1-19
- M1-22
- M1-24
- M1-28
- M1-51
- M1-52
- M1-53
- M1-54
- M2-28
- M2-29
- M2-30
- M2-31
- M2-32

Critério de pronto:

- o backend roda com Hono + Effect, consome os packages e preserva as capacidades centrais da engine como services compostos
- a paridade funcional com o legado atual foi validada para os fluxos que precisam ser mantidos
- nao existe dependencia operacional do runtime legado para o caminho principal da engine
- os `unknown` do runtime foram refinados onde o formato ja estava estavel e os contratos publicos ficaram tipados
- os tipos de trace, step e skill context foram fechados nas fronteiras ja estabilizadas e cobertos por regressao

---

## Epic M3 - Web

> A frente web valida o novo contrato tipado antes da chegada do mobile.

- [ ] **M3-01** Criar `apps/web`
- [ ] **M3-02** Integrar `packages/client-sdk`
- [ ] **M3-03** Definir autenticacao web e consumo padronizado do backend
- [ ] **M3-04** Implementar telas e fluxos iniciais baseados em contratos
- [ ] **M3-05** Tratar loading, erro, vazio e estados de job/progresso
- [ ] **M3-06** Validar padrao visual e de navegação com o produto real
- [ ] **M3-07** Cobrir o consumo web com testes de interface e contrato

Dependencias:

- M2-01
- M2-23

Critério de pronto:

- web consome o backend somente via client SDK e nao duplica contratos ou chamadas HTTP

---

## Epic M4 - Package De UI Compartilhada

> `packages/ui` entra somente quando a frente de front-end estiver concreta.

- [ ] **M4-01** Criar `packages/ui`
- [ ] **M4-02** Definir primitives visuais compartilhadas para web e mobile
- [ ] **M4-03** Definir tokens de design e wrappers de estilo
- [ ] **M4-04** Criar componentes para job, progresso, erro e estados vazios
- [ ] **M4-05** Integrar `ui` com `packages/client-sdk` e `packages/contracts`
- [ ] **M4-06** Cobrir componentes compartilhados com testes visuais basicos

Dependencias:

- M3-01

Critério de pronto:

- o pacote de UI e pequeno, util, compartilhado e nao vira uma aplicacao escondida

---

## Epic M5 - Mobile

> A frente mobile vem por ultimo e deve herdar o que foi estabilizado em web e UI.

- [ ] **M5-01** Criar `apps/mobile`
- [ ] **M5-02** Integrar `packages/client-sdk`
- [ ] **M5-03** Integrar `packages/ui`
- [ ] **M5-04** Adaptar componentes compartilhados para comportamento mobile
- [ ] **M5-05** Tratar navegação, loading, erro e offline quando aplicavel
- [ ] **M5-06** Validar autenticacao mobile e fluxo de dados
- [ ] **M5-07** Cobrir os fluxos principais com testes de integracao e smoke

Dependencias:

- M3-01
- M4-01

Critério de pronto:

- mobile reutiliza os contratos, o SDK e a UI sem duplicar regra central

---

## Epic M6 - Limpeza Do Legado E Paridade

> A limpeza so entra quando a nova estrutura estiver suficiente para substituir o caminho antigo com seguranca.

- [ ] **M6-01** Remover Fastify e adaptadores temporarios
- [ ] **M6-02** Remover controllers e middleware do legado
- [ ] **M6-03** Remover schemas duplicados e bridges de compatibilidade
- [ ] **M6-04** Consolidar documentacao final da arquitetura nova
- [ ] **M6-05** Validar build, lint, testes, smoke tests e parity checks
- [ ] **M6-06** Marcar o legado como somente consulta e encerrar dependencias ativas

Dependencias:

- M2-24
- M3-07
- M5-07

Critério de pronto:

- nao existe mais dupla arquitetura funcional na base

---

## Prioridades

### P0

- M0-01 a M0-09
- M1-01 a M1-18
- M1-37 a M1-54
- M2-01 a M2-13

### P1

- M2-14 a M2-32
- M3-01 a M3-07
- M4-01 a M4-06

### P2

- M5-01 a M5-07
- M6-01 a M6-06

---

## Ordem Recomendada De Execucao

1. fechar fundacao do monorepo
2. completar packages centrais
3. subir backend Hono + Effect
4. validar web via client SDK
5. criar `packages/ui`
6. ligar mobile
7. remover legado apos paridade

## Ordem Exata Dos Packages

1. `packages/contracts`
2. `packages/domain`
3. `packages/core`
4. `packages/orchestrator`
5. `packages/skills`
6. `packages/database`
7. `packages/ai-adapters`
8. `packages/feature-flags`
9. `packages/payments`
10. `packages/client-sdk`
11. `packages/ui` somente quando a frente web estiver concreta

---

## Regras De Uso

- nao abrir tarefas em paralelo que escrevam nos mesmos packages
- nao iniciar `web` ou `mobile` com packages incompletos
- nao remover legado antes de a nova estrutura cobrir o fluxo principal
- tarefas de cleanup so devem ser executadas depois da paridade funcional minima
- qualquer item reutilizado do backlog anterior deve ser reclassificado nesta nova ordem, nao copiado sem revisao
