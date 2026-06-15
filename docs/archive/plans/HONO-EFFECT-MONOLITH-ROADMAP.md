# Hono + Effect Monolith Migration Roadmap

> Roadmap executivo derivado do plano e do backlog de migracao.
>
> Objetivo final: eliminar completamente a arvore `src/` legado e consolidar a fonte de verdade no monorepo novo.
>
> Este documento nao reabre decisoes arquiteturais. Ele transforma o panorama atual em uma sequencia executavel de trabalho.

---

## 1. Objetivo

A migracao precisa fechar em tres resultados:

- o novo monorepo concentra contratos, dominio, runtime e produto
- o codigo legado deixa de ser consumido
- a arvore `src/` pode ser removida sem perda funcional relevante

O criterio de sucesso nao e “ter quase tudo no novo”. O criterio e:

- nenhuma capacidade relevante do produto depende do legado
- nenhum fluxo de producao depende de `src/`
- o legado nao e mais necessario para evoluir o produto

---

## 2. Regras De Execucao

### 2.1 Ordem obrigatoria

1. consolidar a base de runtime no novo stack
2. terminar a granularidade de voz e qualidade textual no novo stack
3. portar ou aposentar a infraestrutura legada de suporte
4. portar ou aposentar a borda legada de app e features
5. fechar as superfícies consumidoras finais
6. remover `src/`

### 2.2 Regras de corte

- se uma capacidade ainda tem valor de produto, ela precisa existir no novo stack antes da remocao do legado correspondente
- se uma capacidade nao tem valor, ela deve ser removida, nao portada
- nao criar um segundo sistema paralelo no novo stack
- todo novo trabalho deve reforcar packages, services, layers, contracts e apps

### 2.3 Critério de pronto por frente

Uma frente so e considerada concluida quando:

- o comportamento relevante existe no novo stack
- a cobertura de teste valida o fluxo novo
- o legado correspondente nao e mais referenciado por producao
- o legado correspondente pode ser removido sem quebra funcional

---

## 3. Frentes Executaveis

### Frente A - Runtime Base Do Novo Stack

**Objetivo**

Fechar a base de runtime que ainda aparece como ponte temporaria entre o legado e o novo stack.

**Escopo**

- `M1-51` primitivas compartilhadas de `context`, `trace`, `step`, `retry`, `progress`
- `M1-52` migracao de `ContextManager`, `TraceRecorder`, validacao de contrato, resolucao de idioma e execucao base de step
- `M1-53` fronteiras de `memory`, `storage`, `corpus` e `adapters`
- `M1-54` smoke tests e composicao end-to-end sem HTTP
- `M2-28` a `M2-32` refinamento de tipos do runtime

**Entrega esperada**

- o runtime central fica tipado, composicional e consumivel sem dependencias no legado
- os contratos do backend e do SDK ficam fechados o suficiente para evolucao segura

**Impacto no legado**

- reduz as ultimas colas conceituais de `src/core`, `src/pipeline-execution` e `src/types`
- prepara o terreno para apagar o runtime antigo sem reintroduzir equivalentes paralelos

---

### Frente B - Voz E Qualidade Textual

**Objetivo**

Portar toda a granularidade de voz, refinamento e avaliacao textual para o stack novo.

**Escopo**

- `packages/text-quality` como motor de voz/qualidade
- `packages/skills` como gerador de candidatas
- `packages/orchestrator` como coordenador de lanes e selecao
- `src/skills/*` de voz, critic, humanizer, fidelity, drift, adversarial critic, analyze, refine
- `src/config/prompts/*` associados a essas capacidades
- `src/language-profiles/*` e `src/language-gate/*`
- `src/memory/voice-examples.ts` e `src/features/voice/*`
- `src/content-generation/*` que ainda carrega semantica de pipeline textual

**Entrega esperada**

- o novo fluxo consegue gerar texto com voz do usuario sem depender de skills legadas
- a concorrencia por plano passa a viver no novo stack
- a escolha do melhor candidato fica centralizada em `text-quality`

**Impacto no legado**

- remove a dependencia mais importante do sistema antigo
- permite apagar o caminho de refinamento e voz no `src/`

---

### Frente C - Infraestrutura Legada De Suporte

**Objetivo**

Migrar ou aposentar a infraestrutura que ainda sustenta o legado por baixo.

**Escopo**

- `src/adapters/*`
- `src/storage/*`
- `src/memory/*`
- `src/corpus/*`
- `src/dsl/*`
- `src/validation/*`
- `src/template/*`
- partes ainda utilizadas de `src/contracts/*`

