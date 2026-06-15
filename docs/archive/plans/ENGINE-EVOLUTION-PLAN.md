# Engine Evolution Plan

> Documento de planejamento técnico completo. Base para todas as decisões de implementação.
> Não iniciar nenhuma fase sem validar consistência com este documento.

---

## Contexto e Princípios

### O que a engine é

Serviço HTTP standalone em TypeScript. Orquestra pipelines de geração de conteúdo com skills nativas e declarativas, memória plugável e contratos de validação de output.

### O que a engine não é

- Não é um monorepo com web
- Não gerencia autenticação (responsabilidade do backend externo Python)
- Não guarda estado de usuário como source of truth (Python Backend + Postgres)

### Princípios que guiam todas as decisões

| Princípio                   | Aplicação                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------- |
| Engine desacoplada          | Web consome via HTTP. Sem dependência de código. Tipos compartilhados via OpenAPI spec. |
| Contrato de retorno estável | API surface fixada antes de qualquer desenvolvimento web. Zero breaking change depois.  |
| Sync primeiro, async depois | Valida output antes de adicionar complexidade de jobs. Flag de configuração.            |
| Memory plugável             | Dev usa file-based. Produção usa camadas (LRU + Redis + HTTP remote). Troca por config. |
| Language-agnostic           | Dados e padrões linguísticos em perfis plugáveis. Engine não assume idioma.             |
| Domínio, não camada técnica | `src/` organizado por bounded context de negócio, não por tipo de arquivo.              |

---

## Arquitetura Alvo

### Engine como serviço standalone

```
[Web Backend / Frontend]
        |
        | HTTP (REST + SSE)
        v
[Engine Service — TypeScript / Fastify]
        |
        |-- [Skill Registry]
        |-- [Pipeline Executor]
        |-- [Language Profiles]
        |-- [Content Generation]
        |-- [Memory: LayeredAdapter]
        |-- [Notification: Pub/Sub]
        |
        v
[Redis]  ←→  [BullMQ Queue + Workers]
        |
        v
[Python Backend]  →  [Postgres]
```

### Comunicação com backend externo

- Engine recebe `userId` validado no header (Python Backend já autenticou)
- Engine nunca vê token de auth
- Leituras de memória: L1 (LRU) → L2 (Redis) → L3 (HTTP para Python Backend)
- Escritas de memória: write-through — invalida cache, escreve na fonte

### Execução de pipelines

Todos os pipelines são **async por design**. Usuário recebe confirmação imediata e notificação ao concluir. Durante desenvolvimento, flag `EXECUTION_MODE=sync` executa inline para facilitar validação de output.

```
Usuário solicita geração
  → Engine enfileira (ou executa inline em modo sync)
  → Retorna { jobId, status }
  → SSE publica progresso por step
  → Notificação ao concluir
  → Resultado disponível em GET /jobs/:jobId
```

---

## Estrutura de Domínios (src/ alvo)

