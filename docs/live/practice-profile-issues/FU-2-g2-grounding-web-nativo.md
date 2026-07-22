# FU-2 · G2 grounding web nativo (destravar o deferral de plataforma)

**Fase:** Follow-up pós-6 (plataforma)
**Caminho crítico:** não
**Depende de:** superfície de grounding/tool-use em `ai-adapters` (não existe hoje)
**Destrava:** especificidade do enriquecimento G2 em campos de cauda longa
**Origem:** ADR 0010 §3 · plano "Deferrals de plataforma" · marcador `ponytail: platform` em `apps/backend/src/product/practice-profile/practice-profile-generator.ts:112`

## Contexto
O enriquecimento **G2** deveria usar **grounding web nativo do provider** (ADR §3, mirado em especificidades — praticantes/debates/casos reais). `ai-adapters` não tem superfície de grounding/tool-use, então hoje o G2 roda como **2ª passada de especificidade paramétrica** (mesma fonte da semente G1, não grounding real). **G5** (perguntar ao autor no `/voice`) é o mitigador do buraco epistêmico até lá. O seam já é plugável.

## Mudança
- Adicionar superfície de grounding/tool-use em `ai-adapters` (ex.: Gemini grounding / provider tool-use).
- Trocar o seam no `practice-profile-generator.ts` da 2ª-passada-paramétrica pelo grounding real; remover o marcador `ponytail: platform`.
- Avaliar custo/latência (é passo assíncrono pós-consentimento no rebuild — cabe).

## Aceite
- [ ] G2 enriquece com grounding web real; `ponytail: platform` removido; discriminabilidade (T2/T3) sobe em campos distantes.

## Verify
Eval multi-domínio (FU-3/F6-2) com grounding ligado vs desligado: a especificidade das dimensões Clichê/Léxico sobe.
