# F4-6 · Vocabulário de chips de canal (tirar os nomes de plataforma)

**Fase:** 4 — Geração
**Caminho crítico:** não
**Depende de:** —
**Destrava:** —
**Origem:** ADR 0010 §7 · plano F4-6 · tickets 06, 07

## Contexto
`GenerationChannelSchema` (5 buckets funcionais) é são; o viés é `platformOptions()` (`generate-view.ts:144-154`, 7 nomes de plataforma). Conserto de **vocabulário na web**, não de contrato.

## Mudança
- Trocar os 7 rótulos de plataforma por escolha por **bucket funcional** (professional-network/blog/email/social).

## Aceite
- [ ] O autor escolhe por bucket funcional; nenhum nome de plataforma hard-coded na UI.

## Verify
Abrir a tela de geração e conferir os chips.
