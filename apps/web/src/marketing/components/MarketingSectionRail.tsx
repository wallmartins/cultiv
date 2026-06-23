import { cn } from "@my-ai-orchestrator/ui";
import { useEffect, useRef, useState } from "react";
import { useLenisInstance } from "~/marketing/animations/lenis-context";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";

const SECTION_IDS = [
  "hero",
  "territorio",
  "rota",
  "ferramentas",
  "comparacao",
  "depoimento",
  "preco",
  "perguntas",
  "waitlist",
] as const;

type SectionId = (typeof SECTION_IDS)[number];

const WAITLIST_INDEX = SECTION_IDS.indexOf("waitlist");

const DARK_SURFACE_SECTIONS = new Set<SectionId>(["waitlist"]);

function sectionLabel(
  locale: MarketingLocale,
  id: SectionId,
  index: number
): string {
  const messages = getLocaleMessages(locale);

  switch (id) {
    case "hero":
      return locale === "pt" ? "Entrada" : "Entry";
    case "territorio":
      return messages.territory.eyebrow;
    case "rota":
      return messages.route.eyebrow;
    case "ferramentas":
      return messages.tools.eyebrow;
    case "comparacao":
      return messages.comparison.eyebrow;
    case "depoimento":
      return locale === "pt" ? "Depoimento" : "Testimonial";
    case "preco":
      return messages.pricing.eyebrow;
    case "perguntas":
      return messages.faq.eyebrow;
    case "waitlist":
      return messages.waitlist.eyebrow;
    default:
      return String(index).padStart(2, "0");
  }
}

function visibleHeight(rect: DOMRect): number {
  return Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
}

function resolveActiveSectionIndex(viewportAnchor: number): number {
  const waitlist = document.getElementById("waitlist");
  if (waitlist) {
    const waitlistRect = waitlist.getBoundingClientRect();
    const waitlistVisible = visibleHeight(waitlistRect);

    if (
      waitlistVisible > 0 &&
      ((waitlistRect.top <= viewportAnchor && waitlistRect.bottom > viewportAnchor) ||
        waitlistVisible >= window.innerHeight * 0.28)
    ) {
      return WAITLIST_INDEX;
    }
  }

  for (let index = SECTION_IDS.length - 1; index >= 0; index -= 1) {
    const element = document.getElementById(SECTION_IDS[index] ?? "");
    if (!element) {
      continue;
    }

    const { top, bottom } = element.getBoundingClientRect();
    if (top <= viewportAnchor && bottom > viewportAnchor) {
      return index;
    }
  }

  let bestIndex = 0;
  let bestVisible = -1;

  for (let index = 0; index < SECTION_IDS.length; index += 1) {
    const element = document.getElementById(SECTION_IDS[index] ?? "");
    if (!element) {
      continue;
    }

    const visible = visibleHeight(element.getBoundingClientRect());

    if (visible > bestVisible) {
      bestVisible = visible;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function isDarkSurfaceBehindRail(railElement: HTMLElement | null): boolean {
  if (!railElement) {
    return false;
  }

  const railRect = railElement.getBoundingClientRect();

  for (const sectionId of DARK_SURFACE_SECTIONS) {
    const section = document.getElementById(sectionId);
    if (!section) {
      continue;
    }

    const sectionRect = section.getBoundingClientRect();
    const overlaps =
      sectionRect.top < railRect.bottom && sectionRect.bottom > railRect.top;

    if (overlaps) {
      return true;
    }
  }

  return false;
}

function markerClasses(
  useLightRail: boolean,
  isActive: boolean,
  isPast: boolean
): string {
  if (useLightRail) {
    if (isActive) {
      return "border-ochre text-ochre";
    }
    if (isPast) {
      return "border-cream/55 text-cream/75";
    }
    return "border-cream/30 text-cream/50 group-hover:border-ochre/70 group-hover:text-cream/80";
  }

  if (isActive) {
    return "border-terracotta text-terracotta";
  }
  if (isPast) {
    return "border-moss/70 text-moss";
  }
  return "border-ink-ghost/50 text-ink-muted group-hover:border-terracotta/50";
}

export interface MarketingSectionRailProps {
  readonly locale: MarketingLocale;
}

export function MarketingSectionRail({ locale }: MarketingSectionRailProps) {
  const lenis = useLenisInstance();
  const navRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [useLightRail, setUseLightRail] = useState(false);

  useEffect(() => {
    const update = () => {
      const viewportAnchor = window.innerHeight * 0.42;
      const nextActiveIndex = resolveActiveSectionIndex(viewportAnchor);
      const activeSectionId = SECTION_IDS[nextActiveIndex];

      setActiveIndex(nextActiveIndex);
      setUseLightRail(
        (activeSectionId !== undefined && DARK_SURFACE_SECTIONS.has(activeSectionId)) ||
          isDarkSurfaceBehindRail(navRef.current)
      );
    };

    update();

    if (lenis) {
      lenis.on("scroll", update);
    } else {
      window.addEventListener("scroll", update, { passive: true });
    }

    window.addEventListener("resize", update, { passive: true });

    return () => {
      if (lenis) {
        lenis.off("scroll", update);
      } else {
        window.removeEventListener("scroll", update);
      }
      window.removeEventListener("resize", update);
    };
  }, [lenis]);

  return (
    <nav
      ref={navRef}
      aria-label={locale === "pt" ? "Seções da página" : "Page sections"}
      className="pointer-events-none sticky top-[calc(var(--marketing-chrome-top)+0.5rem)] hidden h-[calc(100svh-var(--marketing-chrome-top)-1rem)] w-12 bg-transparent lg:flex lg:flex-col lg:items-center lg:justify-center"
    >
      <ol className="relative flex h-[min(62vh,38rem)] w-full flex-col justify-between">
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors duration-200 motion-reduce:transition-none",
            useLightRail ? "bg-cream/35" : "bg-ink-ghost/35"
          )}
        />
        {SECTION_IDS.map((id, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;

          return (
            <li key={id} className="relative z-10 flex justify-center">
              <a
                href={`#${id}`}
                className={cn(
                  "pointer-events-auto group flex flex-col items-center gap-1",
                  "rounded-[5px] px-1 py-1 transition-colors duration-200 motion-reduce:transition-none",
                  useLightRail
                    ? "focus-visible:outline-ochre"
                    : "focus-visible:outline-terracotta",
                  "focus-visible:outline-2 focus-visible:outline-offset-2"
                )}
                aria-current={isActive ? "location" : undefined}
                title={sectionLabel(locale, id, index)}
              >
                <span
                  className={cn(
                    "ui-type-mono flex h-5 w-5 items-center justify-center rounded-full border bg-transparent text-[0.5625rem] leading-none tabular-nums transition-all duration-200 motion-reduce:transition-none",
                    markerClasses(useLightRail, isActive, isPast)
                  )}
                >
                  {String(index).padStart(2, "0")}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
