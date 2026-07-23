# F0-4d · Contrato `Rhetorical Mode` (dominante + secundário)

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não (destrava a espinha)
**Depende de:** —
**Destrava:** F1-2, F1-3, F0-5b, F4-3
**Origem:** ADR 0010 §10 · norte `genero-dimensoes.md` · tickets 13, 14

## Contexto
Modo retórico = dominante + secundário opcional de {expor·narrar·argumentar·instruir·promover}. Representação híbrida: enum reduzido (controle) + prosa (prompt). Classificado por **substância, não por léxico**.

## Mudança
- Definir o contrato do Modo retórico (dominante + secundário) + a descrição em prosa; entra na forma do prefill/execução.

## Aceite
- [ ] Contrato tem dominante + secundário opcional; enum fechado dos 5 modos.

## Verify
`pnpm vitest run` no contrato de gênero.
