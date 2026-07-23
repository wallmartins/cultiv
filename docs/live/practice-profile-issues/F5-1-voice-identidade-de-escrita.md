# F5-1 · `/voice` vira "sua identidade de escrita" (voz + prática)

**Fase:** 5 — `/voice`
**Caminho crítico:** não
**Depende de:** F0-1c, F0-1d
**Destrava:** F5-2, F5-3
**Origem:** ADR 0010 §4 + Consequências (emenda ADR 0005) · plano F5-1 · ticket 03

## Contexto
Voz + prática numa **casa só**, duas seções (razão do usuário: a forma se adapta a quem/sobre o que se escreve, sem perder autenticidade). Reusa o gesto de aceitar/rejeitar de `voice.tsx:97-103`.

## Mudança
- `/voice` ganha a seção de prática ao lado da voz. Companion = subconjunto read-only; `settings` continua só espelhando (não ganha edição de prática).

## Aceite
- [ ] `/voice` mostra voz + prática, duas seções; companion read-only.

## Verify
Abrir `/voice` e conferir as duas seções.
