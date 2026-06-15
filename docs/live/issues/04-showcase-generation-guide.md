---
title: Showcase Generation Guide
doc_type: issue
status: active
domain: marketing-surface
slice_type: HITL
last_updated: 2026-06-09
---

# PoderShowcase Generation Guide

Guia manual para gerar as 6 amostras do showcase (3 formatos × 2 idiomas).

**Issue pai:** `04-showcase-samples-catalog.md`

## Comparativo justo

O lado esquerdo do showcase **não** é IA genérica corporativa. É o que uma pessoa realmente faria no ChatGPT ou Claude: descrever como escreve, colar um exemplo de tom, pedir para imitar a voz e passar o mesmo briefing.

O lado direito é o Cultiv — mesma pauta, voz treinada no backend.

Os prompts da coluna A podem ser exibidos publicamente (`generation.genericPrompt` em cada amostra) para dar transparência ao comparativo.

### Regra de domínio (lexical quality)

A partir do programa **Text Generation Lexical Quality**, o backend classifica cada briefing como `non-technical`, `technical` ou `mixed`. Em briefings **não técnicos** (carreira, aprendizado, comunicação), a geração **não deve** usar jargão de software, nomes de ferramentas ou metáforas de engenharia.

Ao regenerar `voiceOutput` após atualizar o backend:

1. Use briefings alinhados ao domínio do showcase (ex.: LinkedIn de carreira → non-technical).
2. Revise o texto gerado: sem *cache*, *deploy*, *stack* etc. salvo se o briefing for explicitamente técnico.
3. Feature flag: `generation.lexicalQualityV2` (default `on`).

## Antes de começar

1. **Perfil de voz:** monte o perfil com diversidade suficiente — ver `04-showcase-voice-profile-setup.md` (Bruno + `pnpm showcase:voice-setup`).
2. Suba o backend local (`pnpm dev` na raiz ou `apps/backend`).
3. **Plano ativo:** com `pnpm dev` rodando, execute `pnpm showcase:voice-setup` — isso ativa o plano `pro` (via `BILLING_PLAN_ID`) para o usuário do showcase. Sem isso, `POST /me/executions/run` retorna erro de plano.
4. Confirme a URL base — no `.env` local o backend usa `PORT=3000`:
  ```
   http://localhost:3000
  ```
5. No Bruno, use as variáveis impressas por `pnpm showcase:voice-setup` (`baseUrl`, `authorization`).
6. Todas as requisições abaixo precisam do header `Authorization: {{authorization}}`.

### Ativar plano manualmente (Bruno)

Se a geração falhar com *requires an active plan*, com o backend em `development`:

```http
POST {{baseUrl}}/dev/showcase/billing-activate
Authorization: {{authorization}}
```

Resposta esperada: `planId: "pro"`, `active: true`, `availableCredits > 0`.

## Fluxo por amostra

Para cada bloco abaixo:


| Passo | O quê                                                                         | Onde colar o resultado                      |
| ----- | ----------------------------------------------------------------------------- | ------------------------------------------- |
| A     | Cole o **prompt de voz no ChatGPT/Claude** (tentativa real de imitar sua voz) | Atualize `genericOutput` no arquivo do tema |
| B     | Execute o **curl** no Bruno (`POST /me/executions/run`)                       | Atualize `voiceOutput` no arquivo do tema   |


**Arquivos de destino (fonte da verdade):**


| Formato   | Arquivo                                                 |
| --------- | ------------------------------------------------------- |
| Blog post | `apps/web/src/content/showcase/themes/blog-post.ts`     |
| LinkedIn  | `apps/web/src/content/showcase/themes/linkedin-post.ts` |
| Thread    | `apps/web/src/content/showcase/themes/thread.ts`        |


Dentro de cada arquivo, edite `locales.pt` ou `locales.en`.

**Resposta do backend:** use o campo `content` do JSON. Metadados de voz vêm em `voice`.

---

## 01 — Blog post · PT

**Briefing (UI):** artigo sobre produtividade sustentável sem burnout  
**Content type:** `long-form-blog`  
**Arquivo:** `themes/blog-post.ts` → `locales.pt`

### A · Prompt no ChatGPT / Claude (imitar sua voz)

Cole o bloco inteiro no chat:

