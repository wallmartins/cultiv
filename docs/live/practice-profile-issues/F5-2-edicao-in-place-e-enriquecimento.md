# F5-2 · Edição in-place da declaração + aceitar/rejeitar enriquecimento

**Fase:** 5 — `/voice`
**Caminho crítico:** não
**Depende de:** F5-1, F0-1b (diagnostics store)
**Destrava:** —
**Origem:** ADR 0010 §4 · plano F5-2 · tickets 03, 05

## Contexto
Duas naturezas de edição: (a) editar a declaração **in-place** (não é exemplo, ADR 0001 não trava); (b) aceitar/rejeitar sugestões de enriquecimento (store separada, **só-acrescenta**).

## Mudança
- Editar declaração grava no perfil; aceitar/rejeitar sugestão grava na store de diagnostics (nunca reescreve o declarado).

## Aceite
- [ ] Declaração editável in-place; sugestões aceitas/rejeitadas na store separada.

## Verify
Editar a declaração e aceitar uma sugestão; confirmar que a declaração não foi reescrita.