```
src/
├── pipeline-execution/          # domínio: orquestrar e executar pipelines
│   ├── orchestrator.ts
│   ├── step-executor.ts
│   ├── error-recovery.ts
│   ├── strategy/
│   │   ├── sync-strategy.ts
│   │   ├── async-strategy.ts
│   │   └── index.ts
│   └── refinement/
│       ├── loop.ts
│       ├── decision-engine.ts
│       ├── ledger-builder.ts
│       ├── feedback-builder.ts
│       └── json-extraction.ts
│
├── skill-registry/              # domínio: registrar, validar, descobrir skills
│   ├── registry.ts
│   ├── store.ts
│   ├── declarative-executor.ts
│   └── validator.ts
│
├── content-generation/          # domínio: geração por tipo de conteúdo
│   ├── _shared/
│   │   ├── voice-match.yaml
│   │   ├── research.yaml
│   │   └── refine.yaml
│   ├── blog-post/
│   │   ├── pipeline.yaml
│   │   └── steps/
│   │       ├── 01-research.yaml
│   │       ├── 02-outline.yaml
│   │       ├── 03-draft.yaml
│   │       ├── 04-seo.yaml
│   │       └── 05-refine.yaml
│   ├── linkedin-post/
│   │   ├── pipeline.yaml
│   │   └── steps/
│   │       ├── 01-hook.yaml
│   │       ├── 02-insight.yaml
│   │       └── 03-cta.yaml
│   ├── twitter-thread/
│   │   ├── pipeline.yaml
│   │   └── steps/
│   │       ├── 01-hook-tweet.yaml
│   │       ├── 02-thread-body.yaml
│   │       └── 03-engagement.yaml
│   └── newsletter/
│       ├── pipeline.yaml
│       └── steps/
│           ├── 01-subject-line.yaml
│           ├── 02-sections.yaml
│           └── 03-cta.yaml
│
├── memory/                      # domínio: persistência e cache
│   ├── adapters/
│   │   ├── file-adapter.ts
│   │   ├── redis-adapter.ts
│   │   ├── http-adapter.ts
│   │   └── layered-adapter.ts
│   ├── voice-example-repository.ts
│   ├── example-scorer.ts
│   └── semantic-ranker.ts
│
├── language-profiles/           # domínio: perfis linguísticos plugáveis
│   ├── registry.ts
│   ├── detector.ts              # auto-detecção via franc
│   ├── types.ts                 # LanguageProfile interface
│   ├── pt-BR/
│   │   ├── index.ts
│   │   ├── dictionary.json
│   │   ├── patterns.ts
│   │   ├── prompts.ts
│   │   └── contracts.ts
│   └── en-US/
│       ├── index.ts
│       ├── dictionary.json
│       ├── patterns.ts
│       ├── prompts.ts
│       └── contracts.ts
│
├── notification/                # domínio: eventos de conclusão e progresso
│   ├── sse-handler.ts
│   ├── pubsub-notifier.ts
│   └── types.ts
│
├── language-gate/               # domínio: validação de idioma no output
│   ├── gate.ts
│   ├── detectors/
│   │   ├── performative.ts
│   │   ├── freshness.ts
│   │   ├── marker-isolated.ts
│   │   └── all-caps.ts
│   └── data/                   # dados movidos de código para arquivos
│       └── [removido — migrado para language-profiles/]
│
├── api/                         # surface HTTP exposta
│   ├── types.ts                 # contratos de retorno — IMUTÁVEL após Fase 3
│   ├── routes/
│   │   ├── pipelines.ts
│   │   ├── jobs.ts
│   │   ├── notifications.ts
│   │   └── content-types.ts
│   └── middleware/
│
├── contracts/                   # validação de output por contrato
│   ├── contract-engine.ts
│   ├── parser.ts
│   ├── validator.ts
│   └── validators/
│
├── types/                       # tipos compartilhados
│   └── guards/
│       ├── index.ts
│       ├── pipeline.ts
│       ├── trace.ts
│       ├── execution.ts
│       ├── context.ts
│       └── adapter.ts
│
└── validation/
    └── schemas/
        ├── index.ts
        ├── adapter.ts
        ├── skill.ts
        └── pipeline.ts
```

---

## API Surface — Contratos de Retorno

> Estes tipos são fixados na Fase 3 e não mudam depois. Web depende deles.

```typescript
// src/api/types.ts

export interface JobCreatedResponse {
  jobId: string;
  status: "queued" | "done"; // 'done' em modo sync
  contentType: string;
  estimatedSteps: number;
  createdAt: string;
}

export interface JobProgress {
  currentStep: string;
  stepIndex: number;
  totalSteps: number;
  percent: number;
}

export interface JobResult {
  content: string;
  metadata: Record<string, unknown>;
}

export interface JobError {
  message: string;
  step: string | null;
}

export interface JobStatusResponse {
  jobId: string;
  status: "queued" | "running" | "done" | "failed";
  contentType: string;
  progress: JobProgress | null;
  result: JobResult | null;
  error: JobError | null;
  createdAt: string;
  completedAt: string | null;
}

export interface SSEEvent {
  type: "progress" | "done" | "error";
  jobId: string;
  payload: JobProgress | JobResult | JobError;
}

export interface ContentTypeDefinition {
  id: string;
  label: string;
  steps: string[];
  defaultLanguage: string;
  inputSchema: Record<string, unknown>;
}
```

