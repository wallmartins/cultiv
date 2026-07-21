# F2-1 · G1 — gerador da semente síncrona (especificidade paramétrica)

**Fase:** 2 — O gerador
**Caminho crítico:** ⚠️ SIM (espinha)
**Depende de:** F0-1c (contrato), F0-1d (repo), F2-8 (leis)
**Destrava:** F2-2, F2-3, F2-4, F3-1, F6-2
**Origem:** ADR 0010 §3 · norte `gerador-spec.md` (G1) · ticket 04

## Contexto
O tier síncrono: força o modelo a **nomear** praticantes/debates/normas concretas antes de preencher as 7 dimensões. Rápido, cabe na rota crítica tela 1→2. Serve à âncora de calibração.

## Mudança
- Prompt G1 que recebe os eixos declarados e devolve `PracticeProfile` com `depth:"seed"`.

## Aceite
- [ ] Devolve as 7 dimensões preenchidas por especificidade; JSON puro.
- [ ] Discriminabilidade (T1/T2) passa nas amostras do norte.

## Verify
Rodar G1 nos 3 domínios do norte e comparar com `norte/amostras/*.md` (T4).
