import type { AppMessages } from "../types.js";

export const shell: AppMessages["shell"] = {
  yourVoice: "Your voice",
  account: "Account",
  voiceProfile: "Voice profile",
  billing: "Plans & billing",
  settings: "Settings",
  logout: "Log out",
  newGeneration: "＋ New generation",
  searchPlaceholder: "search by topic…",
  toastOpen: "open →",
  toggleHistory: "toggle history",
  toggleTheme: "toggle theme",
  statusFilter: {
    all: "ALL",
    done: "READY",
    running: "RUNNING",
    queued: "QUEUED",
    failed: "FAILED",
    cancelled: "CANCELLED"
  },
  periodFilter: { all: "ALL TIME", "7d": "7D", "30d": "30D", "90d": "90D" },
  historyGroup: {
    today: "Today",
    yesterday: "Yesterday",
    week: "7 days",
    month: "This month",
    older: "Older"
  },
  showOlder: (count) => `show older · ${count}`,
  emptyFiltered: "no generations found · clear the search or the filters",
  emptyNone: "no generations yet · tap ＋ New generation to start",
  emptyOtherStatus: (count) =>
    `nothing here with this filter — but there ${count === 1 ? "is" : "are"} ${count} ${count === 1 ? "result" : "results"} in other statuses`,
  clearFilterCta: (count) => (count === 1 ? "Clear filter and show 1 →" : `Clear filter and show all ${count} →`),
  itemWriting: (percent) => `writing… ${percent}%`,
  itemQueued: (suffix) => `queued${suffix}`,
  itemFailed: (suffix) => `failed${suffix}`,
  itemCancelled: (suffix) => `cancelled${suffix}`,
  topbar: {
    generate: "NEW GENERATION",
    voice: "YOUR VOICE",
    plans: "PLANS",
    billing: "BILLING",
    settings: "SETTINGS",
    detail: "GENERATION",
    fallback: "CULTIV"
  },
  creditsLabel: (credits, texts) => `${credits} credits · ~${texts} texts`,
  creditsUnknown: "— credits",
  companion: {
    title: "Your voice",
    close: "close",
    emptyDescription: "your voice shows up here after calibration",
    emptyCta: "calibrate now →",
    howIThink: "How I think",
    seeFullProfile: "see full profile →",
    meta: (caption, version) => `${caption.toLowerCase()} confidence · version ${version}`
  },
  toast: {
    ready: (topic) => (topic ? `"${topic}" is ready` : "your generation is ready"),
    failed: (topic) => (topic ? `"${topic}" didn't work out` : "a generation didn't work out"),
    withReason: (head, reason) => `${head} — ${reason}`
  }
};
