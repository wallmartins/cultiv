# F4-1 · Popular `briefing.audience`

**Fase:** 4 — Geração
**Caminho crítico:** não
**Depende de:** F0-3a, F4-2 (o estreitamento produz o valor)
**Destrava:** F4-4
**Origem:** ADR 0010 §11 · plano F4-1 · tickets 06, 12

## Contexto
O soquete **já está ligado** — `skill-inputs.ts:44` lê e injeta, `skill-templates.ts:98` instrui o modelo. Só falta **popular**.

## Mudança
- `buildBriefing()` seta `audience` a partir do público estreitado (F4-2).

## Aceite
- [ ] `briefing.audience` chega populado ao prompt; deixa de ser socket vazio.

## Verify
Gerar com público estreitado e confirmar `Audience:` no prompt renderizado.