### Endpoints

```
POST   /pipelines              → JobCreatedResponse
GET    /jobs/:jobId            → JobStatusResponse
GET    /notifications/sse      → SSE stream de SSEEvent
GET    /content-types          → ContentTypeDefinition[]
GET    /skills                 → skill registry introspection
GET    /docs                   → OpenAPI spec (tipos para web)
GET    /health                 → health check
```

---

## Execution Strategy Pattern

```typescript
interface ExecutionStrategy {
  run(pipeline: Pipeline, input: PipelineInput): Promise<JobResult>;
}

// Fase 4 — ambas implementadas, flag determina qual usar
class SyncStrategy implements ExecutionStrategy {
  async run(pipeline, input) {
    const result = await executePipeline(pipeline, input);
    return { jobId: crypto.randomUUID(), status: "done", result };
  }
}

class AsyncStrategy implements ExecutionStrategy {
  constructor(private queue: BullMQQueue) {}
  async run(pipeline, input) {
    const jobId = crypto.randomUUID();
    await this.queue.add({ jobId, pipeline, input });
    return { jobId, status: "queued", result: null };
  }
}

// Config-driven — zero mudança no contrato HTTP ao trocar
const strategy =
  process.env.EXECUTION_MODE === "async"
    ? new AsyncStrategy(queue)
    : new SyncStrategy();
```

Em modo `sync`: `POST /pipelines` retorna resultado imediato com `status: 'done'`. `GET /jobs/:jobId` resolve instantaneamente via Map in-memory. Sem BullMQ, sem workers, sem Redis para jobs.

Em modo `async`: `POST /pipelines` retorna `status: 'queued'`. Workers executam. SSE entrega progresso. Notificação ao concluir.

---

## Memory — LayeredMemoryAdapter

```typescript
interface MemoryAdapter {
  read(userId: string, key: string): Promise<unknown>;
  write(userId: string, key: string, value: unknown): Promise<void>;
  delete(userId: string, key: string): Promise<void>;
  list(userId: string, prefix?: string): Promise<string[]>;
}

class LayeredMemoryAdapter implements MemoryAdapter {
  constructor(
    private config: {
      local: LRUCache;
      redis: RedisClient;
      remote: HttpMemoryAdapter;
    },
  ) {}

  async read(userId: string, key: string) {
    const cacheKey = `mem:${userId}:${key}`;

    // L1: in-process LRU (hot keys, TTL ~10s)
    const l1 = this.config.local.get(cacheKey);
    if (l1) return l1;

    // L2: Redis (warm keys, TTL ~60s)
    const l2 = await this.config.redis.get(cacheKey);
    if (l2) {
      const parsed = JSON.parse(l2);
      this.config.local.set(cacheKey, parsed);
      return parsed;
    }

    // L3: HTTP → Python Backend → Postgres (source of truth)
    const l3 = await this.config.remote.read(userId, key);
    await this.config.redis.setex(cacheKey, 60, JSON.stringify(l3));
    this.config.local.set(cacheKey, l3);
    return l3;
  }

  async write(userId: string, key: string, value: unknown) {
    const cacheKey = `mem:${userId}:${key}`;
    // write-through: invalida cache antes de escrever na fonte
    this.config.local.delete(cacheKey);
    await this.config.redis.del(cacheKey);
    await this.config.remote.write(userId, key, value);
  }
}

// Configuração na inicialização da engine
const engine = createEngine({
  memory:
    process.env.NODE_ENV === "production"
      ? new LayeredMemoryAdapter({ local, redis, remote: httpAdapter })
      : new FileMemoryAdapter(".engine/memory"),
});
```

---

## Language Profile Pattern

### Interface

