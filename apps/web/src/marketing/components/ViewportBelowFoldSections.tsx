import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import type { MarketingLocale } from "~/i18n/marketing/types";

const BelowFoldSections = lazy(async () => {
  const module = await import("./BelowFoldSections");
  return { default: module.BelowFoldSections };
});

export interface ViewportBelowFoldSectionsProps {
  readonly locale: MarketingLocale;
  readonly placeholder?: ReactNode;
}

export function ViewportBelowFoldSections({
  locale,
  placeholder = null
}: ViewportBelowFoldSectionsProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || shouldLoad) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={sentinelRef}>
      {shouldLoad ? (
        <Suspense fallback={placeholder}>
          <BelowFoldSections locale={locale} />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
}
