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
- **Caso 3 (novo) — `buildBriefing` vs. step-planner.** `buildBriefing()`
  (`apps/web/src/routes/generate-view.ts:106-132`) produz `{ topic, goal?, keyPoints? }`. O step-planner
  (`briefing-rules.ts:24-44`) lê `briefing.question` e `briefing.systemContext` — **campos que `buildBriefing`
  nunca seta** → ramos de patch são **código morto** (a condição "não há `briefing.question`" é sempre
  verdadeira, então o ramo dispara sempre pelo motivo errado). E `buildBriefing` colapsa evidência/objeção/etc.
  num `keyPoints: string[]` **sem rótulo** — a LLM nunca soube qual string era o quê.

## DECISÃO / TRABALHO
1. **Verificar se já divergiram** (targets/mins dos dois lados) — feito parcialmente acima; confirmar mins.
2. **Uma fonte só:** `packages/domain` é importável pelos dois lados e hospeda `CALIBRATION_WIZARD_STEPS` — o
   alvo natural. Checar `monorepo-governance`: se a aresta web→domain não estiver na allow-list, é mudança
   **intencional** de allow-list, não contorno.
3. **Política do gate (decisão):** o cliente espelha `>= targetWords * 0.5`, ou o backend afrouxa pro
   `minWords` mostrado? Os dois estão errados de formas diferentes. Mensagem específica se o gate sobreviver
   (ver CD-5).
4. **Ramos mortos do step-planner:** religar com os campos do briefing reshapeado (mapa irmão) **ou deletar**
   — a mesma pergunta "ligar ou deletar" que dá forma a este mapa. **Não consertar a forma do briefing aqui**
   sem o esforço do irmão; o conserto certo é o mesmo trabalho.

## Aceite
- [ ] Verificado se os números divergiram; regra de word-target com uma fonte só; política do gate decidida +
      mensagem; ramos mortos do step-planner religados com os campos novos ou deletados.

## Verify
Teste de consistência do word-target (uma fonte, os dois lados concordam); grep dos campos
`briefing.question`/`briefing.systemContext` → têm produtor ou os ramos morrem.
