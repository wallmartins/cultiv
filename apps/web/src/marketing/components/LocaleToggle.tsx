import { cn } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { getAlternateLocale, getHomePath, getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface LocaleToggleProps {
  readonly locale: MarketingLocale;
  readonly invert?: boolean;
  readonly className?: string;
}

export function LocaleToggle({ locale, invert, className }: LocaleToggleProps) {
  const messages = getLocaleMessages(locale);
  const alternate = getAlternateLocale(locale);
  const targetPath = getHomePath(alternate);

  return (
    <Link
      to={targetPath}
      className={cn(
        invert && "text-paper",
        className
      )}
    >
      {messages.header.localeSwitch}
    </Link>
  );
}
