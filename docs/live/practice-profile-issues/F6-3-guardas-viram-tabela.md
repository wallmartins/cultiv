# F6-3 · Guardas de drift/critic → tabela declarativa keyed-by-value

**Fase:** 6 — Qualidade & eval
**Caminho crítico:** não
**Depende de:** F0-4a (o enum ampliado)
**Destrava:** —
**Origem:** ADR 0010 §10 · plano F6-3 · ticket 14 (decisão do usuário)

## Contexto
Decisão do usuário: **nunca cadeia de `if`**. As guardas por-valor em `development-drift.ts:90-131`, `development-critic.ts:36-47`, `voice-signature-divergence.ts:25-64` viram **tabela declarativa com default seguro** — adicionar postura = 1 linha, valor sem linha cai em guarda neutra (nunca desprotegido).

## Mudança
- Substituir as cadeias de `if` por `Record<EpistemicPosture, {forbids, expects}>` + loop genérico + fallback neutro para valores sem linha.

## Aceite
- [ ] Adicionar um valor novo de postura não exige tocar drift/critic/divergence (só a tabela).
- [ ] Valor sem linha cai na guarda neutra, testado.

## Verify
Teste: adicionar uma postura fictícia sem linha → cai no default seguro, não desprotegida.
