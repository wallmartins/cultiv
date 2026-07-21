# F0-1b · Migration: tabela `practice_profile_diagnostics`

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não
**Depende de:** F0-1c
**Destrava:** F3-5, F5-2
**Origem:** ADR 0010 §4 · ticket 03

## Contexto
A store irmã que guarda as **sugestões de enriquecimento aceitas/rejeitadas** (padrão `voice_profile_diagnostics.traitConfirmations`, `trait-confirmation.ts:14-51`). Nunca escreve no perfil — só-acrescenta na store.

## Mudança
- Migration `practice_profile_diagnostics`, `user_id`, com a store de confirmações de enriquecimento.

## Aceite
- [ ] Tabela criada; roda limpa em banco vazio.

## Verify
Migration contra Postgres local + `\d practice_profile_diagnostics`.
