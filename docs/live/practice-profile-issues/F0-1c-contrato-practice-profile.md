# F0-1c · Contrato `PracticeProfile` (3 eixos + 7 dimensões)

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não (mas cedo — muitas issues dependem)
**Depende de:** —
**Destrava:** F0-1a, F0-1b, F0-1d, F0-1e, F2-1, F4-2, F5-1
**Origem:** ADR 0010 §1, §2 · norte `backbone-curado.md` · tickets 01, 10

## Contexto
O schema do Practice Profile como valor que chega no `GenerationContext` (governança `voice-profile-centralization` — sem import de `database` em `text-quality`). Representação híbrida (prosa + reduzidos, conforme 13/14).

## Mudança
- Definir `PracticeProfile` em `packages/contracts/src/`: 3 eixos (`subject`, `vantagePoint`, `audiences[]`) + 7 dimensões (Ponto·Evidência·Pressuposto·Resistência·Stake·Clichê·Léxico) + `depth: seed|enriched`.

## Aceite
- [ ] O contrato compila; as 7 dimensões e 3 eixos estão tipados; `depth` é enum.
- [ ] `pnpm guardrails:effect` verde (contrato Effect, sem `Promise`/`throw`).

## Verify
`pnpm vitest run` no teste de contrato do Practice Profile.
