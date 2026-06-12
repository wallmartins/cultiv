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
    "border border-foreground bg-foreground text-surface hover:bg-transparent hover:text-foreground",
  ghost:
    "border border-transparent bg-transparent text-foreground hover:border-foreground",
  invert:
    "border border-invert-foreground bg-invert-foreground text-foreground hover:bg-transparent hover:text-invert-foreground"
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
