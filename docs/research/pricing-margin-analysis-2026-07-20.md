# Análise de margem — custo real e recalibração da escada

> Fundamenta a ADR 0009. Data: 2026-07-20.
> **Substitui** `.scratch/rotas-secundarias-app/research/pricing-margin-analysis.md` (2026-07-13), que continua no disco mas está sobre um COGS ~12x inflado — não usar como baseline.
> Este arquivo vive em `docs/` de propósito: a versão anterior estava sob `.scratch/`, que é gitignored, e portanto existia em uma única máquina apesar de ser citada como trilha de decisão pela ADR 0006.

## O erro que invalidava tudo

A telemetria calculava custo assim, duplicado em dois arquivos, sem rótulo de moeda nem de modelo:

```
inputTokens * 0.000004 + outputTokens * 0.000015     // $4,00 / $15,00 por 1M
```

Isso é preço de modelo classe frontier. Mas **todos** os `routingProfiles` da policy ativa apontam para `gemini-3.1-flash-lite`. Tarifas de tabela verificadas em 2026-07-20:

| provider:model | input $/1M | output $/1M | uso |
| :-- | --: | --: | :-- |
| gemini:gemini-3.1-flash-lite | 0,25 | 1,50 | preferido em todos os perfis |
| gemini:gemini-2.5-flash | 0,30 | 2,50 | fallback |
| groq:llama-3.3-70b-versatile | 0,59 | 0,79 | voice-judge |

Fator de inflação: **10x na saída, 16x na entrada** — ~12x combinado num mix típico.

## Custo real por geração (USD)

Chamadas LLM por geração = `lanes(modo) × passos LLM do pipeline`, com lanes 1/2/3 para fast/balanced/strict. A escalação `balanced → strict` declarada em `buildQualityAttempts` é inalcançável: o budget `maxLLMCalls` de balanced é consumido inteiro pelo primeiro attempt. Custo é monotônico (travado por `tests/backend/quality-escalation-economics.test.ts`).

| assinatura | tier | fast | balanced | strict |
| :-- | :-- | --: | --: | --: |
| short-piece | short | 0,0027 | 0,0054 | 0,0082 |
| short-piece | medium | 0,0030 | 0,0060 | 0,0090 |
| serial-piece | medium | 0,0026 | 0,0052 | 0,0078 |
| edition-piece | medium | 0,0052 | 0,0103 | 0,0155 |
| long-piece | medium | 0,0099 | 0,0198 | 0,0298 |
| **long-piece** | **long** | 0,0117 | 0,0234 | **0,0351** |

**O item mais caro do catálogo custa 3,5 centavos de dólar.** A tabela antiga dizia $1,10–1,20 para os mesmos itens.

## Margem real

Câmbio premissa: **R$ 5,40/USD**. (Não virou constante de código — `catalog-pricing.json` carrega BRL e USD explícitos por plano, o que é mais preciso que converter.)

Escada nova, mantendo os preços:

| plano | R$/mês | gerações | textos/mês | teto de refino | margem típica | pior caso |
| :-- | --: | --: | --: | :-- | --: | --: |
| Explorador | 49 | 40 | 16 | balanced | 97,4% | 84,5% |
| Criador | 99 | 120 | 48 | strict | 94,1% | 77,0% |
| Profissional | 249 | 400 | 160 | strict | 92,2% | 69,6% |

"Pior caso" = usuário gasta a quota inteira em `long-piece` longo no modo mais caro que o plano permite. Todos seguem acima do alvo de 67,5%. **Não há cenário de prejuízo dentro da quota.**

## Por que os números antigos estavam baixos

Aplicando o multiplicador de iteração (~2,5 gerações por texto publicado — consistente com "2–3 iterações até soar como você"):

| plano | gerações antigas | textos/mês | veredito |
| :-- | --: | --: | :-- |
| Explorador | 15 | 6 | abaixo da dose mínima de presença |
| Criador | 30 | 12 | no limite inferior |
| Profissional | 80 | 32 | adequado |

A cadência recomendada de LinkedIn para solopreneur é 3–4 posts/semana = **12–16/mês**. O plano de entrada entregava 6. O receio de "dar gerações demais" estava invertido: o risco real era o plano de entrada não sustentar o caso de uso e nunca provar valor.

Segmentação da escada nova:
- **Explorador (16 textos/mês)** — solopreneur, canal único, cadência recomendada.
- **Criador (48)** — multi-canal: social diário + newsletter semanal.
- **Profissional (160)** — agência/múltiplas marcas.

O upgrade Explorador→Criador é puxado pelo **teto de refino** (acesso a `strict`) e pelo segundo canal, não por um limite apertado de volume. Volume como única alavanca gera ressentimento e compara mal; qualidade como alavanca compara bem.

## Preço por tamanho, não por modo

Com o modo decidido pelo sistema (ADR 0009 §1), ele não pode mexer na fatura. Sob a grade anterior, a inferência para `strict` (que é o que o motor recomenda para briefings ricos) queimaria quota 4x mais rápido numa decisão que não foi do usuário — "120 gerações" viraria 30.

| assinatura | créditos | quota | equivalente |
| :-- | --: | --: | :-- |
| short-piece | 2,5 | 1 | post social |
| serial-piece | 2,5 | 1 | thread |
| edition-piece | 5 – 7,5 | 2–3 | newsletter |
| long-piece | 5 – 10 | 2–4 | blog/artigo |

Isso é explicável ao usuário ("artigo longo consome mais que um post") de um jeito que "strict vs balanced" nunca seria.

## Benchmark competitivo (jul/2026)

| produto | entrada | topo | modelo de cota |
| :-- | :-- | :-- | :-- |
| Jasper | Pro **$69** (Creator removido) | Business custom | palavras ilimitadas |
| Copy.ai | Chat $24 | Pro $36 | ilimitado no Pro |
| Writesonic | Lite **$49** = 15 artigos/mês | Growth $399 | artigos/créditos |
| ChatGPT Plus / Claude Pro | $20 | — | chat |
| Gemini AI Plus (BR) | R$ 24,99 | — | chat |

**Leitura:** o mercado migrou de metering para ilimitado (Jasper e Copy.ai) porque o custo de modelo colapsou — exatamente a situação aqui. Writesonic ainda cobra $49 por 15 artigos/mês; Cultiv Explorador a R$49 (~$9) com 40 gerações é agressivo sem ser insustentável.

Sobre a margem alvo: benchmarks 2026 põem SaaS AI-native em 50–60%, com piso estrutural 60–65%. Os 67,5% seguem saudáveis como alvo — mas a realidade medida (92–99%) mostra que a folga hoje é enorme, e a alavanca certa para gastá-la é **generosidade de cota e qualidade de modelo**, não corte de preço.

## Pendências

- **`gemini-1.5-pro` retorna 404** (modelo descontinuado) e segue como fallback final em `default-llm`/`premium-llm`. Os modelos `2.5` têm desligamento anunciado para 16/10/2026 — a cadeia de fallback precisa de revisão própria e datada.
- **`premium-llm` é idêntico a `default-llm`** no modelo preferido. É onde entra um modelo melhor quando houver orçamento — e há.
- **Telemetria histórica** de `estimatedUsdCost` anterior a 2026-07-20 carrega a distorção de 12x; séries não são comparáveis.
- **Custos ainda são teóricos.** `telemetry-ingest.ts` + `buildCalibrationReport` substituem por custo observado assim que houver volume; `buildCellStats` já prefere observado sobre teórico automaticamente.
