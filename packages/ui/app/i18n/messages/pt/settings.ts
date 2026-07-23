export const settings = {
  accountEyebrow: "Conta",
  viaAuth0: "via Auth0",
  preferencesEyebrow: "Preferências",
  interfaceLanguage: "Idioma da interface",
  languageGroupLabel: "idioma da interface",
  logout: "Sair",

  notificationsLabel: "Notificações de conclusão",
  notificationsSub: "avisa quando um texto fica pronto com a aba em segundo plano",
  notificationsDeniedHint: "ative nas configurações do navegador",
  themeReminderNote: "o tema claro/escuro mora no topo do app — não é uma configuração",

  privacyEyebrow: "Privacidade & dados",
  trainingConsentLabel: "Consentimento de treino",
  consentGrantedSub: (sinceLabel: string) => `concedido ${sinceLabel} — o controle mora no perfil de voz`,
  consentRevokedSub: "revogado — a geração está desligada",
  consentSinceLabel: (date: string) => `em ${date}`,
  manageInVoice: "gerenciar na voz →",

  exportDataLabel: "Exportar meus dados",
  exportDataSub: "perfil de voz + exemplos + histórico + conta, num download único",
  exportButton: "Exportar",
  exportingInProgress: "Exportando…",
  exportReadyTopic: "export pronto",
  exportFailedTopic: "não foi possível exportar",

  resetAccountLabel: "Resetar conta",
  resetAccountSub: "apaga voz, exemplos e histórico — mantém o login e volta ao início",
  resetButton: "Resetar",
  resetDialogEyebrow: "ação destrutiva · escopo médio",
  resetDialogTitle: "Resetar apaga tudo, menos o login",
  resetDialogBody:
    "Perfil de voz, exemplos da calibração e todo o histórico de gerações são apagados. Sua conta volta ao estado recém-criado e você cai de novo na calibração.",
  resettingInProgress: "Resetando…",
  resetMyAccount: "Resetar minha conta",

  deleteAccountLabel: "Excluir conta",
  deleteAccountSub: "terminal: remove tudo, inclusive o login",
  deleteDialogEyebrow: "ação terminal · sem volta",
  deleteDialogTitle: "Excluir a conta remove tudo — inclusive o login",
  deleteDialogBody:
    'Voz, exemplos, histórico, dados de pagamento e o acesso. Não há recuperação. Se quiser só recomeçar, use "Resetar conta".',
  deleteConfirmWord: "EXCLUIR",
  deleteDialogConfirmLabel: (word: string) => `digite ${word} pra confirmar`,
  keepAccount: "Manter minha conta",
  deletingInProgress: "Excluindo…",
  deleteForever: "Excluir pra sempre",

  planEyebrow: "Plano",
  manageInBilling: "gerenciar no billing →",

  pageEyebrow: "Configurações",

  // 1e (GAP #7) — no per-user "audience" field survives a reset; the last real generation
  // channel is the closest honest proxy. Plain string keys (not GenerationChannel) since
  // packages/ui may not import other @my-ai-orchestrator/* packages (zero-dep leaf).
  channelAudienceLabel: {
    "professional-network": "quem te lê no LinkedIn",
    blog: "quem acompanha o seu blog",
    email: "quem assina sua newsletter",
    social: "quem te segue"
  } as Record<string, string>,
  channelAudienceFallback: "quem te acompanha"
};
