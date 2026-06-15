---
title: QuaLity Billing Policy
doc_type: policy
status: active
domain: billing
last_updated: 2026-05-16
---

# PRD Técnico: Política de Qualidade, Orquestração e Billing por Créditos

## 1. Objetivo

Definir uma política executável para:

- Geração assíncrona de conteúdo com modos `fast`, `balanced` e `strict`
- Seleção de output por score com controle de retries
- Controle de custo por modelo e débito por créditos
- Regras de bloqueio, top-up, rollover e auditoria

Este documento serve como base de implementação para backend, billing e observabilidade.

Para a proposta de routing de provider/model e versionamento de política de billing, veja [billing-model-policy.md](./billing-model-policy.md).

## 2. Escopo

Inclui:

- Estratégia de execução por modo
- Regras de parada e seleção de melhor candidato
- Fórmula de débito de créditos
- Parâmetros de custo e margem
- Critérios de aceite e testes mínimos

Não inclui:

- Implementação de UI
- Definição final de preço comercial ao cliente
- Escolha definitiva de provedores de pagamento

## 3. Premissas

- O fluxo é assíncrono; usuário recebe notificação ao final.
- Cada geração pode envolver múltiplas chamadas de LLM.
- O custo interno depende de:
- modelo escolhido por modo
- quantidade de chamadas
- volume de tokens de entrada/saída
- É obrigatório manter trilha de auditoria de créditos em ledger imutável.

## 4. Política Executável de Qualidade/Orquestração

### 4.1 Parâmetros globais

- `job_timeout_ms = 900000` (15 minutos)
- `min_improvement_delta`:
- `fast = 2`
- `balanced = 3`
- `strict = 2`
- `max_total_llm_calls_per_job`:
- `fast = 8`
- `balanced = 16`
- `strict = 28`

### 4.2 Estratégia por modo

1. `fast`

- Candidatos paralelos: `1`
- Critério de aprovação: `score >= 68`
- Retries no melhor candidato: `até 1`
- Objetivo: menor latência/custo

2. `balanced`

- Candidatos paralelos: `2`
- Critério de aprovação: `score >= 78`
- Retries no melhor candidato: `até 1`
- Objetivo: equilíbrio custo/qualidade

3. `strict`

- Candidatos paralelos: `3`
- Critério de aprovação: `score >= 88`
- Retries no melhor candidato: `até 2`
- Objetivo: máxima qualidade com custo controlado

### 4.3 Regras de parada

Parar execução quando qualquer condição ocorrer:

- Atingiu `score_floor` do modo
- Atingiu `max_total_llm_calls_per_job`
- `job_timeout_ms` estourado
- `improvement_delta < min_improvement_delta` em 2 tentativas consecutivas

### 4.4 Seleção do output final

Ordenação de prioridade:

1. Maior `score_final`
2. `fidelity_passed = true`
3. `voice_drift_passed = true` (quando aplicável)
4. Menor custo total em tokens (desempate)

### 4.5 Telemetria obrigatória por geração

- `mode`
- `candidate_count`
- `retry_count`
- `score_baseline` / `score_final`
- `fidelity_passed`
- `voice_drift_passed`
- `llm_calls_total`
- `input_tokens_total`
- `output_tokens_total`
- `estimated_usd_cost`
- `debited_credits`
- `selection_reason`

## 5. Política de Custos por Modelo

### 5.1 Mapeamento de classe de modelo por modo

- `fast`: modelo low-cost/high-throughput
- `balanced`: modelo intermediário
- `strict`: modelo high-capability

Observação: nomes exatos de modelo devem ser versionados em configuração (`env`/feature flag), sem hardcode em regra de negócio.

### 5.2 Fórmula de custo interno

`usd_cost = (input_tokens / 1_000_000 * input_price_usd) + (output_tokens / 1_000_000 * output_price_usd)`

`brl_cost = usd_cost * fx_usd_brl`

`target_revenue = brl_cost * margin_factor`

Onde:

- `fx_usd_brl` é o câmbio de referência operacional
- `margin_factor` é definido por estratégia financeira (ex.: 2.5 a 4.0)

### 5.3 Estimativa inicial de custo por geração (referência)

- `fast`: ~R$ 0,04
- `balanced`: ~R$ 0,15
- `strict`: ~R$ 1,77

Esses valores são baseline inicial e devem ser recalibrados com dados reais em produção.

## 6. Política de Débito por Créditos

### 6.1 Base por modo

- `fast = 1.0 crédito`
- `balanced = 2.5 créditos`
- `strict = 10.0 créditos`

