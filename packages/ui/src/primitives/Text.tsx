import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "../lib/cn.js";

const variantClasses = {
  "display-hero": "ui-type-display-hero",
  "display-xl": "ui-type-display-xl",
  display:
    "font-conducao text-[clamp(1.75rem,4vw,2.441rem)] font-medium leading-[1.15] tracking-[-0.01em]",
  "heading-lg":
    "font-conducao text-[clamp(1.5rem,3vw,1.953rem)] font-semibold leading-[1.2]",
  heading:
    "font-conducao text-[clamp(1.25rem,2.5vw,1.563rem)] font-semibold leading-[1.25]",
  h1: "font-conducao text-[clamp(1.5rem,3vw,1.953rem)] font-semibold leading-[1.2]",
  h2: "font-conducao text-[clamp(1.25rem,2.5vw,1.563rem)] font-semibold leading-[1.25]",
  h3: "font-conducao text-[clamp(1.125rem,2vw,1.375rem)] font-semibold leading-[1.3]",
  "body-lg": "font-conducao text-[1.25rem] leading-[1.5]",
  body: "font-conducao text-base leading-[1.6]",
  reading: "ui-type-reading",
  imprint: "ui-type-imprint",
  caption:
    "font-conducao text-[0.8rem] font-medium uppercase tracking-[0.04em] text-ink-muted",
  label:
    "font-conducao text-[0.8rem] font-medium uppercase tracking-[0.04em] text-ink-muted",
  meta: "font-conducao text-sm leading-[1.65] text-ink-muted",
  mono: "font-mono text-xs leading-relaxed text-pigment-indigo",
  "display-sm":
    "font-conducao text-[clamp(1.25rem,3vw,2rem)] font-medium leading-[1.15]"
} as const;

export type TextVariant = keyof typeof variantClasses;

export interface TextProps extends Omit<ComponentPropsWithoutRef<"p">, "className"> {
  readonly as?: ElementType;
  readonly variant?: TextVariant;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Text({
  as: Component = "p",
  variant = "body",
  className,
  children,
  ...rest
}: TextProps) {
  return (
    <Component className={cn(variantClasses[variant], className)} {...rest}>
      {children}
    </Component>
  );
}
