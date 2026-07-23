# F0-1e · `GenerationContext` carrega o Practice Profile como valor

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não
**Depende de:** F0-1c
**Destrava:** F4-4 (alavancas leem o perfil)
**Origem:** ADR 0010 §1 (governança) · tickets 08, 04

## Contexto
Governança `voice-profile-centralization`: `text-quality` **não** importa `database`. O perfil chega **como valor** no `GenerationContext` (o campo `domain` foi removido no 08 — re-adicionar um campo com a forma nova, não o binário fossilizado).

## Mudança
- Adicionar o Practice Profile (valor) ao `GenerationContext`; o backend popula a partir do repositório (F0-1d).

## Aceite
- [ ] `GenerationContext` carrega o perfil como valor; `text-quality` não ganha import de `database`.
- [ ] `pnpm smoke` (monorepo-governance) verde.

## Verify
`pnpm smoke` + rodar uma geração e confirmar o perfil no contexto.
