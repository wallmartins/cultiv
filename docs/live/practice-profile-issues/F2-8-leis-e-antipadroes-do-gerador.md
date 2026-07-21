# F2-8 · Bloco compartilhado: leis + anti-padrões do gerador no prompt

**Fase:** 2 — O gerador
**Caminho crítico:** não
**Depende de:** —
**Destrava:** F2-1, F2-2, F2-3, F2-4 (todas herdam as leis)
**Origem:** ADR 0010 §3 · norte `gerador-spec.md`, `anti-padroes.md`

## Contexto
As 5 superfícies generativas partilham 6 leis e os anti-padrões (a média do campo é o clichê; substância não léxico). Herdar a forma do `ANTI_TOPIC_EXTRACTION_RULES` (`voice-signature-brief.ts:381-386`), não inventar padrão novo.

## Mudança
- Definir `GENERATOR_ANTI_PATTERN_RULES` + `GENERATOR_CLICHE_RETRY_SUFFIX` (norte `anti-padroes.md`) e as 6 leis (JSON puro, não-inventar-fatos, ancorar em especificidades, degradar) como bloco de prompt reutilizável.

## Aceite
- [ ] Bloco existe e é injetável em G1-G4.
- [ ] Detector de vazamento (frase sobrevive à troca de rótulo) tem retry.

## Verify
Teste unitário do detector de clichê com pares de campos intercambiáveis.
