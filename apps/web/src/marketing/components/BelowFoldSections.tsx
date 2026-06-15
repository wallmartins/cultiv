import { useEffect } from "react";
import { loadGsapRuntime } from "~/marketing/animations/gsap-runtime";
import { prefersReducedMotion } from "~/marketing/animations/prefers-reduced-motion";
import { DifferentiatorsSection } from "~/marketing/sections/DifferentiatorsSection";
import { FaqSection } from "~/marketing/sections/FaqSection";
import { ProblemSection } from "~/marketing/sections/ProblemSection";
import { ProductFlowSection } from "~/marketing/sections/ProductFlowSection";
import { SolutionBreathSection } from "~/marketing/sections/SolutionBreathSection";
import { UseCasesSection } from "~/marketing/sections/UseCasesSection";
import { WaitlistSection } from "~/marketing/sections/WaitlistSection";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface BelowFoldSectionsProps {
  readonly locale: MarketingLocale;
}

function useScrollLayoutRefresh() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    let cancelled = false;

    void loadGsapRuntime().then(({ ScrollTrigger }) => {
      if (cancelled) {
        return;
      }

      const refresh = () => ScrollTrigger.refresh();

      refresh();
      requestAnimationFrame(refresh);
      void document.fonts?.ready.then(() => {
        if (!cancelled) {
          refresh();
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);
}

export function BelowFoldSections({ locale }: BelowFoldSectionsProps) {
  useScrollLayoutRefresh();

  return (
    <>
      <ProblemSection locale={locale} />
      <SolutionBreathSection locale={locale} />
      <DifferentiatorsSection locale={locale} />
      <UseCasesSection locale={locale} />
      <ProductFlowSection locale={locale} />
      <WaitlistSection locale={locale} />
      <FaqSection locale={locale} />
    </>
  );
}
