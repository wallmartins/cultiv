export const states = {
  // Shared between VoiceDriftNudge and RecalibrateWithRunning — identical copy in the source.
  recalibrateNow: "Recalibrar agora →",

  degradedDelivery: {
    title: "Este texto saiu abaixo do combinado",
    body: (lengthLabel: string, requestedWords: number, deliveredWords: number) =>
      `Você pediu ${lengthLabel} (~${requestedWords} palavras); saíram ${deliveredWords}. Entregamos mesmo assim — pode servir. Refazer não custa créditos.`,
    redoFree: "Refazer grátis →",
    wordCount: (deliveredWords: number, requestedWords: number) => `${deliveredWords} de ~${requestedWords} palavras`
  },

  downgradeSurplus: {
    header: (fromPlan: string, toPlan: string) => `trocar plano · ${fromPlan} → ${toPlan}`,
    heading: (toPlan: string) => `Você tem mais créditos que o teto do ${toPlan}.`,
    keptLabel: "continuam como créditos do plano",
    surplusLabel: "viram saldo avulso — sem validade, usados primeiro",
    footnote: (toPlan: string, keptCredits: number) =>
      `Nada é confiscado. A partir do próximo ciclo, o rollover respeita o teto do ${toPlan} (${keptCredits}).`,
    keep: (fromPlan: string) => `Manter o ${fromPlan}`,
    confirm: "Confirmar downgrade →"
  },

  longTimeoutWatch: {
    writing: "escrevendo com a sua voz…",
    slowNotice:
      "Está demorando mais que o normal. O texto continua sendo escrito — pode fechar esta tela que a gente avisa quando ficar pronto.",
    cancelGeneric: "Cancelar e estornar os créditos reservados",
    cancelWithCredits: (creditsLabel: string) => `Cancelar e estornar ${creditsLabel}`,
    continueWaiting: "Continuar esperando →"
  },

  pastedThemeFormatted: {
    pastedHint: "colado de outro lugar? a gente organiza",
    confirmEyebrow: "entendi assim — confirma?",
    channelDetected: (channel: string) => `canal detectado: ${channel}`,
    angles: (anglesLabel: string) => `ângulos: ${anglesLabel}`,
    // Double pluralization in pt ("link(s) guardado(s)") — one leaf per language, not shared
    // fragments; see CONVENTIONS.md.
    linksSaved: (n: number) =>
      `${n} ${n === 1 ? "link guardado" : "links guardados"} como referência — não vamos abrir, só citar se você pedir`,
    useAsPasted: "usar o texto como colei",
    confirmAndContinue: "Confirmar e seguir →"
  },

  paymentPendingZeroCredits: {
    creditsLabel: "CRÉDITOS",
    title: "Seus créditos acabaram — e a renovação não passou.",
    body: (planName: string, creditsLabel: string) =>
      `Não conseguimos cobrar o ${planName} este mês. Regularizando, os ${creditsLabel} do ciclo entram na hora. Sua voz e seu histórico estão intactos.`,
    regularize: "Regularizar pagamento →",
    buyExtra: "Comprar créditos avulsos",
    footnote: "compra avulsa reabre depois de regularizar · dúvidas? suporte@cultiv.app"
  },

  postResetReturn: {
    title: (name: string) => `De volta ao começo, ${name}.`,
    body: (dateLabel: string) =>
      `Sua conta foi resetada em ${dateLabel}: voz, exemplos e histórico foram apagados. Seu login e seu plano continuam os mesmos.`,
    priorContextIntro: "Da última vez você escrevia sobre",
    priorContextFor: "para",
    priorContextQuestion: "Quer partir daí ou começar do zero?",
    startFresh: "Começar do zero",
    recalibrateWithContext: "Recalibrar com esse contexto →"
  },

  queueAndTrialGate: {
    lastGeneration: "Esta é a sua última geração do teste.",
    explanation:
      "Depois dela, escrever de novo pede um plano. Sua voz e seu histórico ficam — o limite do teste é só volume.",
    queueStatus: (generationsLabel: string, queueEta: string) =>
      `${generationsLabel} rodando agora — esta entra na fila e começa em ${queueEta}`,
    saveForLater: "Guardar pra depois",
    useLast: "Usar a última e entrar na fila →",
    viewPlans: "ver planos antes de decidir →"
  },

  recalibrateWithRunning: {
    header: (fromVersion: number, toVersion: number) => `recalibrar · voz v${fromVersion} → v${toVersion}`,
    // Double pluralization in pt (gender agreement on "escrito(s)") — whole-sentence leaf per
    // language rather than shared fragments; see CONVENTIONS.md.
    runningNotice: (n: number) =>
      n === 1 ? "Você tem 1 texto sendo escrito agora." : `Você tem ${n} textos sendo escritos agora.`,
    explanation: (fromVersion: number, toVersion: number) =>
      `Eles terminam com a voz atual (v${fromVersion}) — nada é interrompido. Tudo o que você gerar depois da recalibração usa a v${toVersion}. O histórico marca a versão de cada texto.`,
    finishesAtVersion: (version: number) => `termina na v${version}`,
    wait: "Esperar terminarem"
  },

  reconnectionReconcile: {
    title: "De volta — aqui vai o que aconteceu",
    viewReady: "Ver o pronto →",
    offlineIntro: (mins: number) => `Você ficou offline por ${mins} ${mins === 1 ? "minuto" : "minutos"}.`,
    readyEvent: (topic: string) => `"${topic}" ficou pronto`,
    resumedEvent: (topic: string, pct: number) => `"${topic}" segue escrevendo (${pct}%)`,
    sinceThen: (intro: string, eventsLabel: string) => `${intro} Nesse tempo, ${eventsLabel}.`,
    and: "e",
    resumedStatus: (pct: number) => `retomado · escrevendo… ${pct}%`
  },

  voiceDriftNudge: {
    prompt: "soou como você?",
    confirms: "Confere",
    notReally: "Nem tanto",
    title: "Sua voz parece ter mudado desde a calibração.",
    explanation: (confidenceFrom: number, confidenceTo: number) =>
      `Foi o terceiro "nem tanto" seguido — a confiança caiu de ${confidenceFrom} pra ${confidenceTo}. Normal: a escrita de todo mundo evolui. Uma recalibração rápida (só as amostras que mudaram) realinha.`,
    snooze: "depois · não mostrar por 7 dias"
  },

  locked: {
    demoGeneration: {
      seal: "exemplo",
      defaultTopic: "por que times pequenos escrevem melhor",
      defaultParagraphs: [
        "Time grande não escreve pior por falta de talento — escreve pior porque ninguém assume a voz sozinho.",
        "Isso é o que sua voz calibrada resolve: um jeito de escrever que é seu, reconhecível, replicável a cada geração."
      ]
    },
    lockedCenter: {
      notice: "nenhuma geração real ainda — o exemplo abaixo é ilustrativo",
      calibrateCta: "Reativar minha voz →"
    },
    companionEmpty: {
      description: "sua voz aparece aqui depois da calibração",
      ctaLabel: "calibrar minha voz →"
    }
  }
};
