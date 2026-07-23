# F0-5b · Persistir o `modo` (dominante) no `data` da execução

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não
**Depende de:** F0-4d, F0-5a
**Destrava:** F6-2 (eval/observabilidade)
**Origem:** ADR 0010 §10 · ticket 15

## Contexto
O `generationIntent` no `data` da execução morre. O **modo** é inferido de qualquer jeito (13) — persistir barateia o eval/observabilidade e future-proofa a faceta de histórico (fora do v1).

## Mudança
- O registro de execução grava o `modo` dominante no `data` no lugar de `generationIntent`.

## Aceite
- [ ] Execução persiste o `modo`; `generationIntent` não é mais gravado.

## Verify
Gerar e inspecionar o `data` da execução gravada.
