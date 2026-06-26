import type { AppLocale } from "~/i18n/app/types";
import { getHomePath } from "~/i18n/marketing/get-locale";

export function getLogoutReturnUrl(locale: AppLocale): string {
  return `${window.location.origin}${getHomePath(locale)}`;
}
