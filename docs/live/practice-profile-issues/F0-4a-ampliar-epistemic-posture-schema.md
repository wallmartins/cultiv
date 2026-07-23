# F0-4a · Ampliar `EpistemicPostureSchema` para 7 valores + `not_applicable`

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não
**Depende de:** —
**Destrava:** F0-4b, F0-4c, F6-3 (refactor das guardas)
**Origem:** ADR 0010 §10 · plano F0-4 · tickets 13, 14 · norte `genero-dimensoes.md`

## Contexto
Hoje `EpistemicPostureSchema` tem 3 valores, todos argumentativos — quem não argumenta é forçado num deles. O 14 curou o conjunto abrangente derivado dos 5 modos retóricos. `not_applicable` é escape genuíno, **não depósito** (>~10% dos autores nele = conjunto errado).

## Mudança
`packages/contracts/src/reasoning.ts:57-61` — o `Schema.Literal` passa a:
```
exploratory · investigative · advocacy · expository · instructive · experiential · promotional · not_applicable
```
- **Renomear** `advocacy_mixed` → `advocacy`.
- Propagar o tipo onde é referenciado: `contracts/voice.ts:121`, `domain/voice.ts:145`.

## Aceite
- [ ] O schema aceita os 8 valores; `advocacy_mixed` não existe mais.
- [ ] `pnpm lint` verde (nenhum consumidor faz `switch` exaustivo — verificado no 14; se a compilação acusar um, é bug pré-existente a tratar).

## Verify
`pnpm vitest run` nos testes de contrato de reasoning. Decodificar cada um dos 8 valores passa; `advocacy_mixed` falha.

## Nota
As **guardas** de drift/critic que leem esses valores **não** são atualizadas aqui — elas viram tabela declarativa no **F6-3** (decisão do usuário: nunca cadeia de `if`). Até lá, valores novos caem na guarda-default segura.
