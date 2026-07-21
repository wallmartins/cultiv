# F0-1a · Migration: tabela `practice_profiles`

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não (mas cedo — muitas issues dependem)
**Depende de:** F0-1c (contrato define a forma que a tabela persiste)
**Destrava:** F0-1d (repositório), F0-1e (GenerationContext)
**Origem:** ADR 0010 §1, §4 · plano F0-1 · ticket 03

## Contexto
O Practice Profile é irmão do Voice Profile e persiste no mesmo padrão: **single-row-por-usuário**, upsert, rebuild substitui inteiro. **Greenfield** — pré-lançamento, sem migração de dados existentes, sem retrocompatibilidade.

## Mudança
Nova migration em `apps/backend/src/infra/migrations/`:
- Tabela `practice_profiles`, `user_id` **UNIQUE** (espelha `voice_profiles`).
- Colunas: os 3 eixos (`subject`, `vantage_point`, `audiences`) + as 7 dimensões (Ponto·Evidência·Pressuposto·Resistência·Stake·Clichê·Léxico) + `depth` (`seed`|`enriched`).
- Forma das dimensões: ver contrato do F0-1c (prosa + reduzidos, conforme norte `backbone-curado.md`).

## Aceite
- [ ] Migration cria `practice_profiles` com `user_id` UNIQUE.
- [ ] Roda limpa em banco vazio; `pnpm test:postgres` (ou o runner de migration) verde.

## Verify
Rodar a migration contra um Postgres local (docker-compose) e confirmar o schema via `\d practice_profiles`. A store de diagnostics (sugestões de enriquecimento) é a tabela irmã — **issue F0-1b**.
