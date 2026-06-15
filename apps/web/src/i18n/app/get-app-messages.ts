import { appMessagesEn } from "./messages/en";
import { appMessagesPt } from "./messages/pt";
import type { AppLocale, AppMessages } from "./types";

const messagesByLocale: Record<AppLocale, AppMessages> = {
  pt: appMessagesPt,
  en: appMessagesEn
};

export function getAppMessages(locale: AppLocale): AppMessages {
  return messagesByLocale[locale];
}

/** @deprecated Use getAppMessages */
export function getAppShellMessages(locale: AppLocale) {
  return getAppMessages(locale).shell;
}
