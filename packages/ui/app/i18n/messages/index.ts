import type { AppLocale } from "../locale.js";
import { pt } from "./pt/index.js";
import { en } from "./en/index.js";
import type { AppMessages } from "./types.js";

export type { AppMessages };

const BY_LOCALE: Record<AppLocale, AppMessages> = { "pt-BR": pt, en };

export function messagesFor(locale: AppLocale): AppMessages {
  return BY_LOCALE[locale];
}
