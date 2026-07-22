# CD-2 · Dupla contagem da penalidade lexical

**Fase:** defeitos de corretude · **Corte:** antes do beta (se git-blame confirmar bug + eval antes/depois verde)
**Caminho crítico:** não · **Depende de:** — · **Destrava:** seleção de candidato correta
**Origem:** wayfinder 03 · survey §6

## Contexto
O mesmo achado lexical desconta duas vezes do mesmo score (arquitetura re-verificada 2026-07-22 no código
atual — os números do survey original eram pré-Fase-6, ver ⚠️ abaixo):
1. `evaluateLexicalQuality` (`packages/text-quality/src/quality/lexical-quality.ts:98-136`) devolve um
   `penalty` **composto** (soma de concentração de termo, TTR, bigramas repetidos, lemas espaçados, etc.).
2. `criticizeText` (`critic.ts:63-68`, atrás de `lexicalQualityV2`) vira **cada** finding lexical num
   `CriticFinding severity:"medium"` → **−20** cada via `severityPenalty` (`critic.ts:252-253`); isso entra
   no `criticScore` (`critic.ts:170`).
3. `lane-runner.ts:62` guarda o `penalty` composto **da mesma chamada** como `lexicalPenalty` no candidato.
4. `scorer.ts:15` faz `criticScore = clamp(input.criticScore - (input.lexicalPenalty ?? 0))` — **subtrai o
   mesmo achado de novo**.

⚠️ **Re-verificação (2026-07-22):** o survey mediu "3 termos → 100 → 60 → **24**" com o achado de jargão em
`severity:"high"` (−40). Esse caminho tech-first (`techTermHits` / "Technical jargon detected") foi
**deletado na Fase 6** (`ed736e1`, F6-1). No código atual o finding lexical é `medium` (−20), não `high`, e
está gateado por `lexicalQualityV2` (default `on` na VPS). A **dupla contagem em si permanece real** (o
mesmo achado reduz o `criticScore` como `CriticFinding` **e** como `lexicalPenalty` no `scorer`) — só a
magnitude e o exemplo mudaram. A medição do antes/depois deve ser refeita contra o código atual.

## DECISÃO (confirmar na implementação)
1. **Bug ou calibração deliberada?** *Recomendação:* **bug** (dupla subtração do mesmo achado não é
   calibração defensável). **Verificar antes:** `git blame` nos dois pontos; checar se algum limiar de
   seleção de candidato foi ajustado *depois* que a dupla contagem já existia (nesse caso "consertar"
   desregula o que foi tunado em cima do erro).
2. **Qual subtração sobrevive?** *Recomendação:* manter a do `CriticFinding` (participa do sistema de
   severidade, é visível ao usuário como achado); remover a re-subtração numérica de `lexicalPenalty`.
3. **Escopo:** só o achado de jargão técnico, ou todo achado lexical (concentração de termo, TTR baixo,
   bigramas repetidos)? Se atinge todos, o bug é maior — e independe da questão de domínio.

## Mudança
- Remover a subtração duplicada (uma fonte de penalidade por achado).
- Não confundir com o *gate lexical* em si (rejeição dura, listas de léxico) — isso é do mapa irmão; este
  ticket vale mesmo que aquele não mude nada.

## Aceite
- [ ] Estabelecido bug-vs-calibração (com git-blame); uma subtração sobrevive; escopo real nomeado; checagem
      rodável demonstra o antes/depois da seleção de candidato.

## Verify
Fixtures de regressão de `packages/eval` antes/depois (**ressalva: ~85% tech** — se importar fora de tech,
adicionar fixture não-tech ou escopar a alegação). Teste unitário do score composto para os 3 termos.
