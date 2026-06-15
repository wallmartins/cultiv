import { cn } from "@my-ai-orchestrator/ui";
import {
  BRAND_ICON_PATH,
  BRAND_WORDMARK_DARK_PATH,
  BRAND_WORDMARK_PATH
} from "~/brand/assets";

export type BrandMarkVariant = "wordmark" | "icon";

export interface BrandMarkProps {
  readonly className?: string;
  readonly variant?: BrandMarkVariant;
  readonly dark?: boolean;
}

const variantClasses: Record<BrandMarkVariant, string> = {
  wordmark: "h-[1.625rem] w-auto md:h-7",
  icon: "h-9 w-9 md:h-11 md:w-11"
};

export function BrandMark({ className, variant = "wordmark", dark = false }: BrandMarkProps) {
  const src =
    variant === "icon"
      ? BRAND_ICON_PATH
      : dark
        ? BRAND_WORDMARK_DARK_PATH
        : BRAND_WORDMARK_PATH;

  return (
    <img
      src={src}
      alt="Cultiv"
      width={variant === "icon" ? 44 : 104}
      height={variant === "icon" ? 44 : 26}
      decoding="async"
      className={cn("block shrink-0", variantClasses[variant], className)}
    />
  );
}
