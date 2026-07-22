# CD-6 · Guarda anti-vazamento: reconciliação, retry e observabilidade

**Fase:** defeitos de corretude · **Corte:** reconciliação = antes do beta · resto = depois
**Caminho crítico:** não · **Depende de:** — · **Destrava:** Voice Profile que captura *como se pensa*, não *assunto*
**Origem:** wayfinder 06 · survey §6

## Contexto
`ANTI_TOPIC_EXTRACTION_RULES` + `detectTopicLeakage` impedem o Voice Profile de capturar **assunto** em vez
de **como a pessoa pensa** (a lei do `voice-profile-centralization` + ADR 0001). O guarda **está ligado**
(rastreado até o `fetch` do provider). Três buracos:

- **Buraco 1 — a reconciliação não é coberta (o maior).** `reconcileVoiceSignatures`
  (`voice-signature-reconciliation.ts:20-78`) recebe os 2 drafts já verificados **+ o texto cru dos exemplos**
  (`buildReconciliationPrompt:113-150` inclui `example.text.trim()`), harmoniza, e devolve (`:68-71`) com
  **zero triagem** (sem `detectTopicLeakage`, sem repetir as regras nos prompts). A saída **substitui
  incondicionalmente** os originais verificados (`voice-rebuild-pipeline.ts:222-225`). Dispara sempre que
  `evaluateVoiceSignatureDivergence` acha conflito estrutural — que é exatamente pra que ela existe.
- **Buraco 2 — o retry não se verifica.** A checagem roda só em `languageRetry === 0`
  (`voice-signature-extraction.ts:209`). Idioma (`:203-207`) e vazamento dividem **um único slot de retry**;
  se a saída do retry falha nas duas, nenhuma é re-verificada. `minHits` usa o default `2`.
- **Buraco 3 — nada é logado.** Sem `logger?.`/observabilidade em `runSignatureExtraction`. Vazamento
  detectado e vazamento que escapou são igualmente **invisíveis** em produção.

## DECISÃO (confirmar na implementação)
1. **A reconciliação recebe o guarda, ou para de receber texto cru?** *Recomendação:* **reprojetar o prompt
   pra não receber `example.text`** — harmonizar 2 drafts talvez não exija os exemplos originais; se não
   exigir, o vazamento fica **impossível** em vez de detectado (estritamente melhor). Se exigir, repetir as
   regras + chamar `detectTopicLeakage` na saída.
2. **O retry vira o quê?** Re-verificar, dar orçamento separado a cada guarda, ou aceitar um e falhar
   explícito. Falhar tem custo: a ADR 0004 diz que falha de inferência **nunca bloqueia o fluxo** — o
   degradado precisa existir.
3. **Observabilidade — quanto?** Contar disparos é barato e responde "o guarda funciona?". **Não logar
   conteúdo** — é material de voz, criptografado + rotação de chave em `safety/`.
4. **`minHits: 2` é o número certo?** Nunca calibrado. Sem observabilidade (buraco 3) não dá pra medir.

**Restrição:** `contracts`/`core` são pacotes Effect (sem `throw`, sem `decodeUnknownSync`, sem contratos
`Promise`). O guarda vive em `apps/backend/.../voice/`, fora dessa regra, mas o que ele tocar em contratos não.

## Aceite
- [ ] Reconciliação com solução decidida (guardar vs. não receber texto cru); retry com política;
      observabilidade escolhida sem vazar conteúdo; `minHits` escolhido em vez de herdado.

## Verify
Teste: saída de reconciliação que vaza assunto é barrada; contador de disparos incrementa (sem logar conteúdo).
