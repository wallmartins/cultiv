import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn.js";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: "primary" | "ghost" | "invert";
  readonly size?: "default" | "compact";
  readonly children: ReactNode;
}

const variantClasses = {
  primary: cn(
    "border border-terracotta bg-terracotta text-off-white shadow-cartography",
    "hover:-translate-y-0.5 transition duration-200",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
  ),
  ghost: cn(
    "border border-deep-blue bg-transparent text-deep-blue",
    "hover:-translate-y-0.5 hover:bg-off-white transition duration-200",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-blue"
  ),
  invert: cn(
    "border border-off-white bg-off-white text-deep-blue",
    "hover:-translate-y-0.5 hover:bg-transparent hover:text-off-white transition duration-200",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-off-white"
  )
} as const;

export function Button({
  variant = "primary",
  size = "default",
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "ui-btn",
        size === "compact" && "ui-btn--compact",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
