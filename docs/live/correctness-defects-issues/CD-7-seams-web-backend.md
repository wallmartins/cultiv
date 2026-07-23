# CD-7 · Seams web↔backend: regras duplicadas que já divergiram

**Fase:** defeitos de corretude · **Corte:** depois do beta (coordenar com o reshape de briefing do mapa irmão)
**Caminho crítico:** não · **Depende de:** reshape de briefing (mapa irmão) · **Destrava:** uma regra, um dono
**Origem:** wayfinder 07 (+ atualização do 06 do mapa irmão) · survey §6

## Contexto
Casos onde web e backend guardam a mesma regra separadamente.

- **Caso 1 — `minWords` cosmético no cliente, obrigatório no servidor.** `WritingStep.tsx:97` só bloqueia
  Continuar quando o texto está **vazio**; `minWords` é só rótulo do contador. O backend hard-gateia
  (`voice-calibration-service.ts:362-363`): `wordCount >= targetWords * 0.5`. 20 palavras num alvo de 60 → o
  cliente passa, o backend devolve **400** genérico. Pior lugar (onboarding). **Nota:** o `0.5` do backend não
  é o `minWords` mostrado — a UI promete um número e o servidor exige metade.
- **Caso 2 — `WORD_TARGETS` duplicado à mão.** `apps/web/src/routes/calibrate-view.ts` copia os números de
  `packages/domain/src/voice-calibration.ts` (o comentário `GAP-A` admite o gap). **Verificado 2026-07-22:**
  os *targets* ainda concordam (60/150/250/180), mas são dois literais independentes que nada garante que
  concordem — e os *mins* já divergem da regra do gate (`*0.5`).
- **Caso 3 — ramos mortos do step-planner (o reshape do briefing JÁ landou).** `buildBriefing()`
  (`apps/web/src/routes/generate-view.ts:90-140`) **hoje** devolve os slots do backbone
  `{ topic, audience?, payload, anchor, resistance, stake }` — reshape das Fases 1/4. Logo a crítica
  original ("`{ topic, goal?, keyPoints? }` colapsa evidência/objeção num `keyPoints` sem rótulo") está
  **superada**: cada ângulo tem slot próprio. O que **sobrevive**: o step-planner (`briefing-rules.ts:92-102`)
  ainda lê `briefing.question` e `briefing.systemContext` — **campos que `buildBriefing` nunca seta** → os
  ramos de patch são **código morto** (o próprio arquivo comenta em `:27`: *"dead until defeitos/07"*). A
  condição "não há `briefing.question`" é sempre verdadeira, então o ramo dispara sempre pelo motivo errado.
- **Caso 4 — 3º mapa canal→content-type morto (achado no audit FU-6).** `resolveContentTypeHints`
  (`voice-shared.ts:17-35`) e `resolveContributionCode` (`:155-177`) codificam à mão
  `channel === "linkedin"/"newsletter"/"blog"` → content-type, com **literais que não são `GenerationChannel`**
  (`"professional-network"|"social"|"email"|"blog"|"unspecified"`) — os ramos nunca disparam com valores
  reais (código morto; só `test-helpers.ts` os exercita). FU-4 unificou os dois mapas **vivos**
  (`channel-content-types.ts`); estes ficaram de fora por serem mortos. Deletar (ponytail) ou migrar pro
  fonte único se algum dia forem fiados.

## DECISÃO / TRABALHO
1. **Verificar se já divergiram** (targets/mins dos dois lados) — feito parcialmente acima; confirmar mins.
2. **Uma fonte só:** `packages/domain` é importável pelos dois lados e hospeda `CALIBRATION_WIZARD_STEPS` — o
   alvo natural. Checar `monorepo-governance`: se a aresta web→domain não estiver na allow-list, é mudança
   **intencional** de allow-list, não contorno.
3. **Política do gate (decisão):** o cliente espelha `>= targetWords * 0.5`, ou o backend afrouxa pro
   `minWords` mostrado? Os dois estão errados de formas diferentes. Mensagem específica se o gate sobreviver
   (ver CD-5).
4. **Ramos mortos do step-planner:** o reshape do briefing **já landou** (Fases 1/4), então não há mais o
   que coordenar com o irmão. Resta decidir os ramos `briefing.question`/`briefing.systemContext`: **religar**
   com os campos reais do briefing atual (`payload`/`anchor`/`resistance`/`stake`) **ou deletar** — a mesma
   pergunta "ligar ou deletar" do mapa.
5. **Mapa morto do `voice-shared.ts` (Caso 4):** deletar ou migrar pro `channel-content-types.ts` (FU-4).

## Aceite
- [ ] Verificado se os números divergiram; regra de word-target com uma fonte só; política do gate decidida +
      mensagem; ramos mortos do step-planner religados com os campos novos ou deletados; mapa morto do
      `voice-shared.ts` (Caso 4) deletado ou migrado.

## Verify
Teste de consistência do word-target (uma fonte, os dois lados concordam); grep dos campos
`briefing.question`/`briefing.systemContext` → têm produtor ou os ramos morrem.
