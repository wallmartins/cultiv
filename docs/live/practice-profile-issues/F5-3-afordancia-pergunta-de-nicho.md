# F5-3 · Afordância da pergunta HITL de nicho no `/voice`

**Fase:** 5 — `/voice`
**Caminho crítico:** não
**Depende de:** F5-1, F2-5 (G5)
**Destrava:** —
**Origem:** ADR 0010 §3 · plano F5-3 · ticket 04

## Contexto
Quando o grounding volta fino (campo obscuro), o sistema pede especificidades ao autor no `/voice` — in-app, sem infra de comms nova. Distinto do auto-propor v2.

## Mudança
- Surfar a pergunta curada de G5 no `/voice`; a resposta re-dispara o enriquecimento (G2).

## Aceite
- [ ] A pergunta aparece no `/voice` quando G5 dispara; a resposta re-enriquece.

## Verify
Simular grounding fino e confirmar a afordância + o re-enriquecimento.
