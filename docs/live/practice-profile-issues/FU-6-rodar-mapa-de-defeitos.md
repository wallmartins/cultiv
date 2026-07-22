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
- [x] Mapa de defeitos com plano formal em `docs/` + issues atômicas. **(promoção — feito 2026-07-22)**
- [ ] Defeitos fechados por fase com portão. **(implementação — deferida a sessões dedicadas)**

## Resolução parcial (2026-07-22) — promoção feita, implementação deferida
Decisão do usuário: **"promover a `docs/` agora, implementar depois"**. Entregue o passo 1+2 do ticket:
- **(1) Triagem/atualização:** o wayfinder `.scratch/defeitos-de-corretude/` foi triado e os itens roteados
  incorporados — **FU-5** (dupla resolução de voz) já está **fechado nesta branch**; a mensagem de erro crua
  em inglês virou **CD-5**; a deriva default/CI da reasoning-signature virou **CD-1**. O `map.md` registra a
  promoção em "Decisions so far".
- **(2) Promoção a `/implement`-ready:**
  - Plano: [`docs/live/plan/correctness-defects-plan.md`](../plan/correctness-defects-plan.md) — task set
    ordenado, corte antes/depois do beta, dependências, verificações rodáveis, coordenação com o mapa irmão,
    e as decisões abertas com recomendação.
  - Issues atômicas: [`docs/live/correctness-defects-issues/`](../correctness-defects-issues/) — CD-1..CD-7 +
    INDEX, no formato dos tickets do Practice Profile (Contexto / Decisão / Mudança / Aceite / Verify), com
    cada `file:line` rastreável ao survey.
  - **Sem ADR ainda** — nenhuma decisão que a mereça (postura pt-first; default da reasoning-signature) está
    confirmada. ADR 0011 é escrita quando uma delas for decidida numa sessão de implementação.
- **(3) Implementar por fases com portão:** **deferido** — é o track restante, rodado como o Practice
  Profile (revisor em modelo ≠ implementador). As decisões de produto genuínas ficam abertas nas issues por
  design (o wayfinder manda grilá-las **na** sessão de implementação, com verify-antes-de-decidir).

## Verify
Por ticket do plano de defeitos, como no Practice Profile.
