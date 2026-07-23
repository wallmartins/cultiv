# F2-6 · Config da cadeia Gemini→Groq para os passos generativos novos

**Fase:** 2 — O gerador
**Caminho crítico:** não
**Depende de:** F2-1 (os passos existem)
**Destrava:** —
**Origem:** ADR 0010 §3 · plano F2-2 · ticket 04

## Contexto
O failover entre providers **já existe** (`preferredAttempts`/`fallbackAttempts`, usado no Voice Rebuild). É **config**, não infra nova.

## Mudança
- No `catalog.json` (policy), definir `preferredAttempts:[gemini…]` + `fallbackAttempts:[groq…]` para os passos G1-G5.

## Aceite
- [ ] Cada passo generativo tem a cadeia configurada; esgotamento aciona o piso de superfície correto (F3-2 / degrade).

## Verify
Simular falha do preferido e confirmar failover pro fallback via `pipeline-execution-adapter`.
