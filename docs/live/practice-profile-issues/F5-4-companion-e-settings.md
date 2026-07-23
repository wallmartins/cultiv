# F5-4 · Companion read-only + `settings` só espelha

**Fase:** 5 — `/voice`
**Caminho crítico:** não
**Depende de:** F5-1
**Destrava:** —
**Origem:** ADR 0010 §4 · plano F5-1 · ticket 03

## Contexto
O companion segue subconjunto **read-only** da identidade de escrita; `settings` continua só espelhando (não ganha edição de prática) — pra não pluralizar a superfície de edição.

## Mudança
- Companion renderiza voz+prática read-only; `settings` não ganha edição de prática.

## Aceite
- [ ] Companion read-only; nenhuma edição de prática fora de `/voice`.

## Verify
Abrir companion e settings e confirmar a ausência de edição de prática.