```typescript
// src/language-profiles/types.ts

export interface LanguageProfile {
  code: string; // 'pt-BR' | 'en-US' | 'es-ES'
  name: string;
  dictionary: Set<string>;
  patterns: {
    performative: RegExp[]; // disclaimers e meta-discurso
    freshnessClichés: RegExp[]; // clichês de marketing
    markerIsolated: RegExp[]; // marcadores isolados
    validCharRange: RegExp; // caracteres válidos para o idioma
  };
  prompts: {
    draft: string;
    analyze: string;
    refine: string;
    adversarialCritic: string;
    voiceDriftCheck: string;
  };
  defaults: {
    tone: string;
    constraints: string[];
  };
  contracts: {
    forbiddenPatterns: string[];
    requiredMarkers: string[];
  };
  errorMessages: {
    foreignWords: string;
    nonLatinChars: string;
    retryInstruction: string;
  };
}
```

### Resolução de idioma

```typescript
// Prioridade de resolução
// 1. Pipeline input declara explicitamente: input.language = 'en-US'
// 2. Content type tem idioma padrão configurado
// 3. franc auto-detecta pelo texto do input

import { franc } from "franc";

const profile = await LanguageProfileRegistry.resolve({
  explicit: input.language,
  contentType: input.contentType,
  sample: input.topic,
});

// Injetado em todos os componentes que precisam de contexto linguístico
const gate = new LanguageGate(profile);
const critic = new CriticSkill(profile);
const drafter = new DraftSkill(profile);
```

### Adicionando novo idioma

1. Criar `src/language-profiles/en-US/`
2. Implementar `dictionary.json`, `patterns.ts`, `prompts.ts`, `contracts.ts`
3. Registrar no `LanguageProfileRegistry`
4. Nenhuma mudança na engine — zero código novo fora do perfil

---

## Content Generation por Tipo

### Por que separar

Cada formato tem estrutura, tom e constraints específicos:

- **LinkedIn Post**: hook obrigatório na linha 1 (mobile corta após 3 linhas), máx 3000 chars, CTA claro
- **Blog Post**: estrutura SEO, H2/H3, meta description, mínimo 800 palavras
- **Twitter Thread**: cada tweet unidade independente, cliffhanger por tweet, numeração
- **Newsletter**: subject line testável, CTA único, seções bem demarcadas

Uma instrução genérica não captura essas nuances → output mediano em todos os formatos.

### Steps compartilhados com override

```yaml
# content-generation/linkedin-post/steps/01-voice-match.yaml
extends: ../_shared/voice-match.yaml
constraints:
  maxChars: 3000
  hookRequired: true
  hookPosition: first-line
```

### Impacto na manutenção

Mudança em lógica de SEO do blog não afeta LinkedIn. Cada tipo evolui independente. Debug identificado por tipo + step específico.

---

## Plano de Execução por Fase

### Fase 1 — Refactor + Reorganização por Domínio + Language Profiles

> Objetivo: base de código limpa, organizada por domínio, agnóstica de idioma.
> Executar refactor E reorganização simultaneamente — um movimento só.

#### 1.1 Refactor de arquivos críticos

| Arquivo                                | Linhas | Problema                                                                         | Ação                                                                                                              |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `language-gate/dictionary-detector.ts` | 1267   | 80% dados estáticos inline                                                       | Extrair para `language-profiles/pt-BR/dictionary.json`. Classe fica ~200 linhas.                                  |
| `orchestrator/refinement-loop.ts`      | 1004   | Função procedural 295 linhas, mistura loop + decisão + ledger + JSON parsing     | Extrair `LoopDecisionEngine`, `QualityLedgerBuilder`, `IterationFeedbackBuilder`, `JsonExtractionService`         |
| `pipelines/registry.ts`                | 938    | Tipos + builder + quality policy + example selection + diagnostics num arquivo   | Split em `plan-builder.ts`, `quality-policy.ts`, `example-selection.ts`, `diagnostics.ts`                         |
| `types/guards.ts`                      | 816    | 816 linhas sem organização por domínio                                           | Split em `guards/pipeline.ts`, `guards/trace.ts`, `guards/execution.ts`, `guards/context.ts`, `guards/adapter.ts` |
| `core/orchestrator.ts`                 | 799    | God class: step execution + error handling + refinement + language gates + trace | Extrair `StepExecutor`, `LanguageGateHandler`, `RefinementLoopHandler`, `ErrorRecovery`                           |
| `memory/voice-examples.ts`             | 616    | DB access + embedding + scoring + ranking tudo junto                             | Split em `voice-example-repository.ts`, `example-scorer.ts`, `semantic-ranker.ts`                                 |
| `validation/schemas.ts`                | 580    | Schemas Zod sem organização por domínio                                          | Split em `schemas/adapter.ts`, `schemas/skill.ts`, `schemas/pipeline.ts`                                          |

