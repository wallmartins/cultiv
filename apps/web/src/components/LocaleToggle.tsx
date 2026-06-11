import { cn } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { getAlternateLocale, getHomePath, getLocaleMessages } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";

export const navItemClassName =
  "motion-hover font-body text-[0.6875rem] font-semibold uppercase tracking-editorial text-foreground hover:opacity-60";

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
        invert && "text-invert-foreground hover:opacity-80",
        className
      )}
    >
      {messages.header.localeSwitch}
    </Link>
  );
}
