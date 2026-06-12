import { useEffect } from "react";
import { loadGsapRuntime } from "~/animations/gsap-runtime";
import { prefersReducedMotion } from "~/animations/prefers-reduced-motion";
import { DifferentiatorsSection } from "~/sections/DifferentiatorsSection";
import { FaqSection } from "~/sections/FaqSection";
import { ProblemSection } from "~/sections/ProblemSection";
import { ProductFlowSection } from "~/sections/ProductFlowSection";
import { SolutionBreathSection } from "~/sections/SolutionBreathSection";
import { UseCasesSection } from "~/sections/UseCasesSection";
import { WaitlistSection } from "~/sections/WaitlistSection";
import type { MarketingLocale } from "~/i18n/types";

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
