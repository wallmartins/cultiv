import type { AppMessages } from "../types.js";

export const settings: AppMessages["settings"] = {
  accountEyebrow: "Account",
  viaAuth0: "via Auth0",
  preferencesEyebrow: "Preferences",
  interfaceLanguage: "Interface language",
  languageGroupLabel: "interface language",
  logout: "Log out",

  notificationsLabel: "Completion notifications",
  notificationsSub: "lets you know when a text is ready while the tab's in the background",
  notificationsDeniedHint: "enable it in your browser settings",
  themeReminderNote: "light/dark theme lives at the top of the app — it's not a setting here",

  privacyEyebrow: "Privacy & data",
  trainingConsentLabel: "Training consent",
  consentGrantedSub: (sinceLabel: string) => `granted ${sinceLabel} — control lives in the voice profile`,
  consentRevokedSub: "revoked — generation is turned off",
  consentSinceLabel: (date: string) => `on ${date}`,
  manageInVoice: "manage in voice →",

  exportDataLabel: "Export my data",
  exportDataSub: "voice profile + examples + history + account, in a single download",
  exportButton: "Export",
  exportingInProgress: "Exporting…",
  exportReadyTopic: "export ready",
  exportFailedTopic: "couldn't export",

  resetAccountLabel: "Reset account",
  resetAccountSub: "wipes voice, examples, and history — keeps your login and starts you over",
  resetButton: "Reset",
  resetDialogEyebrow: "destructive action · medium scope",
  resetDialogTitle: "Reset wipes everything except your login",
  resetDialogBody:
    "Your voice profile, calibration examples, and entire generation history get wiped. Your account goes back to its just-created state and you land in calibration again.",
  resettingInProgress: "Resetting…",
  resetMyAccount: "Reset my account",

  deleteAccountLabel: "Delete account",
  deleteAccountSub: "terminal: removes everything, including your login",
  deleteDialogEyebrow: "terminal action · no way back",
  deleteDialogTitle: "Deleting your account removes everything — including your login",
  deleteDialogBody:
    'Voice, examples, history, payment data, and access. There\'s no recovery. If you just want a fresh start, use "Reset account".',
  deleteConfirmWord: "DELETE",
  deleteDialogConfirmLabel: (word: string) => `type ${word} to confirm`,
  keepAccount: "Keep my account",
  deletingInProgress: "Deleting…",
  deleteForever: "Delete forever",

  planEyebrow: "Plan",
  manageInBilling: "manage in billing →",

  pageEyebrow: "Settings",

  channelAudienceLabel: {
    "professional-network": "the people who read you on LinkedIn",
    blog: "the people who follow your blog",
    email: "your newsletter subscribers",
    social: "your followers"
  },
  channelAudienceFallback: "the people who follow you"
};
