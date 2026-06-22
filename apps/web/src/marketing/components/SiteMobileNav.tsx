import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Text, cn } from "@my-ai-orchestrator/ui";
import { LocaleToggle, navItemClassName } from "~/marketing/components/LocaleToggle";
import { marketingNavItems } from "~/marketing/navigation/marketing-nav-items";
import type { LocaleMessages, MarketingLocale } from "~/i18n/marketing/types";

export interface SiteMobileNavProps {
  readonly locale: MarketingLocale;
  readonly messages: LocaleMessages["header"];
}

export function SiteMobileNav({ locale, messages }: SiteMobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  const menuOverlay =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[60] md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
              aria-label={messages.menuCloseLabel}
              onClick={closeMenu}
            />
            <nav
              id={panelId}
              aria-label={messages.navLabel}
              className="absolute top-[var(--site-header-height)] right-0 left-0 max-h-[calc(100dvh-var(--site-header-height))] overflow-y-auto border-b border-foreground bg-surface px-[var(--spacing-gutter)] py-5 shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <Text as="p" variant="meta" className="text-ink-muted">
                  {messages.navLabel}
                </Text>
                <button
                  type="button"
                  className="flex size-10 items-center justify-center border border-foreground/20 text-lg leading-none"
                  aria-label={messages.menuCloseLabel}
                  onClick={closeMenu}
                >
                  <span aria-hidden>×</span>
                </button>
              </div>
              <ul className="space-y-4">
                {marketingNavItems.map((item) => (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      className={`${navItemClassName} block py-1 text-sm`}
                      onClick={closeMenu}
                    >
                      {messages.nav[item.key]}
                    </a>
                  </li>
                ))}
                <li className="pt-2">
                  <LocaleToggle locale={locale} className="inline-block text-sm" />
                </li>
              </ul>
            </nav>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="flex items-center md:hidden">
      <button
        type="button"
        className="flex size-10 items-center justify-center border border-foreground/20"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? messages.menuCloseLabel : messages.menuOpenLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="relative block h-3.5 w-4">
          <span
            className={cn(
              "absolute left-0 h-px w-full bg-foreground transition-transform duration-200",
              open ? "top-1.5 rotate-45" : "top-0"
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-1.5 h-px w-full bg-foreground transition-opacity duration-200",
              open && "opacity-0"
            )}
          />
          <span
            className={cn(
              "absolute left-0 h-px w-full bg-foreground transition-transform duration-200",
              open ? "top-1.5 -rotate-45" : "top-3"
            )}
          />
        </span>
      </button>
      {menuOverlay}
    </div>
  );
}