**Entrega esperada**

- providers, persistencia, corpus e validacoes passam a existir em packages novos ou deixam de existir
- o novo stack nao precisa mais importar infra do legado

**Impacto no legado**

- elimina a espinha dorsal tecnica que ainda impede apagar `src/`
- reduz a complexidade de substituicao dos consumers finais

---

### Frente D - App Legado E Features

**Objetivo**

Desativar a aplicacao antiga como fonte de verdade de produto.

**Escopo**

- `src/api/*`
- `src/server.ts`
- `src/features/pipeline/*`
- `src/features/skills/*`
- `src/features/voice/*`
- `src/features/benchmark/*`
- `src/features/health/*`
- `src/shared/*`
- `src/index.ts`

**Entrega esperada**

- o backend novo cobre rotas, jobs, health, SSE e execucao
- o app antigo deixa de ser usado para producao

**Impacto no legado**

- remove a borda HTTP e as features que ainda mantem o monolito antigo vivo

---

### Frente E - Consumidores Finais

**Objetivo**

Garantir que as superficies consumidoras finais estejam prontas para substituir o legado sem dependencia indireta.

**Escopo**

- `packages/client-sdk`
- `apps/web`
- `apps/mobile`
- `packages/ui` quando a frente web/mobile comecar

**Entrega esperada**

- consumidores usam contratos novos, nao estruturas do legado
- web e mobile nao puxam o runtime antigo por conveniencia

**Impacto no legado**

- impede que o legado sobreviva por razoes de integracao tardia

---

### Frente F - Remocao Final Do Legado

**Objetivo**

Eliminar a arvore `src/` depois da paridade funcional minima e da validacao dos consumidores.

**Escopo**

- apagar a arvore `src/`
- remover scripts, aliases e referencias restantes
- limpar documentacao e testes que apontarem para o legado

**Entrega esperada**

- o repositorio deixa de ter dois sistemas concorrentes
- o novo monorepo passa a ser a unica base operacional

**Impacto no legado**

- encerramento total da migracao

---

## 4. Ordem Recomendada De Execucao

### Fase 1

Fechar a base de runtime e os tipos do novo stack.

Prioridade:

1. M1-51
2. M1-52
3. M1-53
4. M1-54
5. M2-28
6. M2-29
7. M2-30
8. M2-31
9. M2-32

### Fase 2

Portar a granularidade de voz e qualidade textual.

Prioridade:

1. voz e voice profile
2. criticagem e humanizacao
3. fidelidade e voice drift
4. refinement loops
5. selecao concorrente por plano

### Fase 3

Migrar infraestrutura legada de suporte.

Prioridade:

1. adapters
2. storage
3. memory
4. corpus
5. DSL e validation

### Fase 4

Apagar a app legada e suas features.

Prioridade:

1. API e server
2. features de pipeline, skills, voice e benchmark
3. shared middleware/plugins
4. root exports e entrypoints do legado

### Fase 5

Fechar consumidores finais e apagar `src/`.

Prioridade:

1. client SDK
2. web
3. mobile
4. remocao final do legado

---

## 5. Sinais De Pronto

### O roadmap avanca quando:

- o novo stack cobre o comportamento que antes so existia no legado
- os testes do novo stack substituem a dependencia de teste no legado
- a documentação aponta para packages novos, nao para `src/`
- o backlog nao tem mais dependencia funcional em arquivos legados

### O roadmap termina quando:

- nenhuma rota, job, skill, contrato ou adapter de producao depende da arvore `src/`
- os prompts e a semantica de voz existem no novo stack
- a borda HTTP antiga pode ser deletada
- o novo monorepo e suficiente para manter e evoluir o produto sozinho

---

## 6. Mapeamento De Extincao Do Legado

### Ainda precisa sair do legado

- runtime base
- voz e refinamento textual
- adapters e storage
- memory e corpus
- DSL e validation
- API e features
- consumers finais

### Ja tem destino novo

- contracts
- domain
- core
- orchestrator
- skills
- database
- ai-adapters
- feature-flags
- payments
- text-quality
- backend

---

## 7. Regra Final

O legado nao deve ser mantido por inercia.

Se algo do legado ainda existir no final da migracao, ele so pode sobreviver se:

- nao tiver valor de produto, e portanto for claramente descartado; ou
- ainda nao tiver sido substituido de forma completa no novo stack.

Quando a segunda condicao deixar de existir, o legado precisa ser removido.

