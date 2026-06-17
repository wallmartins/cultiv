import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "../lib/cn.js";

const variantClasses = {
  chapter: "ui-type-chapter",
  display: "ui-type-display",
  "display-sm": "ui-type-display-sm",
  h1: "ui-type-h1",
  h2: "ui-type-h2",
  h3: "ui-type-h3",
  "body-lg": "ui-type-body-lg",
  body: "ui-type-body",
  handwritten: "ui-type-handwritten",
  caption:
    "font-body text-[0.6875rem] font-semibold uppercase tracking-editorial text-muted",
  label: "font-body text-[0.6875rem] font-semibold uppercase tracking-editorial-wide text-muted",
  meta: "ui-type-meta",
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