```
Preciso de ajuda para escrever um artigo de blog. Quero que o texto soe como EU escrevi — não como um post genérico de produtividade.

Como eu costumo escrever (use isso como referência de voz):
- Primeira pessoa, tom reflexivo e direto
- Parto de algo que mudei na prática, não de frases motivacionais
- Evito aberturas tipo "em um mundo cada vez mais acelerado" ou listas numeradas de dicas
- Prefiro parágrafos curtos; sem tom de guru

Exemplo do meu estilo (não copie o conteúdo, só o tom):
"Parei de tratar descanso como prêmio depois do expediente. Quando entendi que pausa faz parte do trabalho, minha semana ficou mais previsível."

Briefing do artigo:
- Tema: Produtividade sustentável sem burnout
- Tese: Pausa intencional e limites claros aumentam a qualidade do trabalho — não diminuem a produtividade
- Público: Profissionais de conhecimento em startups e empresas de tecnologia
- Estrutura sugerida:
  1. Por que a cultura do hustle falha no longo prazo
  2. Pausa como parte do trabalho, não como recompensa
  3. Rituais de limite que cabem na semana real
  4. Como medir resultado sem obsessão por métricas de vaidade

Escreva o início do artigo (~350–450 palavras) na minha voz. Revise para não parecer escrito por IA.
```

→ Revise e salve em `genericOutput` (locale `pt`).

### B · Geração com voz (Bruno)

**Método:** `POST`  
**URL:** `http://localhost:3000/me/executions/run`  
**Header:** `Content-Type: application/json`

Body (cole no Bruno):

```json
{
  "contentType": "long-form-blog",
  "briefing": {
    "topic": "Produtividade sustentável sem burnout",
    "thesis": "Pausa intencional e limites claros aumentam a qualidade do trabalho — não diminuem a produtividade",
    "audience": "Profissionais de conhecimento em startups e empresas de tecnologia",
    "outline": [
      "Por que a cultura do hustle falha no longo prazo",
      "Pausa como parte do trabalho, não como recompensa",
      "Rituais de limite que cabem na semana real",
      "Como medir resultado sem obsessão por métricas de vaidade"
    ]
  },
  "language": "pt-BR",
  "qualityMode": "balanced"
}
```

Importar no Bruno via cURL:

```bash
curl --request POST \
  --url http://localhost:3000/me/executions/run \
  --header 'Content-Type: application/json' \
  --data '{"contentType":"long-form-blog","briefing":{"topic":"Produtividade sustentável sem burnout","thesis":"Pausa intencional e limites claros aumentam a qualidade do trabalho — não diminuem a produtividade","audience":"Profissionais de conhecimento em startups e empresas de tecnologia","outline":["Por que a cultura do hustle falha no longo prazo","Pausa como parte do trabalho, não como recompensa","Rituais de limite que cabem na semana real","Como medir resultado sem obsessão por métricas de vaidade"]},"language":"pt-BR","qualityMode":"balanced"}'
```

→ Revise `content` e salve em `voiceOutput` (locale `pt`).

---

## 02 — Blog post · EN

**Briefing (UI):** article on sustainable productivity without burnout  
**Content type:** `long-form-blog`  
**Arquivo:** `themes/blog-post.ts` → `locales.en`

### A · ChatGPT / Claude prompt (match your voice)

```
I need help writing a blog article. I want it to sound like ME — not a generic productivity post.

How I usually write (use this as a voice reference):
- First person, reflective and direct
- I start from something I changed in practice, not motivational slogans
- No openings like "in today's fast-paced world" or numbered tip lists
- Short paragraphs; no guru tone

Example of my style (don't copy the content, only the tone):
"I stopped treating rest as a reward after work. Once I saw pause as part of the job, my weeks got more predictable."

Article briefing:
- Topic: Sustainable productivity without burnout
- Thesis: Intentional pause and clear boundaries improve work quality — they don't reduce productivity
- Audience: Knowledge workers at startups and tech companies
- Suggested outline:
  1. Why hustle culture fails in the long run
  2. Pause as part of work, not a reward after it
  3. Boundary rituals that fit a real week
  4. How to measure outcomes without vanity metrics

Write the opening (~350–450 words) in my voice. Polish it so it doesn't read like AI.
```

