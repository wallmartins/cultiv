---
title: Live Docs
doc_type: index
status: active
domain: documentation
last_updated: 2026-05-16
---

# Live Docs

Documentacao ativa do projeto organizada por tipo de documento.

## Convencoes

- nomes de arquivo em `kebab-case`
- pastas organizadas por tipo de documento
- frontmatter curto e consistente nos docs ativos

Campos de frontmatter usados:

- `title`
- `doc_type`
- `status`
- `domain`
- `last_updated`

Tipos mais comuns:

- `index`
- `policy`
- `plan`
- `issue-backlog`
- `prd`
- `api`
- `architecture`
- `reference`

## Estrutura

- `indexes/`
  - pontos de entrada e mapas de navegacao dos workstreams ativos
- `policies/`
  - politicas operacionais e comerciais que governam o produto
- `plans/`
  - roadmaps e planos de implementacao
- `issues/`
  - backlog estruturado por area
- `prd/`
  - product requirement documents ativos
- `api/`
  - contratos e direcao da superficie publica
- `architecture/`
  - visao arquitetural de sistema
- `reference/`
  - material de apoio, exemplos e documentacao geral
- `adr/`
  - architectural decision records

## Navegacao recomendada

Se voce estiver retomando a AI implementation:

1. `indexes/ai-implementation-index.md`
2. `policies/ai-policy-operational.md`
3. `plans/ai-roadmap.md`
4. `issues/ai-implementation-issues.md`
5. `api/backend-api.md`

Se voce estiver analisando billing:

1. `policies/billing-model-policy.md`
2. `plans/billing-model-implementation-plan.md`
3. `issues/billing-model-issues.md`

Se voce estiver analisando decisoes de arquitetura:

1. `adr/`
2. `architecture/architecture.md`
