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
- [x] Superfície de grounding em `ai-adapters` + G2 pede grounding; `ponytail: platform` removido.
- [ ] **(live-only, deferido ao ambiente)** discriminabilidade (T2/T3) sobe em campos distantes — só
      comprovável rodando o eval multi-domínio contra o Gemini ao vivo (ver Verify).

## Resolução (2026-07-22)
A superfície de grounding nativo foi construída e o G2 liga grounding **incondicionalmente** (decisão
do usuário: "grounding ON agora", assumindo o risco de degradar via chain se o modelo rejeitar o tool):

- **`packages/ai-adapters/src/types.ts`** — `AIGroundingRequest { webSearch: boolean }` + campo opcional
  `grounding` em `AIModelRequest`. Providers sem superfície de grounding (OpenAI-compatible/Groq/Ollama)
  ignoram o campo, então a chain degrada pra fallback ungrounded sem erro.
- **`packages/ai-adapters/src/providers/gemini.ts`** — quando `grounding.webSearch`, o `buildRequest`
  emite `tools: [{ google_search: {} }]` (forma Gemini 2.x/3.x; a chain roda gemini-3.1-flash-lite →
  gemini-2.5-flash → groq, então é a forma certa; `google_search_retrieval` era a era 1.5).
- **Seam** — `PracticeProfileGenerationConfig.grounding?: boolean` fia `grounding: { webSearch: true }`
  no `AIModelRequest`; **só** `enrichPracticeProfile` (G2) o seta. O seed (G1) permanece passe
  paramétrico puro (sem chamada externa). Marcador `ponytail: platform` removido do generator.

**Caveat de verificação (honesto):** a parte "discriminabilidade sobe" é *inerentemente eval-only* — só
o ambiente com o Gemini ao vivo + o eval multi-domínio (F6-2) pode comprová-la; não roda daqui. Os
testes daqui cobrem a **forma do request** (Gemini emite o tool sse grounding pedido; G2 pede, G1 não):
`tests/ai-adapters/gemini-adapter.test.ts` + o bloco "FU-2 web grounding" em
`apps/backend/tests/practice-profile-generator.test.ts`.

**Risco aceito:** se o modelo Gemini da VPS rejeitar o JSON do `google_search`, a tentativa Gemini
falha e a chain cai pro fallback (gemini-2.5 → groq ungrounded) — degrada ao comportamento anterior,
não quebra. Rodar o Verify abaixo antes de considerar a discriminabilidade comprovada.

## Verify
Eval multi-domínio (FU-3/F6-2) com grounding ligado vs desligado: a especificidade das dimensões Clichê/Léxico sobe.
