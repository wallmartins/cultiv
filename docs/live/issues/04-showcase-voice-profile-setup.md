---
title: Showcase Voice Profile Setup
doc_type: issue
status: active
domain: marketing-surface
slice_type: HITL
last_updated: 2026-06-09
---

# Showcase Voice Profile Setup

Guia manual (Bruno) para montar um **perfil de voz com boa diversidade** antes de gerar as amostras do showcase via backend.

**Relacionado:** `04-showcase-generation-guide.md` (geração das 6 amostras)

## O que o backend espera

| Sinal | Regra (derivada do código) |
|-------|----------------------------|
| Confiança **high** | ≥ 5 exemplos ativos + diversidade suficiente |
| Diversidade | Variar `explicitContentType`, `channel`, `format` e tamanho do texto |
| Cobertura por formato | ≥ 2 exemplos por `contentType` ajuda na cobertura média |
| Idioma | Mantenha **um idioma** por perfil (`pt-BR` recomendado para o showcase PT) |
| Pin | 1 exemplo `pinned: true` ancora a voz (ex.: LinkedIn) |

Este kit envia **6 exemplos em `pt-BR`** cobrindo os 3 formatos do showcase + newsletter + architecture + um segundo LinkedIn.

## Pré-requisitos

1. Backend rodando (`pnpm dev`) com Postgres (`docker compose up postgres`).
2. URL base: `http://localhost:3000`
3. Postgres rodando e migrado:

```bash
docker compose up -d postgres
pnpm --filter @my-ai-orchestrator/backend migrate
```

4. Com **`pnpm dev` já rodando**, execute o setup de auth + consent + plano (uma vez):

```bash
pnpm showcase:voice-setup
```

O script também ativa o plano `pro` no processo do backend (billing é em memória — precisa do servidor ligado).

Copie para o Bruno:

- variável `baseUrl` = `http://localhost:3000`
- variável `authorization` = valor **completo** do script (já inclui `Bearer `)

Em cada request, configure:

| Header | Valor |
|--------|-------|
| `Authorization` | `{{authorization}}` |
| `Content-Type` | `application/json` |

Não use `Bearer {{authorization}}` — isso duplica o prefixo e causa 401.

Reinicie `pnpm dev` após atualizar o repo e rode `pnpm showcase:voice-setup` de novo (token expira em ~1h).

> Sem consent, `POST /me/voice-profile/examples` retorna erro de consentimento de treino de voz.

### Se algo falhar

| Erro | Causa provável | Ação |
|------|----------------|------|
| `Cannot use a pool after calling end` | Bug corrigido — atualize o repo | `git pull` e reinicie `pnpm dev` |
| `"[object Object]" is not valid JSON` | Coluna JSONB lida como objeto (Postgres) | Idem — já corrigido nos repositórios |
| `Failed to introspect database` | Postgres parado ou `DATABASE_URL` errado | Suba o container e confira `.env` |
| `Authorization bearer token is required` | Header ausente no Bruno | Header `Authorization` = `{{authorization}}` |
| `invalid_signature` / `invalid_token` | Token de outro processo ou `Bearer` duplicado | Reinicie o backend, rode `showcase:voice-setup` de novo, use `{{authorization}}` sem prefixo extra |
| `expired_token` | Token com mais de 1h | Rode `pnpm showcase:voice-setup` novamente |
| `voice_training_consent_required` / consentimento de treino de voz | Migração `0004` não aplicada ou `showcase:voice-setup` não rodou após migrate | `pnpm --filter @my-ai-orchestrator/backend migrate` e depois `pnpm showcase:voice-setup` |
| `Missing tables: voice_training_consents` | Migração pendente (ou histórico `kysely_migration` vazio com schema antigo) | `pnpm --filter @my-ai-orchestrator/backend migrate` — o runner faz baseline automático se as tabelas antigas já existirem |
| `requires an active plan` / `plan_restriction` | Plano não ativado no processo do `pnpm dev` | Com backend ligado: `pnpm showcase:voice-setup` ou `POST /dev/showcase/billing-activate` |
| `Pinned example limit exceeded` / 500 no commit | Vários `pinned: true` com poucos exemplos, ou **items adicionados mais de uma vez** no mesmo batch | Crie um **novo batch**, envie os 6 itens **uma vez** (só `ex-01` com `pinned: true`) e faça commit |

