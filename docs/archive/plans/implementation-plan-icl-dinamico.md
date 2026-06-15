# Plano de Implementacao: ICL Dinamico para Voz Autoral

## Resumo
Implementar In-Context Learning dinamico no pipeline de geracao para aumentar fidelidade de voz do autor com controle de custo e latencia. A estrategia e recuperar exemplos reais do autor por similaridade semantica e injeta-los no Humanizer com orcamento de tokens e guardrails.

## Fase 1 - MVP Funcional
- Ingestao de textos do autor com metadados (`user_id`, `content_type`, `created_at`).
- Geracao de embeddings e indexacao vetorial (preferencia inicial: `pgvector`).
- Retrieval Top-K (K=2 ou 3) por briefing + filtros de `user_id` e `content_type`.
- Injecao de exemplos no prompt do Humanizer com limite de tokens por exemplo e limite global.
- Fallback para K=1 ou sem exemplos quando exceder orcamento.

## Fase 2 - Qualidade e Seguranca
- Filtro de qualidade dos exemplos recuperados (remocao de ruido e duplicados).
- Cache de retrieval para reduzir latencia e custo.
- Shadow mode e A/B contra baseline atual.
- Metricas obrigatorias:
  - latencia de retrieval,
  - tokens adicionais por request,
  - delta de fidelityToVoice,
  - taxa de aceitacao no refinement-loop,
  - taxa de revisao manual.

## Fase 3 - Otimizacao de Custo e Performance
- Re-ranking com sinais de recencia e diversidade estilistica.
- Estrategia dinamica de K por orcamento de tokens.
- Reindexacao incremental baseada em hash de conteudo.
- Ajustes de prompt packing para manter contexto util com custo menor.

## Fase 4 - Personalizacao Avancada
- Perfis de voz por formato/canal (ex: LinkedIn, email, newsletter).
- Novos sinais de estilo no Critic/Ledger (apos validacao do MVP).
- Calibracao por autor com thresholds e politicas por segmento.

## Beneficios Esperados
- Aumento relevante de personalidade textual e consistencia de voz.
- Reducao de "tom generico" em conteudos de IA.
- Menor retrabalho manual de ajustes de estilo.

## Custo e Complexidade
- Fase 1: medio (2-3 semanas).
- Fase 2: medio.
- Fases 3 e 4: medio/alto, condicionadas a metricas de ganho real.

## Criterio de Go/No-Go
Avancar para Fase 3 somente se:
- melhoria consistente de fidelityToVoice,
- impacto de latencia e custo dentro de limites definidos,
- queda mensuravel na revisao manual.

