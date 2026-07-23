# F4-2 · Estreitamento de público por chips (passo ①, antes das perguntas)

**Fase:** 4 — Geração
**Caminho crítico:** não
**Depende de:** F0-1c (públicos declarados)
**Destrava:** F4-1, F4-3
**Origem:** ADR 0010 §6, §11 · plano F4-2 · ticket 06

## Contexto
O estreitamento vira um passo **antes** das perguntas (a redação delas depende do público). Amortecedores decididos pelo usuário. "+adicionar público" = efêmero pra aquela geração.

## Mudança
- UI de chips a partir do conjunto declarado no Practice Profile; auto-pular com público único; denominador comum quando não se estreita.

## Aceite
- [ ] O passo aparece antes das perguntas; público único auto-pula; não-estreitar usa o conjunto inteiro.

## Verify
Fluxo de geração local com 1 e com N públicos.