→ Save to `genericOutput` (locale `en`).

### B · Voice generation (Bruno)

**Method:** `POST`  
**URL:** `http://localhost:3000/me/executions/run`  
**Header:** `Content-Type: application/json`

Body:

```json
{
  "contentType": "long-form-blog",
  "briefing": {
    "topic": "Sustainable productivity without burnout",
    "thesis": "Intentional pause and clear boundaries improve work quality — they don't reduce productivity",
    "audience": "Knowledge workers at startups and tech companies",
    "outline": [
      "Why hustle culture fails in the long run",
      "Pause as part of work, not a reward after it",
      "Boundary rituals that fit a real week",
      "How to measure outcomes without vanity metrics"
    ]
  },
  "language": "en-US",
  "qualityMode": "balanced"
}
```

Importar no Bruno via cURL:

```bash
curl --request POST \
  --url http://localhost:3000/me/executions/run \
  --header "Content-Type: application/json" \
  --data "{\"contentType\":\"long-form-blog\",\"briefing\":{\"topic\":\"Sustainable productivity without burnout\",\"thesis\":\"Intentional pause and clear boundaries improve work quality — they don't reduce productivity\",\"audience\":\"Knowledge workers at startups and tech companies\",\"outline\":[\"Why hustle culture fails in the long run\",\"Pause as part of work, not a reward after it\",\"Boundary rituals that fit a real week\",\"How to measure outcomes without vanity metrics\"]},\"language\":\"en-US\",\"qualityMode\":\"balanced\"}"
```

→ Save `content` to `voiceOutput` (locale `en`).

---

## 03 — LinkedIn · PT

**Briefing (UI):** post sobre aprendizado contínuo na carreira  
**Content type:** `linkedin-post`  
**Arquivo:** `themes/linkedin-post.ts` → `locales.pt`

### A · Prompt no ChatGPT / Claude (imitar sua voz)

```
Me ajuda com um post de LinkedIn? Preciso que pareça que EU escrevi — pessoal, direto, sem tom de influencer.

Minha voz no LinkedIn:
- Primeira pessoa, frases curtas
- Prefiro uma observação concreta a um conselho genérico
- Sem "é essencial", "no mercado atual" ou CTA forçado no final
- Nada de emojis nem hashtags

Exemplo do tom que quero (só referência de estilo):
"Aprendi mais ouvindo colegas em café do que em qualquer slide de tendências."

Briefing:
- Tema: Aprendizado contínuo na carreira
- Público: Profissionais de tecnologia em nível pleno e sênior
- Ângulo: Curadoria de estudo importa mais que volume de cursos
- Pontos que quero encaixar:
  - Aprendi mais em conversas informais do que em decks de tendências
  - Escolher o que ignorar é tão estratégico quanto escolher o que estudar

Escreva o post (~120–180 palavras) imitando minha voz o máximo possível.
```

→ Salve em `genericOutput` (locale `pt`).

### B · Geração com voz (Bruno)

**Método:** `POST`  
**URL:** `http://localhost:3000/me/executions/run`  
**Header:** `Content-Type: application/json`

Body (cole no Bruno):

```json
{
  "contentType": "linkedin-post",
  "briefing": {
    "topic": "Aprendizado contínuo na carreira",
    "audience": "Profissionais de tecnologia em nível pleno e sênior",
    "angle": "Curadoria de estudo importa mais que volume de cursos",
    "proof": [
      "Aprendi mais em conversas informais do que em decks de tendências",
      "Escolher o que ignorar é tão estratégico quanto escolher o que estudar"
    ]
  },
  "language": "pt-BR",
  "qualityMode": "balanced"
}
```

Importar no Bruno via cURL:

```bash
curl --request POST \
  --url http://localhost:3000/me/executions/run \
  --header 'Content-Type: application/json' \
  --data '{"contentType":"linkedin-post","briefing":{"topic":"Aprendizado contínuo na carreira","audience":"Profissionais de tecnologia em nível pleno e sênior","angle":"Curadoria de estudo importa mais que volume de cursos","proof":["Aprendi mais em conversas informais do que em decks de tendências","Escolher o que ignorar é tão estratégico quanto escolher o que estudar"]},"language":"pt-BR","qualityMode":"balanced"}'
```

