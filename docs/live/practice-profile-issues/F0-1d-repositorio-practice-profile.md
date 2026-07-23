# F0-1d · Repositório `practice-profile` (upsert single-row)

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não
**Depende de:** F0-1a, F0-1c
**Destrava:** F2-1, F3-1, F5-1
**Origem:** ADR 0010 §1, §4 · ticket 03

## Contexto
Espelha o `postgres-voice-profile-repository`: single-row-por-usuário, **upsert `onConflict("user_id")`**, rebuild substitui inteiro.

## Mudança
- `postgres-practice-profile-repository` com `upsert`, `getByUserId`.

## Aceite
- [ ] Upsert grava/atualiza a linha única; rebuild substitui inteiro.
- [ ] `pnpm test:postgres` (se aplicável) verde.

## Verify
Teste de repositório: 2 upserts do mesmo user → 1 linha.
