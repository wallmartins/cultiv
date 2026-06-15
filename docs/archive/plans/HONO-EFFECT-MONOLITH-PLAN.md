# Hono + Effect Monorepo Plan

> Plano de implementacao para migrar o projeto para um monorepo modular com Hono na borda HTTP e Effect como linguagem principal de composicao, validacao e injeccao de dependencias.
>
> Este documento organiza a migracao em fases claras: primeiro os `packages`, depois o `backend`, depois `web` e, por ultimo, `mobile`.
>
> As capacidades herdadas da engine anterior foram reinterpretadas para a nova realidade do projeto e para a filosofia do EffectTS. O que nao se encaixa nessa filosofia foi excluido do plano.

---

## 1. Objetivo Do Projeto

Transformar o projeto em uma base monorepo unica, com:

- compartilhamento real de tipos, schemas e contratos
- separacao forte entre dominio, aplicacao e infraestrutura
- backend com Hono + Effect
- web e mobile consumindo um client SDK tipado
- possibilidade de deploy independente por superficie
- base preparada para evoluir sem duplicar regra de negocio
- capacidade de manter estrategia de execucao, memoria, idioma, conteudo e notificacao como dominios compostos por services e layers

O foco deste plano nao e apenas reorganizar pastas. O objetivo e criar uma arquitetura sustentavel para o longo prazo, com baixo acoplamento, contrato estavel e compartilhamento consistente entre todas as camadas.

---

## 2. Capacidades Herdadas Da Engine

As capacidades abaixo continuam fazendo sentido e devem ser preservadas na migracao, mas agora modeladas dentro de packages, contracts, services e layers.

### 2.1 Estrategia De Execucao

O sistema deve continuar suportando dois modos de execucao:

- `sync` para desenvolvimento, validacao e iteracao rapida
- `async` para producao, jobs, filas e resiliencia operacional

A implementacao deve expor um contrato unico e trocar apenas a estrategia interna via configuracao.

No EffectTS isso deve ser modelado como:

- um contrato de execucao em `contracts`
- uma abstracao de estrategia em `core` ou `orchestrator`
- implementacoes `SyncStrategy` e `AsyncStrategy`
- composicao por `Layer`

### 2.2 Memory Plugavel

A memoria do produto continua sendo um dominio importante e deve permanecer plugavel.

O desenho alvo deve suportar:

- adaptador local para dev
- adaptador cacheado para producao
- adaptador remoto quando houver fonte externa
- politica de leitura em camadas
- politica de escrita com invalidacao e write-through quando necessario

No EffectTS isso deve virar um servico de memoria composto por layers, nao uma classe central acoplada ao backend.

### 2.3 Profiles De Idioma

O sistema continua sendo sensivel a idioma, tom e regras de output.

O conceito de `LanguageProfile` deve ser preservado como dominio:

- perfil explicito por entrada
- fallback por tipo de conteudo
- fallback por deteccao automatica quando aplicavel
- prompts, patterns e contracts por idioma

No novo desenho, isso deve viver como um pacote de dominio e contracts, consumido por skills e orchestrator.

### 2.4 Content Generation Por Tipo

O produto continua precisando de pipelines diferentes por tipo de conteudo.

Isso inclui, por exemplo:

- blog post
- LinkedIn post
- Twitter/X thread
- newsletter

Cada tipo deve ter:

- contrato proprio
- steps proprios
- validacoes proprias
- variacoes de estilo e estrutura

No novo desenho, isso deve ser representado em `orchestrator`, `skills` e `contracts`, com suporte a declaracao de pipeline por tipo.

### 2.5 Progresso E Notificacoes

O backend precisa continuar suportando progresso por etapa e notificacoes de conclusao.

Isso deve incluir:

- jobs
- progresso incremental
- SSE para streaming de updates
- erros tipados
- estado recuperavel

No EffectTS isso se encaixa naturalmente em streams, jobs e composicoes de services.

---

## 3. Ordem De Implementacao

A ordem de implementacao precisa ser respeitada para evitar retrabalho:

1. fundacao do monorepo
2. packages de dominio, contratos e infraestrutura compartilhavel
3. backend Hono + Effect
4. web
5. packages de UI compartilhada, entrando junto da fase de web/mobile
6. mobile