O `showcase:voice-setup` pode rodar com o backend ligado ou desligado.

---

## Fluxo recomendado (batch)

Ordem: **criar batch → adicionar itens → commit → validar perfil**

Substitua `{{baseUrl}}` e use o header `Authorization: {{authorization}}` em todas as requisições abaixo.

---

### 0 · Ver perfil atual (opcional)

**GET** `{{baseUrl}}/me/voice-profile`

```bash
curl --request GET \
  --url http://localhost:3000/me/voice-profile \
  --header 'Authorization: Bearer <cole-do-showcase:voice-setup>'
```

Se 404, normal antes do primeiro exemplo.

---

### 1 · Criar batch

**POST** `{{baseUrl}}/me/voice-profile/example-batches`

Body:

```json
{}
```

```bash
curl --request POST \
  --url http://localhost:3000/me/voice-profile/example-batches \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <token>' \
  --data '{}'
```

Guarde `batchId` da resposta.

---

### 2 · Adicionar os 6 exemplos (uma vez por batch)

**POST** `{{baseUrl}}/me/voice-profile/example-batches/{{batchId}}/items`

Não repita este POST no mesmo `batchId` — cada chamada **acumula** itens. Para o showcase, **6 exemplos bastam** e apenas **um** deve ter `pinned: true` (enquanto o perfil tem &lt; 5 exemplos, o limite de pin é 1).

Body (cole no Bruno — troque `BATCH_ID`):

```json
{
  "items": [
    {
      "clientItemId": "ex-01-linkedin-pinned",
      "input": {
        "text": "Parei de tratar curso como plano de carreira. Aprendi mais ouvindo colegas em café do que em qualquer slide de tendências — e hoje escolho com mais critério o que merece meu tempo de estudo.",
        "language": "pt-BR",
        "channel": "linkedin",
        "format": "post",
        "explicitContentType": "linkedin-post",
        "pinned": true,
        "context": "Post curto, opinião direta, sem CTA forçado."
      }
    },
    {
      "clientItemId": "ex-02-linkedin-curation",
      "input": {
        "text": "Carreira, pra mim, virou curadoria: o que estudar, o que ignorar, e quando dizer não para mais um framework da semana.",
        "language": "pt-BR",
        "channel": "linkedin",
        "format": "post",
        "explicitContentType": "linkedin-post",
        "context": "Segunda amostra LinkedIn — tom mais sintético."
      }
    },
    {
      "clientItemId": "ex-03-blog-pause",
      "input": {
        "text": "Parei de tratar descanso como prêmio depois do expediente. Quando entendi que pausa faz parte do trabalho — não é o oposto dele — minha semana ficou mais leve e mais previsível. Não foi sobre trabalhar menos; foi sobre parar de medir valor só pelo cansaço acumulado.",
        "language": "pt-BR",
        "channel": "blog",
        "format": "article",
        "explicitContentType": "long-form-blog",
        "context": "Abertura reflexiva de artigo longo."
      }
    },
    {
      "clientItemId": "ex-04-thread-consistency",
      "input": {
        "text": "1/ Três anos publicando toda terça — mesmo quando não tinha ideia.\n2/ O segredo não foi volume; foi um formato pequeno que eu conseguia sustentar.\n3/ Consistência, pra mim, é gentileza com o leitor: ele sabe quando voltar.",
        "language": "pt-BR",
        "channel": "twitter",
        "format": "thread",
        "explicitContentType": "twitter-thread",
        "context": "Thread curta, numeração explícita."
      }
    },
    {
      "clientItemId": "ex-05-newsletter-reflective",
      "input": {
        "text": "Esta semana percebi de novo que meus melhores textos não nascem de mais uma pesquisa — nascem de uma observação pequena que eu não deixei passar. Escrevo newsletters assim: contexto primeiro, opinião no meio, convite honesto no final, sem tom de vendas.",
        "language": "pt-BR",
        "channel": "newsletter",
        "format": "email",
        "explicitContentType": "newsletter",
        "context": "Parágrafo mais longo, ritmo reflexivo."
      }
    },
    {
      "clientItemId": "ex-06-architecture-tradeoff",
      "input": {
        "text": "Quando explico uma decisão de arquitetura, eu começo pelo limite que nos forçou a escolher — não pelo diagrama bonito. Trade-off primeiro, solução depois. Mesmo em assunto técnico, continuo em primeira pessoa e evito tom de whitepaper.",
        "language": "pt-BR",
        "channel": "blog",
        "format": "essay",
        "explicitContentType": "architecture-post",
        "context": "Tom técnico mas pessoal; diversifica cadência."
      }
    }
  ]
}
```