→ Salve `content` em `voiceOutput` (locale `pt`).

---

## 04 — LinkedIn · EN

**Briefing (UI):** post on continuous learning in your career  
**Content type:** `linkedin-post`  
**Arquivo:** `themes/linkedin-post.ts` → `locales.en`

### A · ChatGPT / Claude prompt (match your voice)

```
Help me with a LinkedIn post. It needs to sound like I wrote it — personal, direct, not influencer cringe.

My LinkedIn voice:
- First person, short sentences
- One concrete observation beats generic advice
- No "it's essential," "in today's market," or forced CTAs
- No emojis or hashtags

Tone reference (style only, don't copy):
"I've learned more from hallway conversations than from any trends deck."

Briefing:
- Topic: Continuous learning in your career
- Audience: Mid-level and senior technology professionals
- Angle: Study curation matters more than course volume
- Points to weave in:
  - I've learned more from informal conversations than from trends decks
  - Choosing what to ignore is as strategic as choosing what to study

Write the post (~120–180 words) matching my voice as closely as you can.
```

→ Save to `genericOutput` (locale `en`).

### B · Voice generation (Bruno)

**Method:** `POST`  
**URL:** `http://localhost:3000/me/executions/run`  
**Header:** `Content-Type: application/json`

Body:

```json
{
  "contentType": "linkedin-post",
  "briefing": {
    "topic": "Continuous learning in your career",
    "audience": "Mid-level and senior technology professionals",
    "angle": "Study curation matters more than course volume",
    "proof": [
      "I've learned more from informal conversations than from trends decks",
      "Choosing what to ignore is as strategic as choosing what to study"
    ]
  },
  "language": "en-US",
  "qualityMode": "balanced"
}
```

Import via cURL:

```bash
curl --request POST \
  --url http://localhost:3000/me/executions/run \
  --header "Content-Type: application/json" \
  --data "{\"contentType\":\"linkedin-post\",\"briefing\":{\"topic\":\"Continuous learning in your career\",\"audience\":\"Mid-level and senior technology professionals\",\"angle\":\"Study curation matters more than course volume\",\"proof\":[\"I've learned more from informal conversations than from trends decks\",\"Choosing what to ignore is as strategic as choosing what to study\"]},\"language\":\"en-US\",\"qualityMode\":\"balanced\"}"
```

→ Save `content` to `voiceOutput` (locale `en`).

---

## 05 — Thread · PT

**Briefing (UI):** thread sobre consistência na criação de conteúdo  
**Content type:** `twitter-thread`  
**Arquivo:** `themes/thread.ts` → `locales.pt`

### A · Prompt no ChatGPT / Claude (imitar sua voz)

```
Quero uma thread para X/Twitter na MINHA voz — honesta, sem tom de guru de growth.

Como eu escrevo threads:
- Tweets numerados (1/, 2/, ...)
- Primeira pessoa, experiência real
- Sem "segredo", "hack" ou promessa de viralizar
- Cada tweet com uma ideia só; transições naturais

Exemplo do meu tom (só referência):
"1/ Três anos publicando toda terça — mesmo quando não tinha ideia."

Briefing:
- Tema: Consistência na criação de conteúdo
- Gancho: Três anos publicando toda terça — mesmo quando não tinha ideia
- Pontos:
  - Formato pequeno e sustentável vence volume
  - Consistência é gentileza com o leitor: ele sabe quando voltar
  - Métricas ajudam, mas não devem definir o ritmo

Escreva 5–7 tweets imitando como eu escreveria. Não deixe parecer template de marketing.
```

→ Salve em `genericOutput` (locale `pt`). Use `\n` entre tweets se necessário.

### B · Geração com voz (Bruno)

**Método:** `POST`  
**URL:** `http://localhost:3000/me/executions/run`  
**Header:** `Content-Type: application/json`

Body (cole no Bruno):

```json
{
  "contentType": "twitter-thread",
  "briefing": {
    "topic": "Consistência na criação de conteúdo",
    "hook": "Três anos publicando toda terça — mesmo quando não tinha ideia",
    "beats": [
      "Formato pequeno e sustentável vence volume",
      "Consistência é gentileza com o leitor: ele sabe quando voltar",
      "Métricas ajudam, mas não devem definir o ritmo"
    ]
  },
  "language": "pt-BR",
  "qualityMode": "balanced"
}
```

