import { CompassMark, cn } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { getHomePath } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface BrandMarkProps {
  readonly locale: MarketingLocale;
  readonly brandLabel: string;
  readonly size?: number;
  readonly color?: "deep-blue" | "ochre" | "white";
  readonly className?: string;
  readonly animate?: boolean;
}

export function BrandMark({
  locale,
  brandLabel,
  size = 32,
  color = "deep-blue",
  className,
  animate = false
}: BrandMarkProps) {
  return (
    <Link
      to={getHomePath(locale)}
      aria-label={brandLabel}
      className={cn("cartography-logo-hover shrink-0", className)}
    >
      <CompassMark variant="horizontal" size={size} color={color} animate={animate} />
    </Link>
  );
}
