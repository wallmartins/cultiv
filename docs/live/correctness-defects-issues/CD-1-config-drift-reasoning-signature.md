# CD-1 · `voice.reasoningSignatureV1` — deriva default/CI vs. produção

**Fase:** defeitos de corretude · **Corte:** depois do beta
**Caminho crítico:** não · **Depende de:** — · **Destrava:** dev/CI exercitando o mesmo produto que produção
**Origem:** wayfinder 02 (premissa **falsificada** 2026-07-20) · survey §9

## Contexto
O survey mapeou este item presumindo a flag **desligada**. Está **ligada em produção**
(`VOICE_REASONING_SIGNATURE_V1=true` na VPS; a fiação foi verificada em código:
`config-env.ts:32` → `config.reasoningSignatureV1Enabled` → `resolveBackendFeatureFlags`
sobrescreve o default do registry (`packages/feature-flags/src/defaults.ts:49-51`) →
`createFeatureFlagRegistry` no bootstrap → os 5 call sites de `isEnabled("voice.reasoningSignatureV1")`
retornam `true`). **Em produção o `CONTEXT.md` está correto** — extração roda, hints são injetados, Voice
Judge roda, `traitProfile` é produzido.

O defeito real é **deriva de configuração**: `defaults.ts:49` (`enabled: false`) e `.env.example:76`
(`=false`) dizem o oposto; a var não existe no `.env` local. **Todo ambiente novo (dev, CI, um 2º nó) roda
um produto diferente do de produção, silenciosamente** — o eval fecha o portão de CI com a flag *off*
enquanto produção roda com ela *on*. Isso explica por que o survey concluiu o oposto lendo só o repo.

## DECISÃO (confirmar na implementação)
1. **O default deve virar `true`?** *Recomendação:* **sim** — alinhar default com produção para dev/CI
   pararem de validar um caminho que produção não usa. Verificar antes: por que estava `false` (incompleta,
   cara, incidente, ou nunca ligada?) — a resposta muda a ação.
2. **Se ficar `false`:** o que garante que dev/CI não validem um caminho morto? (rodar o eval com a flag no
   valor de produção; ou um teste que afirma que o valor efetivo em CI == produção).
3. **`CONTEXT.md`** só pode descrever o que roda: se a flag ficar off por default mas on em prod, registrar
   qual é o produto real; documentação que descreve código morto é pior que documentação ausente.

## Mudança
- Decidir o default; se `true`, mudar `defaults.ts:49` + `.env.example:76` e conferir os 5 call sites.
- Guarda de CI: o eval roda com o valor efetivo de produção da flag (ou um teste afirma a paridade).
- Ajustar `CONTEXT.md` conforme a decisão.

## Aceite
- [ ] Default decidido e registrado; dev/CI exercitam o mesmo caminho de produção (ou um guarda afirma isso);
      `CONTEXT.md` descreve o que de fato roda.

## Verify
Teste/guarda que o valor efetivo da flag no eval/CI == produção; grep dos 5 call sites.
