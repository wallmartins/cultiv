# F3-1 · Derivação síncrona do perfil-semente entre tela 1 e 2

**Fase:** 3 — Onboarding
**Caminho crítico:** ⚠️ SIM
**Depende de:** F0-1c, F0-1d, F2-1 (G1)
**Destrava:** F3-2, F3-4
**Origem:** ADR 0010 §4 · plano F3-1 · tickets 01, 05, 04

## Contexto
Nova chamada de LLM **síncrona** no caminho crítico do funil (hoje o wizard não tem nenhuma). Roda G1 entre a tela 1 e a tela 2, persiste o perfil-semente.

## Mudança
- Endpoint/serviço que dispara G1 após a tela 1, persiste via F0-1d, e libera a tela 2.
- Latência e timeout nomeados.

## Aceite
- [ ] Perfil-semente persistido antes da tela 2; latência aceitável.

## Verify
Rodar o onboarding local e confirmar o perfil gravado entre as telas.