### 6.2 Surcharge por retry

- `balanced`: `+0.75` crédito por retry
- `strict`: `+1.5` crédito por retry
- `fast`: sem surcharge (v1)

### 6.3 Fórmula final de débito

`debited_credits = base_mode_credits + (retry_count * retry_surcharge)`

Arredondamento:

- `ceil_1_decimal`: arredonda para 1 casa decimal para cima

### 6.4 Exemplo

- `balanced` com 1 retry:
- `2.5 + (1 * 0.75) = 3.25`
- com `ceil_1_decimal` -> `3.3` créditos debitados

## 7. Regras Comerciais e Operacionais

### 7.1 Saldo e bloqueio

- Se saldo insuficiente:
- oferecer compra de top-up
- sem top-up aprovado: bloquear geração

### 7.2 Rollover parcial

- `rollover = min(credits_sobra * rollover_percent, rollover_cap)`

Parâmetros iniciais sugeridos:

- `rollover_percent = 0.25`
- `rollover_cap = 100`

### 7.3 Rate limit separado de crédito

Validação dupla obrigatória:

- Limite de tráfego (`rpm`, `rph`, concorrência)
- Saldo de créditos disponível

## 8. Ledger e Auditoria

Obrigatório implementar ledger append-only com idempotência por operação.

Eventos mínimos:

- `grant_cycle`
- `grant_rollover`
- `grant_topup`
- `reserve`
- `capture`
- `release`
- `refund`
- `expire`

Campos mínimos por evento:

- `subscription_id`
- `account_id`
- `entry_type`
- `credits_delta`
- `balance_after`
- `reference_type`
- `reference_id`
- `idempotency_key`
- `metadata_json`
- `created_at`

## 9. Critérios de Aceite

1. Execução por modo respeita número de candidatos e retries definidos.
2. `max_total_llm_calls_per_job` é sempre respeitado.
3. Saída final segue ordenação de seleção definida.
4. Débito de créditos usa fórmula oficial e arredondamento oficial.
5. Falta de crédito bloqueia geração quando top-up não é adquirido.
6. Rollover parcial é aplicado corretamente no fechamento de ciclo.
7. Toda movimentação de crédito gera evento de ledger auditável.
8. Reexecução idempotente não duplica débito.

## 10. Casos de Teste (mínimos)

1. `fast` aprova sem retry:

- Entrada com score >= 68
- Debita exatamente `1.0`

2. `balanced` com 1 retry:

- Score inicial < 78 e final >= 78
- Debita `3.3` (arredondamento oficial)

3. `strict` com 2 retries:

- Melhor candidato só aprova na 2ª tentativa
- Debita `13.0` (10 + 2 \* 1.5)

4. Limite de budget:

- Estoura `max_total_llm_calls_per_job`
- Finaliza com motivo `budget_exhausted`

5. Sem saldo e sem top-up:

- Bloqueia antes de executar geração

6. Com top-up:

- Crédito extra concedido
- Geração passa
- Ledger contém `grant_topup` e `capture`

7. Idempotência:

- Mesmo `idempotency_key` repetido
- Sem débito duplicado

8. Rollover:

- Sobra no ciclo
- Aplica percentual e cap corretamente

## 11. Configuração Inicial (JSON de referência)

```json
{
  "quality_policy": {
    "fast": {
      "candidates": 1,
      "score_floor": 68,
      "max_retries": 1,
      "max_llm_calls": 8,
      "min_improvement_delta": 2
    },
    "balanced": {
      "candidates": 2,
      "score_floor": 78,
      "max_retries": 1,
      "max_llm_calls": 16,
      "min_improvement_delta": 3
    },
    "strict": {
      "candidates": 3,
      "score_floor": 88,
      "max_retries": 2,
      "max_llm_calls": 28,
      "min_improvement_delta": 2
    }
  },
  "credit_policy": {
    "base_credits": {
      "fast": 1.0,
      "balanced": 2.5,
      "strict": 10.0
    },
    "retry_surcharge": {
      "fast": 0.0,
      "balanced": 0.75,
      "strict": 1.5
    },
    "rounding": "ceil_1_decimal",
    "rollover_percent": 0.25,
    "rollover_cap": 100
  }
}
```

## 12. Próximos Passos

1. Transformar esta política em contrato tipado em `packages/contracts`.
2. Implementar enforcement no `PipelineService` e no orquestrador.
3. Implementar ledger imutável e integração com pagamentos/top-up.
4. Publicar documentação de cobrança para clientes com exemplos de débito por modo.
