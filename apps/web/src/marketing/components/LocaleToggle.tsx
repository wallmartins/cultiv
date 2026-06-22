import { cn } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { getAlternateLocale, getHomePath, getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export const navItemClassName =
  "motion-hover font-body text-[0.6875rem] font-semibold uppercase tracking-editorial text-ink hover:opacity-60";

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
        navItemClassName,
        invert && "text-paper hover:opacity-80",
        className
      )}
    >
      {messages.header.localeSwitch}
    </Link>
  );
}
