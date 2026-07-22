# FU-6 · Rodar o mapa de defeitos de corretude até o fim (o track restante)

**Fase:** Follow-up pós-6 (meta — mapa irmão)
**Caminho crítico:** não (mas é o maior thread aberto além do push)
**Depende de:** —
**Destrava:** "mapa completo" de verdade (voz/qualidade sem defeitos conhecidos)
**Origem:** ressalva 4 do fechamento da Fase 6 · wayfinder `.scratch/defeitos-de-corretude/` (map.md + issues 01-08)

## Contexto
O **mapa de defeitos de corretude** é um wayfinder **separado** do mapa de domínio (Practice Profile). Está em `.scratch/defeitos-de-corretude/` como wayfinder (map.md + 8 issues de triagem/decisão), **ainda NÃO promovido a `docs/`** (ADR + plano + issues) — diferente do mapa de domínio, que virou ADR 0010 + `practice-profile-plan.md`. Defeitos abertos conhecidos:
- **03** dupla-contagem de penalidade
- **04** dimensão de metáfora construída e off em prod (ligar ou deletar)
- **05** cluster de localização (inclui o "Text must contain at least N words" cru em inglês na UI pt-BR)
- **06** guarda de vazamento com 3 buracos
- **07** seams web-backend
- **02** `reasoningSignatureV1` — **falsificado**: está `true` na VPS, o defeito é deriva default/CI vs. produção
- **(novo)** FU-5 dupla resolução de voz síncrona

## Mudança
- (1) Triar/atualizar o mapa com os itens roteados (FU-5) e o que a Fase 6 registrou (localização, deriva default/CI).
- (2) Promover a `/implement`-ready (ADR/plano/issues, como fizemos com o domínio).
- (3) Implementar por fases, com o mesmo portão de revisão por fase (revisor em modelo ≠ implementador).

## Aceite
- [ ] Mapa de defeitos com plano formal em `docs/` + issues atômicas; defeitos fechados por fase com portão.

## Verify
Por ticket do plano de defeitos, como no Practice Profile.
