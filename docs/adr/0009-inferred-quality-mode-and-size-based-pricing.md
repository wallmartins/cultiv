# Modo de Qualidade Inferido e Preço por Tamanho

**Status:** accepted
**Emenda:** ADR 0006 §3 (catálogo canônico — recalibra a escada de gerações) e §5 (preço por `contentType × qualityMode` → preço por tamanho)
**Substitui:** a proposta de expor um seletor de modo de qualidade na UI de geração
**Policy:** introduz `2026-07-20` (ativa); `2026-06-22` passa a `legacy-supported`
**Análise de suporte:** `docs/research/pricing-margin-analysis-2026-07-20.md`

## Contexto

A investigação começou por um bug de produção: toda geração falhava com `409 quote_stale`. A causa imediata era divergência de default entre preview (primeiro modo permitido) e execução (default de config). Ao corrigir, apareceram três problemas de fundo que invalidavam o modelo comercial inteiro.

**1. O custo de COGS estava ~12x inflado.** A telemetria calculava custo com uma taxa blended fixa de `$4,00/$15,00` por 1M de tokens — sem rótulo de moeda, sem modelo, duplicada em dois arquivos. Isso é preço de modelo classe frontier. Todos os `routingProfiles` da policy ativa apontam para `gemini-3.1-flash-lite`, que custa `$0,25/$1,50`. Toda a calibração de preço anterior (ADR 0006, `theoretical-cost.ts`, os relatórios de hybrid-pricing) foi construída sobre esse número.

Com as tarifas reais, a geração mais cara do catálogo (`long-piece` longo, strict) custa **$0,035**. A margem real dos planos era de **94–99%**, contra um alvo declarado de 67,5%.

**2. A inferência de modo já existia e era ignorada.** `recommendGenerationPreviewQualityMode` já lê tipo de conteúdo, densidade do briefing e presença de perfil de voz, e devolve um modo com `reasonCodes`. O resultado era calculado, devolvido ao cliente, exibido — e descartado na execução, servindo só como telemetria de correlação.

**3. Os planos entregavam pouco demais.** Aplicando o multiplicador de iteração (~2,5 gerações por texto publicado), o Explorador entregava 6 textos/mês — abaixo da cadência mínima de presença no LinkedIn (12–16/mês). O plano de entrada não sustentava o caso de uso central.

## Decisões

### 1. Não existe seletor de modo de qualidade na UI

O sistema infere o modo; o usuário não escolhe. Motivos:

- **A escolha não é avaliável.** Os três modos usam o mesmo modelo. A diferença é número de amostras (1/2/3 lanes) e alvo de score (58/74/88) — quanto compute queimar, não que capacidade acessar. Pedir essa decisão ao usuário antes de ele ver qualquer saída é pedir que ele faça arbitragem de custo às cegas.
- **A inferência já é melhor que o palpite dele.** Ela enxerga o briefing, o tipo e o perfil de voz.
- **O momento certo de dar controle é depois do resultado**, não antes: um "aprofundar este texto" pós-geração é contextual e avaliável. Fica como evolução, não como porta de entrada.

Precedência de resolução: pedido explícito (só via API) → modo inferido → default de config → primeiro permitido. Todo candidato passa pelo filtro `allowed`.

### 2. O plano é o teto de refino

`MODES_BY_TIER` passa a ser a alavanca de upgrade: `starter` (Explorador) refina até `balanced`; `pro` (Criador/Profissional/trial) alcança `strict`. O usuário sobe de plano porque o texto sai melhor, não porque bateu num muro de volume.

### 3. Preço por tamanho, não por modo

Se o usuário não escolhe o modo, o modo não pode mexer na fatura dele. Sob a grade anterior (`fast` 1 / `balanced` 2,5 / `strict` 10 numa mesma célula), a inferência automática para `strict` queimaria a quota 4x mais rápido numa decisão que não foi do usuário — "120 gerações" viraria 30 na prática.

A policy `2026-07-20` iguala o preço entre os três modos dentro de cada célula, deixando o preço variar só por tamanho:

| assinatura | preço (créditos) | quota |
|---|---:|---:|
| short-piece (post social) | 2,5 | 1 texto |
| serial-piece (thread) | 2,5 | 1 texto |
| edition-piece (newsletter) | 5 – 7,5 | 2–3 textos |
| long-piece (blog/artigo) | 5 – 10 | 2–4 textos |

`canonicalCreditCost` segue 2,5 = 1 texto. "N gerações/mês" volta a ser verdade: N posts curtos, ou N/3 artigos longos, ou uma mistura.

**Consequência:** saldo baixo deixa de rebaixar o modo e passa a bloquear a geração inteira — a afordabilidade agora é do texto, não do refino.

### 4. `qualityMode` sai do seed do quote

