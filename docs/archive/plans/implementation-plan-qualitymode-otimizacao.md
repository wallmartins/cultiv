# Plano de Implementacao: QualityMode para Otimizacao de Custo e Latencia

## Resumo
Implementar uma politica orientada por `qualityMode` para reduzir chamadas LLM, latencia e custo sem degradar qualidade de forma relevante. A estrategia e deterministic-first com escalonamento on-demand de LLM e refinamento limitado por budget.

## Politicas de Qualidade

### qualityMode
- `fast`
  - minScore: 60
  - maxLoops: 1
  - maxLLMCalls: 4
- `balanced`
  - minScore: 70
  - maxLoops: 2
  - maxLLMCalls: 7
- `strict`
  - minScore: 80
  - maxLoops: 3
  - maxLLMCalls: 12

### Regras Gerais
- Atingir `minScore` nao encerra automaticamente.
- O pipeline continua tentando melhorar enquanto houver budget e ganho liquido.
- O resultado final deve ser o melhor candidato observado (`best-so-far`) dentro da execucao.
- Gates duros (language gate, contratos criticos, fidelidade/voice drift quando ativos) nao podem regredir.

## Fase 1 - Contrato e Orquestracao por Modo
- Adicionar `qualityMode` no payload simplificado (`fast|balanced|strict`), com default `balanced`.
- Manter `targetScore` opcional como override avancado.
- Resolver `targetScoreEfetivo` por execucao:
  - sem override: usar `minScore` do mode.
  - com override: usar `max(override, minScore do mode)`.
- Propagar budget por modo para o `refinement-loop` e trace.

## Fase 2 - Gating Deterministico-first
- Tornar `analyze`/`audit` e `critic` orientados a pre-analise deterministica.
- Escalar para LLM apenas quando houver baixa confianca, conflito de sinais ou risco de regressao.
- Tornar `fidelity-check`, `voice-drift-check` e `adversarial-critic` condicionais ao modo e ao risco.

## Fase 3 - Humanizer Rico em Contexto
- Consolidar payload rico para o `humanizer` com:
  - sinais deterministas (regex, language gate, termos proibidos),
  - issues priorizados por severidade,
  - ledger de preservacao de fatos e acertos,
  - perfil autoral e exemplos do ICL dinamico,
  - contratos e violacoes.
- Reduzir passes redundantes (`voice-match`/`refine`) quando o payload unico cobrir os objetivos.

## Fase 4 - Observabilidade e Calibracao
- Registrar no trace:
  - `qualityMode`, score efetivo, budget previsto/consumido,
  - decisoes de gate por etapa,
  - motivo de parada e candidato final escolhido.
- Rodar benchmark A/B vs fluxo atual:
  - latencia total,
  - chamadas LLM por execucao,
  - tokens por execucao,
  - score final,
  - taxa de revisao manual.

## Criterio de Aceite
- Reducao consistente de tempo e chamadas LLM por modo:
  - `fast`: maior economia com risco controlado.
  - `balanced`: melhor relacao custo/qualidade.
  - `strict`: melhora de custo menor, qualidade preservada.
- Sem regressao nos gates duros.
- `best-so-far` sempre retornado quando houver regressao tardia no loop.

## Validacao
- `npm run lint`
- `npm test`
- Suite comparativa de benchmark (baseline vs qualityMode por perfil de request)

