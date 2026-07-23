# F0-2b · Web: gate da Tela 1 → `assunto && lugarDeFala && público≥1`

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não
**Depende de:** F0-2a
**Destrava:** —
**Origem:** ADR 0010 §5 · ticket 05

## Contexto
O gate muda de `domain && audience` para os 3 eixos obrigatórios. Público é **digitado** (não chip — chip é do estreitamento por geração, F4-2).

## Mudança
- `Step1Context.tsx:29`: gate `assunto && lugarDeFala && público≥1`; campo de público digitado, múltiplas entradas.

## Aceite
- [ ] A tela 1 só avança com os 3 eixos preenchidos; público aceita múltiplas entradas digitadas.

## Verify
Abrir o onboarding e testar o gate.
