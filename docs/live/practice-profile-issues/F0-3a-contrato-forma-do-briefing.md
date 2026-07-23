# F0-3a · Contrato: nova forma do briefing

**Fase:** 0 — Contratos & schema
**Caminho crítico:** ⚠️ SIM
**Depende de:** —
**Destrava:** F0-3b, F0-3c, e toda a redação de perguntas (F4-3, F4-4)
**Origem:** ADR 0010 §6 · plano F0-3 · ticket 06

## Contexto
Hoje `buildBriefing()` colapsa experiência/tensão/motivação/extras num `keyPoints: string[]` **sem rótulo**; só `thesis` vira `goal`. A LLM recebe strings anônimas → **toda adaptação de perguntas é cosmética** enquanto o briefing não mudar de forma. Este é o pré-requisito estrutural de todo o resto da geração.

## Mudança
Definir a forma do briefing no contrato compartilhado como:
```ts
{ topic, audience, payload, anchor, resistance, stake }
```
- `audience` opcional (populado no F4-1 via estreitamento de público).
- Campos rotulados substituem o `keyPoints[]` anônimo.
- Arquivo: `packages/contracts/src/` (schema do briefing / generation request).

## Aceite
- [ ] O tipo do briefing expõe os 6 campos rotulados; o `keyPoints[]` anônimo não existe mais no contrato.
- [ ] `pnpm lint` (tsc) verde em todos os pacotes que importam o tipo.

## Verify
`pnpm vitest run` no teste de contrato do briefing (criar se não houver). Confirmar que decodificar um briefing com os 6 campos passa e que o formato antigo é rejeitado.
