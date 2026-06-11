import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "../lib/cn.js";

const variantClasses = {
  chapter:
    "font-display text-[clamp(3.5rem,10vw,8.5rem)] italic leading-[0.92] tracking-[-0.02em] text-balance",
  display:
    "font-display text-[clamp(3.25rem,11vw,7.5rem)] italic leading-[0.94] tracking-[-0.02em] text-balance",
  "display-sm":
    "font-display text-[clamp(2rem,6vw,4.25rem)] italic leading-[1] tracking-[-0.02em]",
  h1: "font-display text-[clamp(2rem,5vw,3.75rem)] italic leading-[1.02] tracking-[-0.02em] text-balance",
  h2: "font-display text-[clamp(1.5rem,3vw,2.25rem)] italic leading-[1.08] tracking-[-0.01em]",
  h3: "font-body text-[1.125rem] font-medium leading-snug tracking-[-0.01em]",
  "body-lg": "font-body text-base leading-[1.75] md:text-[1.0625rem]",
  body: "font-body text-[0.9375rem] leading-[1.7] md:text-base",
  handwritten: "font-handwritten text-[clamp(1.25rem,3vw,1.75rem)] leading-snug",
  caption:
    "font-body text-[0.6875rem] font-semibold uppercase tracking-editorial text-muted",
  label: "font-body text-[0.6875rem] font-semibold uppercase tracking-editorial-wide text-muted",
  meta: "font-mono text-xs font-medium uppercase tracking-editorial text-moss",
  mono: "font-mono text-xs leading-relaxed text-moss"
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
