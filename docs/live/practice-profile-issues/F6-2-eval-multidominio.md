# F6-2 · Conjunto de avaliação multi-domínio (por span de estilo)

**Fase:** 6 — Qualidade & eval
**Caminho crítico:** não
**Depende de:** F2-1 (perfis existem)
**Destrava:** —
**Origem:** ADR 0010 §9 · plano F6-2 · ticket 09

## Contexto
Hoje `apps/backend/scripts/calibration/briefings.ts` + `packages/eval` são **tech-only** ⇒ regressão fora de tech invisível. O eval prova que a régua é **cega a estilo** (não certifica cada campo).

## Mudança
- Semear o eval com domínios por **span de estilo**: tech (analítico) · marketing (persuasivo) · climate (operacional) · +1 distante (direito, preciso-cauteloso). Reusar os perfis de `norte/amostras/` como padrão-ouro. Rodar a discriminabilidade (F2-7) nos textos gerados.

## Aceite
- [ ] O eval cobre ≥4 estilos; regressão em marketing/climate vira detectável.

## Verify
`packages/eval` roda os novos casos e um baseline por domínio.
