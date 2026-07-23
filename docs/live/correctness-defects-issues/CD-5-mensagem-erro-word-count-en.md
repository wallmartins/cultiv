# CD-5 · Mensagem de erro de word-count crua em inglês na UI pt-BR

**Fase:** defeitos de corretude · **Corte:** antes do beta (trivial, beta-visível)
**Caminho crítico:** não · **Depende de:** — · **Destrava:** onboarding sem erro cru
**Origem:** wayfinder 05 (atualização do mapa irmão) — conserto **independente** roteado pra cá · survey §9

## Contexto
`voice-calibration-service.ts:540` devolve `` `Text must contain at least ${Math.floor(targetWords * 0.5)} words` ``
— **inglês cru**, que chega ao usuário numa UI **pt-BR** via `describeCalibrationError()`
(`apps/web/src/routes/calibrate-view.ts`). Espelho invertido do cluster do CD-4 (aqui está preso em inglês).
Acontece **no onboarding, no 1º passo em que a pessoa escreve** — o pior lugar pra um erro sem explicação.

Independente da postura de idioma do CD-4 e do redesenho do wizard: a mensagem precisa ser localizada e
específica de qualquer forma. É pequeno, seguro e standalone.

## Mudança
- Localizar a mensagem (pt-BR; e no idioma do locale se a postura do CD-4 já tiver landado) e torná-la
  específica (o número de palavras exigido). Idealmente via a mesma camada de i18n/`describeCalibrationError`
  em vez de uma string crua no serviço.
- Ao mexer aqui, checar o CD-7 caso 1 (`minWords` cosmético no cliente vs. hard-gate no servidor) — a
  mensagem certa depende de qual regra o gate exige.

## Aceite
- [ ] A validação de word-count chega ao usuário localizada e específica; sem string crua em inglês no
      serviço; teste cobre a mensagem.

## Verify
Teste que o erro de word-count no onboarding tem a mensagem localizada esperada (não `Text must contain…`).
