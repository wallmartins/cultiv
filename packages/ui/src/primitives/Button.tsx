import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn.js";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: "primary" | "ghost" | "invert";
  readonly children: ReactNode;
}

const variantClasses = {
  primary:
    "border border-foreground bg-foreground text-accent-foreground hover:bg-transparent hover:text-foreground",
  ghost:
    "border border-transparent bg-transparent text-foreground hover:border-foreground",
  invert:
    "border border-invert-foreground bg-invert-foreground text-invert hover:bg-transparent hover:text-invert-foreground"
} as const;

export function Button({
  variant = "primary",
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "motion-hover inline-flex items-center justify-center px-6 py-3 font-body text-[0.6875rem] font-semibold uppercase tracking-editorial transition-colors duration-200",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
