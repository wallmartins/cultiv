# FU-3 · Seed órfão do briefings.ts (fiar num sweep ou deletar)

**Fase:** Follow-up pós-6 (F6-2)
**Caminho crítico:** não
**Depende de:** —
**Destrava:** —
**Origem:** portão da Fase 6, achado MINOR do AuditEval

## Contexto
F6-2 adicionou 3 chaves a `CALIBRATION_BRIEFINGS` (`marketing-conversion-audit`, `climate-internal-adoption`, `legal-clause-tradeoff` em `apps/backend/scripts/calibration/briefings.ts`) mas **nada as consome**: `run-calibration-sweep`'s `BRIEFING_KEY_BY_MODE` é mode-keyed, não domain-keyed, e o T1/T2 substantivo vive nos perfis JSON (`packages/eval/.../profiles/`). São dado morto — âncoras bem-feitas (art. 413 CC, Escopo 3, NPS), mas decorativas.

## Mudança
Decidir por escrito:
- (a) adicionar um eixo de domínio ao `run-calibration-sweep` (roda os briefings por domínio numa varredura **gated**), ou
- (b) deletar as 3 chaves (o trabalho vive nos perfis) — ponytail: deleção > dado morto.

## Aceite
- [x] Nenhum dado morto: as chaves são consumidas por um sweep OU removidas; decisão registrada.

## Decisão (2026-07-22)
Escolhida a opção **(b) deletar** — ponytail: deleção > dado morto. O T1/T2 substantivo já vive
nos perfis JSON do eval (`packages/eval/.../profiles/`); as 3 chaves em `briefings.ts` eram âncoras
bem-feitas mas decorativas, sem leitor (`run-calibration-sweep`'s `BRIEFING_KEY_BY_MODE` é
mode-keyed, e `parity-fixtures`/`briefing-variants` são keyed por input do chamador). Removidas
junto do bloco de comentário F6-2. Um eixo de domínio no sweep (opção a) só se justificaria com uso
real do sweep por-domínio, que não existe.

## Verify
`grep` das 3 chaves → todas têm leitor, ou não existem mais.