#### 1.2 Language Profile Pattern

- Criar `src/language-profiles/types.ts` com interface `LanguageProfile`
- Criar `src/language-profiles/registry.ts` com resolução por prioridade
- Criar `src/language-profiles/detector.ts` com `franc` para auto-detecção
- Migrar `pt-BR`:
  - `dictionary-detector.ts` → `pt-BR/dictionary.json` + classe reduzida
  - `language-gate/flag-words.ts` → `pt-BR/patterns.ts`
  - `critic/detectors/performative.ts` → `pt-BR/patterns.ts`
  - `critic/detectors/freshness.ts` → `pt-BR/patterns.ts`
  - `critic/detectors/marker-isolated.ts` → `pt-BR/patterns.ts`
  - `config/prompts/*.ts` → `pt-BR/prompts.ts`
  - `contracts/library/validation-post.contract.ts` → `pt-BR/contracts.ts`
  - `language-gate/gate.ts` mensagens de erro → `pt-BR/errorMessages`
- Criar perfil `en-US` vazio com estrutura pronta para preenchimento futuro
- Injetar `LanguageProfile` em `LanguageGate`, `CriticSkill`, `DraftSkill`

#### 1.3 Reorganização por domínio

Mover arquivos refatorados para estrutura de domínio definida na seção anterior.

#### Critérios de conclusão da Fase 1

- [ ] Nenhum arquivo com mais de 300 linhas (exceto arquivos de dados/JSON)
- [ ] `src/` organizado pelos domínios definidos
- [ ] `language-profiles/pt-BR/` completo e funcional
- [ ] `language-profiles/en-US/` com estrutura criada (conteúdo pode ser vazio)
- [ ] Todos os testes passando
- [ ] Nenhum breaking change na API existente

---

### Fase 2 — Content Generation por Tipo

> Objetivo: cada tipo de conteúdo tem pipeline e steps próprios, declarativos.

#### Ações

- Criar `src/content-generation/` com estrutura de diretórios por tipo
- Implementar `_shared/` com steps reutilizáveis (`voice-match`, `research`, `refine`)
- Implementar `extends:` para override de constraints por tipo
- Criar pipelines declarativos para: `blog-post`, `linkedin-post`, `twitter-thread`, `newsletter`
- Migrar contracts de TypeScript hardcoded para declarativo por tipo
- Criar `ContentTypeStore` seguindo o padrão de persistência já adotado no projeto
- Substituir `PIPELINE_TYPES` hardcoded em `pipelines/registry.ts` por carregamento dinâmico

#### Critérios de conclusão da Fase 2

- [ ] 4 tipos de conteúdo declarativos funcionando
- [ ] Steps compartilhados em `_shared/` sem duplicação
- [ ] Contratos declarativos por tipo (fora de TypeScript)
- [ ] `GET /content-types` retornando tipos disponíveis
- [ ] Qualidade de output validada manualmente por tipo

---

### Fase 3 — API Surface Estável

> Objetivo: contratos de retorno fixados. Web pode começar com segurança.

#### Ações

- Criar `src/api/types.ts` com todos os tipos definidos neste documento
- Garantir que todos os endpoints retornam exatamente os tipos declarados
- Configurar Fastify Swagger para geração automática de OpenAPI spec
- Expor `GET /docs` com spec em JSON
- Adicionar `GET /health` com status básico
- Validar com testes de integração que retornos batem 100% com `types.ts`