Importar no Bruno via cURL:

```bash
curl --request POST \
  --url http://localhost:3000/me/executions/run \
  --header 'Content-Type: application/json' \
  --data '{"contentType":"twitter-thread","briefing":{"topic":"Consistência na criação de conteúdo","hook":"Três anos publicando toda terça — mesmo quando não tinha ideia","beats":["Formato pequeno e sustentável vence volume","Consistência é gentileza com o leitor: ele sabe quando voltar","Métricas ajudam, mas não devem definir o ritmo"]},"language":"pt-BR","qualityMode":"balanced"}'
```

→ Salve `content` em `voiceOutput` (locale `pt`).

---

## 06 — Thread · EN

**Briefing (UI):** thread on consistency in content creation  
**Content type:** `twitter-thread`  
**Arquivo:** `themes/thread.ts` → `locales.en`

### A · ChatGPT / Claude prompt (match your voice)

```
I want an X/Twitter thread in MY voice — honest, no growth-guru tone.

How I write threads:
- Numbered tweets (1/, 2/, ...)
- First person, real experience
- No "secret," "hack," or viral promises
- One idea per tweet; natural transitions

Tone reference (style only):
"1/ Three years publishing every Tuesday — even when I had no idea."

Briefing:
- Topic: Consistency in content creation
- Hook: Three years publishing every Tuesday — even when I had no idea
- Beats:
  - A small, sustainable format beats volume
  - Consistency is kindness to the reader: they know when to come back
  - Metrics help, but they shouldn't set the pace

Write 5–7 tweets the way I would. Don't let it read like a marketing template.
```

→ Save to `genericOutput` (locale `en`).

### B · Voice generation (Bruno)

**Method:** `POST`  
**URL:** `http://localhost:3000/me/executions/run`  
**Header:** `Content-Type: application/json`

Body:

```json
{
  "contentType": "twitter-thread",
  "briefing": {
    "topic": "Consistency in content creation",
    "hook": "Three years publishing every Tuesday — even when I had no idea",
    "beats": [
      "A small, sustainable format beats volume",
      "Consistency is kindness to the reader: they know when to come back",
      "Metrics help, but they shouldn't set the pace"
    ]
  },
  "language": "en-US",
  "qualityMode": "balanced"
}
```

Import via cURL:

```bash
curl --request POST \
  --url http://localhost:3000/me/executions/run \
  --header "Content-Type: application/json" \
  --data "{\"contentType\":\"twitter-thread\",\"briefing\":{\"topic\":\"Consistency in content creation\",\"hook\":\"Three years publishing every Tuesday — even when I had no idea\",\"beats\":[\"A small, sustainable format beats volume\",\"Consistency is kindness to the reader: they know when to come back\",\"Metrics help, but they shouldn't set the pace\"]},\"language\":\"en-US\",\"qualityMode\":\"balanced\"}"
```

→ Save `content` to `voiceOutput` (locale `en`).

---

## Checklist final

- [ ] 6 prompts de voz no ChatGPT/Claude executados e `genericOutput` revisado
- [ ] 6 curls executados no Bruno e `voiceOutput` revisado
- [ ] `pnpm test tests/web/showcase-catalog.test.ts` passando
- [ ] Preview visual em `pnpm dev:web` (`/` e `/en`)
- [ ] Sign-off do domain expert (HITL)

## Referência rápida


| #   | Formato   | Locale | `contentType`    | `language` |
| --- | --------- | ------ | ---------------- | ---------- |
| 01  | Blog post | PT     | `long-form-blog` | `pt-BR`    |
| 02  | Blog post | EN     | `long-form-blog` | `en-US`    |
| 03  | LinkedIn  | PT     | `linkedin-post`  | `pt-BR`    |
| 04  | LinkedIn  | EN     | `linkedin-post`  | `en-US`    |
| 05  | Thread    | PT     | `twitter-thread` | `pt-BR`    |
| 06  | Thread    | EN     | `twitter-thread` | `en-US`    |


**Preview opcional (antes de executar):** `POST /api/generation-preview` com `{ "contentType": "...", "qualityMode": "balanced" }` — retorna `quoteId` para anexar na execução se quiser validar cobrança.