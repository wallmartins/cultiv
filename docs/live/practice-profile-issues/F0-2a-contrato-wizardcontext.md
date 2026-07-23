# F0-2a · Contrato `WizardContextSchema` (eixos novos, remove `selfDeclaredStrength`)

**Fase:** 0 — Contratos & schema
**Caminho crítico:** não
**Depende de:** —
**Destrava:** F0-2b
**Origem:** ADR 0010 §5 · ticket 05

## Contexto
A tela 1 passa a coletar assunto/lugar de fala/públicos (livres, obrigatórios). `selfDeclaredStrength` era coletado e descartado.

## Mudança
- `WizardContextSchema` (`packages/contracts/src/voice-calibration.ts:5-9`): add `assunto`, `lugarDeFala`, `públicos[]`; **remover `selfDeclaredStrength`**. Público = texto livre, múltiplas entradas.

## Aceite
- [ ] Schema tem os 3 eixos; `selfDeclaredStrength` não existe.
- [ ] `pnpm lint` verde.

## Verify
`pnpm vitest run` no teste de contrato do wizard.
