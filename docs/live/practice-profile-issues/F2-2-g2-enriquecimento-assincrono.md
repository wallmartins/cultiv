# F2-2 · G2 — enriquecimento assíncrono (grounding web mirado em especificidades)

**Fase:** 2 — O gerador
**Caminho crítico:** não
**Depende de:** F2-1
**Destrava:** F2-5 (dispara G5 se grounding fino), F3-5
**Origem:** ADR 0010 §3 · norte `gerador-spec.md` (G2) · ticket 04

## Contexto
Aprofunda o **mesmo** perfil com grounding web nativo do provider, mirado em especificidades (nunca "material do campo" genérico — a média é o clichê). Só-acrescenta.

## Mudança
- Prompt G2 que recebe o perfil-semente + eixos e devolve o perfil `depth:"enriched"`.

## Aceite
- [ ] Enriquece sem reescrever o declarado (só-acrescenta).
- [ ] Grounding fino/vazio dispara o sinal de G5 em vez de alucinar.

## Verify
Rodar G2 num campo de nicho e confirmar que grounding vazio → sinal G5, não fabricação.
