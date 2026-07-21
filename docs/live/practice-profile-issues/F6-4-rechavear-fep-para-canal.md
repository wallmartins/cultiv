# F6-4 · Re-chavear o Format Expression Profile de content-type → canal

**Fase:** 6 — Qualidade & eval
**Caminho crítico:** não
**Depende de:** F1-1b (content type morto)
**Destrava:** —
**Origem:** ADR 0010 §11 + `CONTEXT.md` · plano F6-4 · tickets 12, 07

## Contexto
O FEP é chaveado por Content Type (`CONTEXT.md:671`), que o 07 matou. Re-chavear pra **canal** (consistente com "how the author sounds on a channel"). Público **não** entra no FEP — é eixo paralelo (FEP=voz, público=acessibilidade).

## Mudança
- Trocar a chave do FEP de Content Type para canal onde é construído/lido.

## Aceite
- [ ] FEP keyed por canal; nenhuma referência a Content Type; público fora do FEP.

## Verify
`pnpm vitest run` nos testes de resolução de voz/FEP.
