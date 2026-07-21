# F3-2 · Piso do onboarding: bloquear + retentar, sem escape genérico

**Fase:** 3 — Onboarding
**Caminho crítico:** não
**Depende de:** F3-1
**Destrava:** —
**Origem:** ADR 0010 §4 + Consequências (fronteira c/ ADR 0004) · plano F3-2 · tickets 03, 04

## Contexto
Custo assimétrico: amostra genérica envenena o Voice Profile permanentemente. **NÃO** é o piso "nunca bloqueia" da ADR 0004 (que é da geração). Onboarding tem piso próprio.

## Mudança
- Auto-retry 2× invisível (`Effect.retry(Schedule.recurs(2))`) → falha visível + botão de retentar (re-roda dos campos declarados) → "continuar assim mesmo" **de-enfatizado**. Cadeia Gemini→Groq por baixo (F2-6). **Sem** prompt agnóstico como default.

## Aceite
- [ ] Falha persistente mostra erro + retry, nunca cai em prompt genérico silencioso.

## Verify
Simular falha da cadeia e confirmar o estado de erro+retry na UI.
