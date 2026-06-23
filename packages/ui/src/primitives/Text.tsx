import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "../lib/cn.js";

const variantClasses = {
  "display-hero": "ui-type-display-hero",
  "display-xl": "ui-type-display-xl",
  display:
    "ui-type-autoridade text-[clamp(1.75rem,4vw,2.441rem)] font-medium leading-[1.15] tracking-[-0.01em]",
  "display-sm":
    "ui-type-autoridade text-[clamp(1.25rem,3vw,2rem)] font-medium leading-[1.15]",
  "heading-lg":
    "ui-type-autoridade text-[clamp(1.5rem,3vw,1.953rem)] font-semibold leading-[1.2]",
  heading:
    "ui-type-autoridade text-[clamp(1.25rem,2.5vw,1.563rem)] font-semibold leading-[1.25]",
  h1: "ui-type-autoridade text-[clamp(1.5rem,3vw,1.953rem)] font-semibold leading-[1.2]",
  h2: "ui-type-autoridade text-[clamp(1.25rem,2.5vw,1.563rem)] font-semibold leading-[1.25]",
  h3: "ui-type-autoridade text-[clamp(1.125rem,2vw,1.375rem)] font-semibold leading-[1.3]",
  "body-lg": "ui-type-conducao text-[1.25rem] leading-[1.5]",
  body: "ui-type-conducao text-base leading-[1.6]",
  logbook: "ui-type-logbook",
  reading: "ui-type-logbook",
  margem: "ui-type-margem",
  imprint: "ui-type-margem",
  handwritten: "ui-type-margem",
  caption:
    "ui-type-conducao text-[0.8rem] font-medium uppercase tracking-[0.04em] text-ink-muted",
  label:
    "ui-type-conducao text-[0.8rem] font-medium uppercase tracking-[0.04em] text-ink-muted",
  meta: "ui-type-mono text-sm leading-[1.65] text-ink-muted",
  mono: "ui-type-mono text-xs leading-relaxed text-deep-blue"
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
