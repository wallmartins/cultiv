import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  ButtonLink,
  CoordinateLabel,
  cn
} from "@my-ai-orchestrator/ui";
import { BrandMark } from "~/marketing/components/BrandMark";
import { LocaleToggle } from "~/marketing/components/LocaleToggle";
import { rebrandNavItemClassName } from "~/marketing/components/SiteHeader";
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
              className="absolute inset-0 bg-deep-blue/20 backdrop-blur-sm"
              aria-label={messages.menuCloseLabel}
              onClick={closeMenu}
            />
            <nav
              id={panelId}
              aria-label={messages.navLabel}
              className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-dotted-cartography bg-off-white shadow-cartography"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 border-b border-dotted-cartography px-[var(--spacing-gutter)] py-4">
                <BrandMark locale={locale} brandLabel={messages.brand} size={28} />
                <button
                  type="button"
                  className="flex size-10 items-center justify-center rounded-[5px] border border-dotted-cartography text-lg leading-none text-ink"
                  aria-label={messages.menuCloseLabel}
                  onClick={closeMenu}
                >
                  <span aria-hidden>×</span>
                </button>
              </div>

              <ul className="flex-1 overflow-y-auto px-[var(--spacing-gutter)] py-6">
                {marketingNavItems.map((item, index) => (
                  <li key={item.key} className="border-b border-dotted-cartography py-4 last:border-b-0">
                    <CoordinateLabel
                      index={index + 1}
                      label={messages.nav[item.key]}
                      className="mb-2 block text-[0.6875rem] tracking-wide"
                    />
                    <a
                      href={item.href}
                      className={`${rebrandNavItemClassName} block text-sm normal-case tracking-normal`}
                      onClick={closeMenu}
                    >
                      {messages.nav[item.key]}
                    </a>
                  </li>
                ))}
                <li className="border-b border-dotted-cartography py-4">
                  <CoordinateLabel
                    index="—"
                    label={messages.localeSwitch}
                    className="mb-2 block text-[0.6875rem] tracking-wide"
                  />
                  <LocaleToggle locale={locale} className="text-sm font-inter text-ink-muted" />
                </li>
              </ul>

              <div className="border-t border-dotted-cartography px-[var(--spacing-gutter)] py-5">
                <ButtonLink href="#waitlist" className="w-full justify-center" onClick={closeMenu}>
                  {messages.ctaWaitlist}
                </ButtonLink>
              </div>
            </nav>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="flex items-center md:hidden">
      <button
        type="button"
        className="flex size-10 items-center justify-center rounded-[5px] border border-dotted-cartography"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? messages.menuCloseLabel : messages.menuOpenLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="relative block h-3.5 w-4">
          <span
            className={cn(
              "absolute left-0 h-px w-full bg-ink transition-transform duration-200",
              open ? "top-1.5 rotate-45" : "top-0"
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-1.5 h-px w-full bg-ink transition-opacity duration-200",
              open && "opacity-0"
            )}
          />
          <span
            className={cn(
              "absolute left-0 h-px w-full bg-ink transition-opacity duration-200",
              open ? "top-1.5 -rotate-45" : "top-3"
            )}
          />
        </span>
      </button>
      {menuOverlay}
    </div>
  );
}