#### Critérios de conclusão da Fase 3

- [ ] `src/api/types.ts` completo e sem `any`
- [ ] Todos os endpoints validados contra os tipos
- [ ] `GET /docs` retornando OpenAPI spec válido
- [ ] Testes de integração cobrindo todos os endpoints

---

### Fase 4 — Execution Strategy (infra async pronta, flag sync)

> Objetivo: infraestrutura async completa. Flag `EXECUTION_MODE=sync` ativa por padrão.

#### Ações

- Implementar `SyncStrategy`: executa pipeline inline, retorna resultado imediato
- Implementar `AsyncStrategy`: enfileira no BullMQ, retorna `jobId` com `status: 'queued'`
- Implementar workers BullMQ que consomem a fila e executam pipelines
- Implementar `GET /jobs/:jobId` com store em Redis (async) ou Map in-memory (sync)
- Configurar `EXECUTION_MODE` como variável de ambiente
- `EXECUTION_MODE=sync` como padrão em `.env.example`

#### Critérios de conclusão da Fase 4

- [ ] `SyncStrategy` funcionando e testado
- [ ] `AsyncStrategy` + workers implementados e testados
- [ ] `GET /jobs/:jobId` funciona em ambos os modos
- [ ] Troca de modo via variável de ambiente sem nenhuma mudança de código
- [ ] Contrato HTTP idêntico nos dois modos

---

### Fase 5 — Memory Plugável

> Objetivo: `LayeredMemoryAdapter` pronto para produção.

#### Ações

- Implementar `FileMemoryAdapter` (formalizar o que já existe)
- Implementar `RedisMemoryAdapter` (L2)
- Implementar `HttpMemoryAdapter` (L3 → Python Backend)
- Implementar `LayeredMemoryAdapter` com L1 (LRU) + L2 + L3
- Configurar via `MEMORY_BACKEND` variável de ambiente
- Dev usa `FileMemoryAdapter`. Produção usa `LayeredMemoryAdapter`.
- Documentar API que o Python Backend deve expor para o `HttpMemoryAdapter`

#### API esperada do Python Backend (memory endpoints)

```
GET  /internal/memory/:userId/:key        → { value: unknown }
PUT  /internal/memory/:userId/:key        → 204
DELETE /internal/memory/:userId/:key      → 204
GET  /internal/memory/:userId?prefix=x   → { keys: string[] }
```

Autenticação via `X-Internal-Secret` header (shared secret entre engine e backend).

#### Critérios de conclusão da Fase 5

- [ ] `LayeredMemoryAdapter` implementado e testado com mocks
- [ ] Troca de adapter via variável de ambiente
- [ ] API do Python Backend documentada
- [ ] Cache invalidation testado (write invalida L1 e L2)

---

### Fase 6 — SSE + Notificações

> Objetivo: usuário recebe progresso em tempo real e notificação ao concluir.

#### Ações

- Implementar `GET /notifications/sse` com Server-Sent Events
- Worker publica no Redis pub/sub a cada step concluído
- API layer assina pub/sub e forwarda para conexões SSE ativas
- Eventos por step: `{ type: 'progress', stepName, percent }`
- Evento de conclusão: `{ type: 'done', result }`
- Usuário offline: persistir notificação via `POST /internal/notifications` no Python Backend
- Na reconexão: `GET /notifications/pending` retorna notificações não lidas

#### Critérios de conclusão da Fase 6

- [ ] SSE funcionando com progresso por step
- [ ] Reconexão SSE sem perda de eventos
- [ ] Notificações persistidas para usuários offline
- [ ] Evento de erro publicado no caso de falha de pipeline

---

## Sequência de Execução

