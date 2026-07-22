export const shell = {
  yourVoice: "Sua voz",
  account: "Conta",
  voiceProfile: "Perfil de voz",
  billing: "Planos & billing",
  settings: "Configurações",
  logout: "Sair",
  newGeneration: "＋ Nova geração",
  searchPlaceholder: "buscar por tema…",
  toastOpen: "abrir →",
  toggleHistory: "alternar histórico",
  toggleTheme: "alternar tema",
  statusFilter: {
    all: "TODOS",
    done: "PRONTOS",
    running: "RODANDO",
    queued: "NA FILA",
    failed: "FALHAS",
    cancelled: "CANCELADOS"
  },
  periodFilter: { all: "SEMPRE", "7d": "7D", "30d": "30D", "90d": "90D" },
  // Keyed by a stable id, not by the rendered label — grouping used to key its Map on the
  // translated string, which would split buckets the moment the locale changed.
  historyGroup: {
    today: "Hoje",
    yesterday: "Ontem",
    week: "7 dias",
    month: "Este mês",
    older: "Mais antigo"
  },
  showOlder: (count: number) => `mostrar mais antigos · ${count}`,
  emptyFiltered: "nenhuma geração encontrada · limpe a busca ou os filtros",
  emptyNone: "nenhuma geração ainda · toque em ＋ Nova geração para começar",
  emptyOtherStatus: (count: number) =>
    `nada aqui com esse filtro — mas há ${count} ${count === 1 ? "resultado" : "resultados"} em outros status`,
  clearFilterCta: (count: number) => (count === 1 ? "Limpar filtro e mostrar 1 →" : `Limpar filtro e mostrar os ${count} →`),
  itemWriting: (percent: number) => `escrevendo… ${percent}%`,
  itemQueued: (suffix: string) => `na fila${suffix}`,
  itemFailed: (suffix: string) => `falhou${suffix}`,
  itemCancelled: (suffix: string) => `cancelado${suffix}`,
  topbar: {
    generate: "NOVA GERAÇÃO",
    voice: "SUA VOZ",
    plans: "PLANOS",
    billing: "BILLING",
    settings: "CONFIGURAÇÕES",
    detail: "GERAÇÃO",
    fallback: "CULTIV"
  },
  creditsLabel: (credits: number, texts: number) => `${credits} créditos · ~${texts} textos`,
  creditsUnknown: "— créditos",
  companion: {
    title: "Sua voz",
    close: "fechar",
    emptyDescription: "sua voz aparece aqui depois da calibração",
    emptyCta: "calibrar agora →",
    howIThink: "Como eu penso",
    seeFullProfile: "ver perfil completo →",
    meta: (caption: string, version: number) => `confiança ${caption.toLowerCase()} · versão ${version}`,
    practiceHeading: "Prática"
  },
  toast: {
    ready: (topic?: string) => (topic ? `"${topic}" ficou pronto` : "sua geração ficou pronta"),
    failed: (topic?: string) => (topic ? `"${topic}" não deu certo` : "uma geração não deu certo"),
    withReason: (head: string, reason: string) => `${head} — ${reason}`
  }
};
