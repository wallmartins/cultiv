# F6-1 · Confirmar que a régua de qualidade fica neutra (NÃO construir régua por domínio)

**Fase:** 6 — Qualidade & eval
**Caminho crítico:** não
**Depende de:** F1-1c (o aparato de domínio já morreu no 08)
**Destrava:** —
**Origem:** ADR 0010 §9 · plano F6-1 · ticket 09

## Contexto
Decisão explícita a registrar pro `/implement` **não inventar trabalho**: a régua **não muda por domínio**. Adequação é da geração; o scoring é neutro (dimensões do 02 + Voice Judge), clichê pego pela discriminabilidade.

## Mudança
- **Nenhuma** régua/dimensão/limiar por domínio. Confirmar que os checks lexicais neutros (concentração/repetição/em-dash) e o Voice Judge seguem intactos.

## Aceite
- [ ] Nenhum código de scoring condicional a domínio existe (o 08 já cortou; confirmar).

## Verify
`rg` por qualquer resíduo de `domain` em `text-quality/src/quality` → zero condicional de domínio.