```
①  Extrair portuguese-dictionary.json do dictionary-detector.ts
②  Split types/guards.ts por domínio
③  Split validation/schemas.ts por domínio
④  Criar language-profiles/types.ts + registry.ts + detector.ts
⑤  Migrar pt-BR para language-profiles/pt-BR/ (patterns, prompts, contracts)
⑥  Split pipelines/registry.ts em módulos
⑦  Refactor core/orchestrator.ts → extrair handlers
⑧  Refactor orchestrator/refinement-loop.ts → extrair classes
⑨  Refactor memory/voice-examples.ts → extrair camadas
⑩  Reorganizar src/ por domínio (mover arquivos refatorados)
⑪  Implementar content-generation/ por tipo (blog, linkedin, twitter, newsletter)
⑫  Fixar API surface em src/api/types.ts
⑬  Configurar Fastify Swagger → GET /docs
⑭  Implementar SyncStrategy + AsyncStrategy + workers BullMQ
⑮  Implementar LayeredMemoryAdapter (L1 + L2 + L3)
⑯  Implementar SSE + notificações offline
```

---

## Decisões Registradas

| ID    | Decisão                                         | Razão                                                                               |
| ----- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| D-E01 | Engine standalone, sem monorepo                 | Web desacoplada. Deploys independentes. Tipos via OpenAPI spec, não npm.            |
| D-E02 | Todos pipelines async por design                | UX previsível. Engine sem pressão de timeout HTTP. Resiliente a crashes.            |
| D-E03 | EXECUTION_MODE=sync como padrão de dev          | Valida output sem complexidade de jobs. Flag de config para migrar.                 |
| D-E04 | Strategy pattern para execução                  | Contrato HTTP idêntico em sync e async. Troca sem mudança de cliente.               |
| D-E05 | Language Profile pattern                        | Engine agnóstica de idioma. Adicionar língua = criar perfil, zero código na engine. |
| D-E06 | franc para auto-detecção de idioma              | Open source, 400+ idiomas, offline, zero API cost.                                  |
| D-E07 | Content type por diretório declarativo          | Qualidade de output + manutenção cirúrgica. Mudança isolada por tipo.               |
| D-E08 | LayeredMemoryAdapter (LRU + Redis + HTTP)       | Dev simples. Produção escalável. Troca por variável de ambiente.                    |
| D-E09 | SSE para progresso (não WebSocket)              | Unidirecional suficiente para esse caso. Menos overhead que WebSocket.              |
| D-E10 | Nenhum arquivo de domínio > 300 linhas          | Forçar separação de responsabilidades. Facilitar revisão e teste.                   |
| D-E11 | src/ organizado por domínio, não camada técnica | Bounded contexts claros. Mudança cirúrgica por domínio de negócio.                  |

---

## Riscos e Mitigações

| Risco                                                   | Probabilidade | Impacto | Mitigação                                                                                    |
| ------------------------------------------------------- | ------------- | ------- | -------------------------------------------------------------------------------------------- |
| Refactor quebra testes existentes                       | Alta          | Médio   | Executar suite a cada extração. Um arquivo por vez.                                          |
| Language profile pt-BR incompleto após migração         | Média         | Alto    | Checklist de migração por arquivo. Teste de regressão de output.                             |
| API surface mudar após Fase 3                           | Baixa         | Alto    | Tipos em `api/types.ts` tratados como contrato público. PR review obrigatório para mudanças. |
| Latência de L3 (HTTP para Python Backend) em cache miss | Média         | Médio   | TTL agressivo em L2 (Redis). Write-through para manter cache quente.                         |
| BullMQ workers travados em pipeline lento               | Média         | Médio   | Timeout por step configurável. Dead letter queue para jobs falhos.                           |

---

## Variáveis de Ambiente

```bash
# Execução
EXECUTION_MODE=sync          # 'sync' | 'async'

# Memory
MEMORY_BACKEND=file          # 'file' | 'layered'
REDIS_URL=redis://localhost:6379
PYTHON_BACKEND_URL=http://localhost:8000
INTERNAL_SECRET=<shared-secret>

# Language
DEFAULT_LANGUAGE=pt-BR       # fallback quando não detectado

# BullMQ (apenas quando EXECUTION_MODE=async)
QUEUE_CONCURRENCY=10
QUEUE_MAX_RETRIES=3
```