```bash
curl --request POST \
  --url http://localhost:3000/me/voice-profile/example-batches/BATCH_ID/items \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <token>' \
  --data @showcase-voice-batch-items.json
```

> Dica: salve o JSON acima como `showcase-voice-batch-items.json` na raiz do repo para usar com `-d @arquivo`.

---

### 3 · Commit do batch (dispara rebuild do perfil)

**POST** `{{baseUrl}}/me/voice-profile/example-batches/{{batchId}}/commit`

```bash
curl --request POST \
  --url http://localhost:3000/me/voice-profile/example-batches/BATCH_ID/commit \
  --header 'Authorization: Bearer <token>'
```

---

### 4 · Validar qualidade do perfil

**GET** `{{baseUrl}}/me/voice-profile`

Confira na resposta:

| Campo | Esperado |
|-------|----------|
| `profile.confidence` | `high` |
| `profile.adaptationMode` | `standard` |
| `diagnostics.reasonCodes` | `[]` |
| `materialBase.activeExamples` | `6` |
| `materialBase.byContentType` | `linkedin-post`, `long-form-blog`, `twitter-thread`, `newsletter`, `architecture-post` |

Se `confidence` for `medium` ou `low`:

- `insufficient_examples` → adicione mais exemplos (via novo batch ou POST individual)
- `insufficient_diversity` → varie `channel`, `format` ou `explicitContentType`
- `language_conflict` → remova exemplos em outro idioma ou crie outro usuário para EN

**GET** `{{baseUrl}}/me/voice-profile/examples`

Lista todos os exemplos gravados.

---

## Alternativa: um exemplo por vez

Útil para ajustar copy antes do commit.

**POST** `{{baseUrl}}/me/voice-profile/examples`

Exemplo 01 (LinkedIn pinado):

```json
{
  "text": "Parei de tratar curso como plano de carreira. Aprendi mais ouvindo colegas em café do que em qualquer slide de tendências — e hoje escolho com mais critério o que merece meu tempo de estudo.",
  "language": "pt-BR",
  "channel": "linkedin",
  "format": "post",
  "explicitContentType": "linkedin-post",
  "pinned": true
}
```

```bash
curl --request POST \
  --url http://localhost:3000/me/voice-profile/examples \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <token>' \
  --data '{"text":"Parei de tratar curso como plano de carreira. Aprendi mais ouvindo colegas em café do que em qualquer slide de tendências — e hoje escolho com mais critério o que merece meu tempo de estudo.","language":"pt-BR","channel":"linkedin","format":"post","explicitContentType":"linkedin-post","pinned":true}'
```

Repita para os outros 5 textos do passo 2 (sem `pinned` nos demais).

Cada `POST` dispara rebuild assíncrono; após o 5º–6º, confira o perfil.

---

## Showcase em inglês

O perfil acima é **`pt-BR`**. Para gerar EN com a mesma autoria:

**Opção A (rápida):** use o mesmo perfil e passe `"language": "en-US"` nas execuções do `04-showcase-generation-guide.md` — a voz adapta, mas o material base é PT.

**Opção B (mais fiel):** rode `pnpm showcase:voice-setup --subject showcase-cultiv-hitl-en`, crie 6 exemplos em `en-US` (mesma estrutura de formatos) e use esse token só nas gerações EN.

---

## Próximo passo

Com `profile.confidence: "high"`, siga o **`04-showcase-generation-guide.md`** para gerar os `voiceOutput` das 6 amostras via `POST /me/voice-profile` → `POST /me/executions/run`.

## Referência rápida de rotas

| Ação | Método | Rota |
|------|--------|------|
| Ver perfil | GET | `/me/voice-profile` |
| Listar exemplos | GET | `/me/voice-profile/examples` |
| Criar exemplo | POST | `/me/voice-profile/examples` |
| Criar batch | POST | `/me/voice-profile/example-batches` |
| Itens do batch | POST | `/me/voice-profile/example-batches/:batchId/items` |
| Commit | POST | `/me/voice-profile/example-batches/:batchId/commit` |
| Gerar conteúdo | POST | `/me/executions/run` |