Regra principal:

- `packages` tem prioridade maxima no inicio
- `packages/ui` nao entra na fase inicial de core
- `packages/ui` so deve ser criado quando a frente de web e mobile comecar
- `web` vem antes de `mobile`
- `mobile` e a ultima entrega da trilha principal

---

## 4. Visao Geral Da Arquitetura

### 4.1 Estrutura alvo do monorepo

```txt
my-ai-orchestrator/
├── apps/
│   ├── backend/
│   ├── web/
│   └── mobile/
├── packages/
│   ├── contracts/
│   ├── core/
│   ├── domain/
│   ├── orchestrator/
│   ├── skills/
│   ├── database/
│   ├── ai-adapters/
│   ├── payments/
│   ├── feature-flags/
│   ├── client-sdk/
│   ├── ui/
│   └── config/
├── tooling/
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### 4.2 Papel De Cada Area

- `apps/backend`: runtime HTTP, auth, jobs, webhooks, composicao final
- `apps/web`: interface web e consumo do client SDK
- `apps/mobile`: interface mobile e consumo do client SDK
- `packages/contracts`: schemas, DTOs, erros tipados, contratos RPC
- `packages/domain`: entidades, value objects, regras puras
- `packages/core`: bootstrap de Effect, config, logger, tracing, DI
- `packages/orchestrator`: casos de uso, workflows, pipelines e coordenacao
- `packages/skills`: capacidades reutilizaveis da IA
- `packages/database`: reposititorios e adapters de persistencia
- `packages/ai-adapters`: integracoes com LLMs e providers
- `packages/payments`: billing, planos, entitlements, gateways
- `packages/feature-flags`: avaliacao de flags e providers de ambiente
- `packages/client-sdk`: client tipado para consumo de HTTP no web e mobile
- `packages/ui`: primitives e componentes visuais compartilhados
- `packages/config`: configs compartilhadas de tooling

---

## 5. Regras De Dependencia

### 5.1 Regra Base

Dependencia sempre aponta para dentro. Camadas mais externas podem consumir as mais internas, mas nunca o contrario.

### 5.2 Fluxo Permitido

- `contracts` nao depende de infraestrutura do projeto
- `domain` depende no maximo de `contracts` e da stdlib
- `core` depende de `contracts` e de utilitarios transversais
- `skills` depende de `domain`, `contracts` e `core`
- `orchestrator` depende de `domain`, `contracts`, `core` e `skills`
- `database` depende de `domain`, `contracts` e do ORM escolhido
- `ai-adapters` depende de `contracts` e `core`
- `payments` depende de `domain`, `contracts` e `core`
- `feature-flags` depende de `contracts` e `core`
- `client-sdk` depende de `contracts`, de um transport HTTP e de helpers de autenticacao
- `ui` depende de `contracts`, de tokens e de dependencias visuais compartilhadas
- `apps/backend` pode depender de todos os packages
- `apps/web` e `apps/mobile` devem depender de `contracts`, `client-sdk`, `core` e `ui`

### 5.3 Regras De Isolamento

- nenhum package deve importar arquivo interno de outro package fora da API publica
- cada package deve expor sua superficie via `src/index.ts`
- `domain` nao pode conhecer HTTP, banco, gateway ou SDK externo
- `orchestrator` coordena fluxo, mas nao deve conter detalhe de infraestrutura
- `ui` nao deve conter regra de negocio
- `client-sdk` nao deve conter regra de negocio

---

## 6. Definicao Dos Packages

### 6.1 `contracts`

Responsabilidades:

- schemas com `Effect.Schema`
- DTOs de request e response
- eventos compartilhaveis
- erros tipados
- contratos de endpoint e payloads serializaveis
- contratos de execucao
- contratos de jobs, memoria, idioma e conteudo

Nao deve conter:

- acesso a banco
- integracao com LLM
- regra de negocio operacional
- dependencia de app ou framework

### 6.2 `domain`

Responsabilidades:

- entidades como `User`, `Pipeline`, `Skill`, `Plan`
- value objects
- invariantes
- politicas de dominio
- regras puras
- erros de dominio
- modelos de `LanguageProfile`
- modelos de pipeline
- modelos de conteudo
- modelos de memoria

Nao deve conter:

- HTTP
- ORM
- chamadas externas
- manipulacao de transporte

### 6.3 `core`

Responsabilidades:

- bootstrap de Effect
- composition root base
- config compartilhada
- logger
- tracing
- helpers de erro
- utilitarios de integracao transversal
- bootstrap de runtime do backend
- composicao de strategies de execucao

### 6.4 `orchestrator`

Responsabilidades:

- orquestracao de pipelines
- sequenciamento de skills
- refinamento de saida
- controle de retry e fallback
- estado de execucao
- aplicacao de regras de fluxo
- selecao de strategy de execucao
- coordenacao de jobs
- coordenacao de steps por tipo de conteudo

### 6.5 `skills`

Responsabilidades:

- implementacoes de habilidades como `analyze`, `draft`, `refine`, `voice-match`
- transforms e composicoes reusaveis
- operacoes orientadas a efeito
- skills sensiveis a idioma
- skills de validacao e refinement

As skills devem ser estruturadas para funcionar de forma composicional e testavel.

### 6.6 `database`

Responsabilidades:

- reposititorios concretos
- mapeamento ORM <-> dominio
- queries
- transacoes
- persistencia de entidades e execucoes
- persistencia de jobs, progresso e historico de execucao
- persistencia de memoria quando a implementacao exigir
- estrategia `PostgreSQL-first` para producao
- suporte a `pgvector` para busca semantica e memoria vetorial
- separacao entre repositorios transacionais e vetoriais
- migracoes versionadas de schema e indices
- fallback com SQLite apenas para desenvolvimento e testes locais

### 6.7 `ai-adapters`

Responsabilidades:

- clientes OpenAI, Anthropic, Ollama e outros
- normalizacao de request e response
- timeout, retry e rate limit
- adaptacao de provider para interface comum
- adaptadores remotos complementares quando aplicavel

### 6.8 `payments`

Responsabilidades:

- integracao com gateways
- assinatura e renovacao
- planos
- entitlements
- eventos de pagamento

### 6.9 `feature-flags`

Responsabilidades:

- interface comum de flags
- providers por ambiente
- cache e fallback
- leitura padronizada por toda a aplicacao
- flags de execucao sync/async
- flags de habilitacao por tipo de conteudo quando necessario

### 6.10 `client-sdk`

Responsabilidades:

- expor funcoes tipadas para chamar o backend via HTTP
- encapsular `fetch` ou client HTTP equivalente
- padronizar headers, auth e erros
- converter request e response com base nos contratos compartilhados
- expor funcoes tipadas para jobs, conteudo, memoria observavel e status

Nao deve conter:

- regra de negocio
- decisoes de dominio
- acesso direto a dependencias internas do backend

### 6.11 `ui`

Responsabilidades:

- primitives visuais
- componentes compartilhados entre web e mobile
- tokens de design e wrappers de estilo
- composicoes simples e reutilizaveis
- componentes que lidem bem com estados de job, progresso e erro

### 6.12 `config`

Responsabilidades:

- `tsconfig`
- `eslint`
- `prettier`
- `turbo`
- regras comuns de tooling

---

## 7. Decisao Sobre `ui`

O package de UI e valido, mas deve ser tratado como fase posterior, nao como ponto de partida.

Recomendacao:

- criar `ui` somente quando a frente de web e mobile comecar
- usar `ui` para primitives e composicoes leves
- evitar transformar `ui` em um app escondido
- manter o pacote pequeno, previsivel e visualmente consistente

Se a equipe tentar criar `ui` cedo demais, o risco e cristalizar decisoes visuais sem contexto real de produto. O ideal e primeiro consolidar contratos, dominio e backend; depois, com as necessidades concretas de interface, fazer a camada compartilhada de UI.

---

## 8. Estrategia De Implantacao

### 8.1 Monorepo Com Deploy Separado

O monorepo nao significa deploy unico.

Cada app continua com ciclo independente:

- backend deploya separado
- web deploya separado
- mobile publica separado

### 8.2 Compatibilidade Retroativa

Para evitar downtime:

- mudar contratos em etapas
- publicar backend que aceite formatacao antiga e nova quando necessario
- atualizar consumidores apos o backend
- remover compatibilidade legada somente apos estabilizacao

### 8.3 Regra Operacional

Mudancas de schema e contrato devem seguir o principio:

1. adicionar sem quebrar
2. publicar backend compativel
3. atualizar consumidor
4. remover legado depois

---

## 9. Plano De Execucao

## Fase 0 - Fundacao Do Monorepo

Objetivo:

- criar a estrutura base do monorepo
- estabelecer workspace, tooling e convencoes
- preparar a plataforma para os packages que virao primeiro
- preparar o espaco para dominios herdados da engine antiga, mas ja reinterpretados em packages

Tarefas:

- criar `pnpm-workspace.yaml`
- organizar `turbo.json`
- definir aliases e resolucao de paths
- criar `packages/config`
- padronizar lint, formatacao e TypeScript
- estabelecer convencoes de exportacao
- definir regra de dependencia entre packages

Saida esperada:

- monorepo funcional e previsivel
- base de tooling pronta para os packages

Critério de pronto:

- qualquer novo package segue a mesma convencao de build e export

---

## Fase 1 - Packages Primeiro

Objetivo:

- construir a base compartilhada da aplicacao antes de iniciar backend ou front-end
- consolidar os dominios herdados da engine dentro da nova arquitetura Effect

Prioridade interna desta fase:

1. `contracts`
2. `domain`
3. `core`
4. `orchestrator`
5. `skills`
6. `database`
7. `ai-adapters`
8. `payments`
9. `feature-flags`
10. `client-sdk` como esqueleto inicial, podendo ser amadurecido apos o backend

Entregas esperadas desta fase:

- `contracts` com schemas base de execucao, job, conteudo, memoria e idioma
- `domain` com entidades e modelos centrais
- `core` com bootstrap e layers transversais
- `orchestrator` com a espinha dorsal de execucao e pipeline
- `skills` com a base de refine, draft e validacao
- primitives de runtime para `context`, `trace`, `step`, `retry` e `progress`
- fronteiras tecnicas de `memory`, `storage`, `corpus` e `adapters` como services ou interfaces de package
- smoke e testes de composicao para o core sem dependencia de HTTP
- `database` com repositorios essenciais
- `ai-adapters` com providers externos iniciais
- `feature-flags` com interface unica
- `client-sdk` com superficie inicial de consumo

Tarefas por pacote:

- definir estrutura interna padronizada
- criar `src/index.ts` publico
- criar testes de unidade basicos
- definir contratos de erro
- padronizar nomenclatura
- documentar fronteiras de responsabilidade
- para `database`, definir:
- schema transacional para billing, ledger, jobs, progresso e idempotencia
- schema vetorial para embeddings de memoria e exemplos
- estrategia de indices relacionais e vetoriais
- bootstrap de migracoes e validacao da extensao `pgvector`

Saida esperada:

- os fundamentos compartilhados estao prontos
- backend e apps passam a consumir contratos e dominio estaveis
- os dominios herdados da engine estao preservados em uma nova forma compativel com EffectTS

Critério de pronto:

- nenhum fluxo central depende de codigo espalhado em app
- `contracts` e `domain` ja conseguem sustentar os casos principais

---

## Fase 2 - Backend

Objetivo:

- implementar o backend Hono + Effect usando a base criada pelos packages
- integrar as capacidades herdadas da engine como services compostos

Tarefas:

- criar `apps/backend`
- montar composition root do Effect
- integrar Hono como borda HTTP
- criar rotas e handlers finos
- conectar `contracts` aos endpoints
- integrar `orchestrator`, `skills`, `database`, `ai-adapters`, `payments` e `feature-flags`
- fechar a base tecnica de runtime antes de depender do backend para primitives do legado
- padronizar erros HTTP
- adicionar autenticao e autorizacao
- adicionar jobs e execucoes assincronas
- implementar o contrato unico de execucao sync/async
- implementar o dominio de memoria plugavel
- implementar a resolucao de profiles de idioma
- implementar streams de progresso e notificacoes por SSE
- implementar pipelines por tipo de conteudo
- refinar os tipos do runtime nas fronteiras ja estabilizadas apos a primeira execucao end-to-end
- fechar trace, step e skill context em tipos concretos quando o formato deixar de variar entre fluxos
- integrar conexao `PostgreSQL` no runtime do backend
- validar disponibilidade da extensao `pgvector` no startup
- expor services de consulta vetorial com filtros de dominio
- garantir transacoes seguras para consumo de creditos e ledger auditavel

Status atual:

- M2.A ja esta entregue: `apps/backend` existe, o bootstrap usa Effect, o Hono esta na borda HTTP e request/response/error passam por contratos compartilhados.
- M2.B tambem esta entregue: o fluxo principal roda em Effect, o contrato `sync`/`async` esta centralizado, idempotencia e politica de qualidade estao no service, o debito de credito por ciclo de geracao foi integrado e o fluxo principal tem testes de integracao.
- M2.C tambem esta entregue: memoria plugavel, language profile composition, language gate, progress via SSE e worker assincro com job store atualizado estao integrados no backend.

Saida esperada:

- backend funcional com arquitetura limpa
- logica de negocio central fora dos handlers
- execucao, memoria, idioma, conteudo e notificacao operando como dominios de primeiro nivel
- paridade funcional validada com o legado para os fluxos que permanecem suportados
- tipos do runtime refinados nas superficies que ja se estabilizaram durante a migracao

Critério de pronto:

- o backend expoe a API principal de forma estavel
- contratos compartilhaveis estao efetivamente validados no runtime
- o caminho principal da engine nao depende mais do runtime legado
- os contratos publicos nao expõem `unknown` desnecessario nas superficies ja estabilizadas

---

## Fase 3 - Web

Objetivo:

- construir a interface web em cima do backend ja consolidado
- validar o consumo tipado dos contratos e do client SDK com a primeira superficie real de interface

Tarefas:

- criar `apps/web`
- integrar o `client-sdk`
- criar `packages/ui`
- definir tokens visuais compartilhados
- montar componentes base
- implementar telas e fluxos web
- padronizar autenticacao no browser
- tratar loading, erro e estados vazios
- representar jobs, progresso, status e erro de forma consistente com o backend

Regras desta fase:

- `ui` nasce aqui, nao antes
- `web` consome `client-sdk`, nao acessa backend por caminho improvisado
- telas devem consumir componentes do `ui` quando houver ganho claro

Saida esperada:

- front-end web operando com a mesma base tipada do backend

Critério de pronto:

- web nao duplica contratos ou chamadas HTTP
- UI compartilhada existe e e util, nao ornamental

---

## Fase 4 - Mobile

Objetivo:

- construir o app mobile depois da validacao da base web
- reaproveitar o que foi consolidado em web sem duplicar regra ou contrato

Tarefas:

- criar `apps/mobile`
- integrar `client-sdk`
- integrar `packages/ui`
- adaptar estilos e comportamento para mobile
- tratar navegacao, loading, erro e offline quando aplicavel
- validar fluxo de autenticacao mobile
- consumir os mesmos contratos de execucao, job, conteudo e status

Regras desta fase:

- mobile vem por ultimo
- somente agora faz sentido consolidar os componentes compartilhados em UI
- onde houver divergencia de UX, o componente deve aceitar extensao por plataforma

Saida esperada:

- mobile reutilizando a base compartilhada sem copiar logica de app

Critério de pronto:

- mobile usa contratos, SDK e UI compartilhados
- ajustes especificos de plataforma nao quebram a base comum

---

## 10. Sequencia Recomendada De Trabalho

1. fundar o monorepo
2. criar `contracts`
3. criar `domain`
4. criar `core`
5. criar `orchestrator`
6. criar `skills`
7. criar `database`
8. criar `ai-adapters`
9. criar `payments`
10. criar `feature-flags`
11. esqueleto de `client-sdk`
12. implementar backend
13. iniciar web
14. criar `packages/ui`
15. integrar `client-sdk` e `ui` na web
16. iniciar mobile
17. integrar `client-sdk` e `ui` no mobile
18. consolidar e limpar o legado

---

## 11. Regras De Implementacao

- cada package tem dono claro
- cada package expõe apenas sua API publica
- `packages` nao devem depender de `apps`
- `ui` deve permanecer pequeno e pragmatico
- `client-sdk` deve ser estateless e previsivel
- backend concentra a composicao final do sistema
- web e mobile dependem da estabilidade de contratos, nao de detalhes internos
- capacidades herdadas da engine devem ser expressas como services, layers e contracts, nunca como uma subarquitetura paralela

### 11.1 Governanca Da Base

A fundacao do monorepo deve ser mantida pela documentacao em
[docs/archive/plans/MONOREPO-GOVERNANCE.md](./MONOREPO-GOVERNANCE.md) e pelo smoke test
minimo do workspace.

Isso significa que, antes de criar novas superfices, devemos manter sempre validos:

- a politica de dependencias entre packages
- as convencoes de naming
- o smoke test minimo do monorepo
- a exposicao publica via `src/index.ts`
- a compatibilidade dos packages com a estrutura do workspace

---

## 12. Critérios De Qualidade

### 12.1 Testes

- testes unitarios por package
- testes de integracao por caso de uso
- contract tests para API
- testes de composicao do backend
- testes de interacao do SDK com o backend
- testes de strategy sync/async
- testes de memory adapter em camadas
- testes de language profile
- testes de pipeline por tipo de conteudo
- testes de SSE e progresso
- testes de integracao com PostgreSQL real
- testes de migracao e compatibilidade de schema
- testes de concorrencia para transacoes de credito e ledger
- testes de busca vetorial com `pgvector` (top-k e filtros)

### 12.2 Observabilidade

- logging estruturado
- correlation id
- trace por execucao
- metricas por skill, job e provider
- metricas por strategy, memory layer e tipo de conteudo

### 12.3 Seguranca

- validacao explicita em todas as bordas
- secrets fora do codigo
- isolamento de infraestrutura
- respostas tipadas e previsiveis
- contratos imutaveis para os pontos de integracao ja estabilizados

---

## 13. Decisoes Registradas

| ID | Decisao | Razao |
| --- | --- | --- |
| M-01 | Monorepo unico | Compartilhamento real e deploy separado |
| M-02 | Packages primeiro | Reduz retrabalho e evita fronteiras mal definidas |
| M-03 | Backend depois dos packages | Garante base estavel antes da composicao final |
| M-04 | Web antes de mobile | Valida a experiencia compartilhada com menor custo |
| M-05 | `ui` apenas na fase de front-end | Evita antecipar decisoes visuais |
| M-06 | `client-sdk` tipado | Reduz duplicacao entre web e mobile |
| M-07 | Hono + Effect no backend | Transporte fino e core composicional |
| M-08 | `contracts` como fonte de verdade | Tipagem e serializacao alinhadas em toda a pilha |
| M-09 | Execucao sync/async como estrategia | Migra sem perder previsibilidade e flexibilidade |
| M-10 | Memory e idioma como dominios | Mantem capacidades centrais da engine no novo modelo |
| M-11 | Pipelines por tipo de conteudo | Preserva especializacao de saida sem duplicar infraestrutura |
| M-12 | SSE para progresso | Mantem visibilidade operacional sem alterar contrato central |
| M-13 | PostgreSQL + pgvector como persistencia principal | Une transacao forte para billing e jobs com busca vetorial para memoria e contexto |

---

## 14. Critério Final De Sucesso

O plano so esta concluido quando:

- o monorepo esta organizado e documentado
- os packages centrais estao prontos e reutilizaveis
- o backend esta em Hono + Effect
- o `client-sdk` permite consumo tipado do backend
- a web esta publicada usando a base compartilhada
- o `ui` compartilhado faz sentido pratico e e usado de verdade
- o mobile esta publicado por ultimo
- a arquitetura evita duplicacao de regra de negocio
- a base suporta evolucao sem reescrever as camadas principais
- as capacidades herdadas da engine continuam presentes, agora como dominios compostos e testaveis dentro do monorepo
