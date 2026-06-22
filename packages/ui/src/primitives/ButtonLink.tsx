import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn.js";

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  readonly variant?: "primary" | "ghost" | "invert";
  readonly size?: "default" | "compact";
  readonly children: ReactNode;
  readonly href: string;
}

const variantClasses = {
  primary:
    "border border-pigment-terracotta bg-pigment-terracotta text-paper-elevated hover:brightness-105 press-edge",
  ghost:
    "border border-ink-ghost bg-transparent text-ink hover:bg-paper-pressed press-edge",
  invert:
    "border border-paper bg-paper text-ink hover:bg-transparent hover:text-paper press-edge"
} as const;

export function ButtonLink({
  variant = "primary",
  size = "default",
  className,
  children,
  href,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "ui-btn motion-hover",
        size === "compact" && "ui-btn--compact",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}