O `quoteId` protege o preço mostrado ao usuário, então o seed carrega só o que move preço: `policyVersion`, `planTier`, `contentType`, `creditPrice`, `planSignature`, `lengthTier`. Com o preço igual entre modos, manter `qualityMode` no hash fazia o quote recusar requisições que seriam cobradas exatamente igual — que é precisamente o `409 quote_stale` que originou esta investigação. Trocar o modo não invalida mais um quote; trocar tamanho ou tipo invalida.

### 5. Escada recalibrada

| plano | R$/mês | gerações | textos/mês | teto de refino | margem típica | pior caso |
|---|---:|---:|---:|---|---:|---:|
| Teste (trial) | — | 8 | 3 | strict | — | — |
| Explorador | 49 | 40 | 16 | balanced | 97,4% | 84,5% |
| Criador | 99 | 120 | 48 | strict | 94,1% | 77,0% |
| Profissional | 249 | 400 | 160 | strict | 92,2% | 69,6% |

Preços mantidos. O pior caso assume o usuário gastando a quota inteira no item mais caro do catálogo — todos os tiers seguem acima do alvo de 67,5%.

Segmentação: Explorador cobre solopreneur de canal único na cadência recomendada (3–4 posts/semana); Criador cobre multi-canal (social diário + newsletter); Profissional cobre agência/múltiplas marcas. Explorador→Criador é motivado pelo teto de refino e pelo segundo canal, não por um limite apertado de volume.

### 6. Custo de COGS por modelo, em USD

A taxa blended sai. `apps/backend/src/execution/cost/model-rates.ts` passa a ser fonte única: tabela por `provider:model` em USD por 1M de tokens, com fonte e data. Modelo fora da tabela cai num teto conservador (preço de frontier) em vez de subestimar — custo subestimado nunca entra silenciosamente na recalibração. Arredondamento sobe para 6 casas: a 4 casas, passos baratos colapsavam para zero e enviesavam a calibração para baixo.

Câmbio **não** virou constante de código: `catalog-pricing.json` já carrega BRL e USD explícitos por plano, o que é mais preciso que converter por FX. O câmbio aparece só na análise de margem, documentado como premissa.

## Consequências

- Toda calibração de preço anterior a esta ADR está sobre um COGS ~12x inflado e não deve ser reusada como baseline.
- Telemetria de custo gravada antes desta mudança tem a mesma distorção; séries históricas de `estimatedUsdCost` não são comparáveis com as novas.
- Com `strict` virando comum para tier `pro`, o custo médio por geração sobe ~3x sobre `fast` — absorvido com folga pela margem, mas é o número a observar quando entrar modelo melhor.
- A grade `pricesByPlan` mantém a dimensão `qualityMode` no schema com valores iguais. É redundância deliberada: evita mudança de contrato agora e deixa a porta aberta para reintroduzir diferenciação por modo se um dia o modo passar a ser escolha do usuário.

## Pendências

**Resolvidas junto com esta ADR:**

- **Fallback morto.** `gemini-1.5-pro` (404, modelo descontinuado) era o último degrau de `default-llm`/`premium-llm`. Substituído por `groq:llama-3.3-70b-versatile`, que além de existir cruza provider — uma indisponibilidade do Gemini passa a ter saída. **Requer `GROQ_API_KEY` no ambiente:** sem a credencial, `filterConfiguredProviderAttempts` descarta o degrau em silêncio e a cadeia volta a ter dois níveis.
- **`allowedModels` desatualizado.** `default-plans.ts` e `billing-bootstrap.ts` não citam mais `gpt-4o-mini`/`gpt-4.1`/`claude-3-5-sonnet`. Passa a listar os modelos realmente roteados, com o Groq como teto, uniforme entre planos — coerente com §2, onde o plano gate o refino e não o modelo.
- **Diretórios duplicados.** `apps/backend/policies/policies/**` removido. Era snapshot congelado em `2026-05-16`, estritamente mais pobre que a árvore correta (sem `canonicalCreditCost`, sem `pricesByPlan`, 6 pipelines contra 10) e sem nenhuma referência em código.
- **Filtros `intent`/`lengthTier` inertes no Postgres.** `serializeJob` persistia só `briefingTopic` da presentation e `applyJobListFilters` ignorava os dois eixos — a API aceitava o filtro e o SQL não o aplicava. Agora persiste a presentation inteira, filtra pelos dois, e a migração `0023` faz backfill das linhas antigas. O defeito sobreviveu porque a suíte Postgres é gated por `BACKEND_TEST_DATABASE_URL` e não roda em CI; a cobertura nova (`apps/backend/tests/job-list-filters-sql.test.ts`) compila o SQL sem banco.

**Em aberto:**

- **`premium-llm` é idêntico a `default-llm`** no modelo preferido — só muda timeout. Diferenciação morta, e o gancho natural para quando entrar um modelo melhor. Mantido intencionalmente sem mexer.
- **Desligamento da família `2.5`** anunciado para 16/10/2026 (confirmar na documentação oficial do Google). Quando ocorrer, `gemini-2.5-flash` sai de todos os perfis e `voice-extraction-llm`/`linkedin-llm` ficam sem fallback.
